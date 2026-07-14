import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View as RNView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Share
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Award, Download, Share2, CheckCircle, Package, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TINT = '#6366f1';

export default function BundleCertificateScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDarkMode ? '#111827' : '#f9fafb';
  const textColor = isDarkMode ? '#fff' : '#111827';
  const subColor = isDarkMode ? '#9ca3af' : '#6b7280';

  useEffect(() => {
    if (id) fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      const { data } = await apiClient.get(`/bundles/${id}/certificate`);
      setCert(data);
    } catch (err: any) {
      Alert.alert('Not Available', 'Certificate is not yet available. Complete all courses in the bundle first.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎓 I just completed the "${cert?.bundleTitle || 'Course Bundle'}" on OICT Education! #OnlineLearning #Certificate`,
        title: 'My Bundle Certificate',
      });
    } catch {}
  };

  if (loading) return (
    <RNView style={[styles.centered, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={TINT} />
    </RNView>
  );

  return (
    <RNView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Bundle Certificate</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={20} color={TINT} />
        </TouchableOpacity>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Certificate Card */}
        <LinearGradient
          colors={['#4f46e5', '#7c3aed', '#a855f7']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.certCard}
        >
          {/* Decorative top */}
          <RNView style={styles.certHeader}>
            <Award size={48} color="#fbbf24" />
            <Text style={styles.certHeaderText}>BUNDLE CERTIFICATE</Text>
            <Text style={styles.certHeaderSub}>OF COMPLETION</Text>
          </RNView>

          <RNView style={styles.certDivider} />

          <Text style={styles.certPresented}>This is to certify that</Text>
          <Text style={styles.certName}>{user?.name || cert?.studentName || 'Student'}</Text>
          <Text style={styles.certPresented}>has successfully completed all courses in the bundle</Text>
          <Text style={styles.certCourse}>{cert?.bundleTitle || 'Course Bundle'}</Text>

          {cert?.completedAt && (
            <RNView style={styles.certDateRow}>
              <Calendar size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.certDate}>
                {new Date(cert.completedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </Text>
            </RNView>
          )}

          <RNView style={styles.certDivider} />

          {/* Courses completed */}
          <Text style={styles.certCoursesLabel}>Courses Completed:</Text>
          {(cert?.courses || []).map((c: any, i: number) => (
            <RNView key={i} style={styles.certCourseRow}>
              <CheckCircle size={14} color="#4ade80" />
              <Text style={styles.certCourseItem}>{c.title || c}</Text>
            </RNView>
          ))}

          {cert?.certificateId && (
            <Text style={styles.certId}>ID: {cert.certificateId}</Text>
          )}
        </LinearGradient>

        {/* Actions */}
        <RNView style={styles.actions}>
          <TouchableOpacity style={styles.shareAction} onPress={handleShare}>
            <Share2 size={18} color={TINT} />
            <Text style={styles.shareActionText}>Share Certificate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bundleAction}
            onPress={() => router.push('/(tabs)/dashboard')}
          >
            <Package size={18} color="#fff" />
            <Text style={styles.bundleActionText}>My Dashboard</Text>
          </TouchableOpacity>
        </RNView>

        {/* Verification */}
        <RNView style={[styles.verifyBox, { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }]}>
          <CheckCircle size={20} color="#10b981" />
          <RNView>
            <Text style={[styles.verifyTitle, { color: textColor }]}>Verified Certificate</Text>
            <Text style={[styles.verifySub, { color: subColor }]}>
              Issued by OICT Education Platform
            </Text>
          </RNView>
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '900' },
  shareBtn: { padding: 4 },
  certCard: {
    borderRadius: 24, padding: 28, marginBottom: 24,
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10
  },
  certHeader: { alignItems: 'center', marginBottom: 20 },
  certHeaderText: { color: '#fbbf24', fontSize: 18, fontWeight: '900', letterSpacing: 3, marginTop: 10 },
  certHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  certDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 20 },
  certPresented: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', fontStyle: 'italic', marginBottom: 8 },
  certName: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  certCourse: { color: '#fbbf24', fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  certDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12 },
  certDate: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  certCoursesLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  certCourseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  certCourseItem: { color: '#fff', fontSize: 13, fontWeight: '700' },
  certId: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginTop: 16, fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  shareAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: TINT, borderRadius: 14, paddingVertical: 14
  },
  shareActionText: { color: TINT, fontWeight: '900', fontSize: 14 },
  bundleAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: TINT, borderRadius: 14, paddingVertical: 14
  },
  bundleActionText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  verifyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  verifyTitle: { fontSize: 15, fontWeight: '800' },
  verifySub: { fontSize: 12, fontWeight: '600' },
});
