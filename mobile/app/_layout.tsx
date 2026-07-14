import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import '../i18n';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { TimezoneProvider } from '../context/TimezoneContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Dismiss the HTML splash screen on web once the app has mounted
      if (Platform.OS === 'web') {
        document.body.classList.add('app-ready');
      }
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <TimezoneProvider>
              <RootLayoutContent />
            </TimezoneProvider>
          </CurrencyProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const { loading } = useAuth();
  const { isDarkMode } = useTheme();

  if (loading) return null;

  return (
    <NavThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ headerShown: false }} />
        <Stack.Screen name="pricing" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="affiliate" options={{ headerShown: false }} />
        <Stack.Screen name="contact" options={{ headerShown: false }} />
        <Stack.Screen name="cash-manager" options={{ headerShown: false }} />
        {/* Course screens */}
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/player/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/quiz/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/certificate/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/peer-review/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/evaluation/[id]" options={{ headerShown: false }} />
        {/* Bundle screens */}
        <Stack.Screen name="bundle/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="bundle/checkout/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="bundle/player/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="bundle/certificate/[id]" options={{ headerShown: false }} />
        {/* Quiz screens */}
        <Stack.Screen name="quiz/[quizId]/results" options={{ headerShown: false }} />
        {/* Instructor screens */}
        <Stack.Screen name="instructor/quiz-builder/[courseId]" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/withdrawal" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/create" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/edit/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/manage/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/module/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/analytics" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/bundles" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/settings" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/peer-review/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/refund/[id]" options={{ headerShown: false }} />
        {/* Admin screens */}
        <Stack.Screen name="admin/courses" options={{ headerShown: false }} />
        <Stack.Screen name="admin/users" options={{ headerShown: false }} />
        <Stack.Screen name="admin/payments" options={{ headerShown: false }} />
        <Stack.Screen name="admin/refunds" options={{ headerShown: false }} />
        <Stack.Screen name="admin/instructors" options={{ headerShown: false }} />
        <Stack.Screen name="admin/course-approvals" options={{ headerShown: false }} />
        <Stack.Screen name="admin/revenue" options={{ headerShown: false }} />
        <Stack.Screen name="admin/settings" options={{ headerShown: false }} />
        <Stack.Screen name="admin/audit" options={{ headerShown: false }} />
        <Stack.Screen name="admin/assignments" options={{ headerShown: false }} />
        {/* Other */}
        <Stack.Screen name="reset-password/[token]" options={{ headerShown: false }} />
        <Stack.Screen name="success" options={{ headerShown: false }} />
        <Stack.Screen name="checkout/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </NavThemeProvider>
  );
}
