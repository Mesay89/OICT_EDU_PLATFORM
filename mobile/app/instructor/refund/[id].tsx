import React, { useState, useEffect } from 'react';
import { StyleSheet, View as RNView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { RotateCcw, User, Mail, BookOpen, DollarSign, MessageSquare, Calendar, ShieldAlert, Inbox } from 'lucide-react-native';

const TINT = '#6366f1';

interface RefundRequest {
  _id: string;
  amount: number;
  reason: string;
  status: string;
  refundStatus: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  course?: { _id?: string; title?: string };
}

export default function InstructorRefundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'instructor' && user?.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchRefunds();
  }, [id]);

  const fetchRefunds = async () => {
    try {
      const { data } = await apiClient.get('/admin/refunds');
      const courseRefunds = (data || []).filter(
        (r: RefundRequest) => r.course?._id === id
      );
      setRefunds(courseRefunds);
    } catch (err: any) {
      console.error('Failed to load refund requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRefunds();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'approved':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const renderRefundCard = ({ item }: { item: RefundRequest }) => {
    const statusLabel = item.refundStatus || item.status || 'pending';
    const statusColors = getStatusColor(statusLabel);

    return (
      <RNView style={styles.card}>
        {/* Status Badge */}
        <RNView style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
          </Text>
        </RNView>

        {/* Student Info */}
        <RNView style={styles.row}>
          <RNView style={styles.iconWrap}>
            <User size={16} color={TINT} />
          </RNView>
          <RNView style={styles.rowContent}>
            <Text style={styles.label}>Student</Text>
            <Text style={styles.value}>{item.user?.name || 'Unknown Student'}</Text>
          </RNView>
        </RNView>

        <RNView style={styles.row}>
          <RNView style={styles.iconWrap}>
            <Mail size={16} color={TINT} />
          </RNView>
          <RNView style={styles.rowContent}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{item.user?.email || 'No email'}</Text>
          </RNView>
        </RNView>

        {/* Course */}
        <RNView style={styles.row}>
          <RNView style={styles.iconWrap}>
            <BookOpen size={16} color={TINT} />
          </RNView>
          <RNView style={styles.rowContent}>
            <Text style={styles.label}>Course</Text>
            <Text style={styles.value} numberOfLines={1}>{item.course?.title || 'N/A'}</Text>
          </RNView>
        </RNView>

        {/* Amount */}
        <RNView style={styles.row}>
          <RNView style={styles.iconWrap}>
            <DollarSign size={16} color="#10b981" />
          </RNView>
          <RNView style={styles.rowContent}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amountValue}>${item.amount?.toFixed(2) || '0.00'}</Text>
          </RNView>
        </RNView>

        {/* Reason */}
        <RNView style={styles.row}>
          <RNView style={[styles.iconWrap, { alignSelf: 'flex-start', marginTop: 2 }]}>
            <MessageSquare size={16} color={TINT} />
          </RNView>
          <RNView style={styles.rowContent}>
            <Text style={styles.label}>Reason</Text>
            <Text style={styles.reasonText}>{item.reason || 'No reason provided'}</Text>
          </RNView>
        </RNView>

        {/* Date */}
        <RNView style={styles.row}>
          <RNView style={styles.iconWrap}>
            <Calendar size={16} color="#6b7280" />
          </RNView>
          <RNView style={styles.rowContent}>
            <Text style={styles.label}>Requested</Text>
            <Text style={styles.value}>{item.createdAt ? formatDate(item.createdAt) : 'N/A'}</Text>
          </RNView>
        </RNView>
      </RNView>
    );
  };

  if (loading) {
    return (
      <RNView style={styles.centered}>
        <Stack.Screen options={{ title: 'Refund Requests' }} />
        <ActivityIndicator size="large" color={TINT} />
      </RNView>
    );
  }

  return (
    <RNView style={styles.container}>
      <Stack.Screen options={{ title: 'Refund Requests' }} />

      {/* Admin notice banner */}
      <RNView style={styles.noticeBanner}>
        <ShieldAlert size={18} color="#92400e" />
        <Text style={styles.noticeText}>
          Refund requests are reviewed by administrators
        </Text>
      </RNView>

      <FlatList
        data={refunds}
        keyExtractor={(item) => item._id}
        renderItem={renderRefundCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} colors={[TINT]} />
        }
        ListHeaderComponent={
          <RNView style={styles.headerRow}>
            <RotateCcw size={24} color={TINT} />
            <Text style={styles.headerTitle}>Refund Requests ({refunds.length})</Text>
          </RNView>
        }
        ListEmptyComponent={
          <RNView style={styles.emptyState}>
            <Inbox size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No refund requests</Text>
            <Text style={styles.emptySubtitle}>No refund requests for this course</Text>
          </RNView>
        }
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 8,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
});
