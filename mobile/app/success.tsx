import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, ArrowRight, Home, CreditCard } from 'lucide-react-native';

const TINT = '#6366f1';

export default function SuccessScreen() {
  const params = useLocalSearchParams<{ type?: string; message?: string; title?: string }>();
  const { type, message, title } = params;
  const router = useRouter();

  const getIcon = () => {
    switch (type) {
      case 'payment': return <CreditCard size={64} color="#10b981" />;
      default: return <CheckCircle size={64} color="#10b981" />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconBox}>
          {getIcon()}
        </View>
        
        <Text style={styles.title}>{title || 'Successful!'}</Text>
        <Text style={styles.message}>
          {message || 'Your action has been processed successfully. You can now continue using the platform.'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.mainBtn}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
            <Home size={20} color="#fff" />
            <Text style={styles.mainBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/catalog')}
          >
            <Text style={styles.secondaryBtnText}>Explore More Courses</Text>
            <ArrowRight size={18} color={TINT} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#111827',
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    width: '100%',
  },
  secondaryBtnText: {
    color: TINT,
    fontSize: 16,
    fontWeight: '700',
  },
});
