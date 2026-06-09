import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, View as RNView, RefreshControl, Alert
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { PlayCircle, CreditCard, BookOpen, Clock, CheckCircle, XCircle, LogOut, User, RefreshCw, X } from 'lucide-react-native';
import { Modal, TextInput } from 'react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

function ProgressBar({ progress }) {
  return (
    <RNView style={styles.progressBg}>
      <RNView style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
    </RNView>
  );
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('courses');
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [refundModal, setRefundModal] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchAll = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [enrollRes, payRes] = await Promise.all([
        apiClient.get('/enrollments/myenrollments'),
        apiClient.get('/payments/my-payments').catch(() => ({ data: [] })),
      ]);
      setEnrollments(Array.isArray(enrollRes.data) ? enrollRes.data : []);
      setPayments(Array.isArray(payRes.data) ? payRes.data : []);
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      router.replace('/');
    }
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) { Alert.alert('Required', 'Please provide a reason for the refund.'); return; }
    setRefundLoading(true);
    try {
      await apiClient.post(`/payments/${refundModal._id}/refund-request`, { reason: refundReason });
      Alert.alert('Success', 'Your refund request has been submitted. The admin will review it.');
      setRefundModal(null);
      setRefundReason('');
      fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit refund request');
    } finally {
      setRefundLoading(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <RNView style={styles.authPrompt}>
        <BookOpen size={56} color="#d1d5db" />
        <Text style={styles.authTitle}>Sign In Required</Text>
        <Text style={styles.authMsg}>Please sign in to access your learning dashboard.</Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/login')}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authBtnOutline} onPress={() => router.push('/register')}>
          <Text style={styles.authBtnOutlineText}>Create Account</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  const filteredEnrollments = enrollments.filter(e => {
    if (filterStatus === 'all') return e.status !== 'dropped';
    return e.status === filterStatus;
  });

  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const inProgressCount = enrollments.filter(e => e.status === 'active').length;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
    >
      {/* Profile Header */}
      <RNView style={styles.profileHeader}>
        <RNView style={styles.avatarBox}>
          <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </RNView>
        <RNView style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <RNView style={styles.roleBadge}>
            <Text style={styles.roleText}>{(user.role || 'student').toUpperCase()}</Text>
          </RNView>
        </RNView>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </RNView>

      {/* Stats Row */}
      <RNView style={styles.statsRow}>
        {[
          { label: 'Enrolled', value: enrollments.length, color: TINT },
          { label: 'Completed', value: completedCount, color: '#10b981' },
          { label: 'In Progress', value: inProgressCount, color: '#f59e0b' },
        ].map((s, i) => (
          <RNView key={i} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </RNView>
        ))}
      </RNView>

      {/* Instructor redirect banner */}
      {user.role === 'instructor' && (
        <TouchableOpacity style={styles.instructorBanner} onPress={() => router.push('/instructor')}>
          <Text style={styles.instructorBannerText}>📚 Go to Instructor Dashboard →</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <RNView style={styles.tabRow}>
        {['courses', 'payments'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'courses' ? '📚 My Enrolled Courses' : '💳 Payments'}
            </Text>
          </TouchableOpacity>
        ))}
      </RNView>

      {loading ? (
        <RNView style={styles.centered}>
          <ActivityIndicator size="large" color={TINT} />
        </RNView>
      ) : activeTab === 'courses' ? (
        <RNView style={styles.section}>
          {/* Status filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {['all', 'active', 'completed'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
                onPress={() => setFilterStatus(s)}
              >
                <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredEnrollments.length === 0 ? (
            <RNView style={styles.emptyBox}>
              <BookOpen size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Courses Yet</Text>
              <Text style={styles.emptyMsg}>Explore our catalog to start learning.</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/catalog')}>
                <Text style={styles.exploreBtnText}>Browse Courses</Text>
              </TouchableOpacity>
            </RNView>
          ) : (
            filteredEnrollments.map(enrollment => {
              const course = enrollment.course;
              if (!course) return null;
              const progress = enrollment.progress ?? 0;
              return (
                <TouchableOpacity
                  key={enrollment._id}
                  style={styles.enrollCard}
                  onPress={() => router.push(`/course/${course._id}`)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }}
                    style={styles.enrollImage}
                  />
                  <RNView style={styles.enrollInfo}>
                    <Text style={styles.enrollTitle} numberOfLines={2}>{course.title}</Text>
                    <Text style={styles.enrollCategory}>{(course.category || '').toUpperCase()}</Text>
                    <RNView style={styles.progressRow}>
                      <ProgressBar progress={progress} />
                      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                    </RNView>
                    <RNView style={styles.enrollFooter}>
                      <RNView style={[
                        styles.statusBadge,
                        enrollment.status === 'completed' ? styles.statusCompleted :
                        enrollment.status === 'active' ? styles.statusActive : styles.statusDropped
                      ]}>
                        <Text style={styles.statusText}>
                          {enrollment.status === 'completed' ? '✓ Completed' :
                           enrollment.status === 'active' ? '▶ In Progress' : 'Dropped'}
                        </Text>
                      </RNView>
                      <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={() => router.push(`/course/player/${course._id}`)}
                      >
                        <PlayCircle size={14} color="#fff" />
                        <Text style={styles.continueBtnText}>Continue</Text>
                      </TouchableOpacity>
                    </RNView>
                  </RNView>
                </TouchableOpacity>
              );
            })
          )}
        </RNView>
      ) : (
        <RNView style={styles.section}>
          {payments.length === 0 ? (
            <RNView style={styles.emptyBox}>
              <CreditCard size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Payments</Text>
              <Text style={styles.emptyMsg}>Your payment history will appear here.</Text>
            </RNView>
          ) : (
            payments.map(payment => (
              <RNView key={payment._id} style={styles.paymentCard}>
                <RNView style={styles.paymentTop}>
                  <Text style={styles.paymentCourse} numberOfLines={1}>
                    {payment.course?.title || 'Course'}
                  </Text>
                  <Text style={styles.paymentAmount}>${payment.amount?.toFixed(2)}</Text>
                </RNView>
                <RNView style={styles.paymentBottom}>
                  <RNView style={[
                    styles.payStatusBadge,
                    payment.status === 'completed' ? styles.statusCompleted : styles.statusActive
                  ]}>
                    <Text style={styles.statusText}>{payment.status || 'pending'}</Text>
                  </RNView>
                  <Text style={styles.paymentDate}>
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}
                  </Text>
                </RNView>
                {/* Refund status */}
                {payment.refundStatus && payment.refundStatus !== 'none' && (
                  <RNView style={[styles.refundBadge,
                    payment.refundStatus === 'requested' ? styles.refundPending :
                    payment.refundStatus === 'approved' ? styles.refundApproved : styles.refundRejected
                  ]}>
                    <Text style={styles.refundBadgeText}>Refund: {payment.refundStatus}</Text>
                  </RNView>
                )}
                {/* Refund request button – only for completed payments with no active refund */}
                {payment.status === 'completed' && (!payment.refundStatus || payment.refundStatus === 'none') && (
                  <TouchableOpacity
                    style={styles.refundBtn}
                    onPress={() => { setRefundModal(payment); setRefundReason(''); }}
                  >
                    <RefreshCw size={13} color="#d97706" />
                    <Text style={styles.refundBtnText}>Request Refund</Text>
                  </TouchableOpacity>
                )}
              </RNView>
            ))
          )}
        </RNView>

      )}

      {/* Refund Modal */}
      <Modal visible={!!refundModal} transparent animationType="slide" onRequestClose={() => setRefundModal(null)}>
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.modalCard}>
            <RNView style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Refund</Text>
              <TouchableOpacity onPress={() => setRefundModal(null)}>
                <X size={22} color="#374151" />
              </TouchableOpacity>
            </RNView>
            <Text style={styles.modalSubtitle}>
              Course: <Text style={{ color: '#6366f1', fontWeight: '800' }}>{refundModal?.course?.title}</Text>
            </Text>
            <Text style={styles.modalNote}>⚠ Refunds are only processed within 14 days of purchase.</Text>
            <Text style={styles.modalLabel}>Reason for refund</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder="Tell us why you are requesting a refund..."
              value={refundReason}
              onChangeText={setRefundReason}
            />
            <TouchableOpacity
              style={[styles.modalSubmit, refundLoading && { opacity: 0.6 }]}
              onPress={handleRefundRequest}
              disabled={refundLoading}
            >
              <Text style={styles.modalSubmitText}>{refundLoading ? 'Submitting...' : 'Submit Refund Request'}</Text>
            </TouchableOpacity>
          </RNView>
        </RNView>
      </Modal>

      <RNView style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  // Auth Prompt
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14, backgroundColor: '#f9fafb' },
  authTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  authMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  authBtn: { width: '100%', backgroundColor: TINT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  authBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  authBtnOutline: { width: '100%', borderWidth: 2, borderColor: TINT, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  authBtnOutlineText: { color: TINT, fontWeight: '800', fontSize: 16 },
  // Profile Header
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', padding: 20,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  avatarBox: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: TINT,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  userName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  roleBadge: {
    backgroundColor: '#eef2ff', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  roleText: { fontSize: 10, fontWeight: '900', color: TINT, letterSpacing: 1 },
  logoutBtn: { padding: 8 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  statCard: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#6b7280', fontWeight: '700' },
  // Instructor banner
  instructorBanner: {
    backgroundColor: '#faf5ff', borderLeftWidth: 4, borderLeftColor: '#a855f7',
    margin: 16, borderRadius: 12, padding: 14,
  },
  instructorBannerText: { color: '#7c3aed', fontWeight: '700', fontSize: 14 },
  // Tabs
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: TINT },
  tabText: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  tabTextActive: { color: TINT },
  // Content
  section: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', marginRight: 8, backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: TINT, borderColor: TINT },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  filterChipTextActive: { color: '#fff' },
  // Enrollment Card
  enrollCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, flexDirection: 'row',
  },
  enrollImage: { width: 110, height: 130, backgroundColor: '#e5e7eb' },
  enrollInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  enrollTitle: { fontSize: 14, fontWeight: '800', color: '#111827', lineHeight: 20 },
  enrollCategory: { fontSize: 10, fontWeight: '900', color: TINT, letterSpacing: 1, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressBg: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: TINT, borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '800', color: '#6b7280', width: 30 },
  enrollFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  payStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusCompleted: { backgroundColor: '#d1fae5' },
  statusActive: { backgroundColor: '#dbeafe' },
  statusDropped: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 10, fontWeight: '800', color: '#374151' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: TINT, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  continueBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  // Empty States
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptyMsg: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  exploreBtn: { backgroundColor: TINT, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  exploreBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  // Payment Card
  paymentCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    padding: 16, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  paymentTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  paymentCourse: { fontSize: 14, fontWeight: '800', color: '#111827', flex: 1, marginRight: 8 },
  paymentAmount: { fontSize: 16, fontWeight: '900', color: '#10b981' },
  paymentBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentDate: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  // Refund
  refundBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
  refundPending: { backgroundColor: '#fef3c7' },
  refundApproved: { backgroundColor: '#d1fae5' },
  refundRejected: { backgroundColor: '#fee2e2' },
  refundBadgeText: { fontSize: 11, fontWeight: '800', color: '#374151' },
  refundBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  refundBtnText: { fontSize: 12, fontWeight: '800', color: '#d97706' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  modalSubtitle: { fontSize: 14, color: '#374151' },
  modalNote: { fontSize: 13, color: '#d97706', backgroundColor: '#fffbeb', padding: 10, borderRadius: 8 },
  modalLabel: { fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: 'top', color: '#111827' },
  modalSubmit: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
