import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View as RNView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Switch, Image
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import apiClient from '@/api/client';
import {
  ChevronLeft, Save, Tag, BookOpen, CheckCircle,
  ChevronDown, Image as ImageIcon, AlertCircle
} from 'lucide-react-native';

const TINT = '#6366f1';

const CATEGORIES = [
  'Programming', 'Web Development', 'Mobile Development', 'Data Science',
  'Machine Learning', 'Design', 'UI/UX', 'Marketing', 'Business',
  'Finance', 'Photography', 'Music', 'Language', 'Health & Fitness', 'Other'
];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function EditCourseScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [category, setCategory] = useState('Programming');
  const [level, setLevel] = useState('Beginner');
  const [language, setLanguage] = useState('English');
  const [isPublished, setIsPublished] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showLevels, setShowLevels] = useState(false);

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBg = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#e5e7eb';

  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await apiClient.get(`/courses/${id}`);
      setTitle(data.title || '');
      setDescription(data.description || '');
      const p = data.price ?? 0;
      setIsFree(p === 0);
      setPrice(p > 0 ? p.toString() : '');
      setImageUrl(data.image || '');
      setVideoUrl(data.video || '');
      setCategory(data.category || 'Programming');
      setLevel(data.level || 'Beginner');
      setLanguage(data.language || 'English');
      setIsPublished(data.isPublished || false);
    } catch {
      Alert.alert('Error', 'Failed to load course');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Course title is required'); return; }
    if (!imageUrl.trim()) { Alert.alert('Required', 'Thumbnail URL is required'); return; }

    setSaving(true);
    try {
      await apiClient.put(`/courses/${id}`, {
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : parseFloat(price) || 0,
        image: imageUrl.trim(),
        video: videoUrl.trim() || undefined,
        category,
        level,
        language,
        isPublished,
      });
      Alert.alert('✅ Saved', 'Course updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={TINT} />
    </RNView>
  );

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Edit Course</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveHeaderText}>Save</Text>}
        </TouchableOpacity>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Basic Info */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>📋 Basic Information</Text>

          <Text style={[styles.label, { color: subColor }]}>Course Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Course title"
            placeholderTextColor={subColor}
          />

          <Text style={[styles.label, { color: subColor }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: inputBg, color: textColor, borderColor }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Course description..."
            placeholderTextColor={subColor}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Category */}
          <Text style={[styles.label, { color: subColor }]}>Category</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: inputBg, borderColor }]}
            onPress={() => { setShowCategories(!showCategories); setShowLevels(false); }}
          >
            <Tag size={16} color={subColor} />
            <Text style={[styles.pickerText, { color: textColor }]}>{category}</Text>
            <ChevronDown size={16} color={subColor} />
          </TouchableOpacity>
          {showCategories && (
            <RNView style={[styles.dropdown, { backgroundColor: isDarkMode ? '#374151' : '#fff', borderColor }]}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.dropItem, { borderBottomColor: isDarkMode ? '#4b5563' : '#f3f4f6' }]}
                  onPress={() => { setCategory(c); setShowCategories(false); }}
                >
                  <Text style={[styles.dropText, { color: textColor }, category === c && { color: TINT }]}>{c}</Text>
                  {category === c && <CheckCircle size={14} color={TINT} />}
                </TouchableOpacity>
              ))}
            </RNView>
          )}

          {/* Level */}
          <Text style={[styles.label, { color: subColor }]}>Level</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: inputBg, borderColor }]}
            onPress={() => { setShowLevels(!showLevels); setShowCategories(false); }}
          >
            <BookOpen size={16} color={subColor} />
            <Text style={[styles.pickerText, { color: textColor }]}>{level}</Text>
            <ChevronDown size={16} color={subColor} />
          </TouchableOpacity>
          {showLevels && (
            <RNView style={[styles.dropdown, { backgroundColor: isDarkMode ? '#374151' : '#fff', borderColor }]}>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.dropItem, { borderBottomColor: isDarkMode ? '#4b5563' : '#f3f4f6' }]}
                  onPress={() => { setLevel(l); setShowLevels(false); }}
                >
                  <Text style={[styles.dropText, { color: textColor }, level === l && { color: TINT }]}>{l}</Text>
                  {level === l && <CheckCircle size={14} color={TINT} />}
                </TouchableOpacity>
              ))}
            </RNView>
          )}

          <Text style={[styles.label, { color: subColor }]}>Language</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            value={language}
            onChangeText={setLanguage}
            placeholder="e.g. English"
            placeholderTextColor={subColor}
          />
        </RNView>

        {/* Media */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>🎬 Course Media</Text>

          <Text style={[styles.label, { color: subColor }]}>Thumbnail URL *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor={subColor}
            autoCapitalize="none"
          />
          {imageUrl.trim().startsWith('http') && (
            <Image source={{ uri: imageUrl }} style={styles.preview} />
          )}

          <Text style={[styles.label, { color: subColor }]}>Intro Video URL (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor={subColor}
            autoCapitalize="none"
          />
        </RNView>

        {/* Pricing */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>💰 Pricing</Text>
          <RNView style={styles.toggleRow}>
            <RNView>
              <Text style={[styles.toggleLabel, { color: textColor }]}>Free Course</Text>
              <Text style={[styles.toggleSub, { color: subColor }]}>Open access for everyone</Text>
            </RNView>
            <Switch
              value={isFree}
              onValueChange={(v) => { setIsFree(v); if (v) setPrice('0'); }}
              trackColor={{ false: isDarkMode ? '#374151' : '#e5e7eb', true: TINT }}
              thumbColor="#fff"
            />
          </RNView>
          {!isFree && (
            <>
              <Text style={[styles.label, { color: subColor }]}>Price (USD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 29.99"
                placeholderTextColor={subColor}
                keyboardType="decimal-pad"
              />
            </>
          )}
        </RNView>

        {/* Publishing */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>📢 Publishing</Text>
          <RNView style={styles.toggleRow}>
            <RNView>
              <Text style={[styles.toggleLabel, { color: textColor }]}>Published</Text>
              <Text style={[styles.toggleSub, { color: subColor }]}>
                {isPublished ? 'Visible to students' : 'Saved as draft'}
              </Text>
            </RNView>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: isDarkMode ? '#374151' : '#e5e7eb', true: '#10b981' }}
              thumbColor="#fff"
            />
          </RNView>
        </RNView>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '900' },
  saveHeaderBtn: { backgroundColor: TINT, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveHeaderText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  card: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4
  },
  cardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14, borderWidth: 1 },
  textarea: { height: 120 },
  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1
  },
  pickerText: { flex: 1, fontSize: 15, fontWeight: '600' },
  dropdown: {
    borderRadius: 12, marginBottom: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5
  },
  dropItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1
  },
  dropText: { fontSize: 14, fontWeight: '700' },
  preview: { width: '100%', height: 160, borderRadius: 12, marginBottom: 14, backgroundColor: '#e5e7eb' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '800' },
  toggleSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: TINT, borderRadius: 16, paddingVertical: 18,
    shadowColor: TINT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
