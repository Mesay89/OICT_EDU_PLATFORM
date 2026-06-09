import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/client';
import { Package, Plus, Trash2, Edit, ChevronRight } from 'lucide-react-native';

const TINT = '#6366f1';

interface Bundle {
  _id: string;
  title: string;
  description: string;
  price: number;
  courses: any[];
}

export default function BundlesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (user?.role !== 'instructor') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <Stack.Screen options={{ title: 'Access Denied' }} />
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedSub}>You must be an instructor to manage bundles.</Text>
      </View>
    );
  }

  const fetchBundles = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/bundles');
      // Filter bundles belonging to this instructor if needed, or assume backend filters it
      // For now, just set the data
      setBundles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch bundles:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBundles();
  }, [fetchBundles]);

  const handleSave = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        title,
        description,
        price: Number(price) || 0,
        image: imageUrl,
        courses: [] // Simplified for mobile
      };

      if (editingId) {
        await apiClient.put(`/bundles/${editingId}`, payload);
        Alert.alert('Success', 'Bundle updated');
      } else {
        await apiClient.post('/bundles', payload);
        Alert.alert('Success', 'Bundle created');
      }
      
      setTitle('');
      setDescription('');
      setPrice('0');
      setImageUrl('');
      setEditingId(null);
      setShowForm(false);
      fetchBundles();
    } catch (err) {
      Alert.alert('Error', 'Failed to save bundle');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this bundle?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await apiClient.delete(`/bundles/${id}`);
            fetchBundles();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete bundle');
            setLoading(false);
          }
      }}
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Course Bundles' }} />
        <ActivityIndicator size="large" color={TINT} />
        <Text style={styles.loadingText}>Loading bundles…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />}
    >
      <Stack.Screen options={{ title: 'Course Bundles' }} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Bundles</Text>
          <Text style={styles.subHeader}>Group your courses together</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => {
            setEditingId(null);
            setTitle('');
            setDescription('');
            setPrice('0');
            setImageUrl('');
            setShowForm(!showForm);
          }}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Bundle' : 'New Bundle'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Bundle Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Description"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Price ($)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={styles.input}
            placeholder="Bundle Image URL"
            value={imageUrl}
            onChangeText={setImageUrl}
          />
          
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      {bundles.length === 0 && !showForm ? (
        <View style={styles.emptyCard}>
          <Package size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No bundles found</Text>
          <Text style={styles.emptySub}>Create your first course bundle</Text>
        </View>
      ) : (
        bundles.map((bundle) => (
          <View key={bundle._id} style={styles.bundleCard}>
            <View style={styles.bundleContent}>
              <Text style={styles.bundleTitle}>{bundle.title}</Text>
              <Text style={styles.bundleDesc} numberOfLines={2}>{bundle.description}</Text>
              <Text style={styles.bundlePrice}>${bundle.price}</Text>
            </View>
            <View style={styles.bundleActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => {
                  setEditingId(bundle._id);
                  setTitle(bundle.title);
                  setDescription(bundle.description);
                  setPrice(bundle.price.toString());
                  setImageUrl(bundle.image || '');
                  setShowForm(true);
                }}
              >
                <Edit size={18} color={TINT} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleDelete(bundle._id)}
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 20, backgroundColor: '#f9fafb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  header: { fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 4 },
  subHeader: { fontSize: 15, color: '#6b7280' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: TINT, justifyContent: 'center', alignItems: 'center' },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelBtnText: { color: '#4b5563', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: TINT, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  bundleCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, padding: 16 },
  bundleContent: { flex: 1, paddingRight: 12 },
  bundleTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  bundleDesc: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  bundlePrice: { fontSize: 15, fontWeight: '900', color: '#10b981' },
  bundleActions: { flexDirection: 'column', gap: 8, justifyContent: 'center' },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 12, marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#6b7280' },
  loadingText: { marginTop: 12, color: '#6b7280' },
  accessDeniedTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  accessDeniedSub: { fontSize: 15, color: '#6b7280' },
});
