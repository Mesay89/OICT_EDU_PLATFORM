import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, Share, ImageBackground
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Download, Share2, GraduationCap, Award, Calendar, BadgeCheck } from 'lucide-react-native';
import apiClient from '@/api/client';

const TINT = '#001B4B';
const GOLD = '#C19B5E';

interface Certificate {
  courseName: string;
  studentName: string;
  completedAt?: string;
  quizScore?: number;
  certificateId: string;
}

export default function CertificateScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchCert();
  }, [id]);

  const fetchCert = async () => {
    try {
      const { data } = await apiClient.get(`/enrollments/${id}/certificate`);
      setCert(data);
    } catch {
      Alert.alert('Error', 'Certificate not found or not yet issued.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just earned a certificate for "${cert.courseName}" on OICT TUTOR! Check it out: https://oicttutor.com/verify/${cert.certificateId}`,
      });
    } catch (err: any) {
      console.log(err.message);
    }
  };

  if (loading) return <RNView style={styles.centered}><ActivityIndicator color={GOLD} /></RNView>;

  const date = cert?.completedAt ? new Date(cert.completedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  return (
    <RNView style={styles.container}>
      <RNView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Official Certificate</Text>
        <TouchableOpacity onPress={handleShare} style={styles.backBtn}>
          <Share2 size={22} color="#fff" />
        </TouchableOpacity>
      </RNView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Certificate Card */}
        <RNView style={styles.certCard}>
          {/* Borders */}
          <RNView style={styles.innerBorder} />
          <RNView style={styles.outerBorder} />

          <RNView style={styles.content}>
            <RNView style={styles.brand}>
              <GraduationCap size={32} color={TINT} />
              <Text style={styles.brandName}>OICT SOLUTION COMPANY</Text>
            </RNView>
            
            <Text style={styles.certType}>CERTIFICATE OF COMPLETION</Text>
            
            <Text style={styles.certTo}>THIS IS TO CERTIFY THAT</Text>
            <Text style={styles.studentName}>{cert?.studentName}</Text>
            
            <RNView style={styles.line} />
            
            <Text style={styles.hasFinished}>has successfully completed the course</Text>
            <Text style={styles.courseName}>{cert?.courseName}</Text>
            
            <RNView style={styles.scoreBox}>
              <Text style={styles.scoreText}>FINAL SCORE: {cert.quizScore || 100}%</Text>
            </RNView>

            <RNView style={styles.footerRow}>
              <RNView style={styles.footerItem}>
                <Text style={styles.footerLabel}>DATE</Text>
                <Text style={styles.footerVal}>{date}</Text>
              </RNView>
              
              <RNView style={styles.seal}>
                <Award size={40} color={GOLD} />
              </RNView>

              <RNView style={styles.footerItem}>
                <Text style={styles.footerLabel}>VERIFICATION ID</Text>
                <Text style={styles.footerVal} numberOfLines={1}>{cert?.certificateId}</Text>
              </RNView>
            </RNView>
          </RNView>
        </RNView>

        {/* Actions */}
        <RNView style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Share Success</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' }]}
            onPress={() => Alert.alert('Notice', 'Full PDF download is available on our web platform.')}
          >
            <Download size={20} color="#374151" />
            <Text style={[styles.actionBtnText, { color: '#374151' }]}>Get PDF</Text>
          </TouchableOpacity>
        </RNView>

        <RNView style={styles.verifyBox}>
          <BadgeCheck size={16} color="#10b981" />
          <Text style={styles.verifyText}>Verified by OICT TUTOR Authority</Text>
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  backBtn: { padding: 4 },
  scroll: { padding: 20, alignItems: 'center' },
  certCard: { width: '100%', aspectRatio: 1.414, backgroundColor: '#fafafc', borderRadius: 8, padding: 20, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  innerBorder: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 1, borderColor: GOLD },
  outerBorder: { position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, borderWidth: 2, borderColor: GOLD },
  content: { flex: 1, alignItems: 'center', padding: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  brandName: { color: TINT, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  certType: { color: TINT, fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 12, textAlign: 'center' },
  certTo: { fontSize: 8, color: '#6b7280', fontWeight: '900', letterSpacing: 2 },
  studentName: { fontSize: 24, fontWeight: 'bold', color: TINT, fontStyle: 'italic', marginVertical: 8 },
  line: { width: '60%', height: 1, backgroundColor: GOLD, marginBottom: 12 },
  hasFinished: { fontSize: 10, color: '#6b7280' },
  courseName: { fontSize: 14, fontWeight: '800', color: TINT, textAlign: 'center', marginVertical: 6, textTransform: 'uppercase' },
  scoreBox: { backgroundColor: TINT, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  scoreText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: 'auto' },
  footerItem: { alignItems: 'center', width: '30%' },
  footerLabel: { fontSize: 7, fontWeight: '900', color: TINT, borderBottomWidth: 1, borderBottomColor: GOLD, marginBottom: 4, width: '100%', textAlign: 'center' },
  footerVal: { fontSize: 9, color: '#374151', fontWeight: '700' },
  seal: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: GOLD },
  actions: { width: '100%', marginTop: 32, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: GOLD, paddingVertical: 16, borderRadius: 14 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  verifyBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
  verifyText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
});
