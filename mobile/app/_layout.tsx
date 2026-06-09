import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
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
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

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
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/player/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/quiz/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/certificate/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/peer-review/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/quiz-builder/[courseId]" options={{ headerShown: false }} />
        <Stack.Screen name="admin/courses" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password/[token]" options={{ headerShown: false }} />
        <Stack.Screen name="success" options={{ headerShown: false }} />
        <Stack.Screen name="checkout/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </NavThemeProvider>
  );
}
