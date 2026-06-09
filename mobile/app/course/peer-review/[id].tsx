import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ChevronLeft, Users, CheckCircle, Send, 
  FileText, Star, MessageSquare, AlertCircle 
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const TINT = '#6366f1';

interface Task {
  _id: string;
  title: string;
  reviewsRequired: number;
  rubric: { criterion: string; maxPoints: number }[];
}

interface Peer {
  revieweeId: string;
  revieweeName: string;
}

interface Feedback {
  _id: string;
  totalScore: number;
  overallComment: string;
  rubricScores: { criterion: string; score: number }[];
}

export default function PeerReviewScreen() {
  const { id } = useLocalSearchParams(); // Course ID
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [activePeer, setActivePeer] = useState<Peer | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [id]);

  const fetchTasks = async () => {
    try {
      const { data } = await apiClient.get(`/peer-review/my-tasks/${id}`);
      setTasks(data);
    } catch (err: any) {
      console.log('Peer review fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTaskPeers = async (task: Task) => {
    setLoading(true);
    setSelectedTask(task);
    try {
      const [peersRes, fbRes] = await Promise.all([
        apiClient.get(`/peer-review/${task._id}/peers-to-review`),
        apiClient.get(`/peer-review/${task._id}/my-feedback`)
      ]);
      setPeers(peersRes.data);
      setMyFeedback(fbRes.data);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return Alert.alert('Error', 'Please provide a comment.');
    
    setSubmitting(true);
    try {
      const rubricScores = selectedTask.rubric.map(r => ({
        criterion: r.criterion,
        score: scores[r.criterion] || 0
      }));

      await apiClient.post(`/peer-review/${selectedTask._id}/submit`, {
        revieweeId: activePeer.revieweeId,
        rubricScores,
        overallComment: comment
      });

      Alert.alert('Success', 'Review submitted successfully!');
      setActivePeer(null);
      setComment('');
      setScores({});
      loadTaskPeers(selectedTask); // Reload
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) return <RNView style={styles.centered}><ActivityIndicator color={TINT} /></RNView>;

  return (
    <RNView style={styles.container}>
      <RNView style={styles.header}>
        <TouchableOpacity onPress={() => selectedTask ? setSelectedTask(null) : router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedTask ? 'Submit Review' : 'Peer Review'}</Text>
        <RNView style={{ width: 24 }} />
      </RNView>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasks(); }} tintColor={TINT} />}
      >
        {!selectedTask ? (
          <RNView style={styles.section}>
            <Text style={styles.secTitle}>Available Tasks</Text>
            {tasks.length === 0 ? (
              <RNView style={styles.empty}>
                <FileText size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No peer review tasks assigned yet.</Text>
              </RNView>
            ) : (
              tasks.map(task => (
                <TouchableOpacity key={task._id} style={styles.taskCard} onPress={() => loadTaskPeers(task)}>
                  <RNView style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskSub}>{task.reviewsRequired} reviews required</Text>
                  </RNView>
                  <ChevronLeft size={20} color="#d1d5db" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              ))
            )}
          </RNView>
        ) : (
          <RNView style={styles.section}>
            {!activePeer ? (
              <>
                <Text style={styles.secTitle}>Select a Peer to Review</Text>
                {peers.length === 0 ? (
                  <RNView style={styles.empty}>
                    <CheckCircle size={48} color="#10b981" />
                    <Text style={styles.emptyText}>You've completed all reviews for this task! 🎉</Text>
                  </RNView>
                ) : (
                  peers.map(peer => (
                    <TouchableOpacity key={peer.revieweeId} style={styles.peerCard} onPress={() => setActivePeer(peer)}>
                      <Users size={20} color={TINT} />
                      <Text style={styles.peerName}>Review: {peer.revieweeName}</Text>
                      <ChevronLeft size={16} color="#d1d5db" style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                  ))
                )}

                {myFeedback.length > 0 && (
                  <RNView style={{ marginTop: 32 }}>
                    <Text style={styles.secTitle}>Feedback I Received</Text>
                    {myFeedback.map(fb => (
                      <RNView key={fb._id} style={styles.fbCard}>
                        <RNView style={styles.fbHeader}>
                          <Text style={styles.fbScore}>{fb.totalScore}</Text>
                          <Text style={styles.fbScoreLabel}>Total Score</Text>
                        </RNView>
                        <Text style={styles.fbComment}>"{fb.overallComment || 'No comments.'}"</Text>
                        <RNView style={styles.fbRubric}>
                          {fb.rubricScores.map((r, i) => (
                            <RNView key={i} style={styles.fbRubricItem}>
                              <Text style={styles.fbRubricLabel}>{r.criterion}</Text>
                              <Text style={styles.fbRubricVal}>{r.score}</Text>
                            </RNView>
                          ))}
                        </RNView>
                      </RNView>
                    ))}
                  </RNView>
                )}
              </>
            ) : (
              <RNView style={styles.formBox}>
                <Text style={styles.formTitle}>Reviewing {activePeer.revieweeName}</Text>
                <Text style={styles.formSub}>Evaluate the submission based on the rubric below.</Text>
                
                <RNView style={styles.rubricBox}>
                  {selectedTask.rubric.map(r => (
                    <RNView key={r.criterion} style={styles.rubricItem}>
                      <Text style={styles.rubricLabel}>{r.criterion} (Max: {r.maxPoints})</Text>
                      <TextInput
                        style={styles.scoreInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={scores[r.criterion]?.toString() || ''}
                        onChangeText={(val) => setScores({...scores, [r.criterion]: parseInt(val) || 0})}
                      />
                    </RNView>
                  ))}
                </RNView>

                <Text style={styles.inputLabel}>Constructive Feedback</Text>
                <TextInput
                  style={styles.commentInput}
                  multiline
                  placeholder="Tell your peer what they did well and how to improve..."
                  value={comment}
                  onChangeText={setComment}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Send size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit Evaluation</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActivePeer(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </RNView>
            )}
          </RNView>
        )}
        <RNView style={{ height: 40 }} />
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  backBtn: { padding: 4 },
  section: { padding: 20 },
  secTitle: { fontSize: 16, fontWeight: '900', color: '#374151', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: '#9ca3af', fontWeight: '600', textAlign: 'center' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  taskTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  taskSub: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  peerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, gap: 12 },
  peerName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#374151' },
  formBox: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  formTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 4 },
  formSub: { fontSize: 13, color: '#6b7280', marginBottom: 24 },
  rubricBox: { marginBottom: 24, gap: 16 },
  rubricItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12 },
  rubricLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#4b5563' },
  scoreInput: { width: 60, height: 40, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', textAlign: 'center', fontWeight: '800', color: TINT },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#374151', marginBottom: 8 },
  commentInput: { backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#d1d5db', padding: 16, height: 120, textAlignVertical: 'top', fontSize: 14, color: '#111827', marginBottom: 24 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: TINT, paddingVertical: 16, borderRadius: 16, shadowColor: TINT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#6b7280', fontWeight: '700' },
  fbCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#d1fae5' },
  fbHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 12 },
  fbScore: { fontSize: 24, fontWeight: '900', color: '#10b981' },
  fbScoreLabel: { fontSize: 10, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' },
  fbComment: { fontSize: 14, fontStyle: 'italic', color: '#4b5563', lineHeight: 20, marginBottom: 16 },
  fbRubric: { gap: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  fbRubricItem: { flexDirection: 'row', justifyContent: 'space-between' },
  fbRubricLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  fbRubricVal: { fontSize: 12, fontWeight: '900', color: '#10b981' },
});
