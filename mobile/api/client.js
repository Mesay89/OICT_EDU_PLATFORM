import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../constants/Config';

const apiClient = axios.create({
  baseURL: Config.BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach auth token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const savedUser = await AsyncStorage.getItem('userInfo');
    if (savedUser) {
      const { token } = JSON.parse(savedUser);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  } catch {}
  return config;
}, (error) => Promise.reject(error));

export default apiClient;
