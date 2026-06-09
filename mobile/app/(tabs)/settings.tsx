// This file is a redirect — the real settings screen is at /settings
// It exists so the tab layout does not crash
import { Redirect } from 'expo-router';
export default function SettingsTab() {
  return <Redirect href="/settings" />;
}
