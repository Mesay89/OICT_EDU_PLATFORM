import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View,
  ActivityIndicator, RefreshControl, Alert, Image, Text as RNText
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, Star, Clock, BookOpen } from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

interface Course {
  _id: string;
  title: string;
  image?: string;
  instructor?: { name: string };
  createdAt: string;
  status?: string;
  isFeatured?: boolean;
}

export default function AllCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await apiClient.get<Course[]>('/admin/courses');
      setCourses(data || []);
    } catch (err: any) {
      console.log('Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this course?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/admin/courses/${id}`);
            Alert.alert('Success', 'Course deleted successfully');
            fetchData();
          } catch {
            Alert.alert('Error', 'Failed to delete course');
          }
        }
      }
    ]);
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setCourses(prev => prev.map(c => c._id === id ? { ...c, isFeatured: !currentStatus } : c));
      await apiClient.put(`/admin/courses/${id}/featured`);
      fetchData(); // Refresh to confirm
    } catch {
      Alert.alert('Error', 'Failed to toggle featured status');
      fetchData(); // Revert on error
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>All Courses</Text>
          <Text style={styles.headerSubtitle}>Total: {courses.length}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        contentContainerStyle={{ padding: 20 }}
      >
        {loading ? (
          <ActivityIndicator color={TINT} style={{ marginTop: 40 }} />
        ) : courses.length === 0 ? (
          <View style={styles.empty}>
            <BookOpen size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No courses found</Text>
          </View>
        ) : (
          courses.map(course => (
            <View key={course._id} style={styles.card}>
              <Image 
                source={{ uri: course.thumbnail || course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }} 
                style={styles.thumb} 
              />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
                <Text style={styles.author}>By {course.instructor?.name || 'Unknown'}</Text>
                <View style={styles.meta}>
                  <Clock size={12} color="#6b7280" />
                  <Text style={styles.metaText}>{new Date(course.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                {course.status === 'published' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, course.isFeatured ? styles.featuredActive : styles.featureBtnInactive]}
                    onPress={() => handleToggleFeatured(course._id, !!course.isFeatured)}
                  >
                    <Star size={14} color={course.isFeatured ? '#fff' : '#fbbf24'} />
                    <RNText style={[styles.actionBtnText, { color: course.isFeatured ? '#fff' : '#92400e' }]}>
                      {course.isFeatured ? 'Unfeature' : 'Feature'}
                    </RNText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, styles.deleteActive]} onPress={() => handleDelete(course._id)}>
                  <Trash2 size={14} color="#fff" />
                  <RNText style={styles.actionBtnText}>Delete</RNText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  thumb: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#f3f4f6', marginBottom: 10 },
  info: { marginBottom: 10 },
  title: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  author: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  actions: { gap: 8, flexDirection: 'row' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  actionBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  featureBtnInactive: { backgroundColor: '#fef3c7' },
  featuredActive: { backgroundColor: '#fbbf24' },
  deleteActive: { backgroundColor: '#ef4444' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
});
