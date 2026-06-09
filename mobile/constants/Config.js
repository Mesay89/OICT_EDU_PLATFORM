import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHostIP = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

const Config = {
  // Automatically resolve dev server IP for physical devices/emulators
  BASE_URL: Platform.OS === 'web' ? 'http://localhost:5000/api' : `http://${getHostIP()}:5000/api`,
  APP_NAME: 'OICT Education',
  THEME_COLOR: '#1a1a1a',
};

export default Config;
