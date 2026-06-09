import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View as RNView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter, Stack } from 'expo-router';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Settings, Trash2, BookOpen, AlertCircle, Eye } from 'lucide-react-native';

const TINT = '#6366f1';

interface Course {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  isPublished?: boolean;
  price?: number;
  createdAt?: string;
}

export default function CourseSettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'instructor') {
      router.replace('/');
      return;
    }
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await apiClient.get('/courses/instructor/mycourses');
      setCourses(Array.isArray(data) ? data : data.courses ?? []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, []);

  const handleDelete = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${course.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(course._id);
            try {
              await apiClient.delete(`/courses/${course._id}`);
              setCourses((prev) => prev.filter((c) => c._id !== course._id));
              Alert.alert('Deleted', `"${course.title}" has been deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete course');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <RNView style={styles.centered}>
        <Stack.Screen options={{ title: 'Course Settings' }} />
        <ActivityIndicator size="large" color={TINT} />
      </RNView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
    >
      <Stack.Screen options={{ title: 'Course Settings' }} />

      {/* Header */}
      <RNView style={styles.header}>
        <Settings size={28} color={TINT} />
        <Text style={styles.headerTitle}>Course Settings</Text>
      </RNView>
      <Text style={styles.headerSubtitle}>
        Manage your courses — view status and remove courses you no longer need.
      </Text>

      {/* Empty state */}
      {courses.length === 0 ? (
        <RNView style={styles.emptyState}>
          <BookOpen size={56} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Courses Yet</Text>
          <Text style={styles.emptySubtitle}>
            You haven't created any courses. Start by creating your first course!
          </Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/instructor/create')}>
            <Text style={styles.createBtnText}>Create Course</Text>
          </TouchableOpacity>
        </RNView>
      ) : (
        /* Course list */
        courses.map((course) => {
          const isDeleting = deletingId === course._id;
          return (
            <RNView key={course._id} style={styles.courseCard}>
              {/* Top row – title & status */}
              <RNView style={styles.cardTop}>
                <RNView style={{ flex: 1 }}>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  {course.category ? (
                    <Text style={styles.courseCategory}>{course.category}</Text>
                  ) : null}
                </RNView>
                <RNView
                  style={[
                    styles.statusBadge,
                    course.isPublished ? styles.publishedBadge : styles.draftBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      course.isPublished ? styles.publishedText : styles.draftText,
                    ]}
                  >
                    {course.isPublished ? 'Published' : 'Draft'}
                  </Text>
                </RNView>
              </RNView>

              {/* Info row */}
              {course.price !== undefined && (
                <Text style={styles.priceText}>
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </Text>
              )}

              {/* Actions */}
              <RNView style={styles.actions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => handleViewCourse(course._id)}
                >
                  <Eye size={16} color={TINT} />
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBtn, isDeleting && styles.disabledBtn]}
                  onPress={() => handleDelete(course)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#ef4444" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              </RNView>
            </RNView>
          );
        })
      )}

      <RNView style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    marginTop: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 20 },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 260,
  },
  createBtn: {
    marginTop: 24,
    backgroundColor: TINT,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  /* Course card */
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  courseTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  courseCategory: { fontSize: 13, color: '#6b7280' },

  /* Status badge */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 12,
  },
  publishedBadge: { backgroundColor: '#dcfce7' },
  draftBadge: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  publishedText: { color: '#166534' },
  draftText: { color: '#92400e' },

  /* Price */
  priceText: { fontSize: 13, color: '#6b7280', marginTop: 8 },

  /* Actions */
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  viewBtnText: { color: TINT, fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  disabledBtn: { opacity: 0.5 },
});
