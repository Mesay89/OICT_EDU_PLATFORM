import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, FlatList, TextInput, TouchableOpacity, Image,
  ActivityIndicator, View as RNView, RefreshControl, ScrollView
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Search, Filter, Star, Calendar, BookOpen, Shield, Trash2 } from 'lucide-react-native';
import apiClient from '@/api/client';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

const CATEGORIES = ['All', 'Programming', 'Science', 'General', 'Health & Fitness', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Language'];
const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

function CourseCard({ item, onPress, onDelete, isAdmin }: { item: any, onPress: () => void, onDelete?: () => void, isAdmin?: boolean }) {
  const { formatPrice } = useCurrency();
  const { isDarkMode } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.thumbnail || item.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }}
        style={styles.cardImage}
      />
      <RNView style={styles.priceBadge}>
        <Text style={styles.priceText}>
          {item.price === 0 ? 'FREE' : formatPrice(item.price).formatted}
        </Text>
      </RNView>
      {/* Admin delete button on catalog */}
      {isAdmin && onDelete && (
        <TouchableOpacity style={styles.adminDeleteBtn} onPress={onDelete}>
          <Trash2 size={14} color="#fff" />
          <Text style={styles.adminDeleteText}>Delete</Text>
        </TouchableOpacity>
      )}
      <RNView style={styles.cardBody}>
        <RNView style={styles.badgeRow}>
          <RNView style={styles.catBadge}>
            <Text style={styles.catText}>{(item.category || 'General').toUpperCase()}</Text>
          </RNView>
          {item.level && item.level !== 'All Levels' && (
            <RNView style={styles.levelBadge}>
              <Text style={styles.levelText}>{item.level.toUpperCase()}</Text>
            </RNView>
          )}
        </RNView>
        <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#111827' }]} numberOfLines={2}>{item.title}</Text>
        <RNView style={[styles.cardFooter, { borderTopColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
          <RNView style={styles.instructorRow}>
            <RNView style={styles.avatar}>
              <Text style={styles.avatarText}>{item.instructor?.name?.charAt(0) || 'I'}</Text>
            </RNView>
            <Text style={[styles.instructorName, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]} numberOfLines={1}>
              {item.instructor?.name || 'Instructor'}
            </Text>
          </RNView>
          {item.averageRating > 0 && (
            <RNView style={styles.ratingRow}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
            </RNView>
          )}
        </RNView>
      </RNView>
    </TouchableOpacity>
  );
}

export default function CatalogScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All Levels');
  const router = useRouter();

  // Debounce search — mirrors web app 400ms debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (activeLevel !== 'All Levels') params.append('level', activeLevel);

      const { data } = await apiClient.get(`/courses?${params.toString()}`);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, activeCategory, activeLevel]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const onRefresh = () => { setRefreshing(true); fetchCourses(); };

  const resetFilters = () => {
    setSearch('');
    setActiveCategory('All');
    setActiveLevel('All Levels');
  };

  const handleDeleteCourse = (id: string) => {
    Alert.alert('Delete Course', 'Permanently delete this course from the catalog?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/admin/courses/${id}`);
            Alert.alert('Deleted', 'Course removed from catalog.');
            fetchCourses();
          } catch {
            Alert.alert('Error', 'Failed to delete course.');
          }
        }
      }
    ]);
  };

  return (
    <RNView style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }]}>
      {/* Search Bar */}
      <RNView style={[styles.searchWrap, { backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
        <RNView style={[styles.searchBar, { backgroundColor: isDarkMode ? '#111827' : '#f3f4f6' }]}>
          <Search size={18} color={search ? TINT : '#9ca3af'} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#fff' : '#111827' }]}
            placeholder={t('course.search_placeholder') || "Search courses..."}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {loading && search ? (
            <ActivityIndicator size="small" color={TINT} />
          ) : null}
        </RNView>
      </RNView>

      {/* Category Filter */}
      <RNView style={[styles.filterSection, { backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
        <RNView style={styles.filterLabelRow}>
          <Filter size={14} color="#9ca3af" />
          <Text style={styles.filterLabel}>CATEGORY</Text>
        </RNView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RNView>

      {/* Level Filter */}
      <RNView style={[styles.filterSection, { backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
        <RNView style={styles.filterLabelRow}>
          <Text style={styles.filterLabel}>LEVEL</Text>
        </RNView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {LEVELS.map(lvl => (
            <TouchableOpacity
              key={lvl}
              style={[styles.filterChip, styles.levelChip, activeLevel === lvl && styles.levelChipActive]}
              onPress={() => setActiveLevel(lvl)}
            >
              <Text style={[styles.filterChipText, activeLevel === lvl && styles.levelChipTextActive]}>
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RNView>

      {/* Results */}
      {loading && courses.length === 0 ? (
        <RNView style={styles.centered}>
          <ActivityIndicator size="large" color={TINT} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </RNView>
      ) : error ? (
        <RNView style={styles.centered}>
          <Shield size={40} color="#ef4444" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCourses}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </RNView>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <CourseCard
              item={item}
              onPress={() => router.push(`/course/${item._id}`)}
              isAdmin={isAdmin}
              onDelete={() => handleDeleteCourse(item._id)}
              isDarkMode={isDarkMode}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
          ListEmptyComponent={
            <RNView style={styles.centered}>
              <BookOpen size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Courses Found</Text>
              <Text style={styles.emptyMsg}>Try adjusting your search or filters</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetText}>Reset Filters</Text>
              </TouchableOpacity>
            </RNView>
          }
        />
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchWrap: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f3f4f6', borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterSection: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  filterLabel: { fontSize: 10, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', marginRight: 8, backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: TINT, borderColor: TINT },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  filterChipTextActive: { color: '#fff' },
  levelChip: { borderColor: '#e5e7eb' },
  levelChipActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  levelChipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardImage: { width: '100%', height: 180, backgroundColor: '#e5e7eb' },
  priceBadge: {
    position: 'absolute', top: 12, right: 12, backgroundColor: '#fff',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  priceText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  cardBody: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  catBadge: {
    backgroundColor: '#eef2ff', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  catText: { fontSize: 9, fontWeight: '900', color: TINT, letterSpacing: 1 },
  levelBadge: {
    backgroundColor: '#faf5ff', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#e9d5ff',
  },
  levelText: { fontSize: 9, fontWeight: '900', color: '#a855f7', letterSpacing: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#111827', lineHeight: 24, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: TINT, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  instructorName: { fontSize: 12, color: '#6b7280', fontWeight: '700', flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#f59e0b' },
  // States
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  loadingText: { color: '#9ca3af', fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  errorMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  retryBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  retryText: { color: '#fff', fontWeight: '800' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptyMsg: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  resetBtn: { marginTop: 8 },
  resetText: { color: TINT, fontWeight: '800', fontSize: 14 },
  // Admin delete overlay on catalog card
  adminDeleteBtn: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ef4444', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    zIndex: 10,
  },
  adminDeleteText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
