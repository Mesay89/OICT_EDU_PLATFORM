import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  Switch, Alert, Linking
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, ChevronRight, Moon, Globe, DollarSign,
  Clock, Bell, Share2, LogOut, User, Info, Shield, Mail
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/context/CurrencyContext';
import { useTimezone } from '@/context/TimezoneContext';

const TINT = '#6366f1';

function SettingRow({ icon: Icon, label, value, onPress, isSwitch, switchValue, onToggle, danger }) {
  const { isDarkMode } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: isDarkMode ? '#111827' : '#f9fafb' }]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <RNView style={[styles.rowIcon, { backgroundColor: danger ? '#fee2e2' : (isDarkMode ? '#111827' : '#eef2ff') }]}>
        <Icon size={18} color={danger ? '#ef4444' : TINT} />
      </RNView>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger, { color: isDarkMode ? '#fff' : '#374151' }]}>{label}</Text>
      <RNView style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onToggle}
            trackColor={{ false: isDarkMode ? '#374151' : '#e5e7eb', true: TINT }}
            thumbColor="#fff"
          />
        ) : (
          <ChevronRight size={18} color="#d1d5db" />
        )}
      </RNView>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const { timezone } = useTimezone();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      router.replace('/');
    }
  };

  return (
    <RNView style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={26} color={isDarkMode ? '#fff' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#111827' }]}>{t('settings.title')}</Text>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Profile Card */}
        {user ? (
          <RNView style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
            <RNView style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{user.name?.charAt(0)?.toUpperCase()}</Text>
            </RNView>
            <RNView style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: isDarkMode ? '#fff' : '#111827' }]}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <RNView style={styles.roleBadge}>
                <Text style={styles.roleText}>{(user.role || 'student').toUpperCase()}</Text>
              </RNView>
            </RNView>
          </RNView>
        ) : (
          <TouchableOpacity style={[styles.signInCard, { backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: isDarkMode ? '#374151' : '#eef2ff' }]} onPress={() => router.push('/login')}>
            <Text style={styles.signInText}>{t('settings.signin_msg')}</Text>
            <Text style={styles.signInBtn}>{t('nav.login')} →</Text>
          </TouchableOpacity>
        )}

        {/* Appearance */}
        <SectionHeader title={t('settings.appearance')} />
        <RNView style={[styles.section, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
          <SettingRow
            icon={Moon}
            label={t('settings.dark_mode')}
            isSwitch
            switchValue={isDarkMode}
            onToggle={toggleDarkMode}
          />
        </RNView>

        {/* Localization */}
        <SectionHeader title={t('settings.localization')} />
        <RNView style={[styles.section, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
          <SettingRow icon={Globe} label={t('settings.language')} value={i18n.language.toUpperCase()} onPress={() => {}} />
          <SettingRow icon={DollarSign} label={t('settings.currency')} value={currency} onPress={() => {}} />
          <SettingRow icon={Clock} label={t('settings.timezone')} value={timezone.split('/').pop()} onPress={() => {}} />
        </RNView>

        {/* Notifications */}
        <SectionHeader title={t('settings.notifications')} />
        <RNView style={[styles.section, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
          <SettingRow
            icon={Bell}
            label={t('settings.all_notifs')}
            onPress={() => router.push('/notifications')}
          />
        </RNView>

        {/* About */}
        <SectionHeader title={t('settings.about')} />
        <RNView style={[styles.section, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
          <SettingRow
            icon={Info}
            label={t('settings.about_us')}
            onPress={() => router.push('/about')}
          />
          <SettingRow
            icon={Shield}
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://oicttutor.com/privacy')}
          />
          <SettingRow
            icon={Mail}
            label="Contact Support"
            onPress={() => Linking.openURL('mailto:support@oicttutor.com')}
          />
          <SettingRow
            icon={Share2}
            label="Share App"
            onPress={() => Alert.alert('Share', 'Share OICT TUTOR with friends!')}
          />
        </RNView>

        {/* Upgrade */}
        <TouchableOpacity style={styles.upgradeBanner} onPress={() => router.push('/pricing')}>
          <RNView>
            <Text style={styles.upgradeTitle}>🚀 Upgrade to Pro</Text>
            <Text style={styles.upgradeDesc}>Unlock all courses, live sessions & certificates.</Text>
          </RNView>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>

        {/* Sign Out */}
        {user && (
          <>
            <SectionHeader title={t('settings.account')} />
            <RNView style={[styles.section, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
              <SettingRow icon={DollarSign} label="Subscriptions & Billing" onPress={() => router.push('/pricing')} />
              <SettingRow icon={LogOut} label={t('nav.logout')} onPress={handleLogout} danger />
            </RNView>
          </>
        )}

        <Text style={styles.version}>OICT TUTOR v1.0.0</Text>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: TINT,
    justifyContent: 'center', alignItems: 'center',
  },
  profileAvatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  profileName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  profileEmail: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  roleBadge: { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  roleText: { fontSize: 10, fontWeight: '900', color: TINT, letterSpacing: 1 },
  signInCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20,
    alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#eef2ff', borderStyle: 'dashed',
  },
  signInText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  signInBtn: { fontSize: 16, fontWeight: '900', color: TINT },
  sectionHeader: {
    fontSize: 10, fontWeight: '900', color: '#9ca3af', letterSpacing: 1.5,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
  rowLabelDanger: { color: '#ef4444' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: TINT, margin: 16, borderRadius: 20, padding: 20,
    marginTop: 24,
  },
  upgradeTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 4 },
  upgradeDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  version: { textAlign: 'center', fontSize: 12, color: '#d1d5db', fontWeight: '600', marginTop: 24 },
});
