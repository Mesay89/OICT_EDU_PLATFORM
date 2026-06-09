import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View as RNView, StyleSheet } from 'react-native';
import { Home, BookOpen, MessageSquare, Search, Settings, Bell, GraduationCap } from 'lucide-react-native';
import { Text } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Menu } from 'lucide-react-native';
import GlobalMenu from '@/components/GlobalMenu';
import apiClient from '@/api/client';
import { useEffect, useState } from 'react';

const TINT = '#6366f1';
const INACTIVE = '#9ca3af';

export default function TabLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const { data } = await apiClient.get('/notifications');
          const unread = Array.isArray(data) ? data.filter((n: any) => !n.isRead).length : 0;
          setUnreadCount(unread);
        } catch {}
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: TINT,
          tabBarInactiveTintColor: INACTIVE,
          tabBarStyle: {
            height: 66,
            paddingBottom: 10,
            paddingTop: 6,
            backgroundColor: isDarkMode ? '#111827' : '#fff',
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#1f2937' : '#f3f4f6',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
          headerStyle: { 
            backgroundColor: isDarkMode ? '#111827' : '#fff', 
            shadowColor: 'transparent', 
            elevation: 0, 
            borderBottomWidth: 1, 
            borderBottomColor: isDarkMode ? '#1f2937' : '#f3f4f6' 
          },
          headerTitleStyle: { fontWeight: '900', fontSize: 18, color: isDarkMode ? '#fff' : '#111827' },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 16, padding: 4 }} onPress={() => router.push('/settings')}>
              <Settings size={22} color={isDarkMode ? '#fff' : '#374151'} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <RNView style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 12 }}>
              {!user ? (
                <>
                  <TouchableOpacity onPress={() => router.push('/login')}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: TINT }}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => router.push('/register')}
                    style={{ backgroundColor: TINT, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>Join</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => router.push('/notifications')} style={{ padding: 4 }}>
                  <Bell size={22} color={isDarkMode ? '#fff' : '#374151'} />
                  {unreadCount > 0 && (
                    <RNView style={{ 
                      position: 'absolute', top: 0, right: 0, 
                      backgroundColor: '#ef4444', borderRadius: 6, 
                      minWidth: 12, height: 12, justifyContent: 'center', alignItems: 'center',
                      borderWidth: 1.5, borderColor: isDarkMode ? '#111827' : '#fff'
                    }}>
                      <Text style={{ color: '#fff', fontSize: 7, fontWeight: '900' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </RNView>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Menu size={24} color={isDarkMode ? '#fff' : '#374151'} />
              </TouchableOpacity>
            </RNView>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: user ? `Hi, ${user.name?.split(' ')[0]}` : 'OICT TUTOR',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="catalog"
          options={{
            title: 'Courses',
            headerTitle: 'Explore Courses',
            tabBarIcon: ({ color }) => <Search size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'My Learning',
            headerTitle: 'My Dashboard',
            tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
            href: user?.role === 'instructor' ? null : '/dashboard',
          }}
          listeners={{
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
                router.push('/login');
              }
            },
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Community',
            headerTitle: 'Chat Rooms',
            tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
                router.push('/login');
              }
            },
          }}
        />
        <Tabs.Screen name="settings" options={{ href: null, headerTitle: 'Settings' }} />
        <Tabs.Screen name="admin" options={{ href: null, headerTitle: 'Admin Panel' }} />
        <Tabs.Screen 
          name="instructor" 
          options={{ 
            href: user?.role === 'instructor' ? '/instructor' : null, 
            headerTitle: 'Instructor Panel',
            title: 'Instructor',
            tabBarIcon: ({ color }) => <GraduationCap size={24} color={color} />
          }} 
        />
      </Tabs>
      <GlobalMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
  
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#ef4444', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  upgradeBadge: { backgroundColor: TINT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  upgradeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
