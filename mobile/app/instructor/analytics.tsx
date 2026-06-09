import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/client';
import { BookOpen, Users, DollarSign, TrendingUp, ChevronRight } from 'lucide-react-native';

const TINT = '#6366f1';
const { width } = Dimensions.get('window');

interface Course {
  _id: string;
  title: string;
  price?: number;
  students?: string[];
  enrolledStudents?: string[];
  image?: string;
  category?: string;
  isPublished?: boolean;
}

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role guard
  if (user?.role !== 'instructor') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <Stack.Screen options={{ title: 'Access Denied' }} />
        <Text style={styles.accessDeniedIcon}>🚫</Text>
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedSub}>You must be an instructor to view analytics.</Text>
        <TouchableOpacity style={styles.goHomeBtn} onPress={() => router.replace('/')}>
          <Text style={styles.goHomeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fetchCourses = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/courses/instructor/mycourses');
      const list = Array.isArray(data) ? data : data.courses ?? [];
      setCourses(list);
    } catch (err) {
      console.error('Failed to fetch instructor courses:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, [fetchCourses]);

  const getStudentCount = (course: Course) =>
    (course.students ?? course.enrolledStudents ?? []).length;

  const totalCourses = courses.length;
  const totalStudents = courses.reduce((sum, c) => sum + getStudentCount(c), 0);
  const totalRevenue = courses.reduce(
    (sum, c) => sum + (c.price ?? 0) * getStudentCount(c),
    0,
  );
  const avgRevenuePerCourse = totalCourses > 0 ? totalRevenue / totalCourses : 0;

  if (loading) {
    return (
      <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Analytics & Revenue' }} />
        <ActivityIndicator size="large" color={TINT} />
        <Text style={styles.loadingText}>Loading analytics…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
    >
      <Stack.Screen options={{ title: 'Analytics & Revenue' }} />

      {/* Header */}
      <Text style={styles.header}>Analytics & Revenue</Text>
      <Text style={styles.subHeader}>Track your performance across all courses</Text>

      {/* Stat Cards Row 1 */}
      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f1' }]}>
          <View style={styles.statIconWrap}>
            <BookOpen size={22} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={styles.statValue}>{totalCourses}</Text>
          <Text style={styles.statLabel}>Total Courses</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <View style={styles.statIconWrap}>
            <Users size={22} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={styles.statValue}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
      </View>

      {/* Stat Cards Row 2 */}
      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <View style={styles.statIconWrap}>
            <DollarSign size={22} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={styles.statValue}>${totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Est. Revenue</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
          <View style={styles.statIconWrap}>
            <TrendingUp size={22} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={styles.statValue}>${avgRevenuePerCourse.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Avg / Course</Text>
        </View>
      </View>

      {/* Course List */}
      <Text style={styles.sectionTitle}>Course Breakdown</Text>

      {courses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No courses yet</Text>
          <Text style={styles.emptySub}>Create a course to start seeing analytics.</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/instructor/create')}
          >
            <Text style={styles.createBtnText}>Create Course</Text>
          </TouchableOpacity>
        </View>
      ) : (
        courses.map((course, index) => {
          const students = getStudentCount(course);
          const revenue = (course.price ?? 0) * students;
          return (
            <TouchableOpacity
              key={course._id}
              style={styles.courseCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/instructor/manage/${course._id}`)}
            >
              {/* Color accent bar */}
              <View
                style={[
                  styles.courseAccent,
                  {
                    backgroundColor:
                      index % 3 === 0
                        ? '#6366f1'
                        : index % 3 === 1
                        ? '#10b981'
                        : '#f59e0b',
                  },
                ]}
              />
              <View style={styles.courseContent}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <ChevronRight size={18} color="#9ca3af" />
                </View>

                <View style={styles.courseMetaRow}>
                  {course.category ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{course.category}</Text>
                    </View>
                  ) : null}
                  {course.isPublished === false && (
                    <View style={[styles.categoryBadge, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.categoryText, { color: '#92400e' }]}>Draft</Text>
                    </View>
                  )}
                </View>

                <View style={styles.courseStats}>
                  <View style={styles.courseStat}>
                    <Users size={14} color="#6b7280" />
                    <Text style={styles.courseStatText}>{students} student{students !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.courseStat}>
                    <DollarSign size={14} color="#6b7280" />
                    <Text style={styles.courseStatText}>
                      {course.price ? `$${course.price}` : 'Free'}
                    </Text>
                  </View>
                  <View style={styles.courseStat}>
                    <TrendingUp size={14} color="#6b7280" />
                    <Text style={styles.courseStatText}>${revenue.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },

  /* Stat cards */
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  /* Section */
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    marginBottom: 16,
  },

  /* Course cards */
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  courseAccent: {
    width: 5,
  },
  courseContent: {
    flex: 1,
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  courseMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#eef2ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: TINT,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Loading */
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },

  /* Access denied */
  accessDeniedIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  accessDeniedSub: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  goHomeBtn: {
    backgroundColor: TINT,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  goHomeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
