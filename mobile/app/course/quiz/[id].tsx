import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Send, Shield, Clock, AlertCircle, Award, CheckCircle } from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const TINT = '#6366f1';

interface Question {
  text: string;
  options: string[];
  correct: number;
}

interface Course {
  _id: string;
  title: string;
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [canTakeQuiz, setCanTakeQuiz] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [id]);

  const fetchQuizData = async () => {
    try {
      const [courseRes, progRes] = await Promise.all([
        apiClient.get(`/courses/${id}`),
        apiClient.get(`/enrollments/${id}/progress`)
      ]);
      
      setCourse(courseRes.data);
      setProgress(progRes.data.progress || 0);
      setCanTakeQuiz((progRes.data.progress || 0) >= 80);

      // Fetch actual quiz if exists
      try {
        const quizRes = await apiClient.get(`/quiz/course/${id}`);
        if (quizRes.data && quizRes.data.length > 0) {
          setQuestions(quizRes.data[0].questions || []);
          setAnswers(new Array(quizRes.data[0].questions.length).fill(null));
        } else {
          // Fallback static questions
          const staticQs = [
            { text: "What is the primary goal of this course?", options: ["Master core concepts", "Just passing time", "Watching videos", "None"], correct: 0 },
            { text: "Which tool is emphasized in the curriculum?", options: ["Standard industry tools", "Legacy systems", "Manual process", "No tools"], correct: 0 }
          ];
          setQuestions(staticQs);
          setAnswers(new Array(staticQs.length).fill(null));
        }
      } catch {
        // Fallback
      }
    } catch (err: any) {
      console.log('Quiz fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    const newAns = [...answers];
    newAns[currentIdx] = idx;
    setAnswers(newAns);
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    let correctCount = 0;
    answers.forEach((ans, idx) => {
      if (ans === questions[idx].correct) correctCount++;
    });
    
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);

    try {
      await apiClient.post(`/enrollments/${id}/complete`, { quizScore: finalScore });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <RNView style={styles.centered}><ActivityIndicator color={TINT} /></RNView>;

  if (!canTakeQuiz && !submitted) {
    return (
      <RNView style={styles.centered}>
        <AlertCircle size={64} color="#f59e0b" />
        <Text style={styles.errorTitle}>Complete Course First</Text>
        <Text style={styles.errorMsg}>
          You need to complete at least 80% of the course videos before taking the final assessment.
        </Text>
        <RNView style={styles.progBox}>
          <Text style={styles.progLab}>Current Progress: {progress}%</Text>
          <RNView style={styles.progBarBg}>
            <RNView style={[styles.progBarFill, { width: `${progress}%` }]} />
          </RNView>
        </RNView>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Continue Learning</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  if (submitted) {
    return (
      <RNView style={styles.centered}>
        <RNView style={[styles.resultCircle, { backgroundColor: score >= 70 ? '#d1fae5' : '#fee2e2' }]}>
          <Award size={48} color={score >= 70 ? '#10b981' : '#ef4444'} />
        </RNView>
        <Text style={styles.resultTitle}>{score >= 70 ? 'Congratulations!' : 'Quiz Completed'}</Text>
        <Text style={styles.resultScore}>{score}%</Text>
        <Text style={styles.resultMsg}>
          {score >= 70 
            ? 'Excellent work! You have successfully passed the course assessment.' 
            : 'You need at least 70% to pass and earn a certificate. You can retake the quiz anytime.'}
        </Text>
        
        {score >= 70 && (
          <TouchableOpacity style={styles.certBtn} onPress={() => router.push(`/course/certificate/${id}`)}>
            <Text style={styles.certBtnText}>View Certificate</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/dashboard')}>
          <Text style={styles.backBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  const q = questions[currentIdx];
  const qProgress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <RNView style={styles.container}>
      <RNView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <RNView style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Final Assessment</Text>
          <Text style={styles.headerSub}>{course?.title}</Text>
        </RNView>
        <Shield size={20} color={TINT} />
      </RNView>

      <RNView style={styles.progLine}><RNView style={[styles.progFill, { width: `${qProgress}%` }]} /></RNView>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <RNView style={styles.qHeader}>
          <Text style={styles.qNum}>Question {currentIdx + 1} of {questions.length}</Text>
          <RNView style={styles.timerBadge}>
            <Clock size={12} color="#f59e0b" />
            <Text style={styles.timerText}>No Limit</Text>
          </RNView>
        </RNView>

        <Text style={styles.qText}>{q.text}</Text>

        <RNView style={styles.optionsBox}>
          {q.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.optRow, answers[currentIdx] === i && styles.optActive]}
              onPress={() => handleAnswer(i)}
            >
              <RNView style={[styles.radio, answers[currentIdx] === i && styles.radioActive]}>
                {answers[currentIdx] === i && <RNView style={styles.radioInner} />}
              </RNView>
              <Text style={[styles.optText, answers[currentIdx] === i && styles.optTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </RNView>

        <RNView style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft size={20} color={currentIdx === 0 ? '#9ca3af' : '#111827'} />
            <Text style={[styles.navBtnText, { color: currentIdx === 0 ? '#9ca3af' : '#111827' }]}>Prev</Text>
          </TouchableOpacity>

          {currentIdx < questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navBtnMain]}
              onPress={() => setCurrentIdx(i => i + 1)}
            >
              <Text style={styles.navBtnMainText}>Next</Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn]}
              onPress={handleSubmit}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Quiz</Text>
            </TouchableOpacity>
          )}
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  closeBtn: { padding: 4 },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6b7280' },
  progLine: { height: 4, backgroundColor: '#f3f4f6' },
  progFill: { height: '100%', backgroundColor: TINT },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  qNum: { fontSize: 13, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  timerText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  qText: { fontSize: 20, fontWeight: '900', color: '#111827', lineHeight: 28, marginBottom: 32 },
  optionsBox: { gap: 12, marginBottom: 40 },
  optRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', gap: 14 },
  optActive: { borderColor: TINT, backgroundColor: '#f5f7ff' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: TINT },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: TINT },
  optText: { fontSize: 15, fontWeight: '700', color: '#4b5563', flex: 1 },
  optTextActive: { color: TINT },
  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f3f4f6' },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 15, fontWeight: '800' },
  navBtnMain: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#111827', borderRadius: 14 },
  navBtnMainText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  submitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10b981', borderRadius: 14 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  errorTitle: { fontSize: 22, fontWeight: '900', marginTop: 12 },
  errorMsg: { textAlign: 'center', color: '#6b7280', lineHeight: 22 },
  progBox: { width: '100%', marginVertical: 20 },
  progLab: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  progBarBg: { height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden' },
  progBarFill: { height: '100%', backgroundColor: TINT },
  backBtn: { backgroundColor: TINT, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  backBtnText: { color: '#fff', fontWeight: '800' },
  resultCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: '900' },
  resultScore: { fontSize: 48, fontWeight: '900', color: TINT },
  resultMsg: { textAlign: 'center', color: '#6b7280', paddingHorizontal: 20 },
  certBtn: { backgroundColor: '#10b981', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, marginTop: 12 },
  certBtnText: { color: '#fff', fontWeight: '800' },
});
