import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import apiClient from '@/api/client';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const fetchSettings = async () => {
    try {
      const { data } = await apiClient.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await apiClient.put('/settings', settings);
      Alert.alert('Success', 'Settings updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Settings',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
          )
        }} 
      />
      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Allow New Registrations</Text>
              <Switch 
                value={settings.allowRegistrations ?? true} 
                onValueChange={(val) => setSettings({ ...settings, allowRegistrations: val })} 
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Require Email Verification (OTP)</Text>
              <Switch 
                value={settings.requireEmailVerification ?? true} 
                onValueChange={(val) => setSettings({ ...settings, requireEmailVerification: val })} 
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Maintenance Mode</Text>
              <Switch 
                value={settings.maintenanceMode ?? false} 
                onValueChange={(val) => setSettings({ ...settings, maintenanceMode: val })} 
              />
            </View>
          </View>
          <TouchableOpacity onPress={handleUpdate} disabled={updating} style={styles.btn}>
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Settings</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { fontSize: 16, color: '#374151' },
  btn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
