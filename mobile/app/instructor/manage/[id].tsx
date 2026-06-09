import React, { useState, useEffect } from 'react';
import { StyleSheet, View as RNView, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Users, AlertCircle } from 'lucide-react-native';

const TINT = '#6366f1';

export default function ManageCourseScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'instructor' && user?.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchStudents();
  }, [id]);

  const fetchStudents = async () => {
    try {
      const { data } = await apiClient.get(`/enrollments/course/${id}/students`);
      setStudents(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RNView style={styles.centered}>
        <Stack.Screen options={{ title: 'Manage Course' }} />
        <ActivityIndicator size="large" color={TINT} />
      </RNView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Course' }} />
      
      <RNView style={styles.header}>
        <Users size={32} color={TINT} />
        <Text style={styles.title}>Enrolled Students ({students.length})</Text>
      </RNView>

      {students.length === 0 ? (
        <RNView style={styles.emptyState}>
          <AlertCircle size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>No students enrolled yet.</Text>
        </RNView>
      ) : (
        students.map((enrollment, index) => (
          <RNView key={enrollment._id || index} style={styles.studentCard}>
            <RNView style={styles.avatar}>
              <Text style={styles.avatarText}>{enrollment.user?.name?.charAt(0) || 'S'}</Text>
            </RNView>
            <RNView style={styles.studentInfo}>
              <Text style={styles.studentName}>{enrollment.user?.name || 'Unknown Student'}</Text>
              <Text style={styles.studentEmail}>{enrollment.user?.email || 'No email'}</Text>
            </RNView>
            <RNView style={styles.progressBadge}>
              <Text style={styles.progressText}>{enrollment.progress || 0}%</Text>
            </RNView>
          </RNView>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 12 },
  emptyStateText: { marginTop: 12, fontSize: 16, color: '#6b7280', fontWeight: '600' },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: '800', color: TINT },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  studentEmail: { fontSize: 13, color: '#6b7280' },
  progressBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progressText: { color: '#166534', fontWeight: '800', fontSize: 12 },
});
