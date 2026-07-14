import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View as RNView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, AppState
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Award, CheckCircle, AlertCircle,
  AlertTriangle, Send, RotateCcw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

export default function EvaluationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const appState = useRef(AppState.currentState);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [canTake, setCanTake] = useState(false);
  const [progress, setProgress] = useState(0);
  const [existingScore, setExistingScore] = useState<number | null>(null);

  // Anti-cheat
  const [blurCount, setBlurCount] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [blurWarning, setBlurWarning] = useState(false);

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';

  useEffect(() => {
    fetchData();
  }, [id]);

  // Anti-cheat: detect app background
  useEffect(() => {
    if (submitted) return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        const newCount = blurCount + 1;
        setBlurCount(newCount);
        setBlurWarning(true);
        if (newCount >= 3) {
          setFlagged(true);
          Alert.alert('⚠️ Anti-Cheat Warning', 'You left the app multiple times. Your attempt has been flagged.');
        } else {
          Alert.alert('⚠️ Warning', `Switching apps is not allowed during the quiz. Warning ${newCount}/3`);
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [blurCount, submitted]);

  const fetchData = async () => {
    try {
      const [courseRes, progRes] = await Promise.all([
        apiClient.get(`/courses/${id}`),
        apiClient.get(`/enrollments/${id}/progress`),
      ]);
      setCourse(courseRes.data);
      const p = progRes.data.progress || 0;
      setProgress(p);
      setCanTake(p >= 80);
      setExistingScore(progRes.data.quizScore ?? null);

      if (progRes.data.certificateIssued) {
        setSubmitted(true);
        setScore(progRes.data.quizScore || 0);
      }

      // Fetch quiz questions
      try {
        const { data: quizzes } = await apiClient.get(`/quiz/course/${id}`);
        if (quizzes && quizzes.length > 0 && quizzes[0].questions?.length > 0) {
          const qs = quizzes[0].questions.map((q: any) => ({
            _id: q._id,
            question: q.text,
            options: q.options,
            answer: q.correct ?? 0,
          }));
          setQuestions(qs);
          setAnswers(new Array(qs.length).fill(null));
        } else {
          const fallback = [
            { question: 'What is the primary goal of this course?', options: ['Master core concepts', 'Casual browsing', 'Watching videos', 'None'], answer: 0 },
            { question: 'Which tool is emphasized in the curriculum?', options: ['Standard industry tools', 'Legacy systems', 'Manual processes', 'No tools'], answer: 0 },
          ];
          setQuestions(fallback);
          setAnswers(new Array(fallback.length).fill(null));
        }
      } catch {}
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load evaluation');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optIdx: number) => {
    const updated = [...answers];
    updated[currentIdx] = optIdx;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }
    setLoading(true);
    let correct = 0;
    answers.forEach((ans, i) => { if (ans === questions[i].answer) correct++; });
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);

    try {
      await apiClient.post(`/enrollments/${id}/complete`, {
        quizScore: finalScore,
        flagged,
        blurCount,
        flagReason: flagged ? `Left app ${blurCount} times during quiz` : undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={TINT} />
    </RNView>
  );

  // Not eligible
  if (!canTake && !submitted) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <AlertCircle size={64} color="#f59e0b" />
      <Text style={[styles.bigTitle, { color: textColor }]}>Complete Course First</Text>
      <Text style={[styles.subtitle, { color: subColor }]}>
        You need at least 80% course progress to take the final assessment.
      </Text>
      <RNView style={[styles.progressBox, { backgroundColor: card }]}>
        <Text style={[styles.progressLabel, { color: textColor }]}>Your Progress: {progress}%</Text>
        <RNView style={styles.progressBg}>
          <RNView style={[styles.progressFill, { width: `${progress}%` }]} />
        </RNView>
      </RNView>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
        <Text style={styles.primaryBtnText}>Continue Learning</Text>
      </TouchableOpacity>
    </RNView>
  );

  // Submitted — result
  if (submitted) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <LinearGradient
        colors={score >= 70 ? ['#d1fae5', '#a7f3d0'] : ['#fee2e2', '#fecaca']}
        style={styles.resultCircle}
      >
        <Award size={52} color={score >= 70 ? '#10b981' : '#ef4444'} />
      </LinearGradient>
      <Text style={[styles.bigTitle, { color: textColor }]}>
        {score >= 70 ? '🎉 Congratulations!' : 'Quiz Completed'}
      </Text>
      <Text style={styles.resultScore}>{score}%</Text>
      {flagged && (
        <RNView style={styles.flagBox}>
          <AlertTriangle size={16} color="#d97706" />
          <Text style={styles.flagText}>Your attempt was flagged for leaving the app during the quiz.</Text>
        </RNView>
      )}
      <Text style={[styles.subtitle, { color: subColor }]}>
        {score >= 70
          ? 'You passed! You can now view your certificate.'
          : 'You need at least 70% to pass. You can retake anytime.'}
      </Text>
      {score >= 70 && (
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/course/certificate/${id}`)}>
          <Award size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>View Certificate</Text>
        </TouchableOpacity>
      )}
      {score < 70 && (
        <TouchableOpacity style={styles.retakeBtn} onPress={() => {
          setSubmitted(false); setAnswers(new Array(questions.length).fill(null)); setCurrentIdx(0);
          setBlurCount(0); setFlagged(false); setBlurWarning(false);
        }}>
          <RotateCcw size={18} color={TINT} />
          <Text style={styles.retakeBtnText}>Retake Quiz</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.dashBtn} onPress={() => router.replace('/(tabs)/dashboard')}>
        <Text style={styles.dashBtnText}>My Dashboard</Text>
      </TouchableOpacity>
    </RNView>
  );

  // Quiz active
  const q = questions[currentIdx];
  const qProgress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <RNView style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Final Evaluation</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>{course?.title}</Text>
        </RNView>
        {blurWarning && (
          <AlertTriangle size={20} color="#f59e0b" />
        )}
      </RNView>

      {/* Progress bar */}
      <RNView style={styles.progBar}>
        <RNView style={[styles.progFill, { width: `${qProgress}%` }]} />
      </RNView>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={[styles.qNum, { color: subColor }]}>
          Question {currentIdx + 1} of {questions.length}
        </Text>
        <Text style={[styles.qText, { color: textColor }]}>{q.question}</Text>

        <RNView style={{ gap: 12, marginBottom: 32 }}>
          {q.options.map((opt: string, i: number) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.optRow,
                { backgroundColor: card },
                answers[currentIdx] === i && styles.optActive
              ]}
              onPress={() => handleAnswer(i)}
            >
              <RNView style={[styles.radio, answers[currentIdx] === i && styles.radioActive]}>
                {answers[currentIdx] === i && <RNView style={styles.radioInner} />}
              </RNView>
              <Text style={[styles.optText, { color: textColor }, answers[currentIdx] === i && { color: TINT }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </RNView>

        {/* Nav */}
        <RNView style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, { opacity: currentIdx === 0 ? 0.4 : 1 }]}
            onPress={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft size={20} color={textColor} />
            <Text style={{ color: textColor, fontWeight: '700' }}>Prev</Text>
          </TouchableOpacity>

          {currentIdx < questions.length - 1 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setCurrentIdx(i => i + 1)}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Send size={18} color="#fff" />
              <Text style={styles.nextBtnText}>Submit</Text>
            </TouchableOpacity>
          )}
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 12, fontWeight: '600' },
  progBar: { height: 4, backgroundColor: '#f3f4f6' },
  progFill: { height: '100%', backgroundColor: TINT },
  qNum: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  qText: { fontSize: 20, fontWeight: '900', lineHeight: 28, marginBottom: 28 },
  optRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderRadius: 16, borderWidth: 2, borderColor: 'transparent'
  },
  optActive: { borderColor: TINT },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: TINT },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: TINT },
  optText: { flex: 1, fontSize: 15, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f3f4f6' },
  nextBtn: { flex: 1, backgroundColor: '#111827', borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  submitBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#10b981', borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  bigTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  resultCircle: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  resultScore: { fontSize: 52, fontWeight: '900', color: TINT },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: TINT, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: TINT, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  retakeBtnText: { color: TINT, fontWeight: '900', fontSize: 15 },
  dashBtn: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  dashBtnText: { color: '#6b7280', fontWeight: '700' },
  progressBox: { width: '100%', padding: 16, borderRadius: 16, gap: 8 },
  progressLabel: { fontSize: 14, fontWeight: '700' },
  progressBg: { height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: TINT },
  flagBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', padding: 12, borderRadius: 12, width: '100%' },
  flagText: { color: '#92400e', fontSize: 13, fontWeight: '700', flex: 1 },
});
