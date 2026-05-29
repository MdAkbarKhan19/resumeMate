'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAI } from '@/hooks/useAI';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  PageLoading,
  ConfirmModal,
} from '@/components/ui';
import { toast } from '@/components/ui/Alert';
import { formatDate, formatCurrency } from '@/lib/utils';

type Tab = 'profile' | 'subscription' | 'ai-usage';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout, refresh } = useAuth();
  const { usageStats, getUsageStats } = useAI();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'ai-usage') {
      getUsageStats();
    }
  }, [activeTab]);

  if (authLoading) {
    return <PageLoading text="Loading settings..." />;
  }

  if (!user) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully');
        refresh();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsUpdating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('An error occurred while changing password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subscription cancelled successfully');
        setCancelModalOpen(false);
        refresh();
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('An error occurred while cancelling subscription');
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-gray-100 text-gray-600';
      case 'TIER1':
        return 'bg-amber-50 text-amber-700';
      case 'TIER2':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'Free';
      case 'TIER1':
        return 'Pack';
      case 'TIER2':
        return 'Pro';
      default:
        return plan;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const tabs = [
    { id: 'profile' as Tab, name: 'Profile', icon: '👤' },
    { id: 'subscription' as Tab, name: 'Subscription', icon: '💳' },
    { id: 'ai-usage' as Tab, name: 'AI Usage', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafc] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-500">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  font-medium text-sm transition-all
                  ${
                    activeTab === tab.id
                      ? 'bg-white text-amber-700 font-semibold rounded-lg px-4 py-2 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-xl px-6 py-2.5 font-medium hover:from-amber-500 hover:to-amber-500 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-xl px-6 py-2.5 font-medium hover:from-amber-500 hover:to-amber-500 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </CardContent>
            </Card>

            <div className="bg-white rounded-2xl border-2 border-red-100 p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={() => toast.info('Feature coming soon')}
                className="bg-red-600 text-white hover:bg-red-500 rounded-xl px-5 py-2.5 font-medium transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold ${getPlanBadgeColor(
                      user.planType
                    )}`}
                  >
                    {getPlanName(user.planType)}
                  </span>
                  <p className="mt-2 text-gray-500">
                    {user.planType === 'FREE' && '1 resume · 1 ATS/mo · 10 AI/day · watermarked PDF'}
                    {user.planType === 'TIER1' && '1 polished resume · 3 ATS · unlimited AI · clean PDF'}
                    {user.planType === 'TIER2' && 'Unlimited everything · clean PDF · priority support'}
                  </p>
                </div>
                {user.planType !== 'TIER2' && (
                  <Link href="/pricing">
                    <button className="bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-xl px-6 py-2.5 font-medium hover:from-amber-500 hover:to-amber-500 transition-all">
                      Upgrade Plan
                    </button>
                  </Link>
                )}
              </div>

              {user.subscriptionActive && user.subscriptionExpiry && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold text-amber-600">Active</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Next Billing Date</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(user.subscriptionExpiry)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {user.planType === 'TIER2' && user.subscriptionActive && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="text-gray-600 hover:text-gray-700 border border-gray-200 rounded-xl px-5 py-2.5 font-medium transition-all hover:bg-gray-50"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Credits</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user.planType === 'TIER2' ? '∞' : user.resumeCredits}
                  </p>
                  <p className="text-gray-500">
                    {user.planType === 'TIER2'
                      ? 'Unlimited Credits'
                      : 'Credits Remaining'}
                  </p>
                </div>
                {user.planType !== 'TIER2' && user.resumeCredits === 0 && (
                  <Link href="/pricing">
                    <button className="bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-xl px-6 py-2.5 font-medium hover:from-amber-500 hover:to-amber-500 transition-all">
                      Get More Credits
                    </button>
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
              <p className="text-gray-400 text-center py-8">
                No billing history available
              </p>
            </div>
          </div>
        )}

        {/* AI Usage Tab */}
        {activeTab === 'ai-usage' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily AI Usage</h3>
              {!usageStats ? (
                <p className="text-gray-400 text-center py-8">
                  Loading usage statistics...
                </p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Bullet Enhancements
                      </span>
                      <span className="text-sm text-gray-500">
                        {usageStats.bulletEnhancements} /{' '}
                        {user.planType === 'FREE' ? '10' : '∞'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-500 h-2 rounded-full transition-all"
                        style={{
                          width:
                            user.planType === 'FREE'
                              ? `${getUsagePercentage(
                                  usageStats.bulletEnhancements,
                                  10
                                )}%`
                              : '100%',
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Grammar Checks
                      </span>
                      <span className="text-sm text-gray-500">
                        {usageStats.grammarChecks} /{' '}
                        {user.planType === 'FREE' ? '10' : '∞'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all"
                        style={{
                          width:
                            user.planType === 'FREE'
                              ? `${getUsagePercentage(
                                  usageStats.grammarChecks,
                                  10
                                )}%`
                              : '100%',
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Summary Generations
                      </span>
                      <span className="text-sm text-gray-500">
                        {usageStats.summaryGenerations} /{' '}
                        {user.planType === 'FREE' ? '10' : '∞'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all"
                        style={{
                          width:
                            user.planType === 'FREE'
                              ? `${getUsagePercentage(
                                  usageStats.summaryGenerations,
                                  10
                                )}%`
                              : '100%',
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Job Description Matches
                      </span>
                      <span className="text-sm text-gray-500">
                        {usageStats.jdMatches} /{' '}
                        {user.planType === 'FREE' ? '10' : '∞'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all"
                        style={{
                          width:
                            user.planType === 'FREE'
                              ? `${getUsagePercentage(usageStats.jdMatches, 10)}%`
                              : '100%',
                        }}
                      ></div>
                    </div>
                  </div>

                  {user.planType === 'FREE' && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        You're on the Free plan with a daily limit of 10 AI
                        operations. Upgrade to get unlimited AI assistance.
                      </p>
                      <Link href="/pricing">
                        <button className="bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-xl px-6 py-2.5 font-medium hover:from-amber-500 hover:to-amber-500 transition-all">
                          Upgrade Now
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You'll lose access to unlimited resume credits and AI features at the end of your billing period."
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        variant="warning"
      />
    </div>
  );
};

export default SettingsPage;
