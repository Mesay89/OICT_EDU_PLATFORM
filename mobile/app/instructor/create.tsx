// Updated create screen with extra fields and logic
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Switch } from 'react-native';
// Removed Picker import due to dependency conflict; using custom dropdown below
import { Text } from '@/components/Themed';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/client';

const TINT = '#6366f1';

export default function CreateCourseScreen() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role !== 'instructor') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <Stack.Screen options={{ title: 'Access Denied' }} />
        <Text style={styles.header}>Access Denied</Text>
        <Text>You must be an instructor to create a course.</Text>
      </View>
    );
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [isFree, setIsFree] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [category, setCategory] = useState('Programming'); // default category
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);

  const categories = ['Programming', 'Design', 'Marketing', 'Business', 'Music'];

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Course title is required');
      return;
    }
    if (!imageUrl.trim()) {
      Alert.alert('Validation', 'Image URL is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title,
        description,
        price: isFree ? 0 : Number(price) || 0,
        image: imageUrl,
        video: videoUrl,
        category,
        isPublished,
      };
      const { data } = await apiClient.post('/courses', payload);
      Alert.alert('Success', 'Course created successfully');
      // Navigate to the newly created course page to expose all features (modules, quizzes, etc.)
      if (data && data._id) {
        router.replace(`/course/${data._id}`);
      } else {
        router.replace('/instructor');
      }
    } catch (err: any) {
      console.error('Create course error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Create Course' }} />
      <Text style={styles.header}>Create New Course</Text>
      <TextInput style={styles.input} placeholder="Course Title" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      {/* Category Dropdown */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Category</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryList(!showCategoryList)}>
          <Text style={styles.pickerValue}>{category}</Text>
        </TouchableOpacity>
        {showCategoryList && (
          <View style={styles.pickerList}>
            {categories.map((c) => (
              <TouchableOpacity key={c} style={styles.pickerItem} onPress={() => { setCategory(c); setShowCategoryList(false); }}>
                <Text>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <TextInput style={styles.input} placeholder="Image URL" value={imageUrl} onChangeText={setImageUrl} />
      {/* Video URL */}
      <TextInput style={styles.input} placeholder="Video URL (optional)" value={videoUrl} onChangeText={setVideoUrl} />
      {/* Free / Paid Switch */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Free Course</Text>
        <Switch value={isFree} onValueChange={setIsFree} thumbColor={TINT} />
      </View>
      {!isFree && (
        <TextInput
          style={styles.input}
          placeholder="Price (USD)"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
      )}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Publish Immediately</Text>
        <Switch value={isPublished} onValueChange={setIsPublished} thumbColor={TINT} />
      </View>
      <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Course</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f9fafb' },
  header: { fontSize: 24, fontWeight: '900', marginBottom: 20, color: '#111827' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  toggleLabel: { fontSize: 16, color: '#111827' },
  createBtn: { backgroundColor: TINT, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pickerContainer: { marginBottom: 12 },
  pickerLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  picker: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  pickerValue: { color: '#111827' },
  pickerList: { backgroundColor: '#fff', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
});
