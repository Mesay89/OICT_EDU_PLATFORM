import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, RefreshControl, Alert, FlatList
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import {
  LayoutDashboard, UserCheck, BookOpen, Users, CreditCard,
  ChevronRight, ArrowLeft, ShieldAlert, CheckCircle, XCircle,
  RefreshCw, ClipboardCheck, Star, BarChart3, History, Settings
} from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalRevenue: number;
    pendingCourses: number;
  };
}

interface PendingInstructor {
  _id: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [pendingInstructors, setPendingInstructors] = useState<PendingInstructor[]>([]);
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, revRes, pendingCoursesRes] = await Promise.all([
        apiClient.get('/admin/dashboard').catch(() => ({ data: {} })),
        apiClient.get('/admin/pending-instructors').catch(() => ({ data: [] })),
        apiClient.get('/reports/revenue').catch(() => ({ data: { lifetimeTotal: 0 } })),
        apiClient.get('/admin/courses/pending').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setPendingInstructors(pendingRes.data);
      setRevenue(revRes.data.lifetimeTotal || 0);
      setPendingCourses(Array.isArray(pendingCoursesRes.data) ? pendingCoursesRes.data : []);
    } catch (err: any) {
      console.log('Admin fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/admin/approve-instructor/${id}`);
      Alert.alert('Success', 'Instructor approved!');
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve instructor');
    }
  };

  const handleReject = async (id) => {
    try {
      await apiClient.put(`/admin/reject-instructor/${id}`);
      Alert.alert('Success', 'Instructor rejected');
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject instructor');
    }
  };

  const handleApproveCourse = async (id: string) => {
    try {
      await apiClient.put(`/admin/courses/${id}/approve`);
      Alert.alert('Success', 'Course approved and published!');
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve course');
    }
  };

  const handleRejectCourse = async (id: string) => {
    try {
      await apiClient.put(`/admin/courses/${id}/reject`);
      Alert.alert('Rejected', 'Course has been rejected.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject course');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <RNView style={styles.centered}>
        <ShieldAlert size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Admin Access Only</Text>
        <Text style={styles.errorMsg}>You do not have permissions to view this dashboard.</Text>
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
      >
        {/* Header */}
        <RNView style={styles.hero}>
          {pendingInstructors.length > 0 && (
            <RNView style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <ShieldAlert size={20} color="#d97706" style={{ marginRight: 10 }} />
              <Text style={{ color: '#d97706', fontWeight: 'bold', flex: 1 }}>
                Action Required: {pendingInstructors.length} pending instructor application{pendingInstructors.length !== 1 ? 's' : ''}.
              </Text>
            </RNView>
          )}
          <Text style={styles.heroTitle}>System Admin</Text>
          <Text style={styles.heroSubtitle}>Control center & analytics</Text>
          
          <RNView style={styles.quickStats}>
            {[
              { label: 'Total Users', val: stats?.stats?.totalUsers || 0, icon: Users, color: '#6366f1', onPress: () => router.push('/admin/users') },
              { label: 'Total Courses', val: stats?.stats?.totalCourses || 0, icon: BookOpen, color: '#a855f7', onPress: () => router.push('/admin/courses') },
              { label: 'Revenue', val: `$${revenue || 0}`, icon: CreditCard, color: '#10b981', onPress: () => router.push('/admin/revenue') },
            ].map((s, i) => (
              <TouchableOpacity key={i} style={styles.statBox} onPress={s.onPress}>
                <s.icon size={16} color={s.color} />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLab}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </RNView>
        </RNView>

        {/* Pending Approvals */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Instructors</Text>
            {pendingInstructors.length > 0 && (
              <RNView style={styles.badge}><Text style={styles.badgeText}>{pendingInstructors.length}</Text></RNView>
            )}
          </RNView>

          {loading ? (
            <ActivityIndicator color={TINT} />
          ) : pendingInstructors.length === 0 ? (
            <RNView style={styles.emptyBox}>
              <CheckCircle size={32} color="#10b981" />
              <Text style={styles.emptyText}>All instructors processed!</Text>
            </RNView>
          ) : (
            pendingInstructors.map(inst => (
              <RNView key={inst._id} style={styles.card}>
                <RNView style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{inst.name}</Text>
                  <Text style={styles.cardEmail}>{inst.email}</Text>
                </RNView>
                <RNView style={styles.cardActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(inst._id)}>
                    <CheckCircle size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(inst._id)}>
                    <XCircle size={20} color="#fff" />
                  </TouchableOpacity>
                </RNView>
              </RNView>
            ))
          )}
        </RNView>

        {/* Pending Course Approvals */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Courses</Text>
            {pendingCourses.length > 0 && (
              <RNView style={styles.badge}><Text style={styles.badgeText}>{pendingCourses.length}</Text></RNView>
            )}
          </RNView>
          {loading ? (
            <ActivityIndicator color={TINT} />
          ) : pendingCourses.length === 0 ? (
            <RNView style={styles.emptyBox}>
              <CheckCircle size={32} color="#10b981" />
              <Text style={styles.emptyText}>No pending courses!</Text>
            </RNView>
          ) : (
            pendingCourses.map(course => (
              <RNView key={course._id} style={styles.card}>
                <RNView style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{course.title}</Text>
                  <Text style={styles.cardEmail}>By {course.instructor?.name || 'Unknown'}</Text>
                </RNView>
                <RNView style={styles.cardActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveCourse(course._id)}>
                    <CheckCircle size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectCourse(course._id)}>
                    <XCircle size={20} color="#fff" />
                  </TouchableOpacity>
                </RNView>
              </RNView>
            ))
          )}
        </RNView>

        {/* Management Links */}
        <RNView style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          {[
            { label: 'Instructors', icon: UserCheck, count: pendingInstructors.length || 0, action: () => router.push('/admin/instructors') },
            { label: 'Course Management', icon: BookOpen, count: 0, action: () => router.push('/admin/courses') },
            { label: 'Community', icon: Users, count: 0, action: () => router.push('/admin/users') },
            { label: 'Refunds', icon: RefreshCw, count: 0, action: () => router.push('/admin/refunds') },
            { label: 'Payments', icon: CreditCard, count: 0, action: () => router.push('/admin/payments') },
            { label: 'Assignments', icon: ClipboardCheck, count: 0, action: () => router.push('/admin/assignments') },
            { label: 'Course Approvals', icon: Star, count: stats?.pendingCourses || 0, action: () => router.push('/admin/course-approvals') },
            { label: 'Revenue Analytics', icon: BarChart3, count: 0, action: () => router.push('/admin/revenue') },
            { label: 'Audit Logs', icon: History, count: 0, action: () => router.push('/admin/audit') },
            { label: 'Settings', icon: Settings, count: 0, action: () => router.push('/admin/settings') },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.toolRow} onPress={item.action}>
              <RNView style={styles.toolIconRow}>
                <item.icon size={20} color={TINT} />
                <Text style={styles.toolLabel}>{item.label}</Text>
              </RNView>
              <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.count > 0 && (
                  <RNView style={styles.countBadge}><Text style={styles.countText}>{item.count}</Text></RNView>
                )}
                <ChevronRight size={18} color="#d1d5db" />
              </RNView>
            </TouchableOpacity>
          ))}
        </RNView>

        <RNView style={{ height: 40 }} />
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  errorTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  errorMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  hero: { backgroundColor: '#fff', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  heroSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  quickStats: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 16, fontWeight: '900', color: '#111827' },
  statLab: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: '#10b981', fontWeight: '700', fontSize: 14 },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 },
  toolIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toolLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  countBadge: { backgroundColor: '#eef2ff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  countText: { color: TINT, fontSize: 12, fontWeight: '900' },
});
