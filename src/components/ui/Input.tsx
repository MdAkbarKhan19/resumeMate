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
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-500">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5',
              'text-white placeholder-slate-500',
              'focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
              'disabled:bg-white/[0.02] disabled:cursor-not-allowed disabled:text-slate-600',
              'transition-all duration-200 backdrop-blur-sm',
              error && 'border-rose-500/50 focus:ring-rose-500/50',
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
              <span className="text-slate-500">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p id="error-message" className="mt-1 text-sm text-rose-400">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id="helper-text" className="mt-1 text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
