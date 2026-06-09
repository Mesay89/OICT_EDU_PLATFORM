import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimezoneContext = createContext();

export const TimezoneProvider = ({ children }) => {
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa');

  useEffect(() => {
    const loadTimezone = async () => {
      const saved = await AsyncStorage.getItem('userTimezone');
      if (saved) setTimezone(saved);
    };
    loadTimezone();
  }, []);

  const updateTimezone = async (newTimezone) => {
    setTimezone(newTimezone);
    await AsyncStorage.setItem('userTimezone', newTimezone);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { 
      timeZone: timezone,
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone: updateTimezone, formatDate }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => useContext(TimezoneContext);
