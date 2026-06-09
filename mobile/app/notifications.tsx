import React, { useEffect, useState } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell, BellOff, CheckCircle, ClipboardList, Info, X,
  User as UserIcon, ChevronLeft, CheckCheck
} from 'lucide-react-native';
import { Text } from '@/components/Themed';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

type NotificationType =
  | 'assignment_graded'
  | 'course_approved'
  | 'assignment_submitted'
  | 'course_approval_requested'
  | 'refund_requested'
  | 'course_rejected'
  | 'instructor_pending'
  | 'assignment_released'
  | 'general';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
  relatedId?: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const fetchNotifications = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  const handleNotifPress = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await apiClient.put(`/notifications/${notif._id}/read`);
        setNotifications(notifications.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark read');
      }
    }

    if (notif.link) {
      const route = notif.link.startsWith('/') ? notif.link : `/${notif.link}`;
      router.push(route as any);
    } else if (notif.relatedId) {
       if (notif.type.includes('course')) router.push(`/(tabs)/catalog` as any);
       if (notif.type.includes('message')) router.push(`/(tabs)/chat` as any);
    }
  };

  const getIcon = (type: NotificationType) => {
    const size = 20;
    switch (type) {
      case 'assignment_graded':
      case 'course_approved':
        return { icon: <CheckCircle size={size} color="#059669" />, bg: '#ecfdf5' };
      case 'assignment_submitted':
      case 'course_approval_requested':
        return { icon: <ClipboardList size={size} color="#d97706" />, bg: '#fffbeb' };
      case 'refund_requested':
      case 'course_rejected':
        return { icon: <X size={size} color="#dc2626" />, bg: '#fef2f2' };
      case 'instructor_pending':
        return { icon: <UserIcon size={size} color="#7c3aed" />, bg: '#f5f3ff' };
      default:
        return { icon: <Info size={size} color="#4f46e5" />, bg: '#eef2ff' };
    }
  };

  if (!user) {
    return (
      <RNView style={[styles.centered, { backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }]}>
        <Bell size={64} color="#d1d5db" />
        <Text style={[styles.emptyTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>Sign In Required</Text>
        <Text style={styles.emptySubtitle}>Please sign in to view your notifications.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>
      </RNView>
    );
  }

  if (loading && !refreshing) {
    return (
      <RNView style={[styles.centered, { backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }]}>
      <RNView style={[styles.header, { 
        backgroundColor: isDarkMode ? '#18181b' : '#fff',
        borderBottomColor: isDarkMode ? '#27272a' : '#f1f5f9'
      }]}>
        <RNView style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={isDarkMode ? '#fff' : '#111827'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>Alerts</Text>
        </RNView>
        
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.readAllBtn}>
            <CheckCheck size={18} color="#6366f1" />
            <Text style={styles.readAllText}>Read All</Text>
          </TouchableOpacity>
        )}
      </RNView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length === 0 ? (
          <RNView style={styles.emptyState}>
            <RNView style={[styles.emptyIconBox, { backgroundColor: isDarkMode ? '#18181b' : '#fff' }]}>
              <BellOff size={48} color="#94a3b8" />
            </RNView>
            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>All quiet for now!</Text>
            <Text style={styles.emptySubtitle}>We'll notify you when something important happens.</Text>
          </RNView>
        ) : (
          notifications.map((notif) => {
            const { icon, bg } = getIcon(notif.type);
            return (
              <TouchableOpacity
                key={notif._id}
                onPress={() => handleNotifPress(notif)}
                style={[
                  styles.notifItem,
                  { 
                    backgroundColor: isDarkMode ? '#18181b' : '#fff',
                    borderColor: isDarkMode ? '#27272a' : '#f1f5f9'
                  },
                  !notif.isRead && styles.unreadItem
                ]}
              >
                <RNView style={[styles.iconContainer, { backgroundColor: bg }]}>
                  {icon}
                </RNView>
                
                <RNView style={styles.notifContent}>
                  <RNView style={styles.notifHeader}>
                    <Text style={[
                      styles.notifTitle,
                      { color: isDarkMode ? '#f8fafc' : '#111827' },
                      !notif.isRead && styles.unreadTitle
                    ]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    {!notif.isRead && <RNView style={styles.unreadDot} />}
                  </RNView>
                  
                  <Text style={[styles.notifMessage, { color: isDarkMode ? '#94a3b8' : '#64748b' }]} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  
                  <Text style={styles.notifTime}>
                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </RNView>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: {
    height: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  readAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  readAllText: { fontSize: 12, fontWeight: '800', color: '#6366f1' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  unreadTitle: { fontWeight: '900' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1', marginLeft: 8 },
  notifMessage: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  notifTime: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 100, height: 100, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  loginBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 24 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
