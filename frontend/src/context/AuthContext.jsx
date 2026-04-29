import { createContext, useState, useEffect, useCallback } from 'react';
import BASE_URL from '../api/config';

export const AuthContext = createContext();

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user info is in localStorage
    const savedUser = localStorage.getItem('userInfo');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear(); // Complete wipe of all session data
    setUser(null);
    // Redirect to homepage and force a full page refresh to clear browser memory/forms
    window.location.href = '/'; 
  };

  // Role checking utilities
  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const isAdmin = () => hasRole(ROLES.ADMIN);
  const isInstructor = () => hasRole(ROLES.INSTRUCTOR);
  const isStudent = () => hasRole(ROLES.STUDENT);
  const isInstructorOrAdmin = () => hasAnyRole([ROLES.INSTRUCTOR, ROLES.ADMIN]);

  const refreshProfile = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const response = await fetch(`${BASE_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh profile');
      }

      const data = await response.json();
      const updatedUser = { ...user, ...data };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to sync profile:', err);
    }
  }, [user, setUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      hasRole,
      hasAnyRole,
      isAdmin,
      isInstructor,
      isStudent,
      isInstructorOrAdmin,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
