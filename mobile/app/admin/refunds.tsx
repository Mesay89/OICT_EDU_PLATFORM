import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import apiClient from '@/api/client';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react-native';

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchRefunds = async () => {
    try {
      const { data } = await apiClient.get('/admin/refunds');
      setRefunds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleProcess = async (id: string, status: string) => {
    try {
      await apiClient.put(`/admin/refunds/${id}`, { status });
      Alert.alert('Success', `Refund ${status}`);
      fetchRefunds();
    } catch (err) {
      Alert.alert('Error', 'Failed to process refund');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Refund Requests',
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
        <FlatList
          data={refunds}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No refund requests.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.amount}>${item.amount}</Text>
                <Text style={styles.reason}>{item.reason}</Text>
                <Text style={styles.status}>Status: {item.status}</Text>
              </View>
              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleProcess(item._id, 'approved')} style={styles.btnApprove}>
                    <CheckCircle size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleProcess(item._id, 'rejected')} style={styles.btnReject}>
                    <XCircle size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, alignItems: 'center' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  reason: { fontSize: 14, color: '#374151', marginVertical: 4 },
  status: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8 },
  btnApprove: { backgroundColor: '#10b981', padding: 10, borderRadius: 8 },
  btnReject: { backgroundColor: '#ef4444', padding: 10, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#6b7280' }
});
