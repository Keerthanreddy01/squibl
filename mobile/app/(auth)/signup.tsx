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
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { supabase } from '../../lib/supabase';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';

export default function SignupScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'Anton-Regular': require('../../assets/fonts/Anton-Regular.ttf'),
    'ArchivoBlack-Regular': require('../../assets/fonts/ArchivoBlack-Regular.ttf'),
    'Geist-UltraBlack': require('../../assets/fonts/Geist-UltraBlack.ttf'),
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSignup = useCallback(async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password');
      setIsError(true);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setIsError(true);
    } else if (data.session) {
      setMessage(`Account created and signed in as ${data.user?.email}`);
      setIsError(false);
      router.replace('/(tabs)/feed');
    } else {
      setMessage('Signup successful! Please check your email to confirm your account.');
      setIsError(false);
    }
  }, [email, password, router]);

  const fontStyle = fontsLoaded ? styles.heroFontArchivo : styles.heroDisplayLine;

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
          {/* Top Header Bar — Circular Back Button + squibl™ Wordmark */}
          <View style={styles.headerBar}>
            <PressableScale
              style={styles.backButton}
              onPress={() => router.back()}
              activeScale={0.92}
              accessibilityLabel="Go back"
            >
              <Text style={styles.backArrow}>←</Text>
            </PressableScale>

            <View style={styles.brandRow}>
              <Text style={styles.brandWordmark}>squibl</Text>
              <Text style={styles.brandTrademark}>™</Text>
            </View>
          </View>

          {/* Hero Section — Bold Display Typography matching login */}
          <View style={styles.heroSection}>
            <Text style={fontStyle}>JOIN</Text>
            <Text style={fontStyle}>THE</Text>
            <Text style={fontStyle}>NETWORK!</Text>
            <Text style={styles.heroSubtitle}>
              Create your builder account and start collaborating with developers worldwide.
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

          {/* Form Container — Sizing, Corner Radius, and Background exact match to Login */}
          <View style={styles.formContainer}>
            {/* Email Input Card */}
            <View
              style={[
                styles.inputCard,
                isEmailFocused && styles.inputCardFocused,
              ]}
            >
              <Text style={styles.cardLabel}>Email address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="#A1A1AA"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                underlineColorAndroid="transparent"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            {/* Password Input Card */}
            <View
              style={[
                styles.inputCard,
                isPasswordFocused && styles.inputCardFocused,
              ]}
            >
              <Text style={styles.cardLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#A1A1AA"
                secureTextEntry
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
            </View>

            {/* Solid Bright Red Full-width Pill Button with Glassmorphism Specular Edge */}
            <PressableScale
              style={styles.primaryButton}
              onPress={handleSignup}
              disabled={loading}
              activeScale={0.96}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </PressableScale>

            {/* Terms of Use / Privacy Policy Disclaimer */}
            <Text style={styles.disclaimerText}>
              By signing up, you agree to our{' '}
              <Text style={styles.disclaimerHighlight}>Terms and Use</Text> and confirm that you read our{' '}
              <Text style={styles.disclaimerHighlight}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Footer Sign In Link with instant tactile touch feedback */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <PressableScale
              activeScale={0.93}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.signInLink}>Sign In</Text>
            </PressableScale>
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
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerBar: {
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: -2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  brandWordmark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1.5,
  },
  brandTrademark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#71717A',
    marginLeft: 2,
    marginTop: 2,
  },
  heroSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  heroDisplayLine: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 50,
    letterSpacing: -1.5,
    textTransform: 'uppercase',
  },
  heroFontArchivo: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 46,
    lineHeight: 48,
    letterSpacing: -1,
    color: '#000000',
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717A',
    lineHeight: 20,
    marginTop: 8,
  },
  messageBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
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
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: '#ECEEF0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    height: 72,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 14,
  },
  inputCardFocused: {
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    height: 28,
  },
  primaryButton: {
    backgroundColor: RED,
    borderRadius: 9999,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disclaimerText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  disclaimerHighlight: {
    color: '#4B5563',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerText: {
    color: '#52525B',
    fontSize: 14,
    fontWeight: '500',
  },
  signInLink: {
    color: RED,
    fontSize: 14,
    fontWeight: '800',
    paddingVertical: 4,
  },
});
