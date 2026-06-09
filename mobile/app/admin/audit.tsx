import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import apiClient from '@/api/client';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      const { data } = await apiClient.get('/admin/audit-logs');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Audit Logs',
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
          data={logs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No audit logs found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.action}>{item.action}</Text>
              <Text style={styles.details}>By: {item.user?.name || 'System'}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  action: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  details: { fontSize: 14, color: '#374151', marginVertical: 4 },
  date: { fontSize: 12, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 40, color: '#6b7280' }
});
