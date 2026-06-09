import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, Image, TextInput
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, CreditCard, ShieldCheck, CheckCircle, Info } from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const TINT = '#6366f1';

interface Course {
  _id: string;
  title: string;
  image?: string;
  price: number;
}

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('manual');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await apiClient.get(`/courses/${id}`);
      setCourse(data);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load course details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      if (method === 'manual') {
        // Create a pending payment record
        await apiClient.post('/payments/initiate', {
          courseId: course?._id,
          amount: course?.price,
          method: 'manual'
        });
        router.replace({
          pathname: '/success',
          params: {
            type: 'payment',
            title: 'Request Submitted',
            message: 'Your payment request has been submitted. Please send the payment via Bank Transfer/Telebirr and upload the screenshot on the web panel or contact support.'
          }
        });
      } else {
        Alert.alert('Notice', `${method.toUpperCase()} integration is available on the web version. Mobile integration is coming soon.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !course) return <RNView style={styles.centered}><ActivityIndicator color={TINT} /></RNView>;

  return (
    <RNView style={styles.container}>
      <RNView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Course Summary */}
        <RNView style={styles.summaryCard}>
          <Image
            source={{ uri: course?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }}
            style={styles.courseThumb}
          />
          <RNView style={{ flex: 1 }}>
            <Text style={styles.courseTitle} numberOfLines={2}>{course?.title}</Text>
            <Text style={styles.coursePrice}>${course?.price}</Text>
          </RNView>
        </RNView>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {[
          { id: 'chapa', label: 'Chapa (Mobile Money / Cards)', icon: CreditCard },
          { id: 'stripe', label: 'Stripe (International Cards)', icon: CreditCard },
          { id: 'manual', label: 'Manual Bank Transfer / Telebirr', icon: Info },
        ].map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodRow, method === m.id && styles.methodActive]}
            onPress={() => setMethod(m.id)}
          >
            <RNView style={styles.methodInfo}>
              <m.icon size={20} color={method === m.id ? TINT : '#6b7280'} />
              <Text style={[styles.methodLabel, method === m.id && styles.methodLabelActive]}>{m.label}</Text>
            </RNView>
            <RNView style={[styles.radio, method === m.id && styles.radioActive]}>
              {method === m.id && <RNView style={styles.radioInner} />}
            </RNView>
          </TouchableOpacity>
        ))}

        {method === 'manual' && (
          <RNView style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>Manual Transfer Instructions:</Text>
            <Text style={styles.instructionText}>
              1. Transfer ${course?.price} to our bank account or Telebirr.{'\n'}
              2. Keep the transaction ID or screenshot.{'\n'}
              3. Click "Complete Checkout" to notify us.{'\n'}
              4. We will approve your access within 2-4 hours.
            </Text>
          </RNView>
        )}

        {/* Security Info */}
        <RNView style={styles.securityBox}>
          <ShieldCheck size={16} color="#10b981" />
          <Text style={styles.securityText}>Secure SSL Encrypted Payment</Text>
        </RNView>

        {/* Total & CTA */}
        <RNView style={styles.footer}>
          <RNView style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalVal}>${course?.price}</Text>
          </RNView>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Complete Checkout</Text>}
          </TouchableOpacity>
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  summaryCard: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  courseThumb: { width: 80, height: 60, borderRadius: 10, backgroundColor: '#f3f4f6' },
  courseTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  coursePrice: { fontSize: 18, fontWeight: '900', color: TINT },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 12 },
  methodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  methodActive: { borderColor: TINT, backgroundColor: '#f5f7ff' },
  methodInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodLabel: { fontSize: 14, fontWeight: '700', color: '#4b5563' },
  methodLabelActive: { color: TINT },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: TINT },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: TINT },
  instructionBox: { backgroundColor: '#fff7ed', borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1, borderColor: '#ffedd5' },
  instructionTitle: { fontSize: 14, fontWeight: '800', color: '#9a3412', marginBottom: 8 },
  instructionText: { fontSize: 13, color: '#c2410c', lineHeight: 20 },
  securityBox: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginVertical: 20 },
  securityText: { fontSize: 12, color: '#10b981', fontWeight: '700' },
  footer: { marginTop: 10, gap: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  totalVal: { fontSize: 24, fontWeight: '900', color: '#111827' },
  payBtn: { backgroundColor: TINT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
