'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      title,
      description,
      icon,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      info: {
        container: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
        icon: 'text-cyan-400',
        title: 'text-cyan-300',
      },
      success: {
        container: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        icon: 'text-emerald-400',
        title: 'text-emerald-300',
      },
      warning: {
        container: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        icon: 'text-amber-400',
        title: 'text-amber-300',
      },
      error: {
        container: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        icon: 'text-rose-400',
        title: 'text-rose-300',
      },
    };

    const defaultIcons = {
      info: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
      success: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      error: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative rounded-xl border p-4',
          variants[variant].container,
          className
        )}
        {...props}
      >
        <div className="flex items-start">
          <div className={cn('flex-shrink-0', variants[variant].icon)}>
            {icon || defaultIcons[variant]}
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={cn('text-sm font-medium', variants[variant].title)}>
                {title}
              </h3>
            )}
            {(description || children) && (
              <div className="mt-1 text-sm">
                {description || children}
              </div>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onDismiss}
              className="ml-3 inline-flex flex-shrink-0 rounded-md p-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;

// Toast notification system
export interface ToastMessage {
  id: string;
  variant: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  description: string;
  duration?: number;
}

let toastListeners: ((message: ToastMessage) => void)[] = [];

export const toast = {
  show: (message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const fullMessage: ToastMessage = {
      id,
      duration: 5000,
      ...message,
    };
    toastListeners.forEach((listener) => listener(fullMessage));
  },
  success: (description: string, title?: string) => {
    toast.show({ variant: 'success', description, title });
  },
  error: (description: string, title?: string) => {
    toast.show({ variant: 'error', description, title });
  },
  warning: (description: string, title?: string) => {
    toast.show({ variant: 'warning', description, title });
  },
  info: (description: string, title?: string) => {
    toast.show({ variant: 'info', description, title });
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (message: ToastMessage) => {
      setToasts((prev) => [...prev, message]);

      if (message.duration) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== message.id));
        }, message.duration);
      }
    };

    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md backdrop-blur-sm">
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          dismissible
          onDismiss={() => removeToast(toast.id)}
          className="animate-slide-in shadow-lg"
        />
      ))}
    </div>
  );
};
