import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * This ensures proper class override behavior
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Friendly relative time, e.g. "Just now", "5 minutes ago", "Yesterday",
 * "3 days ago". Falls back to an absolute date for anything older than ~30 days.
 * Used on saved-resume cards so users can tell at a glance which one they
 * edited most recently.
 */
export function relativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const ms = d.getTime();
  if (isNaN(ms)) return '';
  const diffSec = Math.round((Date.now() - ms) / 1000);

  if (diffSec < 0) return 'Just now'; // clock skew / future timestamp
  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1 minute ago';

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 30) return `${diffDay} days ago`;

  return formatDate(d);
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Calculate ATS score color
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-amber-600';   // great → brand gold
  if (score >= 60) return 'text-gray-600';     // ok → neutral
  return 'text-red-600';                        // poor → red
}

/**
 * Calculate ATS score background color
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-amber-100';
  if (score >= 60) return 'bg-gray-100';
  return 'bg-red-100';
}
