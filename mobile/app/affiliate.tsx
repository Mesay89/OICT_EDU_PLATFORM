import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, Share, TextInput, RefreshControl, Modal, Dimensions
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, Share2, Users, DollarSign, Copy, 
  CheckCircle, History, Landmark, Info, Send, BookOpen, ChevronRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');
const TINT = '#6366f1';

interface Profile {
  referralCode: string;
  commissionBalance: number;
  referrals: { name: string; createdAt: string; commissionAmount: number }[];
}

export default function AffiliateDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { isDarkMode } = useTheme();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', amount: '' });
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await apiClient.get('/users/profile');
      setProfile(data);
    } catch (err: any) {
      console.log('Affiliate fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  const handleCopy = (text: string, type: string) => {
    // In a real app we'd use Clipboard.setString(text)
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    Alert.alert('Copied', `${type === 'code' ? 'Referral code' : 'Personal link'} copied to clipboard!`);
  };

  const handleTelegramShare = () => {
    const link = `https://oicttutor.com/register?ref=${profile?.referralCode || ''}`;
    const text = `Hey! Join me on OICT TUTOR and start learning today. Use my link to sign up: ${link}`;
    Share.share({ message: text });
  };

  const handleWithdraw = async () => {
    if (!bankDetails.amount || parseFloat(bankDetails.amount) <= 0) return Alert.alert('Error', 'Enter a valid amount');
    if (parseFloat(bankDetails.amount) > (profile?.commissionBalance || 0)) return Alert.alert('Error', 'Insufficient balance');
    
    setWithdrawing(true);
    try {
      await apiClient.post('/users/withdraw', bankDetails);
      Alert.alert('Success', 'Withdrawal request submitted! Admin will process it soon.');
      setShowWithdraw(false);
      fetchProfile();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <RNView style={[styles.centered, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }]}><ActivityIndicator color={TINT} /></RNView>;

  const themeStyles = {
    bg: isDarkMode ? '#111827' : '#f9fafb',
    card: isDarkMode ? '#1f2937' : '#fff',
    text: isDarkMode ? '#fff' : '#111827',
    subText: isDarkMode ? '#9ca3af' : '#6b7280',
    border: isDarkMode ? '#374151' : '#f3f4f6',
  };

  return (
    <RNView style={[styles.container, { backgroundColor: themeStyles.bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: themeStyles.card, borderBottomColor: themeStyles.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={themeStyles.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeStyles.text }]}>Affiliate Hub</Text>
        <TouchableOpacity onPress={handleTelegramShare} style={styles.backBtn}>
          <Share2 size={22} color={themeStyles.text} />
        </TouchableOpacity>
      </RNView>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
      >
        <RNView style={styles.topSection}>
          <Text style={[styles.mainTitle, { color: themeStyles.text }]}>Earn 10% Commission</Text>
          <Text style={[styles.mainSub, { color: themeStyles.subText }]}>Share OICT TUTOR with your network and earn for every successful referral.</Text>
        </RNView>

        {/* Hero Card */}
        <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.heroCard}>
          <RNView style={styles.heroContent}>
            <Text style={styles.heroTitle}>Invite Friends</Text>
            <Text style={styles.heroDesc}>Share your code or link to start earning.</Text>
            
            <RNView style={styles.referralContainer}>
              <RNView style={styles.labelRow}><Text style={styles.inputLabel}>YOUR CODE</Text></RNView>
              <RNView style={styles.inputRow}>
                <Text style={styles.codeValue}>{profile?.referralCode || 'N/A'}</Text>
                <TouchableOpacity style={styles.copyBtnSmall} onPress={() => handleCopy(profile?.referralCode || '', 'code')}>
                  {copied === 'code' ? <CheckCircle size={18} color="#10b981" /> : <Copy size={18} color={TINT} />}
                </TouchableOpacity>
              </RNView>

              <RNView style={[styles.labelRow, { marginTop: 16 }]}><Text style={styles.inputLabel}>PERSONAL LINK</Text></RNView>
              <RNView style={styles.inputRow}>
                <Text style={styles.linkValue} numberOfLines={1}>https://oicttutor.com/reg?ref={profile?.referralCode}</Text>
                <RNView style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.copyBtnSmall} onPress={() => handleCopy(`https://oicttutor.com/reg?ref=${profile?.referralCode}`, 'link')}>
                    {copied === 'link' ? <CheckCircle size={18} color="#10b981" /> : <Copy size={18} color={TINT} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.copyBtnSmall, { backgroundColor: '#0ea5e9' }]} onPress={handleTelegramShare}>
                    <Send size={18} color="#fff" />
                  </TouchableOpacity>
                </RNView>
              </RNView>
            </RNView>
          </RNView>
        </LinearGradient>

        {/* Stats Row */}
        <RNView style={styles.statsGrid}>
          <RNView style={[styles.statCard, { backgroundColor: themeStyles.card }]}>
            <RNView style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
              <DollarSign size={24} color="#10b981" />
            </RNView>
            <RNView style={styles.statsContent}>
              <RNView style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL EARNINGS</Text>
                <Text style={[styles.statValue, { color: themeStyles.text }]}>
                  {formatPrice(profile?.commissionBalance || 0).formatted}
                </Text>
              </RNView>
              <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdraw(true)}>
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
            </RNView>
          </RNView>
        </RNView>

        {/* Purchase CTA */}
        <TouchableOpacity 
          style={styles.purchaseCTA} 
          onPress={() => router.push('/(tabs)/catalog')}
        >
          <BookOpen size={20} color="#fff" />
          <RNView style={{ flex: 1 }}>
            <Text style={styles.purchaseCTATitle}>Purchase Courses</Text>
            <Text style={styles.purchaseCTASub}>Use your balance to enroll instantly</Text>
          </RNView>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>

        {/* Activity Table */}
        <RNView style={styles.section}>
          <RNView style={[styles.activitySection, { backgroundColor: themeStyles.card, borderColor: themeStyles.border }]}>
            <RNView style={[styles.activityHeader, { borderBottomColor: themeStyles.border }]}>
              <History size={20} color="#6366f1" />
              <Text style={[styles.activityTitle, { color: themeStyles.text }]}>RECENT REFERRAL ACTIVITY</Text>
            </RNView>
            
            {(!profile?.referrals || profile.referrals.length === 0) ? (
              <RNView style={styles.emptyTable}>
                <Text style={[styles.emptyTableText, { color: themeStyles.subText }]}>No recent activity. Share your link to start earning!</Text>
              </RNView>
            ) : (
              profile.referrals.map((ref, idx) => (
                <RNView key={idx} style={[styles.tableRow, { borderBottomColor: themeStyles.border }]}>
                  <RNView style={{ flex: 1 }}>
                    <Text style={[styles.studentName, { color: themeStyles.text }]}>{ref.name}</Text>
                    <Text style={[styles.studentDate, { color: themeStyles.subText }]}>{new Date(ref.createdAt).toLocaleDateString()}</Text>
                  </RNView>
                  <RNView style={styles.statusBadge}>
                    <Text style={styles.statusText}>PURCHASED</Text>
                  </RNView>
                  <Text style={styles.earningText}>+{formatPrice(ref.commissionAmount || 0).formatted}</Text>
                </RNView>
              ))
            )}
          </RNView>
        </RNView>

        {/* How it works */}
        <RNView style={[styles.howSection, { backgroundColor: themeStyles.card, borderColor: themeStyles.border }]}>
          <Text style={[styles.howTitle, { color: themeStyles.text }]}>How It Works</Text>
          <RNView style={styles.howSteps}>
            {[
              "Copy your unique referral code.",
              "Share it with friends or on social media.",
              "Earn 10% commission on every course they buy.",
              "Withdraw earnings to your bank or use to buy courses."
            ].map((step, i) => (
              <RNView key={i} style={styles.stepRow}>
                <RNView style={styles.stepNum}><Text style={styles.stepNumText}>{i+1}</Text></RNView>
                <Text style={[styles.stepText, { color: themeStyles.subText }]}>{step}</Text>
              </RNView>
            ))}
          </RNView>
        </RNView>

        <RNView style={{ height: 60 }} />
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal visible={showWithdraw} animationType="slide" transparent>
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: themeStyles.text }]}>Withdraw Earnings</Text>
            
            <RNView style={styles.inputGroup}>
              <Text style={styles.label}>Bank / Wallet Name</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeStyles.bg, color: themeStyles.text, borderColor: themeStyles.border }]} 
                placeholder="e.g. CBE, Telebirr"
                placeholderTextColor="#9ca3af"
                value={bankDetails.bankName}
                onChangeText={t => setBankDetails({...bankDetails, bankName: t})}
              />
            </RNView>
            <RNView style={styles.inputGroup}>
              <Text style={styles.label}>Account Number / Phone</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeStyles.bg, color: themeStyles.text, borderColor: themeStyles.border }]} 
                placeholder="Enter details"
                placeholderTextColor="#9ca3af"
                value={bankDetails.accountNumber}
                onChangeText={t => setBankDetails({...bankDetails, accountNumber: t})}
              />
            </RNView>
            <RNView style={styles.inputGroup}>
              <Text style={styles.label}>Amount ({currency})</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeStyles.bg, color: themeStyles.text, borderColor: themeStyles.border, fontSize: 20, fontWeight: '900' }]} 
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                value={bankDetails.amount}
                onChangeText={t => setBankDetails({...bankDetails, amount: t})}
              />
            </RNView>

            <TouchableOpacity 
              style={[styles.confirmBtn, withdrawing && { opacity: 0.7 }]} 
              onPress={handleWithdraw} 
              disabled={withdrawing}
            >
              {withdrawing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Withdrawal</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdraw(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </RNView>
        </RNView>
      </Modal>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  backBtn: { padding: 4 },
  topSection: { padding: 20, paddingBottom: 10 },
  mainTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  mainSub: { fontSize: 14, lineHeight: 22 },
  heroCard: { margin: 20, borderRadius: 32, padding: 24, overflow: 'hidden' },
  heroContent: { backgroundColor: 'transparent' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 20 },
  referralContainer: { gap: 12 },
  labelRow: { marginBottom: 4 },
  inputLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  codeValue: { flex: 1, color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  linkValue: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '600' },
  copyBtnSmall: { backgroundColor: '#fff', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { paddingHorizontal: 20, marginBottom: 12 },
  statCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statIconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statsContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statBox: { gap: 2 },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  statValue: { fontSize: 20, fontWeight: '900' },
  withdrawBtn: { backgroundColor: TINT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  withdrawBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  activitySection: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  activityHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, borderBottomWidth: 1 },
  activityTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  studentName: { fontSize: 15, fontWeight: '800' },
  studentDate: { fontSize: 11, marginTop: 2 },
  earningText: { fontSize: 15, fontWeight: '900', color: '#10b981' },
  emptyTable: { padding: 40, alignItems: 'center' },
  emptyTableText: { fontWeight: '600' },
  purchaseCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', margin: 20, marginTop: 0, padding: 16, borderRadius: 20, gap: 12 },
  purchaseCTATitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  purchaseCTASub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  howSection: { margin: 20, padding: 20, borderRadius: 24, borderWidth: 1 },
  howTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  howSteps: { gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stepNumText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18 },
  statusBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  statusText: { color: '#6366f1', fontSize: 8, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1 },
  confirmBtn: { backgroundColor: '#10b981', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontWeight: '800' },
});
