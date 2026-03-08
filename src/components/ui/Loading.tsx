'use client';

import React, { useState, useEffect } from 'react';
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
      className={cn('animate-spin text-indigo-600', sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const Dots = () => {
    const dotSize = { sm: 'h-2 w-2', md: 'h-3 w-3', lg: 'h-4 w-4', xl: 'h-5 w-5' };
    return (
      <div className="flex space-x-2">
        <div className={cn('rounded-full bg-indigo-500 animate-bounce', dotSize[size])} style={{ animationDelay: '0ms' }} />
        <div className={cn('rounded-full bg-violet-500 animate-bounce', dotSize[size])} style={{ animationDelay: '150ms' }} />
        <div className={cn('rounded-full bg-pink-500 animate-bounce', dotSize[size])} style={{ animationDelay: '300ms' }} />
      </div>
    );
  };

  const Pulse = () => (
    <div className={cn('rounded-full bg-indigo-500 animate-pulse', sizes[size])} />
  );

  const renderVariant = () => {
    switch (variant) {
      case 'spinner': return <Spinner />;
      case 'dots': return <Dots />;
      case 'pulse': return <Pulse />;
      default: return <Spinner />;
    }
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {renderVariant()}
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;

// Skeleton loading component
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width, height, count = 1, className, ...props
}) => {
  const baseClass = 'animate-pulse bg-gray-100 rounded';
  const variantClass = { text: 'rounded h-4', circular: 'rounded-full', rectangular: 'rounded-xl' };
  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
  };

  if (count === 1) {
    return <div className={cn(baseClass, variantClass[variant], className)} style={style} {...props} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(baseClass, variantClass[variant], className)} style={style} {...props} />
      ))}
    </div>
  );
};

// Agent status messages that cycle during loading
const AGENT_MESSAGES = [
  'Parsing document structure...',
  'Analyzing content patterns...',
  'Matching keywords to JD...',
  'Optimizing sections...',
  'Running ATS compatibility check...',
  'Finalizing recommendations...',
];

// Page loading -- "Agent doing magic" experience
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % AGENT_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[#fafafc]">
      {/* Agent magic animation */}
      <div className="relative w-28 h-28">
        {/* Central agent icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 animate-agent-think">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
        </div>

        {/* Orbiting sparkle 1 - pink */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-orbit">
            <div className="w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
          </div>
        </div>

        {/* Orbiting sparkle 2 - amber */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-orbit-reverse">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
          </div>
        </div>

        {/* Orbiting sparkle 3 - sky */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-orbit-slow">
            <div className="w-2 h-2 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50" />
          </div>
        </div>

        {/* Pulse ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl border-2 border-indigo-300/50 animate-pulse-ring" />
        </div>
      </div>

      {/* Status text area */}
      <div className="text-center space-y-2">
        <p className="text-base font-medium text-gray-800">{text}</p>
        <div className="flex items-center justify-center gap-2">
          <span className="agent-dot-active" />
          <p className="text-sm text-indigo-600 font-mono animate-fade-in" key={msgIndex}>
            {AGENT_MESSAGES[msgIndex]}
          </p>
        </div>
      </div>
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
