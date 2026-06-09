import React, { useState } from 'react';
import {
  StyleSheet, Modal, TouchableOpacity, View, ScrollView,
  SafeAreaView, Dimensions, Platform, Alert
} from 'react-native';
import { Text } from './Themed';
import {
  X, Home, BookOpen, User, MessageSquare, Bell,
  Settings, LogOut, Globe, DollarSign, Clock,
  Shield, Share2, Info, ChevronRight, GraduationCap,
  Sun, Moon, Star, Zap, Mail
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/client';
import { useCurrency } from '@/context/CurrencyContext';
import { useTimezone } from '@/context/TimezoneContext';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface GlobalMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function GlobalMenu({ visible, onClose }: GlobalMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { timezone, setTimezone } = useTimezone();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    if (visible && user) {
      const fetchUnread = async () => {
        try {
          const { data } = await apiClient.get('/notifications');
          const count = Array.isArray(data) ? data.filter((n: any) => !n.isRead).length : 0;
          setUnreadCount(count);
        } catch {}
      };
      fetchUnread();
    }
  }, [visible, user]);

  const handleLogout = async () => {
    try {
      // Direct logout for better reliability across platforms
      onClose();
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      onClose();
      router.replace('/');
    }
  };

  const navigateTo = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 100);
  };

  const menuItems = [
    { icon: Home, label: t('nav.home') || 'Home', path: '/' },
    { icon: BookOpen, label: t('nav.courses') || 'Courses', path: '/(tabs)/catalog' },
    { icon: Info, label: t('nav.about') || 'About Us', path: '/about' },
    { icon: Mail, label: 'Contact Us', path: '/contact' },
    { icon: Zap, label: 'Pricing & Plans', path: '/pricing' },
  ];

  if (user) {
    menuItems.push(
      { icon: MessageSquare, label: t('nav.messages') || 'Messages', path: '/chat' },
      { icon: Share2, label: t('nav.affiliate') || 'Affiliate', path: '/affiliate' },
      { 
        icon: User, 
        label: user.role === 'admin' ? 'Admin Dashboard' : user.role === 'instructor' ? 'Instructor Dashboard' : 'Student Dashboard', 
        path: user.role === 'admin' ? '/(tabs)/admin' : user.role === 'instructor' ? '/(tabs)/instructor' : '/(tabs)/dashboard' 
      }
    );
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'am', name: 'አማርኛ' },
    { code: 'om', name: 'Oromoo' },
    { code: 'es', name: 'Español' },
  ];

  const currencies = ['ETB', 'USD', 'EUR'];
  const timezones = [
    { label: 'EAT (Addis)', value: 'Africa/Addis_Ababa' },
    { label: 'UTC', value: 'UTC' },
    { label: 'EST (NY)', value: 'America/New_York' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={onClose} />
        
        <SafeAreaView style={[styles.drawer, { backgroundColor: isDarkMode ? '#111827' : '#fff' }]}>
          <View style={[styles.header, { borderBottomColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}>
            <View style={styles.brand}>
              <View style={styles.logoBox}>
                <GraduationCap size={20} color="#fff" />
              </View>
              <Text style={[styles.brandText, { color: isDarkMode ? '#fff' : '#111827' }]}>OICT TUTOR</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={isDarkMode ? '#9ca3af' : '#374151'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* User Info */}
            {user ? (
              <View style={[styles.userCard, { backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb' }]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: isDarkMode ? '#fff' : '#111827' }]}>{user.name}</Text>
                  <Text style={styles.userRole}>{(user.role || 'student').toUpperCase()}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.loginCard}>
                <TouchableOpacity style={styles.loginBtn} onPress={() => navigateTo('/login')}>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.registerBtn, { borderColor: isDarkMode ? '#374151' : '#d1d5db' }]} onPress={() => navigateTo('/register')}>
                  <Text style={[styles.registerBtnText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>Create Account</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Navigation Links */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Navigation</Text>
              {menuItems.map((item, i) => (
                <TouchableOpacity key={i} style={styles.menuItem} onPress={() => navigateTo(item.path)}>
                  <item.icon size={20} color={isDarkMode ? '#9ca3af' : '#4b5563'} />
                  <Text style={[styles.menuLabel, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>{item.label}</Text>
                  <ChevronRight size={16} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Localization */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localization</Text>
              
              {/* Language */}
              <View style={styles.locItem}>
                <View style={styles.locHeader}>
                  <Globe size={16} color="#6b7280" />
                  <Text style={styles.locLabel}>Language</Text>
                </View>
                <View style={styles.chipRow}>
                  {languages.map(lang => (
                    <TouchableOpacity 
                      key={lang.code}
                      style={[styles.chip, i18n.language === lang.code && styles.chipActive, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }, i18n.language === lang.code && styles.chipActive]}
                      onPress={() => i18n.changeLanguage(lang.code)}
                    >
                      <Text style={[styles.chipText, i18n.language === lang.code && styles.chipTextActive]}>{lang.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Currency */}
              <View style={styles.locItem}>
                <View style={styles.locHeader}>
                  <DollarSign size={16} color="#6b7280" />
                  <Text style={styles.locLabel}>Currency</Text>
                </View>
                <View style={styles.chipRow}>
                  {currencies.map(curr => (
                    <TouchableOpacity 
                      key={curr}
                      style={[styles.chip, currency === curr && styles.chipActive, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }, currency === curr && styles.chipActive]}
                      onPress={() => setCurrency(curr)}
                    >
                      <Text style={[styles.chipText, currency === curr && styles.chipTextActive]}>{curr}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Settings & Appearance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDarkMode}>
                {isDarkMode ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#6366f1" />}
                <Text style={[styles.menuLabel, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Text>
                <View style={[styles.toggle, isDarkMode && styles.toggleActive, { backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }, isDarkMode && styles.toggleActive]}>
                  <View style={[styles.toggleBall, isDarkMode && styles.toggleBallActive]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/notifications')}>
                <Bell size={20} color={isDarkMode ? '#9ca3af' : '#4b5563'} />
                <Text style={[styles.menuLabel, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>{t('settings.notifications')}</Text>
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}><Text style={styles.notifCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
                )}
              </TouchableOpacity>
            </View>

            {/* Pro Banner */}
            <TouchableOpacity style={styles.proBanner} onPress={() => navigateTo('/pricing')}>
              <View style={styles.proIcon}>
                <Zap size={20} color="#fff" fill="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proTitle}>Upgrade to Pro</Text>
                <Text style={styles.proSub}>Get unlimited access</Text>
              </View>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>

            {/* Footer */}
            {user && (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.logoutText}>{t('nav.logout') || 'Sign Out'}</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.version}>v1.0.0 • OICT Solution</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  dismiss: { flex: 1 },
  drawer: { 
    width: width * 0.8, 
    height: '100%', 
    backgroundColor: '#fff', 
    shadowColor: '#000', 
    shadowOffset: { width: -2, height: 0 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 10 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 32, height: 32, backgroundColor: '#6366f1', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  brandText: { fontSize: 18, fontWeight: '900', color: '#111827' },
  closeBtn: { padding: 4 },
  scroll: { padding: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#f9fafb', padding: 16, borderRadius: 20, marginBottom: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  userRole: { fontSize: 10, color: '#6366f1', fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  loginCard: { gap: 10, marginBottom: 24 },
  loginBtn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  registerBtn: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  registerBtnText: { color: '#374151', fontWeight: '800', fontSize: 15 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#374151' },
  locItem: { marginBottom: 16 },
  locHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  locLabel: { fontSize: 13, fontWeight: '800', color: '#4b5563' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  toggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: '#e5e7eb', padding: 2 },
  toggleActive: { backgroundColor: '#6366f1' },
  toggleBall: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  toggleBallActive: { alignSelf: 'flex-end' },
  notifBadge: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  notifCount: { color: '#fff', fontSize: 10, fontWeight: '900' },
  proBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#6366f1', padding: 16, borderRadius: 20, marginBottom: 24 },
  proIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  proTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  proSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#ef4444' },
  version: { textAlign: 'center', fontSize: 11, color: '#d1d5db', fontWeight: '600', marginTop: 12 },
});
