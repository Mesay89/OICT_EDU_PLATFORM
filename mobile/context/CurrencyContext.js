import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('ETB');
  const [rates, setRates] = useState({ USD: 150, EUR: 165 });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data } = await apiClient.get('/settings');
        if (data && data.etbUsdRate) {
          setRates({ USD: data.etbUsdRate, EUR: data.etbUsdRate * 1.1 });
        }
      } catch (err) {
        console.log('Failed to fetch exchange rates, using fallbacks');
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const loadCurrency = async () => {
      const saved = await AsyncStorage.getItem('userCurrency');
      if (saved) setCurrency(saved);
    };
    loadCurrency();
  }, []);

  const updateCurrency = async (newCurrency) => {
    setCurrency(newCurrency);
    await AsyncStorage.setItem('userCurrency', newCurrency);
  };

  const formatPrice = (priceInETB) => {
    if (!priceInETB || priceInETB === 0) return { amount: 0, formatted: 'Free' };
    
    let amount = priceInETB;
    let symbol = 'ETB';
    let suffix = ' ETB';
    let prefix = '';

    if (currency === 'USD') {
      amount = priceInETB / rates.USD;
      symbol = '$';
      prefix = '$';
      suffix = '';
    } else if (currency === 'EUR') {
      amount = priceInETB / rates.EUR;
      symbol = '€';
      prefix = '€';
      suffix = '';
    }

    return {
      value: amount.toFixed(2),
      symbol,
      formatted: `${prefix}${amount.toFixed(2)}${suffix}`
    };
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
