import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, View as RNView, Alert, Linking
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Star, Clock, Users, BookOpen, Award,
  PlayCircle, CheckCircle, Lock, ShoppingCart, Globe
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

interface Course {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  price: number;
  category?: string;
  level?: string;
  instructor?: { _id: string; name: string };
  averageRating?: number;
  totalStudents?: number;
  modules?: Array<{ _id: string; title: string }>;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { isDarkMode } = useTheme();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await apiClient.get(`/courses/${id}`);
      setCourse(data);
      if (user) checkEnrollment(data._id);
    } catch (err: any) {
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async (courseId: string) => {
    try {
      const { data } = await apiClient.get('/enrollments/myenrollments');
      setIsEnrolled(data.some(e => e.course?._id === courseId || e.course === courseId));
    } catch {}
  };

  const handleEnroll = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to enroll in this course.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (user.role === 'admin' || user.role === 'instructor') {
      Alert.alert('Not Allowed', 'Administrators and Instructors cannot purchase or enroll in courses.');
      return;
    }
    if (course?.price && course.price > 0) {
      router.push(`/checkout/${course._id}`);
      return;
    }
    setEnrolling(true);
    try {
      await apiClient.post('/enrollments', { courseId: course?._id });
      setIsEnrolled(true);
      Alert.alert('Enrolled!', 'You have successfully enrolled in this course.', [
        { text: 'OK', onPress: () => router.push(`/course/player/${course?._id}`) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <RNView style={styles.centered}>
        <ActivityIndicator size="large" color={TINT} />
      </RNView>
    );
  }

  if (error || !course) {
    return (
      <RNView style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Course not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSmall}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }]} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={24} color="#fff" />
      </TouchableOpacity>

      {/* Hero Image */}
      <Image
        source={{ uri: course?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800' }}
        style={styles.hero}
      />

      {/* Content */}
      <RNView style={styles.content}>
        {/* Badges */}
        <RNView style={styles.badgeRow}>
          <RNView style={styles.catBadge}>
            <Text style={styles.catText}>{(course?.category || 'General').toUpperCase()}</Text>
          </RNView>
          {course?.level && course.level !== 'All Levels' && (
            <RNView style={styles.levelBadge}>
              <Text style={styles.levelText}>{course.level.toUpperCase()}</Text>
            </RNView>
          )}
        </RNView>

        {/* Title */}
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#111827' }]}>{course?.title}</Text>

        {/* Instructor */}
        <RNView style={styles.instructorRow}>
          <RNView style={styles.instructorAvatar}>
            <Text style={styles.instructorInitial}>
              {course?.instructor?.name?.charAt(0) || 'I'}
            </Text>
          </RNView>
          <Text style={[styles.instructorName, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
            {t('course.instructor')}: {course?.instructor?.name || 'Instructor'}
          </Text>
        </RNView>

        {/* Stats Row */}
        <RNView style={styles.statsRow}>
          {course?.averageRating && course.averageRating > 0 && (
            <RNView style={styles.statItem}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.statText}>{course.averageRating.toFixed(1)}</Text>
            </RNView>
          )}
          {course?.totalStudents && course.totalStudents > 0 && (
            <RNView style={styles.statItem}>
              <Users size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.statText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>{course.totalStudents} {t('stats.students')}</Text>
            </RNView>
          )}
          {course?.modules && course.modules.length > 0 && (
            <RNView style={styles.statItem}>
              <BookOpen size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.statText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>{course.modules.length} {t('course.modules')}</Text>
            </RNView>
          )}
        </RNView>

        {/* Enroll Card */}
        <RNView style={[styles.enrollCard, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
          <RNView style={styles.priceRow}>
            <Text style={[styles.price, { color: isDarkMode ? '#fff' : '#111827' }]}>
              {course?.price === 0 ? t('course.free') : formatPrice(course?.price || 0).formatted}
            </Text>
            {course?.price === 0 && (
              <Text style={styles.freeLabel}>{t('course.enroll_free')}</Text>
            )}
          </RNView>

          {isEnrolled ? (
            <TouchableOpacity
              style={styles.watchBtn}
              onPress={() => router.push(`/course/player/${course?._id}`)}
            >
              <PlayCircle size={18} color="#fff" />
              <Text style={styles.watchBtnText}>{t('course.resume_learning')}</Text>
            </TouchableOpacity>
          ) : user?.role === 'instructor' ? (
            <RNView style={[styles.enrollBtn, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
              <Text style={[styles.enrollBtnText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>Instructors cannot enroll</Text>
            </RNView>
          ) : (
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {course?.price && course.price > 0
                    ? <ShoppingCart size={18} color="#fff" />
                    : <CheckCircle size={18} color="#fff" />
                  }
                  <Text style={styles.enrollBtnText}>
                    {course?.price && course.price > 0 ? t('course.purchase_now') : t('course.enroll_free')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </RNView>

        {/* Message Instructor (Only for students) */}
        {user && user.role !== 'instructor' && course?.instructor?._id && (
          <TouchableOpacity
            style={[styles.enrollBtn, { backgroundColor: '#8b5cf6', marginBottom: 24 }]}
            onPress={() => router.push(`/chat/direct/${course.instructor._id}`)}
          >
            <Text style={styles.enrollBtnText}>Message Instructor</Text>
          </TouchableOpacity>
        )}

        {/* Description */}
        {course?.description && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>{t('course.overview')}</Text>
            <Text style={[styles.description, { color: isDarkMode ? '#9ca3af' : '#4b5563' }]}>{course.description}</Text>
          </RNView>
        )}

        {/* Curriculum */}
        {course?.modules && course.modules.length > 0 && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>{t('course.curriculum')}</Text>
            <Text style={styles.modulesCount}>{course.modules.length} {t('course.modules')}</Text>
            {course.modules.map((mod, i) => (
              <RNView key={mod._id || i} style={[styles.moduleItem, { backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
                <RNView style={[styles.moduleNum, { backgroundColor: isDarkMode ? '#111827' : '#f3f4f6' }]}>
                  <Text style={styles.moduleNumText}>{i + 1}</Text>
                </RNView>
                <Text style={[styles.moduleTitle, { color: isDarkMode ? '#e5e7eb' : '#374151' }]} numberOfLines={2}>{mod.title}</Text>
                {isEnrolled ? (
                  <PlayCircle size={16} color={TINT} />
                ) : (
                  i === 0 ? <Globe size={16} color="#10b981" /> : <Lock size={16} color="#d1d5db" />
                )}
              </RNView>
            ))}
          </RNView>
        )}

        <RNView style={{ height: 32 }} />
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  errorText: { fontSize: 16, color: '#374151', textAlign: 'center' },
  backBtnSmall: { padding: 8 },
  backBtnText: { color: TINT, fontWeight: '700', fontSize: 15 },
  backBtn: {
    position: 'absolute', top: 44, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  hero: { width: '100%', height: 260, backgroundColor: '#e5e7eb' },
  content: { padding: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 4 },
  catBadge: { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { fontSize: 10, fontWeight: '900', color: TINT, letterSpacing: 1 },
  levelBadge: { backgroundColor: '#faf5ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#e9d5ff' },
  levelText: { fontSize: 10, fontWeight: '900', color: '#a855f7', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827', lineHeight: 32, marginBottom: 14 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  instructorAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: TINT, justifyContent: 'center', alignItems: 'center' },
  instructorInitial: { color: '#fff', fontSize: 13, fontWeight: '900' },
  instructorName: { fontSize: 14, color: '#6b7280', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  enrollCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  price: { fontSize: 30, fontWeight: '900', color: '#111827' },
  freeLabel: { fontSize: 13, color: '#10b981', fontWeight: '700', backgroundColor: '#d1fae5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  enrollBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: TINT, borderRadius: 14, paddingVertical: 16,
    shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  enrollBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  watchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 16,
  },
  watchBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#4b5563', lineHeight: 24 },
  modulesCount: { fontSize: 13, color: '#9ca3af', fontWeight: '600', marginBottom: 12 },
  moduleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  moduleNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  moduleNumText: { fontSize: 12, fontWeight: '900', color: '#6b7280' },
  moduleTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#374151' },
});
