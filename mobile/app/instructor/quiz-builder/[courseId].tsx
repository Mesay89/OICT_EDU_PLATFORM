import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View,
  ActivityIndicator, Alert, TextInput, Switch, Modal
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Plus, Trash2, Save, Settings,
  BookOpen, Shield, BarChart2, CheckCircle, X
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';

interface Question {
  _id: string;
  type: string;
  text: string;
  options: string[];
  correct: number;
  tags: string[];
  points: number;
  explanation: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: any[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimitMinutes: number;
  maxAttempts: number;
  passingScore: number;
  isPublished: boolean;
}

const TINT = '#6366f1';

export default function QuizBuilderScreen() {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<'bank' | 'quizzes'>('bank');
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [qForm, setQForm] = useState({
    type: 'mcq', text: '', options: ['', '', '', ''], correct: 0,
    tags: '', points: 1, explanation: ''
  });
  const [editingQId, setEditingQId] = useState<string | null>(null);

  const [quizForm, setQuizForm] = useState<{
    title: string;
    description: string;
    questions: string[];
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    timeLimitMinutes: number;
    maxAttempts: number;
    passingScore: number;
  }>({
    title: '', description: '', questions: [],
    shuffleQuestions: true, shuffleOptions: true, timeLimitMinutes: 0,
    maxAttempts: 1, passingScore: 70
  });
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, quizRes] = await Promise.all([
        apiClient.get(`/quiz/questions/${courseId}`),
        apiClient.get(`/quiz/course/${courseId}`)
      ]);
      setBankQuestions(qRes.data);
      setQuizzes(quizRes.data);
    } catch (err: any) {
      console.error('Failed to load quiz data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!qForm.text) return Alert.alert('Error', 'Question text is required');
    setSaving(true);
    const payload = {
      courseId,
      ...qForm,
      options: qForm.type === 'mcq' ? qForm.options : ['True', 'False'],
      tags: qForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (editingQId) {
        const { data } = await apiClient.put<Question>(`/quiz/questions/${editingQId}`, payload);
        setBankQuestions(prev => prev.map(q => q._id === editingQId ? data : q));
      } else {
        const { data } = await apiClient.post<Question>(`/quiz/questions`, payload);
        setBankQuestions(prev => [data, ...prev]);
      }
      setQForm({ type: 'mcq', text: '', options: ['', '', '', ''], correct: 0, tags: '', points: 1, explanation: '' });
      setEditingQId(null);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    Alert.alert('Delete', 'Delete this question from bank?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/quiz/questions/delete/${id}`);
          setBankQuestions(prev => prev.filter(q => q._id !== id));
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title) return Alert.alert('Error', 'Quiz title is required');
    if (quizForm.questions.length === 0) return Alert.alert('Error', 'Select at least one question');
    
    setSaving(true);
    try {
      if (editingQuizId) {
        const { data } = await apiClient.put<Quiz>(`/quiz/${editingQuizId}`, { ...quizForm, courseId });
        setQuizzes(prev => prev.map(q => q._id === editingQuizId ? data : q));
      } else {
        const { data } = await apiClient.post<Quiz>(`/quiz`, { ...quizForm, courseId });
        setQuizzes(prev => [data, ...prev]);
      }
      setShowQuizModal(false);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={TINT} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Builder</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'bank', icon: BookOpen, label: 'Question Bank' },
          { id: 'quizzes', icon: Shield, label: 'Quizzes' }
        ].map(t => (
          <TouchableOpacity 
            key={t.id} 
            style={[styles.tab, tab === t.id && styles.activeTab]}
            onPress={() => setTab(t.id)}
          >
            <t.icon size={18} color={tab === t.id ? TINT : '#9ca3af'} />
            <Text style={[styles.tabText, tab === t.id && styles.activeTabText]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tab === 'bank' && (
          <View>
            {/* Add/Edit Question */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{editingQId ? 'Edit Question' : 'Add Question'}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Question Text</Text>
                <TextInput 
                  style={styles.textInput} 
                  multiline 
                  value={qForm.text}
                  onChangeText={t => setQForm({...qForm, text: t})}
                  placeholder="Enter question..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Options</Text>
                {qForm.options.map((opt, i) => (
                  <View key={i} style={styles.optionRow}>
                    <TouchableOpacity 
                      onPress={() => setQForm({...qForm, correct: i})}
                      style={[styles.radio, qForm.correct === i && styles.radioActive]}
                    />
                    <TextInput 
                      style={styles.optInput} 
                      value={opt}
                      onChangeText={t => {
                        const newOpts = [...qForm.options];
                        newOpts[i] = t;
                        setQForm({...qForm, options: newOpts});
                      }}
                      placeholder={`Option ${i+1}`}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveQuestion}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingQId ? 'Update' : 'Add to Bank'}</Text>}
              </TouchableOpacity>
              {editingQId && (
                <TouchableOpacity onPress={() => { setEditingQId(null); setQForm({type:'mcq', text:'', options:['','','',''], correct:0, tags:'', points:1, explanation:''}) }}>
                  <Text style={styles.cancelText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <Text style={styles.sectionTitle}>Saved Questions ({bankQuestions.length})</Text>
            {bankQuestions.map(q => (
              <View key={q._id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText} numberOfLines={2}>{q.text}</Text>
                  <Text style={styles.itemSub}>{q.points} pts • {q.type}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => {
                    setEditingQId(q._id);
                    setQForm({
                      type: q.type, text: q.text, 
                      options: q.options || ['', '', '', ''], 
                      correct: q.correct || 0,
                      tags: q.tags?.join(', ') || '',
                      points: q.points || 1,
                      explanation: q.explanation || ''
                    });
                  }}>
                    <Save size={18} color={TINT} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteQuestion(q._id)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'quizzes' && (
          <View>
            <TouchableOpacity style={styles.addBtn} onPress={() => {
              setEditingQuizId(null);
              setQuizForm({title:'', description:'', questions:[], shuffleQuestions:true, shuffleOptions:true, timeLimitMinutes:0, maxAttempts:1, passingScore:70});
              setShowQuizModal(true);
            }}>
              <Plus size={20} color="#fff" />
              <Text style={styles.addBtnText}>Create New Quiz</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Course Quizzes</Text>
            {quizzes.length === 0 && <Text style={styles.emptyText}>No quizzes created yet.</Text>}
            {quizzes.map(quiz => (
              <View key={quiz._id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{quiz.title}</Text>
                  <Text style={styles.itemSub}>{quiz.questions?.length || 0} Questions • {quiz.isPublished ? 'Published' : 'Draft'}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => {
                    setEditingQuizId(quiz._id);
                    setQuizForm({
                      title: quiz.title,
                      description: quiz.description || '',
                      questions: quiz.questions?.map(q => q._id || q) || [],
                      shuffleQuestions: quiz.shuffleQuestions,
                      shuffleOptions: quiz.shuffleOptions,
                      timeLimitMinutes: quiz.timeLimitMinutes,
                      maxAttempts: quiz.maxAttempts,
                      passingScore: quiz.passingScore
                    });
                    setShowQuizModal(true);
                  }}>
                    <Settings size={18} color={TINT} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => {
                    try {
                      await apiClient.delete(`/quiz/${quiz._id}`);
                      setQuizzes(prev => prev.filter(q => q._id !== quiz._id));
                    } catch { Alert.alert('Error', 'Failed to delete'); }
                  }}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quiz Modal */}
      <Modal visible={showQuizModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingQuizId ? 'Edit Quiz' : 'New Quiz'}</Text>
              <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quiz Title</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={quizForm.title}
                  onChangeText={t => setQuizForm({...quizForm, title: t})}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Time Limit (min)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    keyboardType="numeric"
                    value={String(quizForm.timeLimitMinutes)}
                    onChangeText={t => setQuizForm({...quizForm, timeLimitMinutes: Number(t)})}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Passing Score (%)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    keyboardType="numeric"
                    value={String(quizForm.passingScore)}
                    onChangeText={t => setQuizForm({...quizForm, passingScore: Number(t)})}
                  />
                </View>
              </View>

              <Text style={styles.label}>Select Questions</Text>
              <View style={styles.qPicker}>
                {bankQuestions.map(q => (
                  <TouchableOpacity 
                    key={q._id} 
                    style={[styles.qPickItem, quizForm.questions.includes(q._id) && styles.qPickActive]}
                    onPress={() => {
                      const newQs = quizForm.questions.includes(q._id)
                        ? quizForm.questions.filter(id => id !== q._id)
                        : [...quizForm.questions, q._id];
                      setQuizForm({...quizForm, questions: newQs});
                    }}
                  >
                    <View style={[styles.check, quizForm.questions.includes(q._id) && styles.checkActive]} />
                    <Text style={styles.qPickText}>{q.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQuiz} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Quiz</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: TINT },
  tabText: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  activeTabText: { color: TINT },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 },
  textInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db' },
  radioActive: { borderColor: TINT, backgroundColor: TINT },
  optInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  saveBtn: { backgroundColor: TINT, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelText: { color: '#ef4444', textAlign: 'center', fontWeight: '700', marginTop: 12, fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10 },
  itemText: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 2 },
  itemSub: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, marginBottom: 24 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#9ca3af', paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 4 },
  row: { flexDirection: 'row' },
  qPicker: { gap: 8, marginBottom: 20 },
  qPickItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  qPickActive: { borderColor: TINT, backgroundColor: '#f5f7ff' },
  qPickText: { fontSize: 14, fontWeight: '600', color: '#4b5563', flex: 1 },
  check: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#d1d5db' },
  checkActive: { backgroundColor: TINT, borderColor: TINT },
});
