import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View as RNView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Wallet, CreditCard, CheckCircle, XCircle,
  Clock, AlertCircle, DollarSign, Building, Send
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

const BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Awash Bank',
  'Abyssinia Bank',
  'Dashen Bank',
  'TeleBirr',
  'CBE Birr',
  'Other',
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'approved') return <CheckCircle size={16} color="#10b981" />;
  if (status === 'rejected') return <XCircle size={16} color="#ef4444" />;
  return <Clock size={16} color="#f59e0b" />;
}

export default function WithdrawalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showBankList, setShowBankList] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBg = isDarkMode ? '#374151' : '#f3f4f6';

  useEffect(() => {
    if (user?.role !== 'instructor') {
      Alert.alert('Access Denied', 'Instructor role required.');
      router.back();
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [wRes, sRes] = await Promise.all([
        apiClient.get('/withdrawals/my'),
        apiClient.get('/stats/instructor').catch(() => ({ data: null })),
      ]);
      setWithdrawals(Array.isArray(wRes.data) ? wRes.data : []);
      setStats(sRes.data);
    } catch (err: any) {
      console.log('Withdrawal fetch error:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !bankName || !accountNumber) {
      Alert.alert('Required', 'Please fill all fields.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { data } = await apiClient.post('/withdrawals', {
        amount: numAmount,
        bankName,
        accountNumber,
      });
      setMessage(data.message || 'Withdrawal request submitted successfully!');
      setMessageType('success');
      setAmount('');
      setBankName('');
      setAccountNumber('');
      fetchAll();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to submit withdrawal request');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) =>
    s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#f59e0b';

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Withdrawal</Text>
      </RNView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={TINT} />}
      >
        {/* Earnings stats */}
        {stats && (
          <RNView style={styles.statsRow}>
            <RNView style={[styles.statCard, { backgroundColor: card }]}>
              <DollarSign size={20} color="#10b981" />
              <Text style={[styles.statVal, { color: textColor }]}>
                ETB {stats.totalEarnings?.toLocaleString() || 0}
              </Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Total Earnings</Text>
            </RNView>
            <RNView style={[styles.statCard, { backgroundColor: card }]}>
              <Wallet size={20} color={TINT} />
              <Text style={[styles.statVal, { color: textColor }]}>
                ETB {stats.availableBalance?.toLocaleString() || 0}
              </Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Available</Text>
            </RNView>
          </RNView>
        )}

        {/* Status message */}
        {message !== '' && (
          <RNView style={[styles.msgBox, messageType === 'success' ? styles.msgSuccess : styles.msgError]}>
            {messageType === 'success' ? <CheckCircle size={16} color="#10b981" /> : <AlertCircle size={16} color="#ef4444" />}
            <Text style={[styles.msgText, { color: messageType === 'success' ? '#065f46' : '#991b1b' }]}>
              {message}
            </Text>
          </RNView>
        )}

        {/* Withdrawal Form */}
        <RNView style={[styles.formCard, { backgroundColor: card }]}>
          <Text style={[styles.formTitle, { color: textColor }]}>Request Withdrawal</Text>

          <Text style={[styles.label, { color: subColor }]}>Amount (ETB)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="e.g. 500"
            placeholderTextColor={subColor}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={[styles.label, { color: subColor }]}>Bank / Mobile Money</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectInput, { backgroundColor: inputBg }]}
            onPress={() => setShowBankList(!showBankList)}
          >
            <Text style={{ color: bankName ? textColor : subColor, fontWeight: '600' }}>
              {bankName || 'Select Bank / Mobile Money'}
            </Text>
            <Building size={18} color={subColor} />
          </TouchableOpacity>

          {showBankList && (
            <RNView style={[styles.bankList, { backgroundColor: isDarkMode ? '#374151' : '#f9fafb' }]}>
              {BANKS.map(b => (
                <TouchableOpacity
                  key={b}
                  style={[styles.bankItem, { borderBottomColor: isDarkMode ? '#4b5563' : '#f3f4f6' }]}
                  onPress={() => { setBankName(b); setShowBankList(false); }}
                >
                  <Text style={[styles.bankItemText, { color: textColor }]}>{b}</Text>
                  {bankName === b && <CheckCircle size={14} color={TINT} />}
                </TouchableOpacity>
              ))}
            </RNView>
          )}

          <Text style={[styles.label, { color: subColor }]}>Account Number / Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="e.g. 0912345678 or 1000123456789"
            placeholderTextColor={subColor}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Send size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                </>
            }
          </TouchableOpacity>
        </RNView>

        {/* Withdrawal History */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Request History</Text>
        {withdrawals.length === 0 ? (
          <RNView style={[styles.emptyBox, { backgroundColor: card }]}>
            <Wallet size={40} color="#d1d5db" />
            <Text style={[styles.emptyText, { color: subColor }]}>No withdrawal requests yet</Text>
          </RNView>
        ) : (
          withdrawals.map(w => (
            <RNView key={w._id} style={[styles.historyCard, { backgroundColor: card }]}>
              <RNView style={{ flex: 1 }}>
                <Text style={[styles.historyAmount, { color: textColor }]}>
                  ETB {w.amount?.toLocaleString()}
                </Text>
                <Text style={[styles.historySub, { color: subColor }]}>
                  {w.bankName} · {w.accountNumber}
                </Text>
                {w.rejectionReason && (
                  <Text style={styles.rejectReason}>Reason: {w.rejectionReason}</Text>
                )}
                <Text style={[styles.historyDate, { color: subColor }]}>
                  {new Date(w.createdAt).toLocaleDateString()}
                </Text>
              </RNView>
              <RNView style={styles.statusBadge}>
                <StatusIcon status={w.status} />
                <Text style={[styles.statusText, { color: statusColor(w.status) }]}>
                  {(w.status || 'pending').charAt(0).toUpperCase() + (w.status || 'pending').slice(1)}
                </Text>
              </RNView>
            </RNView>
          ))
        )}
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  headerTitle: { fontSize: 20, fontWeight: '900', flex: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 16 },
  msgSuccess: { backgroundColor: '#d1fae5' },
  msgError: { backgroundColor: '#fee2e2' },
  msgText: { flex: 1, fontSize: 13, fontWeight: '700' },
  formCard: {
    padding: 20, borderRadius: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4
  },
  formTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16,
    borderWidth: 1, borderColor: 'transparent'
  },
  selectInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankList: { borderRadius: 12, marginTop: -12, marginBottom: 16, overflow: 'hidden' },
  bankItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1
  },
  bankItemText: { fontSize: 14, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: TINT, borderRadius: 14, paddingVertical: 16,
    shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 14 },
  emptyBox: { alignItems: 'center', padding: 32, borderRadius: 16, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700' },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2
  },
  historyAmount: { fontSize: 17, fontWeight: '900', marginBottom: 2 },
  historySub: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  historyDate: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  rejectReason: { fontSize: 12, color: '#dc2626', fontStyle: 'italic' },
  statusBadge: { alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '800' },
});
