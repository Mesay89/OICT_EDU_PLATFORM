import React, { createContext, useContext, useState, useEffect } from 'react';

const TimezoneContext = createContext();

export const TimezoneProvider = ({ children }) => {
  const [timezone, setTimezone] = useState(localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    localStorage.setItem('userTimezone', timezone);
  }, [timezone]);

  const formatTime = (date, options = {}) => {
    return new Intl.DateTimeFormat('default', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(new Date(date));
  };

  const formatDate = (date, options = {}) => {
    return new Intl.DateTimeFormat('default', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(new Date(date));
  };

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone, formatTime, formatDate }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => useContext(TimezoneContext);
