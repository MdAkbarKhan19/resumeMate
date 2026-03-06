import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const Spinner = () => (
    <svg
      className={cn('animate-spin text-blue-600', sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const Dots = () => {
    const dotSize = {
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4',
      xl: 'h-5 w-5',
    };

    return (
      <div className="flex space-x-2">
        <div className={cn('rounded-full bg-blue-600 animate-bounce', dotSize[size])} />
        <div className={cn('rounded-full bg-blue-600 animate-bounce delay-100', dotSize[size])} />
        <div className={cn('rounded-full bg-blue-600 animate-bounce delay-200', dotSize[size])} />
      </div>
    );
  };

  const Pulse = () => (
    <div className={cn('rounded-full bg-blue-600 animate-pulse', sizes[size])} />
  );

  const renderVariant = () => {
    switch (variant) {
      case 'spinner':
        return <Spinner />;
      case 'dots':
        return <Dots />;
      case 'pulse':
        return <Pulse />;
      default:
        return <Spinner />;
    }
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {renderVariant()}
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;

// Skeleton loading component for content placeholders
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
  ...props
}) => {
  const baseClass = 'animate-pulse bg-gray-200';

  const variantClass = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
  };

  if (count === 1) {
    return (
      <div
        className={cn(baseClass, variantClass[variant], className)}
        style={style}
        {...props}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(baseClass, variantClass[variant], className)}
          style={style}
          {...props}
        />
      ))}
    </div>
  );
};

// Page loading component
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
};

// Section loading skeleton
export const SectionSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" count={3} />
      <div className="flex gap-4">
        <Skeleton variant="rectangular" width={200} height={40} />
        <Skeleton variant="rectangular" width={200} height={40} />
      </div>
    </div>
  );
};
