import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  ActivityIndicator, Alert, TextInput
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react-native';

const TINT = '#6366f1';

export default function ContactScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }
    setLoading(true);
    // Mocking send
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Message Sent', 'Thank you for reaching out! We will get back to you soon.');
      setForm({ name: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <RNView style={styles.container}>
      <RNView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <RNView style={{ width: 24 }} />
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.heroTitle}>Get in Touch</Text>
        <Text style={styles.heroSub}>Have questions or need support? Our team is here to help you.</Text>

        <RNView style={styles.contactCards}>
          <RNView style={styles.card}>
            <RNView style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
              <Mail size={20} color={TINT} />
            </RNView>
            <RNView>
              <Text style={styles.cardLabel}>Email Us</Text>
              <Text style={styles.cardVal}>mesayboja3@gmail.com</Text>
            </RNView>
          </RNView>

          <RNView style={styles.card}>
            <RNView style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
              <Phone size={20} color="#10b981" />
            </RNView>
            <RNView>
              <Text style={styles.cardLabel}>Call Us</Text>
              <Text style={styles.cardVal}>+251 988 335 151</Text>
            </RNView>
          </RNView>

          <RNView style={styles.card}>
            <RNView style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
              <MapPin size={20} color="#f59e0b" />
            </RNView>
            <RNView>
              <Text style={styles.cardLabel}>Location</Text>
              <Text style={styles.cardVal}>Addis Ababa, Ethiopia</Text>
            </RNView>
          </RNView>
        </RNView>

        <RNView style={styles.formCard}>
          <Text style={styles.formHeader}>Send a Message</Text>
          
          <RNView style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={form.name}
              onChangeText={(t) => setForm({...form, name: t})}
            />
          </RNView>

          <RNView style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(t) => setForm({...form, email: t})}
            />
          </RNView>

          <RNView style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="How can we help?"
              multiline
              numberOfLines={4}
              value={form.message}
              onChangeText={(t) => setForm({...form, message: t})}
            />
          </RNView>

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Send size={18} color="#fff" />
                <Text style={styles.btnText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </RNView>

        <RNView style={{ height: 40 }} />
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  backBtn: { padding: 4 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#111827', marginTop: 12 },
  heroSub: { fontSize: 15, color: '#6b7280', marginTop: 8, lineHeight: 22, marginBottom: 24 },
  contactCards: { gap: 12, marginBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' },
  cardVal: { fontSize: 15, fontWeight: '800', color: '#111827' },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  formHeader: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, fontSize: 14, color: '#111827' },
  textArea: { height: 100, textAlignVertical: 'top' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: TINT, paddingVertical: 16, borderRadius: 14, marginTop: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
