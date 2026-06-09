import React from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView, Linking
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, GraduationCap, Users, BookOpen, Award,
  Globe, Mail, Phone, MapPin, Star, Zap, Shield
} from 'lucide-react-native';

const TINT = '#6366f1';

const TEAM = [
  { name: 'Academic Excellence', desc: 'Courses designed with rigorous educational standards.', icon: Award },
  { name: 'Expert Instructors', desc: 'Learn from verified industry professionals worldwide.', icon: Users },
  { name: 'Global Reach', desc: 'Available in multiple languages for learners everywhere.', icon: Globe },
  { name: 'Secure Platform', desc: 'Your data is protected with enterprise-grade security.', icon: Shield },
];

const STATS = [
  { value: '500+', label: 'Courses' },
  { value: '10K+', label: 'Students' },
  { value: '50+', label: 'Instructors' },
  { value: '98%', label: 'Satisfaction' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={26} color="#111827" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <LinearGradient colors={['#6366f1', '#a855f7', '#ec4899']} style={styles.hero}>
        <RNView style={styles.heroIcon}>
          <GraduationCap size={40} color="#fff" />
        </RNView>
        <Text style={styles.heroTitle}>OICT TUTOR</Text>
        <Text style={styles.heroSubtitle}>
          Empowering learners worldwide with world-class online education.
        </Text>
      </LinearGradient>

      {/* Mission */}
      <RNView style={styles.section}>
        <Text style={styles.sectionBadge}>OUR MISSION</Text>
        <Text style={styles.sectionTitle}>Education Without Boundaries</Text>
        <Text style={styles.sectionText}>
          OICT TUTOR was founded with a simple but powerful mission: to make high-quality education
          accessible to everyone, everywhere. We believe that learning should not be limited by
          geography, financial constraints, or background.{'\n\n'}
          Our platform connects passionate instructors with eager learners, creating a vibrant
          community of knowledge-sharing that transcends borders and breaks barriers.
        </Text>
      </RNView>

      {/* Stats */}
      <RNView style={styles.statsGrid}>
        {STATS.map((s, i) => (
          <RNView key={i} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </RNView>
        ))}
      </RNView>

      {/* Features */}
      <RNView style={styles.section}>
        <Text style={styles.sectionBadge}>WHY CHOOSE US</Text>
        <Text style={styles.sectionTitle}>Built for Learners</Text>
        {TEAM.map((f, i) => (
          <RNView key={i} style={styles.featureRow}>
            <RNView style={styles.featureIcon}>
              <f.icon size={20} color={TINT} />
            </RNView>
            <RNView style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.name}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </RNView>
          </RNView>
        ))}
      </RNView>

      {/* Contact */}
      <RNView style={[styles.section, styles.contactSection]}>
        <Text style={styles.sectionBadge}>CONTACT US</Text>
        <Text style={styles.sectionTitle}>Get In Touch</Text>
        {[
          { icon: Mail, label: 'support@oicttutor.com', onPress: () => Linking.openURL('mailto:support@oicttutor.com') },
          { icon: Globe, label: 'www.oicttutor.com', onPress: () => Linking.openURL('https://oicttutor.com') },
          { icon: MapPin, label: 'Addis Ababa, Ethiopia', onPress: null },
        ].map((c, i) => (
          <TouchableOpacity key={i} style={styles.contactRow} onPress={c.onPress} disabled={!c.onPress}>
            <RNView style={styles.contactIcon}>
              <c.icon size={16} color={TINT} />
            </RNView>
            <Text style={styles.contactText}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </RNView>

      <RNView style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backText: { fontSize: 16, color: '#374151', fontWeight: '600' },
  hero: { padding: 32, alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff' },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 20, paddingVertical: 24,
  },
  statCard: {
    flex: 1, minWidth: '43%', backgroundColor: '#fff', borderRadius: 16,
    padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '900', color: TINT, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '700' },
  section: { paddingHorizontal: 20, paddingBottom: 24 },
  sectionBadge: { fontSize: 10, fontWeight: '900', color: TINT, letterSpacing: 1.5, marginBottom: 6, marginTop: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 14 },
  sectionText: { fontSize: 15, color: '#4b5563', lineHeight: 26 },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  featureTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 },
  featureDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  contactSection: { marginBottom: 8 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
  },
  contactIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center',
  },
  contactText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
