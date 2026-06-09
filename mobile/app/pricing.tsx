import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView, Alert
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, Zap, Star, Crown } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const TINT = '#6366f1';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: ['#6b7280', '#9ca3af'],
    icon: Star,
    features: [
      'Access to free courses',
      'Basic learning dashboard',
      'Community chat access',
      'Course certificates (free courses)',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: 'per month',
    color: ['#6366f1', '#a855f7'],
    icon: Zap,
    badge: 'MOST POPULAR',
    features: [
      'Unlimited course access',
      'HD video streaming',
      'Downloadable resources',
      'Priority support',
      'All certificates',
      'Live Q&A sessions',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: 'per month',
    color: ['#f59e0b', '#ef4444'],
    icon: Crown,
    features: [
      'Everything in Pro',
      'Team management',
      'Custom branding',
      'Analytics dashboard',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
  },
];

export default function PricingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState('pro');

  const handleCTA = (plan) => {
    if (plan.id === 'free') return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to upgrade your plan.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (plan.id === 'enterprise') {
      Alert.alert('Contact Sales', 'Please email us at sales@oicttutor.com for Enterprise pricing.');
      return;
    }
    // Navigate to checkout or payment
    Alert.alert('Coming Soon', 'Payment integration will be available soon.');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={26} color="#111827" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.hero}>
        <Text style={styles.heroBadge}>💎 PRICING PLANS</Text>
        <Text style={styles.heroTitle}>Simple, Transparent Pricing</Text>
        <Text style={styles.heroSubtitle}>
          Choose the plan that's right for your learning journey.{'\n'}No hidden fees, cancel anytime.
        </Text>
      </LinearGradient>

      {/* Plans */}
      <RNView style={styles.plansContainer}>
        {PLANS.map(plan => {
          const isSelected = selected === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.85}
            >
              {plan.badge && (
                <RNView style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{plan.badge}</Text>
                </RNView>
              )}
              <LinearGradient colors={plan.color} style={styles.planHeader}>
                <plan.icon size={24} color="#fff" />
                <Text style={styles.planName}>{plan.name}</Text>
                <RNView style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>/{plan.period}</Text>
                </RNView>
              </LinearGradient>

              <RNView style={styles.planFeatures}>
                {plan.features.map((f, i) => (
                  <RNView key={i} style={styles.featureRow}>
                    <RNView style={styles.checkIcon}>
                      <Check size={12} color="#10b981" strokeWidth={3} />
                    </RNView>
                    <Text style={styles.featureText}>{f}</Text>
                  </RNView>
                ))}
              </RNView>

              <TouchableOpacity
                style={[styles.ctaBtn, plan.disabled && styles.ctaBtnDisabled]}
                onPress={() => handleCTA(plan)}
                disabled={plan.disabled}
              >
                <LinearGradient
                  colors={plan.disabled ? ['#e5e7eb', '#e5e7eb'] : plan.color}
                  style={styles.ctaBtnGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.ctaBtnText, plan.disabled && styles.ctaBtnTextDisabled]}>
                    {plan.cta}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </RNView>

      {/* FAQ */}
      <RNView style={styles.faqSection}>
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes! Cancel your subscription at any time with no cancellation fees.' },
          { q: 'Is there a free trial?', a: 'Yes, all paid plans come with a 7-day free trial.' },
          { q: 'What payment methods do you accept?', a: 'We accept credit/debit cards, PayPal, Stripe, and Chapa.' },
        ].map((item, i) => (
          <RNView key={i} style={styles.faqItem}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </RNView>
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
  hero: { padding: 32, alignItems: 'center', gap: 10 },
  heroBadge: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  plansContainer: { padding: 16, gap: 16 },
  planCard: {
    backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  planCardSelected: { borderColor: TINT },
  popularBadge: {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
    backgroundColor: '#fbbf24', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  popularBadgeText: { fontSize: 9, fontWeight: '900', color: '#92400e', letterSpacing: 1 },
  planHeader: { padding: 24, gap: 6 },
  planName: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 4 },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 },
  planPrice: { fontSize: 36, fontWeight: '900', color: '#fff' },
  planPeriod: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', paddingBottom: 4 },
  planFeatures: { padding: 20, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#d1fae5',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  featureText: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },
  ctaBtn: { marginHorizontal: 20, marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnGradient: { paddingVertical: 15, alignItems: 'center' },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  ctaBtnTextDisabled: { color: '#9ca3af' },
  faqSection: { padding: 20 },
  faqTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 16, textAlign: 'center' },
  faqItem: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  faqQ: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 6 },
  faqA: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
});
