import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      type = 'text',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5',
              'text-gray-900 placeholder-gray-400',
              'focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500',
              'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400',
              'transition-all duration-200',
              error && 'border-red-300 focus:ring-red-500/30 focus:border-red-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'error-message' : helperText ? 'helper-text' : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p id="error-message" className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id="helper-text" className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
