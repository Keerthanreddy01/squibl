import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COUNTRIES, Country } from '../../lib/countries';
import { CountryPickerView } from '../../components/CountryPickerView';
import { PressableScale } from '../../components/PressableScale';

// Required for expo-auth-session to handle OAuth redirects properly
WebBrowser.maybeCompleteAuthSession();

const RED = '#E50914';

// ─── View modes ───────────────────────────────────────────────────────────────
type Mode = 'landing' | 'phone' | 'otp';

// ─── Phone Input Helpers ──────────────────────────────────────────────────────
function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

function buildE164(callingCode: string, localNumber: string): string {
  // Strip leading zeros from local number, prepend calling code
  const digits = sanitizePhone(localNumber).replace(/^0+/, '');
  return `+${callingCode.replace('+', '')}${digits}`;
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OTPInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const digits = value.padEnd(6, ' ').split('');
  return (
    <View style={otpStyles.row}>
      {digits.map((d, i) => (
        <View
          key={i}
          style={[otpStyles.cell, d.trim() !== '' && otpStyles.cellFilled]}
        >
          <Text style={otpStyles.cellText}>{d.trim()}</Text>
        </View>
      ))}
      {/* Hidden text input that captures real typing */}
      <TextInput
        style={otpStyles.hiddenInput}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        caretHidden
      />
    </View>
  );
}

const otpStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  cellText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'Anton-Regular': require('../../assets/fonts/Anton-Regular.ttf'),
    'ArchivoBlack-Regular': require('../../assets/fonts/ArchivoBlack-Regular.ttf'),
    'Geist-UltraBlack': require('../../assets/fonts/Geist-UltraBlack.ttf'),
  });

  const [mode, setMode] = useState<Mode>('landing');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ── Country Picker ─────────────────────────────────────────────────────────
  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setIsCountryPickerOpen(false);
  }, []);

  if (isCountryPickerOpen) {
    return (
      <CountryPickerView
        selectedCountry={selectedCountry}
        onSelect={handleCountrySelect}
        onBack={() => setIsCountryPickerOpen(false)}
      />
    );
  }

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (loading || googleLoading) return;
    const digits = sanitizePhone(phoneNumber);
    if (digits.length < 6) {
      setError('Please enter a valid phone number.');
      return;
    }

    const e164 = buildE164(selectedCountry.callingCode, digits);
    setLoading(true);
    setError(null);
    setInfo(null);

    const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);

    if (otpErr) {
      const msg = (otpErr.message ?? '').toLowerCase();
      let friendlyError = otpErr.message ?? 'Failed to send OTP. Please try again.';
      if (msg.includes('too many') || msg.includes('rate') || (otpErr as any).status === 429) {
        friendlyError = 'Too many requests. Please wait a few moments before trying again.';
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
        friendlyError = 'Network connection error. Please check your internet and try again.';
      }
      setError(friendlyError);
      return;
    }

    setOtp('');
    setMode('otp');
    setInfo(`OTP sent to ${e164}`);
    startResendCooldown();
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (loading) return;
    const digits = sanitizePhone(phoneNumber);
    const e164 = buildE164(selectedCountry.callingCode, digits);

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otp,
      type: 'sms',
    });

    setLoading(false);

    if (verifyErr) {
      const msg = (verifyErr.message ?? '').toLowerCase();
      let friendlyError = verifyErr.message ?? 'Verification failed. Please try again.';
      if (msg.includes('expired')) {
        friendlyError = 'This code has expired. Please tap Resend to get a new code.';
      } else if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('token')) {
        friendlyError = 'Incorrect 6-digit code. Please check and try again.';
      } else if (msg.includes('too many') || msg.includes('rate') || (verifyErr as any).status === 429) {
        friendlyError = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
        friendlyError = 'Network connection error. Please check your internet and try again.';
      }
      setError(friendlyError);
      return;
    }

    if (data.session) {
      // Check onboarding status
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
        router.replace('/(tabs)/feed');
      }
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loading) return;
    const digits = sanitizePhone(phoneNumber);
    const e164 = buildE164(selectedCountry.callingCode, digits);

    setLoading(true);
    setError(null);
    const { error: resendErr } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);

    if (resendErr) {
      const msg = (resendErr.message ?? '').toLowerCase();
      let friendly = resendErr.message ?? 'Could not resend OTP. Try again shortly.';
      if (msg.includes('too many') || msg.includes('rate') || (resendErr as any).status === 429) {
        friendly = 'Too many attempts. Please wait before requesting another code.';
      }
      setError(friendly);
      return;
    }
    setInfo('New verification code sent!');
    startResendCooldown();
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    setError(null);

    try {
      const redirectUrl = makeRedirectUri({ scheme: 'squibl', path: 'auth/callback' });

      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (oauthErr || !data.url) {
        throw oauthErr ?? new Error('Could not start Google login.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const urlStr = result.url;
        let code: string | null = null;
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let errorParam: string | null = null;
        let errorDescParam: string | null = null;

        // Parse query params (?...)
        const queryIndex = urlStr.indexOf('?');
        const hashIndex = urlStr.indexOf('#');

        if (queryIndex !== -1) {
          const queryString = hashIndex > queryIndex
            ? urlStr.substring(queryIndex + 1, hashIndex)
            : urlStr.substring(queryIndex + 1);
          const searchParams = new URLSearchParams(queryString);
          code = searchParams.get('code');
          errorParam = searchParams.get('error');
          errorDescParam = searchParams.get('error_description');
          if (!accessToken) accessToken = searchParams.get('access_token');
          if (!refreshToken) refreshToken = searchParams.get('refresh_token');
        }

        // Parse hash params (#...)
        if (hashIndex !== -1) {
          const hashString = urlStr.substring(hashIndex + 1);
          const hashParams = new URLSearchParams(hashString);
          if (!code) code = hashParams.get('code');
          if (!accessToken) accessToken = hashParams.get('access_token');
          if (!refreshToken) refreshToken = hashParams.get('refresh_token');
          if (!errorParam) errorParam = hashParams.get('error');
          if (!errorDescParam) errorDescParam = hashParams.get('error_description');
        }

        if (errorParam || errorDescParam) {
          throw new Error(errorDescParam || errorParam || 'Google login failed.');
        }

        let sessionUser = null;

        if (code) {
          const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
          sessionUser = exchangeData?.user ?? null;
        } else if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) throw sessionErr;
          sessionUser = sessionData?.user ?? null;
        } else {
          setError('Google login did not return a session. Please try again.');
          return;
        }

        const uid = sessionUser?.id;
        if (uid) {
          const { data: profile } = await (supabase.from('builder_profiles') as any)
            .select('onboarding_completed')
            .eq('id', uid)
            .maybeSingle();

          if (profile?.onboarding_completed) {
            router.replace('/(tabs)/feed');
          } else {
            router.replace('/onboarding');
          }
        } else {
          router.replace('/(tabs)/feed');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User dismissed or closed browser session — clean reset without error
        setError(null);
      } else {
        setError('Google login was cancelled or incomplete.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Google login failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Shared error/info UI ───────────────────────────────────────────────────
  const MessageBanner = () => {
    if (error) {
      return (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      );
    }
    if (info) {
      return (
        <View style={styles.infoBanner}>
          <Feather name="check-circle" size={14} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.infoBannerText}>{info}</Text>
        </View>
      );
    }
    return null;
  };

  const fontStyle = fontsLoaded ? styles.heroFontArchivo : styles.heroDisplayLine;

  // ════════════════════════════════════════════════════════════════════════════
  // OTP Verification Screen
  // ════════════════════════════════════════════════════════════════════════════
  if (mode === 'otp') {
    const e164 = buildE164(selectedCountry.callingCode, sanitizePhone(phoneNumber));
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerBar}>
              <PressableScale style={styles.backBtn} onPress={() => { setMode('phone'); setError(null); setOtp(''); }} activeScale={0.88}>
                <Feather name="arrow-left" size={18} color="#000" />
              </PressableScale>
              <View style={styles.brandRow}>
                <Text style={styles.brandWordmark}>squibl</Text>
                <Text style={styles.brandTrademark}>™</Text>
              </View>
            </View>

            {/* Heading */}
            <View style={styles.heroSection}>
              <Text style={styles.otpHeading}>VERIFY{'\n'}YOUR NUMBER</Text>
              <Text style={styles.otpSubtitle}>
                We sent a 6-digit code to{'\n'}
                <Text style={{ fontWeight: '800', color: '#000' }}>{e164}</Text>
              </Text>
            </View>

            <MessageBanner />

            {/* OTP Boxes */}
            <OTPInput value={otp} onChange={(v) => { setOtp(v); setError(null); }} />

            {/* Verify Button */}
            <PressableScale
              style={[styles.primaryBtn, (loading || otp.length !== 6) && styles.primaryBtnDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              activeScale={0.96}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
              )}
            </PressableScale>

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive it? </Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={resendCooldown > 0 || loading}>
                <Text style={[styles.resendLink, (resendCooldown > 0 || loading) && { color: '#A1A1AA' }]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.changeNumberBtn} onPress={() => { setMode('landing'); setOtp(''); setError(null); }}>
              <Text style={styles.changeNumberText}>← Use a different number</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Phone Entry Screen
  // ════════════════════════════════════════════════════════════════════════════
  if (mode === 'phone') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerBar}>
              <PressableScale style={styles.backBtn} onPress={() => { setMode('landing'); setError(null); }} activeScale={0.88}>
                <Feather name="arrow-left" size={18} color="#000" />
              </PressableScale>
              <View style={styles.brandRow}>
                <Text style={styles.brandWordmark}>squibl</Text>
                <Text style={styles.brandTrademark}>™</Text>
              </View>
            </View>

            {/* Hero */}
            <View style={styles.heroSection}>
              <Text style={fontStyle}>ENTER YOUR</Text>
              <Text style={fontStyle}>NUMBER</Text>
              <Text style={styles.heroSubtitle}>We'll send you a one-time code to verify it's you.</Text>
            </View>

            <MessageBanner />

            {/* Phone Row */}
            <View style={styles.formContainer}>
              <View style={styles.phoneRow}>
                <PressableScale
                  style={styles.countryCard}
                  onPress={() => setIsCountryPickerOpen(true)}
                  activeScale={0.97}
                >
                  <Text style={styles.cardLabel}>Country</Text>
                  <View style={styles.countrySelector}>
                    <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.callingCode}</Text>
                    <Text style={styles.chevron}>⌵</Text>
                  </View>
                </PressableScale>

                <View style={styles.phoneCard}>
                  <Text style={styles.cardLabel}>Phone number</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="98765 43210"
                    placeholderTextColor="#A1A1AA"
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    autoFocus
                    value={phoneNumber}
                    onChangeText={(v) => { setPhoneNumber(v); setError(null); }}
                  />
                </View>
              </View>

              <PressableScale
                style={[styles.primaryBtn, (loading || sanitizePhone(phoneNumber).length < 6) && styles.primaryBtnDisabled]}
                onPress={handleSendOTP}
                disabled={loading || sanitizePhone(phoneNumber).length < 6}
                activeScale={0.96}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Send Code</Text>}
              </PressableScale>

              <Text style={styles.disclaimer}>
                By continuing, you agree to our{' '}
                <Text style={styles.disclaimerHighlight}>Terms</Text> and{' '}
                <Text style={styles.disclaimerHighlight}>Privacy Policy</Text>.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Landing Screen (default)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Brand Bar */}
          <View style={styles.headerBar}>
            <View style={styles.brandRow}>
              <Text style={styles.brandWordmark}>squibl</Text>
              <Text style={styles.brandTrademark}>™</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.heroSection}>
            <Text style={fontStyle}>THE</Text>
            <View style={styles.heroRowWithBadge}>
              <Text style={fontStyle}>BIG</Text>
              <View style={styles.logoBadge}>
                <Image
                  source={require('../../assets/squibl-logo.png')}
                  style={styles.heroCubeLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={fontStyle}>GEST</Text>
            </View>
            <Text style={fontStyle}>BUILDER</Text>
            <Text style={fontStyle}>NETWORK!</Text>
          </View>

          {/* Error banner (e.g. from Google OAuth) */}
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            {/* Mobile Number */}
            <PressableScale
              style={styles.primaryBtn}
              onPress={() => { setError(null); setMode('phone'); }}
              activeScale={0.96}
            >
              <Feather name="phone" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.primaryBtnText}>Login with Mobile Number</Text>
            </PressableScale>

            {/* Google */}
            <PressableScale
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeScale={0.96}
            >
              {googleLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  {/* Google G icon inline */}
                  <View style={styles.googleIconBox}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </PressableScale>

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Signup link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <PressableScale activeScale={0.93} onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </PressableScale>
            </View>
          </View>

          <Text style={styles.disclaimer}>
            By continuing, you agree to our{' '}
            <Text style={styles.disclaimerHighlight}>Terms</Text> and{' '}
            <Text style={styles.disclaimerHighlight}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  headerBar: {
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1, borderColor: '#E4E4E7',
    alignItems: 'center', justifyContent: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'flex-start' },
  brandWordmark: { fontSize: 32, fontWeight: '900', color: '#000000', letterSpacing: -1.5 },
  brandTrademark: { fontSize: 12, fontWeight: '800', color: '#71717A', marginLeft: 2, marginTop: 2 },

  // Hero
  heroSection: { marginTop: 10, marginBottom: 28 },
  heroDisplayLine: {
    fontSize: 48, fontWeight: '900', color: '#000000',
    lineHeight: 50, letterSpacing: -1.5, textTransform: 'uppercase',
  },
  heroFontArchivo: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 46, lineHeight: 48, letterSpacing: -1,
    color: '#000000', textTransform: 'uppercase',
  },
  heroRowWithBadge: { flexDirection: 'row', alignItems: 'center' },
  logoBadge: { width: 44, height: 44, marginHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  heroCubeLogo: { width: 42, height: 42, borderRadius: 10 },
  heroSubtitle: { fontSize: 14, fontWeight: '500', color: '#71717A', lineHeight: 20, marginTop: 8 },

  // OTP heading (used in OTP mode)
  otpHeading: {
    fontSize: 42, fontWeight: '900', color: '#000', letterSpacing: -1.5,
    lineHeight: 44, textTransform: 'uppercase', marginBottom: 12,
  },
  otpSubtitle: { fontSize: 15, color: '#52525B', lineHeight: 22 },

  // Banners
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12, borderWidth: 1, borderColor: '#FECACA',
    paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorBannerText: { fontSize: 13, color: '#B91C1C', fontWeight: '600', flex: 1 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12, borderWidth: 1, borderColor: '#6EE7B7',
    paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 16,
  },
  infoBannerText: { fontSize: 13, color: '#059669', fontWeight: '600', flex: 1 },

  // CTA
  ctaContainer: { marginBottom: 20, gap: 14 },

  // Primary red button
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: RED,
    borderRadius: 9999,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleIconBox: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#000', alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  googleIconText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: '#000000', letterSpacing: 0.1 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E4E4E7' },
  dividerText: { fontSize: 12, fontWeight: '700', color: '#A1A1AA', letterSpacing: 1 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#52525B', fontSize: 14, fontWeight: '500' },
  signupLink: { color: RED, fontSize: 14, fontWeight: '800', paddingVertical: 4 },

  // Phone entry
  formContainer: { width: '100%', marginBottom: 20 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  countryCard: {
    width: 122, minWidth: 122, flexShrink: 0,
    backgroundColor: '#ECEEF0', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 12,
    height: 72, justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  phoneCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 12,
    height: 72, justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  cardLabel: { fontSize: 12, fontWeight: '500', color: '#71717A', marginBottom: 4 },
  countrySelector: { flexDirection: 'row', alignItems: 'center' },
  flagEmoji: { fontSize: 18, marginRight: 6 },
  countryCode: { fontSize: 18, fontWeight: '800', color: '#000', marginRight: 4 },
  chevron: { fontSize: 13, fontWeight: '800', color: '#71717A', marginTop: -2 },
  phoneInput: {
    fontSize: 19, fontWeight: '800', color: '#000000',
    backgroundColor: 'transparent', padding: 0, height: 28,
  },

  // Resend
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  resendLabel: { fontSize: 14, color: '#52525B' },
  resendLink: { fontSize: 14, fontWeight: '800', color: RED },
  changeNumberBtn: { alignItems: 'center', marginTop: 16 },
  changeNumberText: { fontSize: 13, color: '#71717A', fontWeight: '600' },

  // Disclaimer
  disclaimer: {
    fontSize: 12, color: '#9CA3AF', textAlign: 'center',
    lineHeight: 18, marginTop: 16, paddingHorizontal: 12,
  },
  disclaimerHighlight: { color: '#4B5563', fontWeight: '600' },
});
