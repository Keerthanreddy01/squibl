import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const RED = '#E50914';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setMessage('Please enter both email and password');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setIsError(true);
    } else if (data.session) {
      setMessage(`Logged in as ${data.user?.email}`);
      setIsError(false);
      router.replace('/(tabs)/feed');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Bar */}
          <View style={styles.headerBar}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/squibl-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>squibl</Text>
              <View style={styles.brandDot} />
            </View>

            {/* Temporary Dev Testing Button */}
            <TouchableOpacity
              style={styles.devQuickLoginBtn}
              onPress={() => {
                setEmail('keerthan.squibl.test@gmail.com');
                setPassword('Password123!');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.devQuickLoginText}>⚡ Quick Login</Text>
            </TouchableOpacity>
          </View>

          {/* Bold Oversized Display Typography */}
          <View style={styles.heroSection}>
            <Text style={styles.heroEyebrow}>DEVELOPER NETWORK</Text>
            <Text style={styles.heroTitle}>WELCOME</Text>
            <Text style={styles.heroTitle}>BACK.</Text>
            <Text style={styles.heroSubtitle}>
              Find teammates, build ambitious projects, and grow together.
            </Text>
          </View>

          {/* Message / Error Box */}
          {message && (
            <View
              style={[
                styles.messageBox,
                isError ? styles.errorBox : styles.successBox,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isError ? styles.errorText : styles.successText,
                ]}
              >
                {message}
              </Text>
            </View>
          )}

          {/* Clean Input Card Section */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="name@domain.com"
                  placeholderTextColor="#71717A"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••••••"
                  placeholderTextColor="#71717A"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.showPasswordBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full-width Large Red Pill Button */}
            <TouchableOpacity
              style={styles.pillButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.pillButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Secondary Disclaimer */}
            <Text style={styles.disclaimerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.disclaimerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.disclaimerLink}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  headerBar: {
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devQuickLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    borderStyle: 'dashed',
  },
  devQuickLoginText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 9,
    marginRight: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.8,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RED,
    marginLeft: 3,
    marginTop: 2,
  },
  heroSection: {
    marginTop: 12,
    marginBottom: 28,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 46,
    letterSpacing: -1.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#52525B',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: '92%',
  },
  messageBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  successBox: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#000000',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
  },
  successText: {
    color: '#000000',
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: '#F4F4F5',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    height: 54,
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordInput: {
    paddingRight: 10,
  },
  showPasswordBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  showPasswordText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1,
  },
  pillButton: {
    backgroundColor: RED,
    borderRadius: 9999,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  pillButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  disclaimerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  disclaimerLink: {
    color: '#000000',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  footerText: {
    color: '#52525B',
    fontSize: 14,
    fontWeight: '500',
  },
  signupLink: {
    color: RED,
    fontSize: 14,
    fontWeight: '800',
  },
});
