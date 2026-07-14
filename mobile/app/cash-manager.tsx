import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View as RNView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput, Modal, Image
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import {
  DollarSign, CheckCircle, XCircle, Eye, RefreshCw, Search,
  Users, CreditCard, ArrowDownCircle, BarChart3, X, AlertTriangle,
  BookOpen, ChevronRight
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownCircle },
  { id: 'refunds', label: 'Refunds', icon: RefreshCw },
];

function StatCard({ icon: Icon, label, value, color }: any) {
  const { isDarkMode } = useTheme();
  return (
    <RNView style={[styles.statCard, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
      <RNView style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </RNView>
      <Text style={[styles.statVal, { color: isDarkMode ? '#fff' : '#111827' }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
    </RNView>
  );
}

export default function CashManagerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';

  useEffect(() => {
    if (user?.role !== 'cashManager') {
      Alert.alert('Access Denied', 'Cash Manager role required.');
      router.replace('/');
    } else {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'overview' || activeTab === 'payments') {
        const { data } = await apiClient.get('/payments/all');
        const arr = Array.isArray(data) ? data : [];
        setPayments(arr);
        // Build stats from payments
        const total = arr.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const pending = arr.filter((p: any) => p.status === 'pending').length;
        const approved = arr.filter((p: any) => p.status === 'approved').length;
        setStats({ total, pending, approved, count: arr.length });
      }
      if (activeTab === 'withdrawals') {
        const { data } = await apiClient.get('/withdrawals/all');
        setWithdrawals(Array.isArray(data) ? data : []);
      }
      if (activeTab === 'refunds') {
        const { data } = await apiClient.get('/refunds/all');
        setRefunds(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.log('Cash manager fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const approvePayment = async (paymentId: string) => {
    setProcessing(true);
    try {
      await apiClient.put(`/payments/${paymentId}/approve`);
      Alert.alert('Success', 'Payment approved!');
      setSelectedPayment(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    if (!rejectReason.trim()) { Alert.alert('Required', 'Please enter a rejection reason'); return; }
    setProcessing(true);
    try {
      await apiClient.put(`/payments/${paymentId}/reject`, { reason: rejectReason });
      Alert.alert('Done', 'Payment rejected.');
      setSelectedPayment(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const approveWithdrawal = async (wId: string) => {
    setProcessing(true);
    try {
      await apiClient.put(`/withdrawals/${wId}/approve`);
      Alert.alert('Done', 'Withdrawal approved!');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setProcessing(false); }
  };

  const processRefund = async (refundId: string, action: 'approve' | 'reject') => {
    setProcessing(true);
    try {
      await apiClient.put(`/refunds/${refundId}/${action}`);
      Alert.alert('Done', `Refund ${action}d.`);
      setSelectedRefund(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setProcessing(false); }
  };

  const filteredPayments = payments.filter(p =>
    !search ||
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    if (status === 'approved') return '#10b981';
    if (status === 'rejected') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <X size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Cash Manager</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchData(); }}>
          <RefreshCw size={20} color={TINT} />
        </TouchableOpacity>
      </RNView>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsBar, { backgroundColor: card }]}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon size={16} color={active ? TINT : subColor} />
              <Text style={[styles.tabLabel, { color: active ? TINT : subColor }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <RNView style={styles.centered}>
          <ActivityIndicator size="large" color={TINT} />
        </RNView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={TINT} />}
        >
          {/* Overview */}
          {activeTab === 'overview' && stats && (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Dashboard Overview</Text>
              <RNView style={styles.statsGrid}>
                <StatCard icon={DollarSign} label="Total Revenue" value={`ETB ${stats.total?.toLocaleString()}`} color="#10b981" />
                <StatCard icon={CreditCard} label="Total Payments" value={stats.count} color={TINT} />
                <StatCard icon={AlertTriangle} label="Pending" value={stats.pending} color="#f59e0b" />
                <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="#10b981" />
              </RNView>
            </>
          )}

          {/* Payments */}
          {activeTab === 'payments' && (
            <>
              <TextInput
                style={[styles.search, { backgroundColor: card, color: textColor }]}
                placeholder="Search by student or course..."
                placeholderTextColor={subColor}
                value={search}
                onChangeText={setSearch}
              />
              {filteredPayments.map(p => (
                <TouchableOpacity
                  key={p._id}
                  style={[styles.listCard, { backgroundColor: card }]}
                  onPress={() => setSelectedPayment(p)}
                >
                  <RNView style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>
                      {p.user?.name || 'Unknown User'}
                    </Text>
                    <Text style={[styles.cardSub, { color: subColor }]}>
                      {p.course?.title || p.bundle?.title || 'Course/Bundle'}
                    </Text>
                    <Text style={[styles.cardSub, { color: subColor }]}>
                      ETB {p.amount?.toLocaleString()} · {p.method}
                    </Text>
                  </RNView>
                  <RNView>
                    <Text style={[styles.statusBadge, { color: getStatusColor(p.status) }]}>
                      {(p.status || 'pending').toUpperCase()}
                    </Text>
                    <ChevronRight size={16} color={subColor} />
                  </RNView>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Withdrawals */}
          {activeTab === 'withdrawals' && (
            <>
              {withdrawals.map(w => (
                <RNView key={w._id} style={[styles.listCard, { backgroundColor: card }]}>
                  <RNView style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>{w.instructor?.name || 'Instructor'}</Text>
                    <Text style={[styles.cardSub, { color: subColor }]}>
                      ETB {w.amount?.toLocaleString()} · {w.bankName} · {w.accountNumber}
                    </Text>
                    <Text style={[styles.statusBadge, { color: getStatusColor(w.status) }]}>
                      {(w.status || 'pending').toUpperCase()}
                    </Text>
                  </RNView>
                  {w.status === 'pending' && (
                    <RNView style={styles.actionBtns}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => approveWithdrawal(w._id)}
                        disabled={processing}
                      >
                        <CheckCircle size={14} color="#fff" />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                    </RNView>
                  )}
                </RNView>
              ))}
              {withdrawals.length === 0 && (
                <RNView style={styles.emptyBox}>
                  <Text style={{ color: subColor }}>No withdrawal requests</Text>
                </RNView>
              )}
            </>
          )}

          {/* Refunds */}
          {activeTab === 'refunds' && (
            <>
              {refunds.map(r => (
                <TouchableOpacity
                  key={r._id}
                  style={[styles.listCard, { backgroundColor: card }]}
                  onPress={() => setSelectedRefund(r)}
                >
                  <RNView style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>{r.student?.name || 'Student'}</Text>
                    <Text style={[styles.cardSub, { color: subColor }]}>{r.course?.title || 'Course'}</Text>
                    <Text style={[styles.cardSub, { color: subColor }]} numberOfLines={2}>Reason: {r.reason}</Text>
                    <Text style={[styles.statusBadge, { color: getStatusColor(r.status) }]}>
                      {(r.status || 'pending').toUpperCase()}
                    </Text>
                  </RNView>
                  <ChevronRight size={16} color={subColor} />
                </TouchableOpacity>
              ))}
              {refunds.length === 0 && (
                <RNView style={styles.emptyBox}>
                  <Text style={{ color: subColor }}>No refund requests</Text>
                </RNView>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Payment Detail Modal */}
      <Modal visible={!!selectedPayment} animationType="slide" transparent onRequestClose={() => setSelectedPayment(null)}>
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalBox, { backgroundColor: card }]}>
            <RNView style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Payment Details</Text>
              <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                <X size={22} color={textColor} />
              </TouchableOpacity>
            </RNView>
            {selectedPayment && (
              <>
                <Text style={[styles.detailRow, { color: textColor }]}>
                  Student: {selectedPayment.user?.name}
                </Text>
                <Text style={[styles.detailRow, { color: textColor }]}>
                  Course: {selectedPayment.course?.title || selectedPayment.bundle?.title}
                </Text>
                <Text style={[styles.detailRow, { color: textColor }]}>
                  Amount: ETB {selectedPayment.amount?.toLocaleString()}
                </Text>
                <Text style={[styles.detailRow, { color: textColor }]}>
                  Method: {selectedPayment.method}
                </Text>
                <Text style={[styles.detailRow, { color: textColor }]}>
                  Status: {selectedPayment.status}
                </Text>
                {selectedPayment.screenshotUrl && (
                  <Image source={{ uri: selectedPayment.screenshotUrl }} style={styles.screenshot} />
                )}
                {selectedPayment.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={styles.approveFullBtn}
                      onPress={() => approvePayment(selectedPayment._id)}
                      disabled={processing}
                    >
                      {processing ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <CheckCircle size={16} color="#fff" />
                          <Text style={styles.approveBtnText}>Approve Payment</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.reasonInput, { color: textColor, borderColor: '#f3f4f6' }]}
                      placeholder="Rejection reason..."
                      placeholderTextColor={subColor}
                      value={rejectReason}
                      onChangeText={setRejectReason}
                    />
                    <TouchableOpacity
                      style={styles.rejectFullBtn}
                      onPress={() => rejectPayment(selectedPayment._id)}
                      disabled={processing}
                    >
                      <XCircle size={16} color="#fff" />
                      <Text style={styles.approveBtnText}>Reject Payment</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </RNView>
        </RNView>
      </Modal>

      {/* Refund Detail Modal */}
      <Modal visible={!!selectedRefund} animationType="slide" transparent onRequestClose={() => setSelectedRefund(null)}>
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalBox, { backgroundColor: card }]}>
            <RNView style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Refund Request</Text>
              <TouchableOpacity onPress={() => setSelectedRefund(null)}>
                <X size={22} color={textColor} />
              </TouchableOpacity>
            </RNView>
            {selectedRefund && (
              <>
                <Text style={[styles.detailRow, { color: textColor }]}>Student: {selectedRefund.student?.name}</Text>
                <Text style={[styles.detailRow, { color: textColor }]}>Course: {selectedRefund.course?.title}</Text>
                <Text style={[styles.detailRow, { color: textColor }]}>Reason: {selectedRefund.reason}</Text>
                {selectedRefund.status === 'pending' && (
                  <RNView style={styles.actionBtns}>
                    <TouchableOpacity
                      style={[styles.approveFullBtn, { flex: 1 }]}
                      onPress={() => processRefund(selectedRefund._id, 'approve')}
                      disabled={processing}
                    >
                      <CheckCircle size={16} color="#fff" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectFullBtn, { flex: 1 }]}
                      onPress={() => processRefund(selectedRefund._id, 'reject')}
                      disabled={processing}
                    >
                      <XCircle size={16} color="#fff" />
                      <Text style={styles.approveBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </RNView>
                )}
              </>
            )}
          </RNView>
        </RNView>
      </Modal>
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900' },
  tabsBar: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6', maxHeight: 56 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: TINT },
  tabLabel: { fontSize: 13, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', padding: 16, borderRadius: 16, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  search: {
    borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#e5e7eb'
  },
  listCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2
  },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  cardSub: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  statusBadge: { fontSize: 11, fontWeight: '900', marginTop: 4 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10
  },
  approveBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  emptyBox: { padding: 32, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  detailRow: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  screenshot: { width: '100%', height: 150, borderRadius: 12, marginVertical: 12 },
  approveFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 14, marginTop: 12
  },
  reasonInput: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12, fontSize: 14 },
  rejectFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, marginTop: 10
  },
});
