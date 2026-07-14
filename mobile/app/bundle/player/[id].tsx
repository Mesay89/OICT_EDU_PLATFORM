import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View as RNView, TouchableOpacity,
  ActivityIndicator, Alert, FlatList, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, ChevronRight, BookOpen, CheckCircle, List, X
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';
const { width, height } = Dimensions.get('window');

export default function BundlePlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentCourseIdx, setCurrentCourseIdx] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const bg = isDarkMode ? '#0f172a' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';

  useEffect(() => {
    if (id) fetchBundle();
  }, [id]);

  const fetchBundle = async () => {
    try {
      const { data } = await apiClient.get(`/bundles/${id}`);
      setBundle(data);
      // Start with first lesson of first course
      const firstCourse = data.courses?.[0];
      if (firstCourse?.sections?.[0]?.lessons?.[0]) {
        setCurrentLesson(firstCourse.sections[0].lessons[0]);
      }
    } catch {
      Alert.alert('Error', 'Failed to load bundle');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getVideoUrl = (lesson: any) => {
    const raw = lesson?.videoUrl || lesson?.video || '';
    if (raw.includes('youtube.com') || raw.includes('youtu.be')) {
      const match = raw.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
    if (raw.includes('vimeo.com')) {
      const match = raw.match(/vimeo\.com\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
    }
    return raw;
  };

  const markLessonComplete = async (lesson: any, courseId: string) => {
    try {
      await apiClient.post(`/enrollments/${courseId}/progress`, {
        lessonId: lesson._id,
      });
    } catch {}
  };

  if (loading) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={TINT} />
    </RNView>
  );

  if (!bundle) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <Text style={{ color: textColor }}>Bundle not found</Text>
    </RNView>
  );

  const courses = bundle.courses || [];
  const currentCourse = courses[currentCourseIdx];
  const videoUrl = currentLesson ? getVideoUrl(currentLesson) : '';

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ChevronLeft size={22} color={textColor} />
        </TouchableOpacity>
        <RNView style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
            {currentCourse?.title || 'Bundle Player'}
          </Text>
          {currentLesson && (
            <Text style={[styles.headerSub, { color: subColor }]} numberOfLines={1}>
              {currentLesson.title}
            </Text>
          )}
        </RNView>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.headerBtn}>
          <List size={22} color={textColor} />
        </TouchableOpacity>
      </RNView>

      {/* Video Player */}
      <RNView style={styles.videoContainer}>
        {videoUrl ? (
          <WebView
            source={{ uri: videoUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            javaScriptEnabled
            onLoad={() => {
              if (currentLesson && currentCourse?._id) {
                markLessonComplete(currentLesson, currentCourse._id);
              }
            }}
          />
        ) : (
          <RNView style={styles.noVideo}>
            <BookOpen size={48} color="#6b7280" />
            <Text style={{ color: subColor, marginTop: 12 }}>No video available</Text>
          </RNView>
        )}
      </RNView>

      {/* Course Navigation */}
      <RNView style={[styles.courseNav, { backgroundColor: card }]}>
        <Text style={[styles.courseNavLabel, { color: subColor }]}>Course</Text>
        <RNView style={styles.courseNavRow}>
          <TouchableOpacity
            onPress={() => setCurrentCourseIdx(i => Math.max(0, i - 1))}
            disabled={currentCourseIdx === 0}
            style={[styles.navBtn, currentCourseIdx === 0 && styles.navBtnDisabled]}
          >
            <ChevronLeft size={18} color={currentCourseIdx === 0 ? '#d1d5db' : textColor} />
          </TouchableOpacity>
          <Text style={[styles.courseNavTitle, { color: textColor }]} numberOfLines={1}>
            {currentCourse?.title || 'Course'}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentCourseIdx(i => Math.min(courses.length - 1, i + 1))}
            disabled={currentCourseIdx === courses.length - 1}
            style={[styles.navBtn, currentCourseIdx === courses.length - 1 && styles.navBtnDisabled]}
          >
            <ChevronRight size={18} color={currentCourseIdx === courses.length - 1 ? '#d1d5db' : textColor} />
          </TouchableOpacity>
        </RNView>
        <Text style={[styles.courseNavCount, { color: subColor }]}>
          {currentCourseIdx + 1} / {courses.length}
        </Text>
      </RNView>

      {/* Lessons List */}
      <FlatList
        data={currentCourse?.sections?.flatMap((s: any) => s.lessons || []) || []}
        keyExtractor={(item, idx) => item._id || String(idx)}
        style={styles.lessonsList}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.lessonRow,
              { backgroundColor: card },
              currentLesson?._id === item._id && styles.lessonActive
            ]}
            onPress={() => setCurrentLesson(item)}
          >
            <RNView style={[styles.lessonNum, currentLesson?._id === item._id && { backgroundColor: TINT }]}>
              <Text style={[styles.lessonNumText, currentLesson?._id === item._id && { color: '#fff' }]}>
                {index + 1}
              </Text>
            </RNView>
            <Text
              style={[styles.lessonTitle, { color: textColor }, currentLesson?._id === item._id && { color: TINT }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <RNView style={styles.emptyBox}>
            <Text style={{ color: subColor }}>No lessons found</Text>
          </RNView>
        }
      />

      {/* Sidebar overlay — course list */}
      {showSidebar && (
        <RNView style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowSidebar(false)} />
          <RNView style={[styles.sidebar, { backgroundColor: card }]}>
            <RNView style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, { color: textColor }]}>Bundle Courses</Text>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <X size={22} color={textColor} />
              </TouchableOpacity>
            </RNView>
            <FlatList
              data={courses}
              keyExtractor={(item, idx) => item._id || String(idx)}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.sidebarCourse, currentCourseIdx === index && styles.sidebarCourseActive]}
                  onPress={() => {
                    setCurrentCourseIdx(index);
                    const first = item.sections?.[0]?.lessons?.[0];
                    if (first) setCurrentLesson(first);
                    setShowSidebar(false);
                  }}
                >
                  {currentCourseIdx === index && <CheckCircle size={16} color={TINT} />}
                  <Text style={[styles.sidebarCourseTitle, { color: textColor }]} numberOfLines={2}>
                    {index + 1}. {item.title}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </RNView>
        </RNView>
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  headerBtn: { padding: 6 },
  headerTitle: { fontSize: 15, fontWeight: '900' },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  videoContainer: { width, height: (width * 9) / 16, backgroundColor: '#000' },
  webview: { flex: 1 },
  noVideo: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  courseNav: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center', gap: 4
  },
  courseNavLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  courseNavRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  navBtnDisabled: { opacity: 0.4 },
  courseNavTitle: { fontSize: 14, fontWeight: '800', maxWidth: 220, textAlign: 'center' },
  courseNavCount: { fontSize: 12, fontWeight: '700' },
  lessonsList: { flex: 1 },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, marginHorizontal: 12, marginTop: 8, borderRadius: 12
  },
  lessonActive: { borderLeftWidth: 3, borderLeftColor: TINT },
  lessonNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center'
  },
  lessonNumText: { fontSize: 13, fontWeight: '900', color: '#374151' },
  lessonTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  emptyBox: { padding: 32, alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row-reverse', zIndex: 100 },
  overlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { width: width * 0.78, paddingTop: 52, shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 20 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sidebarTitle: { fontSize: 16, fontWeight: '900' },
  sidebarCourse: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sidebarCourseActive: { backgroundColor: '#eef2ff' },
  sidebarCourseTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
});
