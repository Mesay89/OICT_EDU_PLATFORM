import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../api/config';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // Try to get from localStorage or default to ETB
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('app_currency') || 'ETB';
  });

  const [etbUsdRate, setEtbUsdRate] = useState(150);
  const [etbEurRate, setEtbEurRate] = useState(165);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/settings`);
        if (data && data.etbUsdRate) {
          setEtbUsdRate(data.etbUsdRate);
        }
      } catch (err) {
        console.error('Failed to fetch exchange rate, using fallback');
      }
    };
    fetchRate();
  }, []);

  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  // Convert ETB to the target currency
  const formatPrice = (price, isEarnings = false, originalCurrency = 'ETB') => {
    if ((!price || price === 0) && !isEarnings) return { amount: 0, formatted: 'Free' };
    
    // Normalize to ETB first
    let priceInETB = price || 0;
    if (originalCurrency === 'USD') priceInETB = price * etbUsdRate;
    else if (originalCurrency === 'EUR') priceInETB = price * etbEurRate;

    if (currency === 'USD') {
      const converted = priceInETB / etbUsdRate;
      return {
        amount: converted,
        formatted: `$${converted.toFixed(2)}`
      };
    }

    if (currency === 'EUR') {
      const converted = priceInETB / etbEurRate;
      return {
        amount: converted,
        formatted: `€${converted.toFixed(2)}`
      };
    }
    
    // Default ETB
    return {
      amount: priceInETB,
      formatted: `${priceInETB.toFixed(2)} ETB`
    };
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, etbUsdRate, etbEurRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
