import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View as RNView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import {
  ClipboardCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Calendar,
  Users,
  FileText,
} from 'lucide-react-native';

const TINT = '#6366f1';

interface PeerReview {
  _id: string;
  title: string;
  assignment?: { title?: string };
  isPublished: boolean;
  reviewsRequired: number;
  dueDate?: string;
  submissions?: any[];
}

export default function PeerReviewManagementScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'instructor' && user?.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchPeerReviews();
  }, [id]);

  const fetchPeerReviews = async () => {
    try {
      const { data } = await apiClient.get(`/api/peer-review/course/${id}`);
      setReviews(Array.isArray(data) ? data : data.peerReviews || data.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load peer reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPeerReviews();
  }, [id]);

  const togglePublish = async (review: PeerReview) => {
    setTogglingId(review._id);
    try {
      await apiClient.put(`/api/peer-review/${review._id}/publish`);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, isPublished: !r.isPublished } : r
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update publish status');
    } finally {
      setTogglingId(null);
    }
  };

  const viewSubmissions = (review: PeerReview) => {
    const count = review.submissions?.length ?? 0;
    Alert.alert(
      'Submissions',
      `"${review.title}" has ${count} submission${count !== 1 ? 's' : ''}.`,
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isDueSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < Date.now();
  };

  if (loading) {
    return (
      <RNView style={styles.centered}>
        <Stack.Screen options={{ title: 'Peer Reviews' }} />
        <ActivityIndicator size="large" color={TINT} />
      </RNView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />
      }
    >
      <Stack.Screen options={{ title: 'Peer Reviews' }} />

      {/* Header */}
      <RNView style={styles.header}>
        <RNView style={styles.headerIcon}>
          <ClipboardCheck size={28} color="#fff" />
        </RNView>
        <RNView style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Peer Reviews</Text>
          <Text style={styles.headerSubtitle}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} configured
          </Text>
        </RNView>
      </RNView>

      {/* Empty State */}
      {reviews.length === 0 ? (
        <RNView style={styles.emptyState}>
          <AlertCircle size={52} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No peer reviews created yet.</Text>
          <Text style={styles.emptyStateSubtext}>
            Create a peer review from the web dashboard to get started.
          </Text>
        </RNView>
      ) : (
        reviews.map((review, index) => {
          const overdue = isOverdue(review.dueDate);
          const dueSoon = isDueSoon(review.dueDate);

          return (
            <RNView key={review._id || index} style={styles.card}>
              {/* Card Header */}
              <RNView style={styles.cardHeader}>
                <RNView style={styles.cardTitleRow}>
                  <FileText size={18} color={TINT} />
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {review.title}
                  </Text>
                </RNView>
                <RNView
                  style={[
                    styles.statusBadge,
                    review.isPublished ? styles.statusPublished : styles.statusDraft,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      review.isPublished ? styles.statusTextPublished : styles.statusTextDraft,
                    ]}
                  >
                    {review.isPublished ? 'Published' : 'Draft'}
                  </Text>
                </RNView>
              </RNView>

              {/* Assignment */}
              {review.assignment?.title && (
                <RNView style={styles.metaRow}>
                  <ClipboardCheck size={14} color="#6b7280" />
                  <Text style={styles.metaLabel}>Assignment:</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {review.assignment.title}
                  </Text>
                </RNView>
              )}

              {/* Reviews Required */}
              <RNView style={styles.metaRow}>
                <Users size={14} color="#6b7280" />
                <Text style={styles.metaLabel}>Reviews Required:</Text>
                <Text style={styles.metaValue}>{review.reviewsRequired}</Text>
              </RNView>

              {/* Due Date */}
              <RNView style={styles.metaRow}>
                <Calendar size={14} color={overdue ? '#dc2626' : dueSoon ? '#d97706' : '#6b7280'} />
                <Text style={styles.metaLabel}>Due:</Text>
                <Text
                  style={[
                    styles.metaValue,
                    overdue && styles.overdueText,
                    dueSoon && !overdue && styles.dueSoonText,
                  ]}
                >
                  {formatDate(review.dueDate)}
                  {overdue ? ' (Overdue)' : dueSoon ? ' (Due Soon)' : ''}
                </Text>
              </RNView>

              {/* Divider */}
              <RNView style={styles.divider} />

              {/* Action Buttons */}
              <RNView style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    review.isPublished ? styles.unpublishBtn : styles.publishBtn,
                  ]}
                  onPress={() => togglePublish(review)}
                  disabled={togglingId === review._id}
                  activeOpacity={0.7}
                >
                  {togglingId === review._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : review.isPublished ? (
                    <ToggleRight size={16} color="#fff" />
                  ) : (
                    <ToggleLeft size={16} color="#fff" />
                  )}
                  <Text style={styles.actionBtnText}>
                    {review.isPublished ? 'Unpublish' : 'Publish'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.viewBtn]}
                  onPress={() => viewSubmissions(review)}
                  activeOpacity={0.7}
                >
                  <Eye size={16} color={TINT} />
                  <Text style={[styles.actionBtnText, styles.viewBtnText]}>Submissions</Text>
                </TouchableOpacity>
              </RNView>
            </RNView>
          );
        })
      )}

      <RNView style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 17,
    color: '#374151',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 6,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },

  /* Status Badge */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPublished: {
    backgroundColor: '#dcfce7',
  },
  statusDraft: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextPublished: {
    color: '#166534',
  },
  statusTextDraft: {
    color: '#92400e',
  },

  /* Meta Rows */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  overdueText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  dueSoonText: {
    color: '#d97706',
    fontWeight: '700',
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 14,
  },

  /* Action Buttons */
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  publishBtn: {
    backgroundColor: TINT,
  },
  unpublishBtn: {
    backgroundColor: '#ef4444',
  },
  viewBtn: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  viewBtnText: {
    color: TINT,
  },
});
