import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, RefreshControl, Alert, Image, FlatList
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import {
  Plus, Users, BookOpen, BarChart3, ChevronRight,
  Settings, Trash2, Edit, CheckCircle, Clock, AlertCircle, Shield,
  DollarSign, FileText, LayoutDashboard, FolderPlus
} from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

interface Course {
  _id: string;
  title: string;
  image?: string;
  totalStudents: number;
  isPublished: boolean;
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInstructorData = async () => {
    try {
      const { data } = await apiClient.get('/courses/instructor/mycourses');
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('Instructor fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'instructor') fetchInstructorData();
  }, [user]);

  const onRefresh = () => { setRefreshing(true); fetchInstructorData(); };

  if (user?.role !== 'instructor') {
    return (
      <RNView style={styles.centered}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorMsg}>Instructor role is required to access this dashboard.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  if (user.status !== 'approved') {
    return (
      <RNView style={styles.centered}>
        <Clock size={48} color="#f59e0b" />
        <Text style={styles.errorTitle}>Approval Pending</Text>
        <Text style={styles.errorMsg}>
          Your instructor account is pending admin approval. You will be able to manage courses once approved.
        </Text>
        <Text style={styles.statusLabel}>Current Status: <Text style={{ color: '#f59e0b' }}>{user.status}</Text></Text>
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
      >
        {/* Hero Stats */}
        <RNView style={styles.hero}>
          <Text style={styles.heroTitle}>Instructor Dashboard</Text>
          <Text style={styles.heroSubtitle}>Manage your content and students</Text>
          <RNView style={styles.statsRow}>
            <RNView style={styles.statCard}>
              <Text style={styles.statVal}>{courses.length}</Text>
              <Text style={styles.statLab}>Courses</Text>
            </RNView>
            <RNView style={styles.statCard}>
              <Text style={styles.statVal}>{courses.reduce((acc, c: Course) => acc + (c.totalStudents || 0), 0)}</Text>
              <Text style={styles.statLab}>Students</Text>
            </RNView>
          </RNView>
        </RNView>

        {/* Actions */}
        <RNView style={styles.section}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/instructor/create')}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create New Course</Text>
          </TouchableOpacity>
        </RNView>

        {/* Course List */}
        <RNView style={styles.section}>
          <Text style={styles.sectionTitle}>My Created Courses</Text>
          {loading ? (
            <ActivityIndicator color={TINT} style={{ margin: 20 }} />
          ) : courses.length === 0 ? (
            <RNView style={styles.emptyBox}>
              <BookOpen size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>You haven't created any courses yet.</Text>
            </RNView>
          ) : (
            courses.map(course => (
              <RNView key={course._id} style={styles.courseCardContainer}>
                <TouchableOpacity
                  style={styles.courseRow}
                  onPress={() => router.push(`/course/${course._id}`)}
                >
                  <Image
                    source={{ uri: course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }}
                    style={styles.courseThumb}
                  />
                  <RNView style={styles.courseInfo}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                    <RNView style={styles.courseMeta}>
                      <RNView style={styles.metaItem}>
                        <Users size={12} color="#6b7280" />
                        <Text style={styles.metaText}>{course.totalStudents || 0} Students</Text>
                      </RNView>
                      <RNView style={[styles.statusBadge, course.isPublished ? styles.statusPub : styles.statusDraft]}>
                        <Text style={styles.statusText}>{course.isPublished ? 'Published' : 'Draft'}</Text>
                      </RNView>
                    </RNView>
                  </RNView>
                  <ChevronRight size={18} color="#d1d5db" />
                </TouchableOpacity>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionButtonsScroll}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/instructor/manage/${course._id}`)}>
                    <LayoutDashboard size={14} color={TINT} />
                    <Text style={styles.actionButtonText}>Manage</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/instructor/peer-review/${course._id}`)}>
                    <FileText size={14} color={TINT} />
                    <Text style={styles.actionButtonText}>Peer Reviews</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/instructor/quiz-builder/${course._id}`)}>
                    <Shield size={14} color={TINT} />
                    <Text style={styles.actionButtonText}>Quiz Builder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/instructor/edit/${course._id}`)}>
                    <Edit size={14} color={TINT} />
                    <Text style={styles.actionButtonText}>Edit Course</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/instructor/module/${course._id}`)}>
                    <FolderPlus size={14} color={TINT} />
                    <Text style={styles.actionButtonText}>Add Module</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/instructor/refund/${course._id}`)}>
                    <DollarSign size={14} color={TINT} />
                    <Text style={styles.actionButtonText}>Refunds</Text>
                  </TouchableOpacity>
                </ScrollView>
              </RNView>
            ))
          )}
        </RNView>

        {/* Advanced Tools */}
        <RNView style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Tools</Text>
          {[
            { icon: Shield, label: 'Quiz Builder', color: TINT, action: () => Alert.alert('Quiz Builder', 'Select a course above and tap the "Quiz Builder" button to manage quizzes for that course.') },
            { icon: BarChart3, label: 'Analytics & Revenue', color: '#10b981', action: () => router.push('/instructor/analytics') },
            { icon: FileText, label: 'Course Bundles', color: '#8b5cf6', action: () => router.push('/instructor/bundles') },
            { icon: Settings, label: 'Course Settings', color: '#6366f1', action: () => router.push('/instructor/settings') },
          ].map((tool, i) => (
            <TouchableOpacity key={i} style={styles.toolRow} onPress={tool.action}>
              <RNView style={[styles.toolIcon, { backgroundColor: tool.color + '15' }]}>
                <tool.icon size={18} color={tool.color} />
              </RNView>
              <Text style={styles.toolLabel}>{tool.label}</Text>
              <ChevronRight size={16} color="#d1d5db" />
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
  errorTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  errorMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  statusLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 8 },
  backBtn: { backgroundColor: TINT, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  backBtnText: { color: '#fff', fontWeight: '800' },
  hero: { backgroundColor: '#fff', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  heroSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: TINT },
  statVal: { fontSize: 24, fontWeight: '900', color: '#111827' },
  statLab: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: TINT, borderRadius: 14, paddingVertical: 14, shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  courseCardContainer: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  actionButtonsScroll: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: TINT + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  actionButtonText: { color: TINT, fontSize: 12, fontWeight: '700' },
  courseThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#f3f4f6' },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPub: { backgroundColor: '#d1fae5' },
  statusDraft: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 10, fontWeight: '800', color: '#374151' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: '#9ca3af', fontWeight: '600' },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 },
  toolIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  toolLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#374151' },
});
