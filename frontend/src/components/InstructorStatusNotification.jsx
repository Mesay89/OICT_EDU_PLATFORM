import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

const InstructorStatusNotification = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'instructor') {
    return null;
  }

  const getStatusConfig = () => {
    switch (user.status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          title: 'Approval Pending',
          message: 'Your instructor account is pending admin approval. You will be notified once approved.'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          title: 'Account Approved',
          message: 'Your instructor account has been approved! You can now create and manage courses.'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          title: 'Application Rejected',
          message: 'Your instructor application has been rejected. Please contact support for more information.'
        };
      case 'suspended':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          title: 'Account Suspended',
          message: 'Your instructor privileges have been suspended. Contact admin for assistance.',
          action: (
             <a href="mailto:mesayboja3@gmail.com?subject=Instructor Suspension Appeal" className="mt-2 inline-flex items-center text-sm font-bold text-red-700 hover:text-red-600 underline underline-offset-4">
                Message Admin Privately
             </a>
          )
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  if (!statusConfig || user.status === 'approved') {
    return null; // Don't show notification for approved instructors
  }

  return (
    <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-start">
        <div className={`${statusConfig.iconColor} flex-shrink-0`}>
          {statusConfig.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${statusConfig.textColor}`}>
            {statusConfig.title}
          </h3>
          <p className={`mt-1 text-sm ${statusConfig.textColor}`}>
            {statusConfig.message}
          </p>
          {statusConfig.action && statusConfig.action}
        </div>
      </div>
    </div>
  );
};

export default InstructorStatusNotification;