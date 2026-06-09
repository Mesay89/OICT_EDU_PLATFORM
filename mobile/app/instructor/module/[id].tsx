import React, { useState, useEffect } from 'react';
import { StyleSheet, View as RNView, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { FolderPlus, CheckCircle } from 'lucide-react-native';

const TINT = '#6366f1';

export default function AddModuleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (user?.role !== 'instructor' && user?.role !== 'admin') {
      router.replace('/');
    }
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Module title is required');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(`/courses/${id}/modules`, { title });
      Alert.alert('Success', 'Module added successfully!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add module');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Add Module' }} />
      
      <RNView style={styles.header}>
        <FolderPlus size={32} color={TINT} />
        <Text style={styles.title}>Create New Module</Text>
      </RNView>

      <RNView style={styles.form}>
        <Text style={styles.label}>Module Title</Text>
        <TextInput 
          style={styles.input} 
          value={title} 
          onChangeText={setTitle} 
          placeholder="e.g. Introduction to React"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Add Module</Text>
            </>
          )}
        </TouchableOpacity>
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827', marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: TINT, padding: 16, borderRadius: 12, marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
