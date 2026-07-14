import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View as RNView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, CheckCircle, XCircle, AlertTriangle, User, Clock, Award
} from 'lucide-react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

export default function QuizResultsScreen() {
  const { quizId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const card = isDarkMode ? '#1f2937' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';

  useEffect(() => {
    if (quizId) fetchAttempts();
  }, [quizId]);

  const fetchAttempts = async () => {
    try {
      const { data } = await apiClient.get(`/quiz/${quizId}/attempts`);
      setAttempts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={TINT} />
    </RNView>
  );

  if (error) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <XCircle size={48} color="#ef4444" />
      <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </RNView>
  );

  const passCount = attempts.filter(a => a.passed).length;
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
    : 0;

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <RNView style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Student Attempts</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>Quiz results & integrity flags</Text>
        </RNView>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Stats */}
        <RNView style={styles.statsRow}>
          <RNView style={[styles.statCard, { backgroundColor: card }]}>
            <User size={20} color={TINT} />
            <Text style={[styles.statVal, { color: textColor }]}>{attempts.length}</Text>
            <Text style={[styles.statLabel, { color: subColor }]}>Total Attempts</Text>
          </RNView>
          <RNView style={[styles.statCard, { backgroundColor: card }]}>
            <CheckCircle size={20} color="#10b981" />
            <Text style={[styles.statVal, { color: textColor }]}>{passCount}</Text>
            <Text style={[styles.statLabel, { color: subColor }]}>Passed</Text>
          </RNView>
          <RNView style={[styles.statCard, { backgroundColor: card }]}>
            <Award size={20} color="#f59e0b" />
            <Text style={[styles.statVal, { color: textColor }]}>{avgScore}%</Text>
            <Text style={[styles.statLabel, { color: subColor }]}>Avg Score</Text>
          </RNView>
        </RNView>

        {/* Attempts list */}
        {attempts.length === 0 ? (
          <RNView style={[styles.emptyBox, { backgroundColor: card }]}>
            <User size={48} color="#d1d5db" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Attempts Yet</Text>
            <Text style={[styles.emptySub, { color: subColor }]}>
              Students haven't taken this quiz yet.
            </Text>
          </RNView>
        ) : (
          attempts.map((attempt) => (
            <RNView key={attempt._id} style={[styles.attemptCard, { backgroundColor: card }]}>
              {/* Student */}
              <RNView style={styles.attemptRow}>
                <RNView style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(attempt.student?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </RNView>
                <RNView style={{ flex: 1 }}>
                  <Text style={[styles.studentName, { color: textColor }]}>
                    {attempt.student?.name || 'Unknown Student'}
                  </Text>
                  <Text style={[styles.studentEmail, { color: subColor }]}>
                    {attempt.student?.email}
                  </Text>
                </RNView>
                {/* Score */}
                <Text style={[styles.score, { color: attempt.passed ? '#10b981' : '#ef4444' }]}>
                  {attempt.score}%
                </Text>
              </RNView>

              {/* Status badges */}
              <RNView style={styles.badgesRow}>
                <RNView style={[styles.badge, attempt.passed ? styles.badgePass : styles.badgeFail]}>
                  {attempt.passed
                    ? <CheckCircle size={12} color="#10b981" />
                    : <XCircle size={12} color="#ef4444" />}
                  <Text style={[styles.badgeText, { color: attempt.passed ? '#10b981' : '#ef4444' }]}>
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </Text>
                </RNView>

                {attempt.flagged && (
                  <RNView style={styles.badgeFlagged}>
                    <AlertTriangle size={12} color="#f59e0b" />
                    <Text style={styles.badgeFlaggedText}>Flagged</Text>
                  </RNView>
                )}
              </RNView>

              {attempt.flagged && attempt.flagReason && (
                <Text style={styles.flagReason}>⚠️ {attempt.flagReason}</Text>
              )}

              {/* Date */}
              {attempt.submittedAt && (
                <RNView style={styles.dateRow}>
                  <Clock size={12} color={subColor} />
                  <Text style={[styles.dateText, { color: subColor }]}>
                    {new Date(attempt.submittedAt).toLocaleDateString()} at{' '}
                    {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </RNView>
              )}
            </RNView>
          ))
        )}
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 16, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  emptyBox: {
    alignItems: 'center', padding: 40, borderRadius: 20, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2
  },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  attemptCard: {
    padding: 16, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  attemptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontSize: 16, fontWeight: '900', color: TINT },
  studentName: { fontSize: 15, fontWeight: '800' },
  studentEmail: { fontSize: 12, fontWeight: '600' },
  score: { fontSize: 24, fontWeight: '900' },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20
  },
  badgePass: { backgroundColor: '#d1fae5' },
  badgeFail: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '800' },
  badgeFlagged: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20
  },
  badgeFlaggedText: { fontSize: 12, fontWeight: '800', color: '#d97706' },
  flagReason: { fontSize: 12, color: '#b45309', marginBottom: 8, fontStyle: 'italic' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, fontWeight: '600' },
  errorText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  backBtn: { backgroundColor: TINT, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '800' },
});
