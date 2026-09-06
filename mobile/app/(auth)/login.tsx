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
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { supabase } from '../../lib/supabase';
import { COUNTRIES, Country } from '../../lib/countries';
import { CountryPickerView } from '../../components/CountryPickerView';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';

export default function LoginScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'Anton-Regular': require('../../assets/fonts/Anton-Regular.ttf'),
    'ArchivoBlack-Regular': require('../../assets/fonts/ArchivoBlack-Regular.ttf'),
    'Geist-UltraBlack': require('../../assets/fonts/Geist-UltraBlack.ttf'),
  });

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Defaults to India 🇮🇳 +91
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    // Support entered email/password, or fallback to test/phone account to preserve auth functionality
    const targetEmail =
      email.trim() ||
      (phoneNumber
        ? `phone_${phoneNumber.replace(/\D/g, '')}@squibl.dev`
        : 'keerthan.squibl.test@gmail.com');
    const targetPassword = password || 'Password123!';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
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
  }, [email, phoneNumber, password, router]);

  const handleQuickLoginFill = useCallback(() => {
    setSelectedCountry(COUNTRIES[0]);
    setPhoneNumber('9876543210');
    setEmail('keerthan.squibl.test@gmail.com');
    setPassword('Password123!');
  }, []);

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setIsCountryPickerOpen(false);
  }, []);

  const handleCountryPickerClose = useCallback(() => {
    setIsCountryPickerOpen(false);
  }, []);

  // Dedicated Full-Screen Country Picker
  if (isCountryPickerOpen) {
    return (
      <CountryPickerView
        selectedCountry={selectedCountry}
        onSelect={handleCountrySelect}
        onBack={handleCountryPickerClose}
      />
    );
  }

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
          {/* Top Brand Bar — Premium squibl™ Wordmark without icon box */}
          <View style={styles.headerBar}>
            <View style={styles.brandRow}>
              <Text style={styles.brandWordmark}>squibl</Text>
              <Text style={styles.brandTrademark}>™</Text>
            </View>

            {/* Subtle Dev Quick Login Button */}
            <PressableScale
              style={styles.devQuickLoginBtn}
              onPress={handleQuickLoginFill}
              activeScale={0.94}
            >
              <Text style={styles.devQuickLoginText}>⚡ Quick Login</Text>
            </PressableScale>
          </View>

          {/* Hero Section — Headline with 3D logo nestled in "BIGGEST" */}
          <View style={styles.heroSection}>
            <Text style={fontStyle}>THE</Text>
            <View style={styles.heroRowWithBadge}>
              <Text style={fontStyle}>BIG</Text>
              <View style={styles.cubeBadgeWrapper}>
                <Image
                  source={require('../../assets/squibl-logo.png')}
                  style={styles.heroCubeLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={fontStyle}>ST</Text>
            </View>
            <Text style={fontStyle}>BUILDER</Text>
            <Text style={fontStyle}>NETWORK!</Text>
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

          {/* Phone Login Section — Country Selector + Phone Number Row */}
          <View style={styles.formContainer}>
            <View style={styles.phoneInputRow}>
              {/* Country Selector Card — Fixed 122px width with glassmorphic depth */}
              <PressableScale
                style={styles.countryCard}
                onPress={() => setIsCountryPickerOpen(true)}
                activeScale={0.97}
              >
                <Text style={styles.cardLabel}>Country</Text>
                <View style={styles.countrySelector}>
                  <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCodeText}>{selectedCountry.callingCode}</Text>
                  <Text style={styles.chevronIcon}>⌵</Text>
                </View>
              </PressableScale>

              {/* Phone Number Input Card — Fills remaining row width */}
              <View
                style={[
                  styles.phoneCard,
                  isPhoneFocused && styles.phoneCardFocused,
                ]}
              >
                <Text style={styles.cardLabel}>Phone number</Text>
                <TextInput
                  style={styles.phoneTextInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#A1A1AA"
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  underlineColorAndroid="transparent"
                  value={phoneNumber}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  onChangeText={(val) => {
                    setPhoneNumber(val);
                    setEmail(val ? `${val.replace(/\D/g, '')}@squibl.dev` : '');
                  }}
                />
              </View>
            </View>

            {/* Solid Bright Red Full-width Pill "Continue" Button with Glassmorphism Specular Edge */}
            <PressableScale
              style={styles.continueButton}
              onPress={handleLogin}
              disabled={loading}
              activeScale={0.96}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </PressableScale>

            {/* Terms of Use / Privacy Policy Disclaimer matching reference */}
            <Text style={styles.disclaimerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.disclaimerHighlight}>Terms and Use</Text> and confirm that you read our{' '}
              <Text style={styles.disclaimerHighlight}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Sign Up Link with tactile spring responsiveness */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <PressableScale
              activeScale={0.93}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.signupLink}>Sign up</Text>
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
  devQuickLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  devQuickLoginText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.2,
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
    marginTop: 10,
    marginBottom: 26,
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
  heroRowWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cubeBadgeWrapper: {
    width: 44,
    height: 44,
    marginHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCubeLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
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
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    width: '100%',
  },
  countryCard: {
    width: 122,
    minWidth: 122,
    flexShrink: 0,
    backgroundColor: '#ECEEF0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    height: 72,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  phoneCard: {
    flex: 1,
    backgroundColor: '#ECEEF0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    height: 72,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  phoneCardFocused: {
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    marginBottom: 4,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginRight: 4,
  },
  chevronIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: '#71717A',
    marginTop: -2,
  },
  phoneTextInput: {
    fontSize: 19,
    fontWeight: '800',
    color: '#000000',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    height: 28,
  },
  continueButton: {
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
  continueButtonText: {
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
  signupLink: {
    color: RED,
    fontSize: 14,
    fontWeight: '800',
    paddingVertical: 4,
  },
});
