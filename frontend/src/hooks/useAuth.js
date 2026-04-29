import { useContext } from 'react';
import { AuthContext, ROLES } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const useRole = () => {
  const { user, hasRole, hasAnyRole, isAdmin, isInstructor, isStudent, isInstructorOrAdmin } = useAuth();

  return {
    userRole: user?.role,
    hasRole,
    hasAnyRole,
    isAdmin,
    isInstructor,
    isStudent,
    isInstructorOrAdmin,
    canAccess: (allowedRoles) => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    }
  };
};

export default useAuth;