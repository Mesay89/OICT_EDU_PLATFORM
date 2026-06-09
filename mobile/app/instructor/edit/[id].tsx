import React, { useState, useEffect } from 'react';
import { StyleSheet, View as RNView, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Edit3, CheckCircle } from 'lucide-react-native';

const TINT = '#6366f1';

export default function EditCourseScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '0',
    category: ''
  });

  useEffect(() => {
    if (user?.role !== 'instructor' && user?.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await apiClient.get(`/courses/${id}`);
      setCourseData({
        title: data.title || '',
        description: data.description || '',
        price: data.price ? data.price.toString() : '0',
        category: data.category || ''
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/courses/${id}`, {
        ...courseData,
        price: parseFloat(courseData.price) || 0
      });
      Alert.alert('Success', 'Course updated successfully!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RNView style={styles.centered}>
        <Stack.Screen options={{ title: 'Edit Course' }} />
        <ActivityIndicator size="large" color={TINT} />
      </RNView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Course' }} />
      
      <RNView style={styles.header}>
        <Edit3 size={32} color={TINT} />
        <Text style={styles.title}>Edit Course Details</Text>
      </RNView>

      <RNView style={styles.form}>
        <Text style={styles.label}>Course Title</Text>
        <TextInput 
          style={styles.input} 
          value={courseData.title} 
          onChangeText={(text) => setCourseData({...courseData, title: text})} 
          placeholder="Enter title"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={courseData.description} 
          onChangeText={(text) => setCourseData({...courseData, description: text})} 
          placeholder="Enter description"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Price ($)</Text>
        <TextInput 
          style={styles.input} 
          value={courseData.price} 
          onChangeText={(text) => setCourseData({...courseData, price: text})} 
          placeholder="0.00"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Category</Text>
        <TextInput 
          style={styles.input} 
          value={courseData.category} 
          onChangeText={(text) => setCourseData({...courseData, category: text})} 
          placeholder="e.g. Programming, Business"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827', marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: TINT, padding: 16, borderRadius: 12, marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
