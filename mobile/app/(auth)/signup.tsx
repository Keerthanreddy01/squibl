import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';
import { isEmailVerified, supabase } from '../../lib/supabase';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';
const EMAIL_OTP_LENGTH = 8;

// ─── Validation helpers ───────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email address is required.';
  if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
  return null;
}

function validatePassword(pw: string): string | null {
  if (!pw) return 'Password is required.';
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  return null;
}

type InputCardProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
  error?: string | null;
  secure?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  keyboardType?: any;
  autoCapitalize?: any;
  placeholder?: string;
  autoFocus?: boolean;
};

function InputCard({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  error,
  secure,
  showSecure,
  onToggleSecure,
  keyboardType,
  autoCapitalize,
  placeholder,
  autoFocus,
}: InputCardProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[styles.inputCard, isFocused && styles.inputCardFocused, !!error && styles.inputCardError]}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            value={value}
            onChangeText={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor="#A1A1AA"
            secureTextEntry={secure && !showSecure}
            keyboardType={keyboardType ?? 'default'}
            autoCapitalize={autoCapitalize ?? 'none'}
            autoCorrect={false}
            underlineColorAndroid="transparent"
            autoFocus={autoFocus}
          />
          {secure && onToggleSecure ? (
            <TouchableOpacity onPress={onToggleSecure} style={{ padding: 4 }}>
              <Feather name={showSecure ? 'eye-off' : 'eye'} size={18} color="#71717A" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {error ? (
        <View style={styles.fieldError}>
          <Feather name="alert-circle" size={12} color="#B91C1C" />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Password strength indicator ──────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const color = colors[passed - 1] ?? '#E4E4E7';
  const label = labels[passed - 1] ?? '';
  return (
    <View style={{ marginTop: 8, marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              backgroundColor: i < passed ? color : '#E4E4E7',
            }}
          />
        ))}
      </View>
      {label ? <Text style={{ fontSize: 11, color, fontWeight: '700' }}>{label}</Text> : null}
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'form' | 'verify';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SignupScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'Anton-Regular': require('../../assets/fonts/Anton-Regular.ttf'),
    'ArchivoBlack-Regular': require('../../assets/fonts/ArchivoBlack-Regular.ttf'),
    'Geist-UltraBlack': require('../../assets/fonts/Geist-UltraBlack.ttf'),
  });

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Focus state
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  // Feedback state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification flow state
  const [mode, setMode] = useState<Mode>('form');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const fontStyle = fontsLoaded ? styles.heroFontArchivo : styles.heroDisplayLine;

  // ── Resend cooldown ────────────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Validate and sign up ───────────────────────────────────────────────────
  const handleSignup = useCallback(async () => {
    if (loading) return;

    // Clear all errors first
    setEmailError(null);
    setPassError(null);
    setConfirmError(null);
    setGlobalError(null);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = password !== confirmPassword
      ? 'Passwords do not match. Please try again.'
      : null;

    setEmailError(eErr);
    setPassError(pErr);
    setConfirmError(cErr);

    // Block if any validation fails — never send request on mismatch
    if (eErr || pErr || cErr) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      let friendlyError = error.message ?? 'Signup failed. Please try again.';
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        friendlyError = 'An account with this email already exists. Please log in instead.';
      } else if (msg.includes('rate') || (error as any).status === 429) {
        friendlyError = 'Too many signup attempts. Please wait a few minutes before trying again.';
      }
      setGlobalError(friendlyError);
      return;
    }

    if (data.session && isEmailVerified(data.user, true)) {
      // Only a confirmed email may enter the authenticated application.
      try {
        const { data: profile } = await (supabase.from('builder_profiles') as any)
          .select('onboarding_completed')
          .eq('id', data.user?.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          router.replace('/(tabs)/feed');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
      return;
    }

    // Supabase may return either no session or an unverified session while
    // email confirmation is required. Both cases stay in this verification flow.
    setRegisteredEmail(email.trim().toLowerCase());
    setMode('verify');
    startResendCooldown();
  }, [email, password, confirmPassword, loading, router]);

  // ── Verify email OTP ────────────────────────────────────────────────────────
  const handleVerifyEmail = async () => {
    if (verifyLoading) return;
    const token = verifyCode.trim();
    if (token.length !== EMAIL_OTP_LENGTH) {
      setVerifyError(`Please enter the complete ${EMAIL_OTP_LENGTH}-digit verification code from your email.`);
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);

    const { data, error } = await supabase.auth.verifyOtp({
      email: registeredEmail,
      token,
      type: 'email',
    });

    setVerifyLoading(false);

    if (error) {
      if (__DEV__) {
        console.error('[Signup email verification] verifyOtp failed', {
          email: registeredEmail,
          tokenLength: token.length,
          error,
        });
      }

      const msg = (error.message ?? '').toLowerCase();
      let friendlyError = error.message ?? 'Verification failed. Please check the code and try again.';
      if (msg.includes('expired') && !msg.includes('invalid')) {
        friendlyError = 'This verification code has expired. Please tap Resend to request a fresh code.';
      } else if (msg.includes('invalid') || msg.includes('token') || msg.includes('incorrect')) {
        friendlyError = `This verification code was rejected. Please check that you entered the latest ${EMAIL_OTP_LENGTH}-digit code and try again.`;
      } else if (msg.includes('too many') || msg.includes('rate') || (error as any).status === 429) {
        friendlyError = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
        friendlyError = 'Network connection error. Please check your internet and try again.';
      }
      setVerifyError(friendlyError);
      return;
    }

    if (data.session) {
      // Verified and authenticated — proceed directly into onboarding or feed without re-login
      try {
        const { data: profile } = await (supabase.from('builder_profiles') as any)
          .select('onboarding_completed')
          .eq('id', data.user?.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          router.replace('/(tabs)/feed');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    }
  };

  // ── Resend verification email ───────────────────────────────────────────────
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || verifyLoading) return;
    setVerifyError(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: registeredEmail,
    });

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      let friendlyError = error.message ?? 'Could not resend verification email. Try again shortly.';
      if (msg.includes('too many') || msg.includes('rate') || (error as any).status === 429) {
        friendlyError = 'Too many attempts. Please wait a minute before requesting another code.';
      }
      setVerifyError(friendlyError);
      return;
    }
    startResendCooldown();
  };

  // ════════════════════════════════════════════════════════════════════════════
  // EMAIL VERIFICATION SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (mode === 'verify') {
    // Mask email: k***@gmail.com
    const [user, domain] = registeredEmail.split('@');
    const maskedEmail = `${user[0]}${'*'.repeat(Math.min(user.length - 1, 6))}@${domain}`;

    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerBar}>
              <PressableScale style={styles.backBtn} onPress={() => { setMode('form'); setVerifyCode(''); setVerifyError(null); }} activeScale={0.88}>
                <Feather name="arrow-left" size={18} color="#000" />
              </PressableScale>
              <View style={styles.brandRow}>
                <Text style={styles.brandWordmark}>squibl</Text>
                <Text style={styles.brandTrademark}>™</Text>
              </View>
            </View>

            {/* Heading */}
            <View style={styles.heroSection}>
              <Text style={styles.verifyHeading}>VERIFY{'\n'}YOUR EMAIL</Text>
              <Text style={styles.verifySubtitle}>
                We sent an {EMAIL_OTP_LENGTH}-digit code to
              </Text>
              <Text style={styles.verifyEmail}>{maskedEmail}</Text>
            </View>

            {/* Error / Success */}
            {verifyError ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{verifyError}</Text>
              </View>
            ) : null}

            {/* Code Input */}
            <View style={[styles.inputCard, styles.inputCardFocused, { marginBottom: 20 }]}>
              <Text style={styles.cardLabel}>Verification code</Text>
              <TextInput
                style={styles.textInput}
                value={verifyCode}
                onChangeText={(v) => { setVerifyCode(v.replace(/\D/g, '')); setVerifyError(null); }}
                placeholder="00000000"
                placeholderTextColor="#A1A1AA"
                keyboardType="number-pad"
                maxLength={EMAIL_OTP_LENGTH}
                autoFocus
              />
            </View>

            {/* Verify Button */}
            <PressableScale
              style={[styles.primaryBtn, (verifyLoading || verifyCode.length !== EMAIL_OTP_LENGTH) && styles.primaryBtnDisabled]}
              onPress={handleVerifyEmail}
              disabled={verifyLoading || verifyCode.length !== EMAIL_OTP_LENGTH}
              activeScale={0.96}
            >
              {verifyLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Continue</Text>
              )}
            </PressableScale>

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive it? </Text>
              <TouchableOpacity onPress={handleResendVerification} disabled={resendCooldown > 0}>
                <Text style={[styles.resendLink, resendCooldown > 0 && { color: '#A1A1AA' }]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Change email */}
            <TouchableOpacity style={styles.changeEmailBtn} onPress={() => { setMode('form'); setVerifyCode(''); setVerifyError(null); }}>
              <Text style={styles.changeEmailText}>← Change email address</Text>
            </TouchableOpacity>

            <Text style={styles.verifyHint}>
              Check your spam folder if you don't see it in your inbox.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SIGNUP FORM
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerBar}>
            <PressableScale style={styles.backBtn} onPress={() => router.back()} activeScale={0.88}>
              <Feather name="arrow-left" size={18} color="#000" />
            </PressableScale>
            <View style={styles.brandRow}>
              <Text style={styles.brandWordmark}>squibl</Text>
              <Text style={styles.brandTrademark}>™</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.heroSection}>
            <Text style={fontStyle}>JOIN</Text>
            <Text style={fontStyle}>THE</Text>
            <Text style={fontStyle}>NETWORK!</Text>
            <Text style={styles.heroSubtitle}>
              Create your builder account and start collaborating with developers worldwide.
            </Text>
          </View>

          {/* Global error */}
          {globalError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{globalError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.formContainer}>
            <InputCard
              label="Email address"
              value={email}
              onChange={(v) => { setEmail(v); setEmailError(null); setGlobalError(null); }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              isFocused={emailFocused}
              error={emailError}
              keyboardType="email-address"
              placeholder="name@example.com"
            />

            <InputCard
              label="Password"
              value={password}
              onChange={(v) => { setPassword(v); setPassError(null); setGlobalError(null); }}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              isFocused={passFocused}
              error={passError}
              secure
              showSecure={showPassword}
              onToggleSecure={() => setShowPassword((x) => !x)}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
            />

            {/* Password strength meter */}
            <PasswordStrength password={password} />

            <InputCard
              label="Confirm password"
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); setConfirmError(null); setGlobalError(null); }}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              isFocused={confirmFocused}
              error={confirmError}
              secure
              showSecure={showConfirm}
              onToggleSecure={() => setShowConfirm((x) => !x)}
              placeholder="Re-enter your password"
            />

            {/* Create Account Button */}
            <PressableScale
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeScale={0.96}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </PressableScale>

            <Text style={styles.disclaimer}>
              By signing up, you agree to our{' '}
              <Text style={styles.disclaimerHighlight}>Terms</Text> and{' '}
              <Text style={styles.disclaimerHighlight}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <PressableScale activeScale={0.93} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    flexGrow: 1, paddingHorizontal: 22,
    paddingTop: 6, paddingBottom: 32,
    justifyContent: 'space-between',
  },
  headerBar: {
    paddingTop: 8, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1, borderColor: '#E4E4E7',
    alignItems: 'center', justifyContent: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'flex-start' },
  brandWordmark: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: -1.5 },
  brandTrademark: { fontSize: 12, fontWeight: '800', color: '#71717A', marginLeft: 2, marginTop: 2 },

  heroSection: { marginTop: 8, marginBottom: 24 },
  heroDisplayLine: { fontSize: 48, fontWeight: '900', color: '#000', lineHeight: 50, letterSpacing: -1.5, textTransform: 'uppercase' },
  heroFontArchivo: { fontFamily: 'ArchivoBlack-Regular', fontSize: 46, lineHeight: 48, letterSpacing: -1, color: '#000', textTransform: 'uppercase' },
  heroSubtitle: { fontSize: 14, fontWeight: '500', color: '#71717A', lineHeight: 20, marginTop: 8 },

  // Verify headings
  verifyHeading: { fontSize: 42, fontWeight: '900', color: '#000', letterSpacing: -1.5, lineHeight: 44, textTransform: 'uppercase', marginBottom: 12 },
  verifySubtitle: { fontSize: 15, color: '#52525B', lineHeight: 22 },
  verifyEmail: { fontSize: 16, fontWeight: '800', color: '#000', marginTop: 4, marginBottom: 20 },
  verifyHint: { fontSize: 12, color: '#A1A1AA', textAlign: 'center', marginTop: 20, lineHeight: 18 },

  // Banners
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 12,
    borderWidth: 1, borderColor: '#FECACA',
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  errorBannerText: { fontSize: 13, color: '#B91C1C', fontWeight: '600', flex: 1 },

  formContainer: { width: '100%', marginBottom: 20 },

  inputCard: {
    backgroundColor: '#ECEEF0', borderRadius: 18,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    minHeight: 72, justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  inputCardFocused: { borderColor: '#18181B', backgroundColor: '#FFFFFF' },
  inputCardError: { borderColor: '#F87171', backgroundColor: '#FFF' },
  cardLabel: { fontSize: 12, fontWeight: '500', color: '#71717A', marginBottom: 4 },
  textInput: {
    fontSize: 18, fontWeight: '700', color: '#000',
    backgroundColor: 'transparent', padding: 0, height: 28,
  },

  // Field-level error
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fieldErrorText: { fontSize: 12, color: '#B91C1C', fontWeight: '600', flex: 1 },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: RED, borderRadius: 9999, height: 56,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 8,
    shadowColor: RED, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },

  disclaimer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, marginTop: 14, paddingHorizontal: 12 },
  disclaimerHighlight: { color: '#4B5563', fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  footerText: { color: '#52525B', fontSize: 14, fontWeight: '500' },
  signInLink: { color: RED, fontSize: 14, fontWeight: '800', paddingVertical: 4 },

  // Resend
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  resendLabel: { fontSize: 14, color: '#52525B' },
  resendLink: { fontSize: 14, fontWeight: '800', color: RED },
  changeEmailBtn: { alignItems: 'center', marginTop: 14 },
  changeEmailText: { fontSize: 13, color: '#71717A', fontWeight: '600' },
});
