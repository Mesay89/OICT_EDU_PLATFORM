import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View,
  ActivityIndicator, RefreshControl, Alert, Image
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle, XCircle, BookOpen, Clock } from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#6366f1';

interface Course {
  _id: string;
  title: string;
  image?: string;
  instructor?: { name: string };
  createdAt: string;
}

export default function CourseApprovalsScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await apiClient.get<Course[]>('/admin/courses/pending');
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

  const handleApprove = async (id: string) => {
    try {
      await apiClient.put(`/admin/courses/${id}/approve`);
      Alert.alert('Approved', 'Course is now live!');
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to approve course');
    }
  };

  const handleReject = async (id: string) => {
    try {
      // In a real app we'd use a Modal or Alert.prompt (iOS only) to get the reason
      await apiClient.put(`/admin/courses/${id}/reject`, { reason: 'Rejected by mobile admin' });
      Alert.alert('Rejected', 'Course has been rejected.');
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to reject course');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Approvals</Text>
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
            <CheckCircle size={64} color="#10b981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No courses pending approval.</Text>
          </View>
        ) : (
          courses.map(course => (
            <View key={course._id} style={styles.card}>
              <Image 
                source={{ uri: course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }} 
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
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(course._id)}>
                  <CheckCircle size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(course._id)}>
                  <XCircle size={20} color="#fff" />
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
  empty: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  emptySub: { color: '#6b7280' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  thumb: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#f3f4f6' },
  info: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  author: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  actions: { gap: 8 },
  approveBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
});
