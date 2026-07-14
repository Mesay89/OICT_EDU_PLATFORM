import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, Image, TextInput, Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, CreditCard, ShieldCheck, Info, CheckCircle,
  Smartphone, Building, Globe, DollarSign, X
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

const PAYMENT_METHODS = [
  { id: 'chapa', label: 'Chapa (Telebirr, CBE, Banks)', icon: '🇪🇹', description: 'Pay via Ethiopian mobile money & banks' },
  { id: 'cbe', label: 'CBE Bank Transfer (Manual)', icon: '🏦', description: 'Transfer to CBE account & notify us' },
  { id: 'telebirr', label: 'TeleBirr Manual Transfer', icon: '📱', description: 'Transfer via TeleBirr & notify us' },
  { id: 'stripe', label: 'International Card (Stripe)', icon: '💳', description: 'Visa, Mastercard, etc.' },
];

export default function BundleCheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { isDarkMode } = useTheme();

  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('chapa');
  const [processing, setProcessing] = useState(false);
  const [chapaUrl, setChapaUrl] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';

  useEffect(() => {
    if (id) fetchBundle();
  }, [id]);

  const fetchBundle = async () => {
    try {
      const { data } = await apiClient.get(`/bundles/${id}`);
      setBundle(data);
    } catch {
      Alert.alert('Error', 'Failed to load bundle'); router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) { router.push('/login'); return; }
    setProcessing(true);
    try {
      if (method === 'chapa') {
        // Initiate Chapa payment and get redirect URL
        const { data } = await apiClient.post('/payments/bundle/chapa', {
          bundleId: bundle._id,
          amount: bundle.price,
        });
        if (data.checkoutUrl) {
          setChapaUrl(data.checkoutUrl);
          setShowWebView(true);
        } else {
          Alert.alert('Error', 'Could not get payment URL. Please try manual transfer.');
        }
      } else if (method === 'stripe') {
        const { data } = await apiClient.post('/payments/bundle/stripe', {
          bundleId: bundle._id,
          amount: bundle.price,
        });
        if (data.checkoutUrl) {
          setChapaUrl(data.checkoutUrl);
          setShowWebView(true);
        } else {
          Alert.alert('Not available', 'Stripe is not configured. Please use Chapa or manual transfer.');
        }
      } else {
        // Manual (CBE or Telebirr)
        await apiClient.post('/payments/bundle/initiate', {
          bundleId: bundle._id,
          amount: bundle.price,
          method,
          transactionRef: transactionRef || undefined,
        });
        router.replace({
          pathname: '/success',
          params: {
            type: 'payment',
            title: 'Request Submitted!',
            message: `Please transfer ${formatPrice(bundle.price).formatted} via ${method === 'cbe' ? 'CBE Bank' : 'TeleBirr'} and contact support with your transaction ID for quick approval.`,
          }
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !bundle) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={TINT} />
    </RNView>
  );

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Chapa WebView Modal */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <RNView style={{ flex: 1 }}>
          <RNView style={styles.webViewHeader}>
            <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.webViewClose}>
              <X size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Secure Payment</Text>
            <ShieldCheck size={20} color="#10b981" />
          </RNView>
          <WebView
            source={{ uri: chapaUrl }}
            onNavigationStateChange={(navState) => {
              // Detect successful payment redirect
              if (navState.url.includes('success') || navState.url.includes('callback')) {
                setShowWebView(false);
                router.replace({
                  pathname: '/success',
                  params: { type: 'payment', title: 'Payment Successful!', message: 'Your bundle has been unlocked. Happy learning!' }
                });
              }
            }}
          />
        </RNView>
      </Modal>

      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Bundle Checkout</Text>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Bundle Summary */}
        <RNView style={[styles.summaryCard, { backgroundColor: card }]}>
          <Image
            source={{ uri: bundle.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }}
            style={styles.thumb}
          />
          <RNView style={{ flex: 1 }}>
            <Text style={[styles.bundleTitle, { color: textColor }]} numberOfLines={2}>
              {bundle.title}
            </Text>
            <Text style={styles.courseCount}>{(bundle.courses || []).length} courses included</Text>
            <Text style={styles.bundlePrice}>{formatPrice(bundle.price).formatted}</Text>
          </RNView>
        </RNView>

        {/* Payment Method */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Payment Method</Text>
        {PAYMENT_METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodRow, { backgroundColor: card }, method === m.id && styles.methodActive]}
            onPress={() => setMethod(m.id)}
          >
            <Text style={styles.methodIcon}>{m.icon}</Text>
            <RNView style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, { color: textColor }, method === m.id && { color: TINT }]}>
                {m.label}
              </Text>
              <Text style={styles.methodDesc}>{m.description}</Text>
            </RNView>
            <RNView style={[styles.radio, method === m.id && styles.radioActive]}>
              {method === m.id && <RNView style={styles.radioInner} />}
            </RNView>
          </TouchableOpacity>
        ))}

        {/* Manual transfer reference field */}
        {(method === 'cbe' || method === 'telebirr') && (
          <RNView style={[styles.instructionBox, { backgroundColor: card }]}>
            <Text style={styles.instrTitle}>
              {method === 'cbe' ? '🏦 CBE Transfer Details' : '📱 TeleBirr Transfer Details'}
            </Text>
            <Text style={styles.instrText}>
              {method === 'cbe'
                ? `Account: 1000475739098\nAmount: ${formatPrice(bundle.price).formatted}\n\nAfter transfer, enter your transaction ID below:`
                : `TeleBirr Number: 0939648955\nAmount: ${formatPrice(bundle.price).formatted}\n\nAfter transfer, enter your transaction ID below:`}
            </Text>
            <TextInput
              style={styles.refInput}
              placeholder="Transaction ID / Reference (optional)"
              value={transactionRef}
              onChangeText={setTransactionRef}
              placeholderTextColor="#9ca3af"
            />
          </RNView>
        )}

        {/* Security */}
        <RNView style={styles.secureRow}>
          <ShieldCheck size={16} color="#10b981" />
          <Text style={styles.secureText}>SSL Encrypted & Secure Checkout</Text>
        </RNView>

        {/* Total & CTA */}
        <RNView style={styles.footer}>
          <RNView style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: textColor }]}>Total:</Text>
            <Text style={styles.totalVal}>{formatPrice(bundle.price).formatted}</Text>
          </RNView>
          <TouchableOpacity style={styles.payBtn} onPress={handlePayment} disabled={processing}>
            {processing
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.payBtnText}>
                  {method === 'chapa' ? '🇪🇹 Pay with Chapa' :
                   method === 'stripe' ? '💳 Pay with Stripe' :
                   '✅ Submit Payment Request'}
                </Text>
            }
          </TouchableOpacity>
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', flex: 1 },
  webViewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  webViewClose: { padding: 4 },
  webViewTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: '#111827' },
  summaryCard: {
    flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  thumb: { width: 80, height: 60, borderRadius: 10, backgroundColor: '#e5e7eb' },
  bundleTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  courseCount: { fontSize: 12, color: '#9ca3af', fontWeight: '700', marginBottom: 4 },
  bundlePrice: { fontSize: 18, fontWeight: '900', color: TINT },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent'
  },
  methodActive: { borderColor: TINT },
  methodIcon: { fontSize: 22 },
  methodLabel: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  methodDesc: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: TINT },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: TINT },
  instructionBox: { borderRadius: 16, padding: 16, marginTop: 8, marginBottom: 8 },
  instrTitle: { fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 8 },
  instrText: { fontSize: 13, color: '#4b5563', lineHeight: 20, marginBottom: 12 },
  refInput: {
    backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb'
  },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginVertical: 16 },
  secureText: { fontSize: 12, color: '#10b981', fontWeight: '700' },
  footer: { gap: 16, marginTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalVal: { fontSize: 26, fontWeight: '900', color: TINT },
  payBtn: {
    backgroundColor: TINT, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
