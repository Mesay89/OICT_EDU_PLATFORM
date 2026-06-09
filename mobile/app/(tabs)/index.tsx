import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, View as RNView, Dimensions, RefreshControl
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, BookOpen, Users, Video, Award,
  Star, TrendingUp, Shield, Zap
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');
const TINT = '#6366f1';

const STATS = [
  { icon: BookOpen, label: '500+ Courses', color: '#6366f1' },
  { icon: Users, label: '10K+ Students', color: '#a855f7' },
  { icon: Video, label: 'HD Videos', color: '#ec4899' },
  { icon: Award, label: 'Certificates', color: '#f59e0b' },
];

function CourseCard({ course, onPress }: { course: any, onPress: () => void }) {
  const { formatPrice } = useCurrency();
  const { isDarkMode } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.courseCard, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }}
        style={styles.courseThumb}
      />
      <RNView style={styles.coursePriceBadge}>
        <Text style={styles.coursePriceText}>
          {course.price === 0 ? 'FREE' : formatPrice(course.price).formatted}
        </Text>
      </RNView>
      <RNView style={styles.courseInfo}>
        <Text style={styles.courseCategory}>{(course.category || 'General').toUpperCase()}</Text>
        <Text style={[styles.courseTitle, { color: isDarkMode ? '#fff' : '#111827' }]} numberOfLines={2}>{course.title}</Text>
        <RNView style={styles.courseFooter}>
          <RNView style={styles.instructorRow}>
            <RNView style={styles.instructorAvatar}>
              <Text style={styles.instructorInitial}>
                {course.instructor?.name?.charAt(0) || 'I'}
              </Text>
            </RNView>
            <Text style={[styles.instructorName, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]} numberOfLines={1}>
              {course.instructor?.name || 'Instructor'}
            </Text>
          </RNView>
          {course.averageRating > 0 && (
            <RNView style={styles.ratingRow}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{course.averageRating.toFixed(1)}</Text>
            </RNView>
          )}
        </RNView>
      </RNView>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data: featData } = await apiClient.get('/courses/featured');
      setFeatured(Array.isArray(featData) ? featData : []);

      if (user) {
        try {
          const { data: recData } = await apiClient.get('/courses/recommendations');
          setRecommended(Array.isArray(recData) ? recData : []);
        } catch {}
      }
    } catch (err: any) {
      console.log('Home fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
    >
      {/* Hero */}
      <LinearGradient colors={['#6366f1', '#a855f7', '#ec4899']} style={styles.hero}>
        <RNView style={styles.heroBadge}>
          <Star size={12} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.heroBadgeText}>{t('hero.trusted_by')}</Text>
        </RNView>
        <Text style={styles.heroTitle}>
          {t('hero.title1')}{'\n'}
          <Text style={styles.heroTitleAccent}>{t('hero.title2')}</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          {t('hero.subtitle')}
        </Text>
        <RNView style={styles.heroButtons}>
          {user ? (
            <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.heroBtnPrimaryText}>{t('hero.cta_explore')}</Text>
              <ArrowRight size={18} color={TINT} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => router.push('/register')}>
                <Text style={styles.heroBtnPrimaryText}>{t('hero.cta_get_started')}</Text>
                <ArrowRight size={18} color={TINT} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtnSecondary} onPress={() => router.push('/login')}>
                <Text style={styles.heroBtnSecondaryText}>{t('nav.login')}</Text>
              </TouchableOpacity>
            </>
          )}
        </RNView>

        {/* Stats */}
        <RNView style={styles.statsRow}>
          {STATS.map((s, i) => (
            <RNView key={i} style={styles.statItem}>
              <RNView style={[styles.statIcon, { backgroundColor: s.color + '33' }]}>
                <s.icon size={16} color={s.color} />
              </RNView>
              <Text style={styles.statLabel}>{s.label}</Text>
            </RNView>
          ))}
        </RNView>
      </LinearGradient>

      {/* Featured Courses */}
      <RNView style={[styles.section, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }]}>
        <RNView style={styles.sectionHeader}>
          <RNView>
            <Text style={styles.sectionBadge}>{t('home.recommended_badge')}</Text>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>{t('home.featured_title')}</Text>
          </RNView>
          <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.sectionLink}>{t('home.see_more')} →</Text>
          </TouchableOpacity>
        </RNView>

        {loading ? (
          <ActivityIndicator color={TINT} style={{ marginTop: 20 }} />
        ) : featured.length === 0 ? (
          <RNView style={styles.emptyBox}>
            <BookOpen size={32} color="#d1d5db" />
            <Text style={styles.emptyText}>No featured courses yet</Text>
          </RNView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {featured.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                onPress={() => router.push(`/course/${course._id}`)}
              />
            ))}
          </ScrollView>
        )}
      </RNView>

      {/* Recommendations (logged-in only) */}
      {user && recommended.length > 0 && (
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <RNView>
              <Text style={styles.sectionBadge}>🎯 FOR YOU</Text>
              <Text style={styles.sectionTitle}>Recommended</Text>
            </RNView>
          </RNView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {recommended.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                onPress={() => router.push(`/course/${course._id}`)}
              />
            ))}
          </ScrollView>
        </RNView>
      )}

      {/* Features Section */}
      <RNView style={styles.featuresSection}>
        <Text style={styles.featuresSectionTitle}>Why Choose OICT TUTOR?</Text>
        {[
          { icon: Zap, title: 'Learn at Your Pace', desc: 'Access courses anytime, anywhere on any device.', color: '#f59e0b' },
          { icon: Shield, title: 'Expert Instructors', desc: 'Learn from verified industry professionals.', color: '#10b981' },
          { icon: TrendingUp, title: 'Career Growth', desc: 'Gain skills that employers are looking for.', color: '#6366f1' },
          { icon: Award, title: 'Get Certified', desc: 'Earn certificates to showcase your achievements.', color: '#a855f7' },
        ].map((f, i) => (
          <RNView key={i} style={styles.featureCard}>
            <RNView style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
              <f.icon size={22} color={f.color} />
            </RNView>
            <RNView style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </RNView>
          </RNView>
        ))}
      </RNView>

      {/* CTA */}
      {!user && (
        <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.ctaBanner}>
          <Text style={styles.ctaTitle}>Ready to Start Learning?</Text>
          <Text style={styles.ctaSubtitle}>Join thousands of students and transform your career.</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/register')}>
            <Text style={styles.ctaBtnText}>Join Now Free</Text>
            <ArrowRight size={18} color={TINT} />
          </TouchableOpacity>
        </LinearGradient>
      )}

      <RNView style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  // Hero
  hero: { paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20,
  },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 38, fontWeight: '900', color: '#fff', lineHeight: 44, marginBottom: 12 },
  heroTitleAccent: { color: '#fbbf24' },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 22, marginBottom: 24 },
  heroButtons: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  heroBtnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, gap: 8,
  },
  heroBtnPrimaryText: { color: TINT, fontWeight: '800', fontSize: 15 },
  heroBtnSecondary: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingVertical: 14,
  },
  heroBtnSecondaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: '45%' },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Sections
  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionBadge: { fontSize: 10, fontWeight: '900', color: TINT, letterSpacing: 1, marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  sectionLink: { color: TINT, fontWeight: '700', fontSize: 14 },
  hScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  emptyBox: { alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { color: '#9ca3af', fontWeight: '600' },
  // Course Card
  courseCard: {
    width: 240, backgroundColor: '#fff', borderRadius: 20, marginRight: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, overflow: 'hidden',
  },
  courseThumb: { width: '100%', height: 130, backgroundColor: '#e5e7eb' },
  coursePriceBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  coursePriceText: { fontSize: 12, fontWeight: '900', color: '#111827' },
  courseInfo: { padding: 14 },
  courseCategory: { fontSize: 9, fontWeight: '900', color: TINT, letterSpacing: 1, marginBottom: 4 },
  courseTitle: { fontSize: 14, fontWeight: '800', color: '#111827', lineHeight: 20, marginBottom: 10 },
  courseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  instructorAvatar: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: TINT,
    justifyContent: 'center', alignItems: 'center',
  },
  instructorInitial: { color: '#fff', fontSize: 10, fontWeight: '900' },
  instructorName: { fontSize: 11, color: '#6b7280', fontWeight: '700', flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  // Features
  featuresSection: { padding: 20, paddingTop: 32 },
  featuresSectionTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 20, textAlign: 'center' },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 2,
  },
  featureIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 },
  featureDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  // CTA
  ctaBanner: { margin: 20, borderRadius: 24, padding: 28, alignItems: 'center' },
  ctaTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  ctaSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
  },
  ctaBtnText: { color: TINT, fontWeight: '900', fontSize: 15 },
});
