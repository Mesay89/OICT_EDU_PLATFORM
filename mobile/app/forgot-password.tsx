import React, { useState } from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, View as RNView, ScrollView
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setLoading(true); setError('');
    try {
      await apiClient.post('/users/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll}>
        <RNView style={styles.header}>
          <RNView style={styles.iconBox}><Mail size={36} color="#fff" /></RNView>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>
        </RNView>
        <RNView style={styles.card}>
          {sent ? (
            <RNView style={styles.successBox}>
              <Text style={styles.successTitle}>✓ Email Sent!</Text>
              <Text style={styles.successMsg}>
                If an account exists for {email}, you will receive a password reset link shortly.
              </Text>
              <TouchableOpacity style={styles.btn} onPress={() => router.replace('/login')}>
                <Text style={styles.btnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </RNView>
          ) : (
            <>
              {!!error && <RNView style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></RNView>}
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.footer} onPress={() => router.back()}>
                <Text style={styles.footerLink}>← Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </RNView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6366f1' },
  backBtn: { position: 'absolute', top: 52, left: 16, zIndex: 10, padding: 8 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 28 },
  iconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { height: 52, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb', marginBottom: 8 },
  btn: { height: 52, backgroundColor: TINT, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 16, shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer: { marginTop: 16, alignItems: 'center' },
  footerLink: { color: TINT, fontWeight: '700', fontSize: 14 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  successBox: { alignItems: 'center', gap: 12 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#10b981' },
  successMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
});
