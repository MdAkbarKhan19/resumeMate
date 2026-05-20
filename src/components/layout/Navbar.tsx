'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const navigation = [
    { name: 'Home', href: '/', public: true },
    { name: 'Pricing', href: '/pricing', public: true },
    { name: 'Dashboard', href: '/dashboard', public: false },
    { name: 'Builder', href: '/builder', public: false },
    { name: 'ATS Optimizer', href: '/builder/ats', public: false },
  ];

  const filteredNav = navigation.filter(
    (item) => item.public || isAuthenticated
  );

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              {/* Pulsing agent dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
              ResumeMate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md',
                  isActive(item.href)
                    ? 'text-indigo-600 font-semibold'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/60'
                )}
              >
                {item.name}
                {/* Active indicator dot */}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isLoading ? (
              // Show loading state while checking authentication
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 border-0">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {user?.name || user?.email || 'Profile'}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 border-0">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 border-0 text-white transition-all duration-300">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {!isMobileMenuOpen ? (
              <svg
                className="block h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            ) : (
              <svg
                className="block h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {/* Active indicator dot in mobile */}
                {isActive(item.href) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                )}
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-100">
            {isLoading ? (
              <div className="px-3 py-2 flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <div className="px-2 space-y-1">
                <Link
                  href="/dashboard/settings"
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors duration-200"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-2">
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="md" className="w-full text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 border-0">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 border-0 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
