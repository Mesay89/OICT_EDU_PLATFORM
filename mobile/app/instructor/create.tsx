import React, { useState } from 'react';
import {
  StyleSheet, View as RNView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Switch, Image
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import apiClient from '@/api/client';
import {
  BookOpen, DollarSign, Image as ImageIcon, Video,
  Tag, CheckCircle, ChevronDown, AlertCircle, Plus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TINT = '#6366f1';

const CATEGORIES = [
  'Programming', 'Web Development', 'Mobile Development', 'Data Science',
  'Machine Learning', 'Design', 'UI/UX', 'Marketing', 'Business',
  'Finance', 'Photography', 'Music', 'Language', 'Health & Fitness', 'Other'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function CreateCourseScreen() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

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
  const [loading, setLoading] = useState(false);

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBg = isDarkMode ? '#374151' : '#f3f4f6';
  const borderColor = isDarkMode ? '#4b5563' : '#e5e7eb';

  if (user?.role !== 'instructor') {
    return (
      <RNView style={[styles.centered, { backgroundColor: bg }]}>
        <AlertCircle size={64} color="#ef4444" />
        <Text style={[styles.errorTitle, { color: textColor }]}>Access Denied</Text>
        <Text style={[styles.errorSub, { color: subColor }]}>Instructor role required.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Course title is required'); return; }
    if (!description.trim()) { Alert.alert('Required', 'Description is required'); return; }
    if (!imageUrl.trim()) { Alert.alert('Required', 'Thumbnail URL is required'); return; }
    if (!isFree && (!price.trim() || isNaN(parseFloat(price)))) {
      Alert.alert('Required', 'Please enter a valid price'); return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : parseFloat(price) || 0,
        image: imageUrl.trim(),
        video: videoUrl.trim() || undefined,
        category,
        level,
        language,
        isPublished,
      };
      const { data } = await apiClient.post('/courses', payload);
      Alert.alert('🎉 Success', 'Course created! Add modules & content from the Manage page.', [
        { text: 'Manage Course', onPress: () => router.replace(`/instructor/manage/${data._id}`) },
        { text: 'Instructor Dashboard', onPress: () => router.replace('/(tabs)/instructor') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Hero Header */}
      <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.heroHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>‹</Text>
        </TouchableOpacity>
        <Plus size={28} color="#fff" />
        <Text style={styles.heroTitle}>Create New Course</Text>
        <Text style={styles.heroSub}>Fill in the details to publish your course</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Basic Info Card */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>📋 Basic Information</Text>

          <Text style={[styles.label, { color: subColor }]}>Course Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="e.g. Complete Python Bootcamp"
            placeholderTextColor={subColor}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: subColor }]}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="What will students learn? Be specific and engaging..."
            placeholderTextColor={subColor}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Category Picker */}
          <Text style={[styles.label, { color: subColor }]}>Category *</Text>
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
                  <Text style={[styles.dropItemText, { color: textColor }, category === c && { color: TINT }]}>{c}</Text>
                  {category === c && <CheckCircle size={14} color={TINT} />}
                </TouchableOpacity>
              ))}
            </RNView>
          )}

          {/* Level Picker */}
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
                  <Text style={[styles.dropItemText, { color: textColor }, level === l && { color: TINT }]}>{l}</Text>
                  {level === l && <CheckCircle size={14} color={TINT} />}
                </TouchableOpacity>
              ))}
            </RNView>
          )}

          <Text style={[styles.label, { color: subColor }]}>Language</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="English"
            placeholderTextColor={subColor}
            value={language}
            onChangeText={setLanguage}
          />
        </RNView>

        {/* Media Card */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>🎬 Course Media</Text>

          <Text style={[styles.label, { color: subColor }]}>Thumbnail URL *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="https://example.com/thumbnail.jpg"
            placeholderTextColor={subColor}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
          />
          {imageUrl.trim().startsWith('http') && (
            <Image source={{ uri: imageUrl }} style={styles.preview} />
          )}

          <Text style={[styles.label, { color: subColor }]}>Intro Video URL (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor={subColor}
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
          />
        </RNView>

        {/* Pricing Card */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>💰 Pricing</Text>

          <RNView style={styles.toggleRow}>
            <RNView>
              <Text style={[styles.toggleLabel, { color: textColor }]}>Free Course</Text>
              <Text style={[styles.toggleSub, { color: subColor }]}>Make this course free for everyone</Text>
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
              <Text style={[styles.label, { color: subColor }]}>Price (USD) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="e.g. 29.99"
                placeholderTextColor={subColor}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </>
          )}
        </RNView>

        {/* Publishing Card */}
        <RNView style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>📢 Publishing</Text>
          <RNView style={styles.toggleRow}>
            <RNView>
              <Text style={[styles.toggleLabel, { color: textColor }]}>Publish Immediately</Text>
              <Text style={[styles.toggleSub, { color: subColor }]}>
                {isPublished ? 'Course will be visible to students' : 'Saved as draft — not visible yet'}
              </Text>
            </RNView>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: isDarkMode ? '#374151' : '#e5e7eb', true: '#10b981' }}
              thumbColor="#fff"
            />
          </RNView>
          {!isPublished && (
            <RNView style={styles.draftNote}>
              <Text style={styles.draftText}>
                💡 You can add modules, lessons, and quizzes before publishing.
              </Text>
            </RNView>
          )}
        </RNView>

        {/* Submit Button */}
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Plus size={20} color="#fff" />
                <Text style={styles.createBtnText}>Create Course</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  errorTitle: { fontSize: 22, fontWeight: '900' },
  errorSub: { fontSize: 15 },
  backBtn: { backgroundColor: TINT, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '800' },
  heroHeader: {
    paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20,
    alignItems: 'center', gap: 4
  },
  backArrow: { position: 'absolute', top: 52, left: 16, padding: 8 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  card: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4
  },
  cardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  input: {
    borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14,
    borderWidth: 1
  },
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
  dropItemText: { fontSize: 14, fontWeight: '700' },
  preview: { width: '100%', height: 160, borderRadius: 12, marginBottom: 14, backgroundColor: '#e5e7eb' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '800' },
  toggleSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  draftNote: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, marginTop: 4 },
  draftText: { color: '#92400e', fontSize: 13, fontWeight: '600' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: TINT, borderRadius: 16, paddingVertical: 18,
    shadowColor: TINT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6
  },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
