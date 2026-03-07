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
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            className={cn(
              'block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5',
              'text-white placeholder-slate-500',
              'focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
              'disabled:bg-white/[0.02] disabled:cursor-not-allowed disabled:text-slate-600',
              'transition-all duration-200 resize-y backdrop-blur-sm',
              error && 'border-rose-500/50 focus:ring-rose-500/50',
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
              <p id="error-message" className="text-sm text-rose-400">
                {error}
              </p>
            )}
            {!error && helperText && (
              <p id="helper-text" className="text-sm text-slate-500">
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
                  : 'text-slate-500'
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
