import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import apiClient from '@/api/client';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle, XCircle, UserX } from 'lucide-react-native';

export default function AdminInstructors() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const router = useRouter();

  const fetchInstructors = async () => {
    try {
      const [pendingRes, historyRes] = await Promise.all([
        apiClient.get('/admin/pending-instructors'),
        apiClient.get('/admin/instructors/history')
      ]);
      setPending(pendingRes.data || []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiClient.put(`/admin/approve-instructor/${id}`);
      Alert.alert('Success', 'Instructor approved!');
      fetchInstructors();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve instructor');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.put(`/admin/reject-instructor/${id}`);
      Alert.alert('Success', 'Instructor rejected');
      fetchInstructors();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject instructor');
    }
  };

  const handleRevoke = (id: string) => {
    Alert.alert('Confirm', 'Are you sure you want to revoke this instructor\'s permissions?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.put(`/admin/revoke-instructor/${id}`);
            Alert.alert('Success', 'Permissions revoked');
            fetchInstructors();
          } catch (err) {
            Alert.alert('Error', 'Failed to revoke permissions');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Instructors',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
          )
        }} 
      />
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
      ) : activeTab === 'pending' ? (
        <FlatList
          data={pending}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No pending instructors found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.date}>Registered: {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleApprove(item._id)} style={styles.btnApprove}>
                  <CheckCircle size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleReject(item._id)} style={styles.btnReject}>
                  <XCircle size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No instructor history found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.status}>Status: {item.status.toUpperCase()}</Text>
              </View>
              {item.status === 'approved' && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleRevoke(item.userId || item._id)} style={styles.btnRevoke}>
                    <UserX size={20} color="#fff" />
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
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabText: { color: '#6b7280', fontWeight: 'bold' },
  activeTabText: { color: '#6366f1' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold' },
  email: { fontSize: 14, color: '#6b7280' },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  status: { fontSize: 12, color: '#6366f1', fontWeight: 'bold', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnApprove: { backgroundColor: '#10b981', padding: 10, borderRadius: 8 },
  btnReject: { backgroundColor: '#ef4444', padding: 10, borderRadius: 8 },
  btnRevoke: { backgroundColor: '#f59e0b', padding: 10, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#6b7280' }
});
