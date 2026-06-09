import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, View as DefaultView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, PlayCircle, Lock, CheckCircle, FileText, Send, Award, Clock } from 'lucide-react-native';
import { WebView } from 'react-native-webview'; // Needed for YouTube/Drive embeds
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CONFIG from '@/constants/Config';

const { width } = Dimensions.get('window');

interface Course {
  _id: string;
  title: string;
  description?: string;
  introVideoUrl?: string;
  modules?: Array<{
    _id: string;
    title: string;
    videoUrl?: string;
    content?: string;
    isLocked?: boolean;
  }>;
}

export default function CoursePlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(0);
  const [moduleProgress, setModuleProgress] = useState([]);
  
  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      if (!user?.token) return;
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${CONFIG.BASE_URL}/courses/${id}`, config);
      setCourse(data);
      
      // Fetch progress
      const progRes = await axios.get(`${CONFIG.BASE_URL}/enrollments/${id}/progress`, config);
      setCourseProgress(progRes.data.progress || 0);
      setModuleProgress(progRes.data.moduleProgress || []);
    } catch (error: any) {
      console.error('Failed to fetch course data', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActiveVideo = () => {
    if (!course) return null;
    if (currentModuleIdx === -1) return course?.introVideoUrl;
    return course?.modules?.[currentModuleIdx]?.videoUrl || course?.introVideoUrl;
  };

  const renderVideo = () => {
    const videoUrl = getActiveVideo();
    if (!videoUrl) return <View style={styles.noVideo}><Text>No video available</Text></View>;

    // Simple YouTube/Web embed logic
    let embedUrl = videoUrl;
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('v=') ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('/').pop();
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    return (
      <View style={styles.videoContainer}>
        {Platform.OS === 'web' ? (
          <iframe 
            src={embedUrl} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <WebView 
            source={{ uri: embedUrl }} 
            style={styles.video}
            allowsFullscreenVideo
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  const currentModule = currentModuleIdx === -1 ? null : course?.modules?.[currentModuleIdx];

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={colorScheme === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course?.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderVideo()}

      <ScrollView style={styles.content}>
        <View style={styles.detailsPadding}>
          <Text style={styles.moduleTitle}>
            {currentModuleIdx === -1 ? 'Introduction' : `${currentModuleIdx + 1}. ${currentModule?.title}`}
          </Text>
          <Text style={styles.description}>
            {currentModule?.content || course?.description}
          </Text>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Course Progress</Text>
              <Text style={styles.progressPct}>{courseProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${courseProgress}%`, backgroundColor: Colors[colorScheme].tint }]} />
            </View>
          </View>

          {/* Module List */}
          <Text style={styles.sectionTitle}>Course Content</Text>
          <TouchableOpacity 
            style={[styles.moduleItem, currentModuleIdx === -1 && styles.activeModule]}
            onPress={() => setCurrentModuleIdx(-1)}
          >
            <PlayCircle size={24} color={currentModuleIdx === -1 ? Colors[colorScheme].tint : '#999'} />
            <Text style={[styles.moduleItemText, currentModuleIdx === -1 && styles.activeModuleText]}>Introduction Video</Text>
          </TouchableOpacity>

          {course?.modules?.map((mod: any, index: number) => (
            <TouchableOpacity 
              key={mod._id || index}
              style={[styles.moduleItem, currentModuleIdx === index && styles.activeModule]}
              onPress={() => setCurrentModuleIdx(index)}
            >
              <PlayCircle size={24} color={currentModuleIdx === index ? Colors[colorScheme].tint : '#999'} />
              <View style={styles.moduleItemInfo}>
                <Text style={[styles.moduleItemText, currentModuleIdx === index && styles.activeModuleText]}>
                  {index + 1}. {mod.title}
                </Text>
                {mod.isLocked && <Lock size={14} color="#f59e0b" />}
              </View>
            </TouchableOpacity>
          ))}

          {/* Quiz CTA */}
          {courseProgress >= 80 && (
            <TouchableOpacity 
              style={styles.quizBtn}
              onPress={() => router.push(`/course/quiz/${id}` as any)}
            >
              <Award size={24} color="#fff" />
              <View style={{ flex: 1, marginLeft: 12, backgroundColor: 'transparent' }}>
                <Text style={styles.quizBtnTitle}>Take Final Assessment</Text>
                <Text style={styles.quizBtnSub}>Earn your official certificate</Text>
              </View>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '80%',
  },
  videoContainer: {
    width: width,
    height: width * (9 / 16),
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  noVideo: {
    width: width,
    height: width * (9 / 16),
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  detailsPadding: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  moduleTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.7,
    marginBottom: 24,
  },
  progressSection: {
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6366f1',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'transparent',
  },
  activeModule: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderColor: '#6366f1',
  },
  moduleItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  moduleItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeModuleText: {
    color: '#6366f1',
  },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 20,
    borderRadius: 20,
    marginTop: 32,
    marginBottom: 40,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  quizBtnTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  quizBtnSub: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.9 },
});
