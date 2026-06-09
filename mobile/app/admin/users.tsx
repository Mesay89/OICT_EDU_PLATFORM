import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import apiClient from '@/api/client';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, ShieldAlert, CheckCircle, Shield, ShieldOff } from 'lucide-react-native';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const { data } = await apiClient.get('/admin/users');
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id: string, suspended: boolean) => {
    try {
      const endpoint = suspended ? 'activate' : 'suspend';
      await apiClient.put(`/admin/users/${id}/${endpoint}`);
      Alert.alert('Success', `User ${suspended ? 'activated' : 'suspended'}`);
      fetchUsers();
    } catch (err) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleAdminToggle = (id: string, currentRole: string) => {
    const isAdmin = currentRole === 'admin';
    Alert.alert('Confirm Role Change', `Are you sure you want to ${isAdmin ? 'revoke' : 'grant'} admin role?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isAdmin ? 'Revoke Admin' : 'Grant Admin',
        style: isAdmin ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const endpoint = isAdmin ? 'revoke-admin' : 'grant-admin';
            await apiClient.put(`/admin/${endpoint}/${id}`);
            Alert.alert('Success', `Admin role ${isAdmin ? 'revoked' : 'granted'}`);
            fetchUsers();
          } catch (err) {
            Alert.alert('Error', 'Failed to update admin role');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Community & Users',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
          )
        }} 
      />
      <View style={styles.statsHeader}>
        <Text style={styles.statsText}>Total Users Registered: {users.length}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email} ({item.role})</Text>
                <Text style={styles.date}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleAdminToggle(item._id, item.role)} style={[styles.btn, item.role === 'admin' ? styles.btnRevoke : styles.btnGrant]}>
                  {item.role === 'admin' ? <ShieldOff size={16} color="#fff" /> : <Shield size={16} color="#fff" />}
                  <Text style={styles.btnText}>{item.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleStatus(item._id, item.isSuspended)} style={[styles.btn, item.isSuspended ? styles.btnActivate : styles.btnSuspend]}>
                  {item.isSuspended ? <CheckCircle size={16} color="#fff" /> : <ShieldAlert size={16} color="#fff" />}
                  <Text style={styles.btnText}>{item.isSuspended ? 'Activate' : 'Suspend'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  statsHeader: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  statsText: { fontSize: 16, fontWeight: 'bold', color: '#6366f1' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold' },
  email: { fontSize: 14, color: '#6b7280' },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, flex: 1 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  btnActivate: { backgroundColor: '#10b981' },
  btnSuspend: { backgroundColor: '#ef4444' },
  btnGrant: { backgroundColor: '#8b5cf6' },
  btnRevoke: { backgroundColor: '#f59e0b' }
});
