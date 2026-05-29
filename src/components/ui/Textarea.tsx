import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  showCharCount?: boolean;
  maxCharCount?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      containerClassName,
      showCharCount = false,
      maxCharCount,
      disabled,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const charCount = typeof value === 'string' ? value.length : 0;
    const showCount = showCharCount || maxCharCount;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            className={cn(
              'block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5',
              'text-gray-900 placeholder-gray-400',
              'focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500',
              'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400',
              'transition-all duration-200 resize-y',
              error && 'border-red-300 focus:ring-red-500/30 focus:border-red-500',
              className
            )}
            disabled={disabled}
            value={value}
            maxLength={maxCharCount}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'error-message' : helperText ? 'helper-text' : undefined}
            {...props}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex-1">
            {error && (
              <p id="error-message" className="text-sm text-red-500">
                {error}
              </p>
            )}
            {!error && helperText && (
              <p id="helper-text" className="text-sm text-gray-500">
                {helperText}
              </p>
            )}
          </div>
          {showCount && (
            <span
              className={cn(
                'text-sm',
                maxCharCount && charCount > maxCharCount * 0.9
                  ? 'text-orange-600'
                  : 'text-gray-400'
              )}
            >
              {charCount}
              {maxCharCount && `/${maxCharCount}`}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
