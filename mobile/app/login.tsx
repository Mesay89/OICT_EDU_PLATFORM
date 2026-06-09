import React, { useState, useEffect } from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView, View as RNView, Dimensions
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, GraduationCap } from 'lucide-react-native';
import apiClient from '@/api/client';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);
  const [sendingAppeal, setSendingAppeal] = useState(false);
  const [appealSent, setAppealSent] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const handleLogin = async () => {
    setError('');
    setIsSuspended(false);
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/users/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      await login(data);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Connection error. Please try again.';
      if (err.response?.status === 403 && err.response?.data?.isSuspended) {
        setIsSuspended(true);
      } else {
        Alert.alert('Login Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async () => {
    setSendingAppeal(true);
    try {
      await apiClient.post('/users/request-appeal', { email: email.trim().toLowerCase() });
      setAppealSent(true);
      Alert.alert('Success', 'Your appeal has been sent to the administrator.');
    } catch (err) {
      Alert.alert('Error', 'Failed to send appeal. Please try again later.');
    } finally {
      setSendingAppeal(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#09090b', '#1e1b4b', '#09090b'] : ['#eef2ff', '#f5f3ff', '#fdf2f8']}
        style={StyleSheet.absoluteFill}
      />
      
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
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
            <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#111827' }]}>Welcome back</Text>
            <Text style={styles.subtitle}>Please sign in to your account</Text>
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

                {isSuspended && !appealSent && (
                  <RNView style={styles.suspendBox}>
                    <Text style={styles.suspendText}>
                      Your account has been suspended. To appeal, contact:{' '}
                    </Text>
                    <TouchableOpacity onPress={handleAppeal} disabled={sendingAppeal}>
                      <Text style={styles.appealLink}>
                        {sendingAppeal ? 'Sending...' : 'mesayboja3@gmail.com'}
                      </Text>
                    </TouchableOpacity>
                  </RNView>
                )}

                {appealSent && (
                  <RNView style={styles.successBox}>
                    <Text style={styles.successText}>
                      Appeal sent! Check your email soon.
                    </Text>
                  </RNView>
                )}

                <RNView style={styles.form}>
                  <RNView style={styles.inputGroup}>
                    <Text style={[styles.label, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>Email address</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: isDarkMode ? '#27272a' : '#fff',
                        borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
                        color: isDarkMode ? '#fff' : '#111827'
                      }]}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="off"
                      editable={!loading}
                    />
                  </RNView>

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
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete="off"
                        editable={!loading}
                      />
                      <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} color="#71717a" /> : <Eye size={20} color="#71717a" />}
                      </TouchableOpacity>
                    </RNView>
                  </RNView>

                  <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/forgot-password')}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleLogin} disabled={loading}>
                    <LinearGradient
                      colors={['#4f46e5', '#7c3aed']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btn}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnText}>Sign in</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <RNView style={styles.footer}>
                    <Text style={[styles.footerText, { color: isDarkMode ? '#a1a1aa' : '#6b7280' }]}>
                      Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                      <Text style={styles.footerLink}>Sign up now</Text>
                    </TouchableOpacity>
                  </RNView>
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
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
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
  forgotBtn: { alignSelf: 'center' },
  forgotText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
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
  suspendBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 14, marginBottom: 16 },
  suspendText: { color: '#92400e', fontSize: 13 },
  appealLink: { color: '#d97706', fontWeight: '800', textDecorationLine: 'underline', marginTop: 4 },
  successBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14, marginBottom: 16 },
  successText: { color: '#166534', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
