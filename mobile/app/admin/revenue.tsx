import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import apiClient from '@/api/client';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function AdminRevenue() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchRevenue = async () => {
    try {
      const { data } = await apiClient.get('/reports/revenue');
      setRevenueData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Revenue Analytics',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
          )
        }} 
      />
      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            <Text style={styles.label}>Total Lifetime Revenue</Text>
            <Text style={styles.value}>${revenueData?.lifetimeTotal || 0}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Top Selling Courses</Text>
          {revenueData?.topCourses?.length > 0 ? (
            revenueData.topCourses.map((course: any, i: number) => (
              <View key={i} style={styles.txCard}>
                <Text style={styles.txDate}>{course.title}</Text>
                <Text style={styles.txAmount}>{course.students} students</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No courses sold yet.</Text>
          )}

          <Text style={styles.sectionTitle}>Monthly Revenue (Last 6 Months)</Text>
          {revenueData?.monthlyRevenue?.length > 0 ? (
            revenueData.monthlyRevenue.map((month: any, i: number) => (
              <View key={i} style={styles.txCard}>
                <Text style={styles.txDate}>{month._id.month}/{month._id.year}</Text>
                <Text style={styles.txAmount}>${month.total}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No monthly data available.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 12, elevation: 2, alignItems: 'center' },
  label: { fontSize: 14, color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' },
  value: { fontSize: 28, fontWeight: '900', color: '#111827', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8 },
  txDate: { fontSize: 14, color: '#374151' },
  txAmount: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 20 }
});
