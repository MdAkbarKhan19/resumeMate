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
    { name: 'Templates', href: '/templates', public: true },
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
    <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow duration-300">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              {/* Pulsing agent dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
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
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                {item.name}
                {/* Active indicator dot */}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isLoading ? (
              // Show loading state while checking authentication
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 border-0">
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
                <Button variant="outline" size="sm" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 border-0">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 border-0 text-white transition-all duration-300">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 transition-colors duration-200"
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
        <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {/* Active indicator dot in mobile */}
                {isActive(item.href) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 flex-shrink-0"></span>
                )}
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-white/[0.06]">
            {isLoading ? (
              <div className="px-3 py-2 flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <div className="px-2 space-y-1">
                <Link
                  href="/dashboard/settings"
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors duration-200"
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
                  <Button variant="ghost" size="md" className="w-full text-slate-300 hover:text-white hover:bg-white/10 border-0">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border-0 text-white">
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
