import React, { useState, useEffect } from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView, View as RNView, Dimensions
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth, getPostAuthRoute } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, GraduationCap, ChevronDown } from 'lucide-react-native';
import apiClient from '@/api/client';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const TINT = '#6366f1';

const ROLES = [
  { label: 'Student', value: 'student' },
  { label: 'Instructor', value: 'instructor' },
];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');

  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const validateForm = () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters'); return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address'); return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters'); return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match'); return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/users', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        referralCode: referralCode.trim().toUpperCase(),
      });

      if (data.requiresOTP) {
        setStep(2);
        Alert.alert('Success', data.message);
      } else {
        const msg = role === 'instructor'
          ? 'Registration successful! Your instructor account is pending approval.'
          : 'Registration successful! Redirecting to dashboard...';

        Alert.alert('Success', msg);
        await login(data);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpHandler = async () => {
    if (!otp.trim()) return setError('Please enter the OTP');
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.post('/users/verify-otp', { email: email.trim(), otp: otp.trim() });
      const msg = data.role === 'instructor' 
        ? 'Verification successful! Your instructor account is pending approval.' 
        : 'Verification successful! Redirecting to dashboard...';
      Alert.alert('Success', msg);
      await login(data);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally { setLoading(false); }
  };

  const resendOtpHandler = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.post('/users/resend-otp', { email: email.trim() });
      Alert.alert('Success', data.message || 'A new OTP has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#09090b', '#1e1b4b', '#09090b'] : ['#eef2ff', '#f5f3ff', '#fdf2f8']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : router.replace('/')}>
        <ChevronLeft size={28} color={isDarkMode ? '#fff' : '#4f46e5'} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <RNView style={styles.content}>
          {/* Brand Header */}
          <RNView style={styles.header}>
            <LinearGradient
              colors={['#4f46e5', '#9333ea']}
              style={styles.iconBox}
            >
              <GraduationCap size={32} color="#fff" />
            </LinearGradient>
            <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#111827' }]}>
              {step === 1 ? 'Create an account' : 'Verify Email'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Join OICT TUTOR today' : `OTP sent to ${email}`}
            </Text>
          </RNView>

          {/* Card with Gradient Border */}
          <RNView style={styles.cardWrapper}>
            <LinearGradient
              colors={['#4f46e5', '#9333ea', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <RNView style={[styles.card, { backgroundColor: isDarkMode ? '#18181b' : '#fff' }]}>
                {!!error && (
                  <RNView style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </RNView>
                )}

                <RNView style={styles.form}>
                  {step === 1 ? (
                    <>
                      {/* Full Name */}
                      <RNView style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>Full Name</Text>
                        <TextInput
                          style={[styles.input, { 
                            backgroundColor: isDarkMode ? '#27272a' : '#fff',
                            borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                            color: isDarkMode ? '#fff' : '#111827'
                          }]}
                          placeholder="John Doe"
                          placeholderTextColor={isDarkMode ? '#71717a' : '#9ca3af'}
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                          editable={!loading}
                        />
                      </RNView>

                      {/* Email */}
                      <RNView style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>Email address</Text>
                        <TextInput
                          style={[styles.input, { 
                            backgroundColor: isDarkMode ? '#27272a' : '#fff',
                            borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                            color: isDarkMode ? '#fff' : '#111827'
                          }]}
                          placeholder="you@example.com"
                          placeholderTextColor={isDarkMode ? '#71717a' : '#9ca3af'}
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          editable={!loading}
                        />
                      </RNView>

                      {/* Password */}
                      <RNView style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>Password</Text>
                        <RNView style={styles.passwordContainer}>
                          <TextInput
                            style={[styles.input, { 
                              flex: 1,
                              backgroundColor: isDarkMode ? '#27272a' : '#fff',
                              borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                              color: isDarkMode ? '#fff' : '#111827'
                            }]}
                            placeholder="••••••••"
                            placeholderTextColor={isDarkMode ? '#71717a' : '#9ca3af'}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                          />
                          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={20} color="#71717a" /> : <Eye size={20} color="#71717a" />}
                          </TouchableOpacity>
                        </RNView>
                      </RNView>

                      {/* Confirm Password */}
                      <RNView style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>Confirm Password</Text>
                        <RNView style={styles.passwordContainer}>
                          <TextInput
                            style={[styles.input, { 
                              flex: 1,
                              backgroundColor: isDarkMode ? '#27272a' : '#fff',
                              borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                              color: isDarkMode ? '#fff' : '#111827'
                            }]}
                            placeholder="••••••••"
                            placeholderTextColor={isDarkMode ? '#71717a' : '#9ca3af'}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                          />
                          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff size={20} color="#71717a" /> : <Eye size={20} color="#71717a" />}
                          </TouchableOpacity>
                        </RNView>
                      </RNView>

                      {/* Role Picker */}
                      <RNView style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>I am a...</Text>
                        <TouchableOpacity
                          style={[styles.picker, { backgroundColor: isDarkMode ? '#27272a' : '#fff', borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb' }]}
                          onPress={() => setShowRolePicker(!showRolePicker)}
                          disabled={loading}
                        >
                          <Text style={[styles.pickerText, { color: isDarkMode ? '#fff' : '#111827' }]}>
                            {ROLES.find(r => r.value === role)?.label}
                          </Text>
                          <ChevronDown size={18} color="#71717a" />
                        </TouchableOpacity>
                        {showRolePicker && (
                          <RNView style={[styles.dropdownBox, { backgroundColor: isDarkMode ? '#27272a' : '#fff', borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb' }]}>
                            {ROLES.map(r => (
                              <TouchableOpacity
                                key={r.value}
                                style={[styles.dropdownItem, role === r.value && styles.dropdownItemActive, { borderBottomColor: isDarkMode ? '#3f3f46' : '#f3f4f6' }]}
                                onPress={() => { setRole(r.value); setShowRolePicker(false); }}
                              >
                                <Text style={[styles.dropdownText, role === r.value && styles.dropdownTextActive, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
                                  {r.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </RNView>
                        )}
                      </RNView>

                      {/* Referral Code */}
                      <RNView style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>Referral Code (Optional)</Text>
                        <TextInput
                          style={[styles.input, { 
                            backgroundColor: isDarkMode ? '#27272a' : '#fff',
                            borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                            color: isDarkMode ? '#fff' : '#111827',
                            textTransform: 'uppercase'
                          }]}
                          placeholder="XXXXXX"
                          placeholderTextColor={isDarkMode ? '#71717a' : '#9ca3af'}
                          value={referralCode}
                          onChangeText={t => setReferralCode(t.toUpperCase())}
                          autoCapitalize="characters"
                          editable={!loading}
                        />
                      </RNView>

                      <TouchableOpacity onPress={handleRegister} disabled={loading}>
                        <LinearGradient
                          colors={['#4f46e5', '#7c3aed']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.btn}
                        >
                          {loading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.btnText}>Create account</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <RNView style={styles.footer}>
                        <Text style={[styles.footerText, { color: isDarkMode ? '#a1a1aa' : '#6b7280' }]}>
                          Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                          <Text style={styles.footerLink}>Sign in</Text>
                        </TouchableOpacity>
                      </RNView>
                    </>
                  ) : (
                    <>
                      {/* OTP Input */}
                      <RNView style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>Enter OTP</Text>
                        <TextInput
                          style={[styles.input, { 
                            backgroundColor: isDarkMode ? '#27272a' : '#fff',
                            borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                            color: isDarkMode ? '#fff' : '#111827',
                            textAlign: 'center',
                            fontSize: 20,
                            letterSpacing: 4
                          }]}
                          placeholder="123456"
                          placeholderTextColor={isDarkMode ? '#71717a' : '#9ca3af'}
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                          editable={!loading}
                        />
                      </RNView>

                      <TouchableOpacity onPress={verifyOtpHandler} disabled={loading}>
                        <LinearGradient
                          colors={['#4f46e5', '#7c3aed']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.btn}
                        >
                          {loading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.btnText}>Verify Email</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <RNView style={[styles.footer, { flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 16 }]}>
                        <TouchableOpacity onPress={resendOtpHandler} disabled={loading}>
                          <Text style={styles.footerLink}>Resend OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep(1)} disabled={loading}>
                          <Text style={[styles.footerText, { color: isDarkMode ? '#a1a1aa' : '#6b7280' }]}>Back to Registration</Text>
                        </TouchableOpacity>
                      </RNView>
                    </>
                  )}
                </RNView>
              </RNView>
            </LinearGradient>
          </RNView>
        </RNView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { position: 'absolute', top: 52, left: 16, zIndex: 10, padding: 8 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  content: { padding: 24, paddingTop: 100 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconBox: {
    width: 64, height: 64, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#71717a', textAlign: 'center' },
  cardWrapper: { borderRadius: 24, padding: 1, overflow: 'hidden' },
  cardGradient: { borderRadius: 24, padding: 1 },
  card: { borderRadius: 23, padding: 24 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 15,
  },
  passwordContainer: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 14, padding: 8 },
  picker: {
    height: 52, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerText: { fontSize: 15 },
  dropdownBox: {
    borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1 },
  dropdownItemActive: { backgroundColor: '#eef2ff' },
  dropdownText: { fontSize: 15 },
  dropdownTextActive: { color: '#6366f1', fontWeight: '700' },
  btn: {
    height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { fontSize: 14 },
  footerLink: { color: '#6366f1', fontWeight: '800', fontSize: 14 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
