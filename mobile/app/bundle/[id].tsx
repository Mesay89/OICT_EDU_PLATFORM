import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, Image
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Package, BookOpen, ShoppingCart, CheckCircle,
  Star, Users, Tag, PlaySquare
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

export default function BundleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { isDarkMode } = useTheme();

  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';

  useEffect(() => {
    if (id) fetchBundle();
  }, [id]);

  const fetchBundle = async () => {
    try {
      const { data } = await apiClient.get(`/bundles/${id}`);
      setBundle(data);
      if (user) {
        const { data: enrollments } = await apiClient.get('/enrollments/myenrollments');
        const ids = (Array.isArray(enrollments) ? enrollments : []).map(
          (e: any) => (e.course?._id || e.course)?.toString()
        );
        setEnrolledCourseIds(ids);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load bundle');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!user) { router.push('/login'); return; }
    const restricted = ['instructor', 'cashManager', 'admin', 'superAdmin'];
    if (restricted.includes(user.role)) {
      Alert.alert('Not allowed', `${user.role}s cannot purchase bundles.`);
      return;
    }
    router.push(`/bundle/checkout/${id}`);
  };

  if (loading) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={TINT} />
    </RNView>
  );

  if (!bundle) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <Package size={64} color="#d1d5db" />
      <Text style={[styles.errorTitle, { color: textColor }]}>Bundle Not Found</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Go Back</Text>
      </TouchableOpacity>
    </RNView>
  );

  const courses = bundle.courses || [];
  const alreadyPurchased = bundle.isEnrolled;

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          Bundle Details
        </Text>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Image
          source={{ uri: bundle.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600' }}
          style={styles.heroImage}
        />

        <RNView style={{ padding: 20 }}>
          {/* Badge */}
          <RNView style={styles.badgeRow}>
            <RNView style={styles.badge}>
              <Package size={12} color={TINT} />
              <Text style={styles.badgeText}>COURSE BUNDLE</Text>
            </RNView>
            {bundle.discount > 0 && (
              <RNView style={styles.discountBadge}>
                <Tag size={12} color="#fff" />
                <Text style={styles.discountText}>{bundle.discount}% OFF</Text>
              </RNView>
            )}
          </RNView>

          <Text style={[styles.bundleTitle, { color: textColor }]}>{bundle.title}</Text>
          <Text style={[styles.bundleDesc, { color: subColor }]}>{bundle.description}</Text>

          {/* Stats row */}
          <RNView style={styles.statsRow}>
            <RNView style={styles.stat}>
              <BookOpen size={16} color={TINT} />
              <Text style={[styles.statText, { color: subColor }]}>{courses.length} Courses</Text>
            </RNView>
            {bundle.totalStudents > 0 && (
              <RNView style={styles.stat}>
                <Users size={16} color={TINT} />
                <Text style={[styles.statText, { color: subColor }]}>{bundle.totalStudents} Students</Text>
              </RNView>
            )}
          </RNView>

          {/* Price */}
          <RNView style={[styles.priceCard, { backgroundColor: card }]}>
            <RNView>
              {bundle.originalPrice > bundle.price && (
                <Text style={styles.originalPrice}>
                  {formatPrice(bundle.originalPrice).formatted}
                </Text>
              )}
              <Text style={styles.price}>{formatPrice(bundle.price).formatted}</Text>
            </RNView>
            {!alreadyPurchased ? (
              <TouchableOpacity style={styles.buyBtn} onPress={handlePurchase}>
                <ShoppingCart size={18} color="#fff" />
                <Text style={styles.buyBtnText}>Buy Bundle</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.buyBtn, { backgroundColor: '#10b981' }]}
                onPress={() => router.push(`/bundle/player/${id}`)}
              >
                <PlaySquare size={18} color="#fff" />
                <Text style={styles.buyBtnText}>Continue Learning</Text>
              </TouchableOpacity>
            )}
          </RNView>

          {/* Courses included */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>Courses Included</Text>
          {courses.map((course: any, idx: number) => {
            const enrolled = enrolledCourseIds.includes(course._id?.toString());
            return (
              <RNView key={course._id || idx} style={[styles.courseRow, { backgroundColor: card }]}>
                <Image
                  source={{ uri: course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200' }}
                  style={styles.courseThumb}
                />
                <RNView style={{ flex: 1 }}>
                  <Text style={[styles.courseTitle, { color: textColor }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={[styles.courseInstructor, { color: subColor }]}>
                    {course.instructor?.name || 'Instructor'}
                  </Text>
                  {enrolled && (
                    <RNView style={styles.enrolledBadge}>
                      <CheckCircle size={12} color="#10b981" />
                      <Text style={styles.enrolledText}>Already Enrolled</Text>
                    </RNView>
                  )}
                </RNView>
                <Text style={styles.courseNum}>#{idx + 1}</Text>
              </RNView>
            );
          })}
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', flex: 1 },
  heroImage: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '900', color: TINT },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  discountText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  bundleTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8, lineHeight: 30 },
  bundleDesc: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, fontWeight: '700' },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderRadius: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4
  },
  originalPrice: { fontSize: 14, color: '#9ca3af', textDecorationLine: 'line-through', fontWeight: '700' },
  price: { fontSize: 28, fontWeight: '900', color: TINT },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: TINT, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14,
    shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  buyBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 14 },
  courseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2
  },
  courseThumb: { width: 64, height: 48, borderRadius: 10, backgroundColor: '#f3f4f6' },
  courseTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  courseInstructor: { fontSize: 12, fontWeight: '600' },
  enrolledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  enrolledText: { fontSize: 11, fontWeight: '700', color: '#10b981' },
  courseNum: { fontSize: 20, fontWeight: '900', color: '#d1d5db' },
  errorTitle: { fontSize: 22, fontWeight: '900' },
  btn: { backgroundColor: TINT, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  btnText: { color: '#fff', fontWeight: '900' },
});
