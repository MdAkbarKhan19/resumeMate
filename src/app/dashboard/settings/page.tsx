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
        return 'bg-gray-100 text-gray-800';
      case 'TIER1':
        return 'bg-blue-100 text-blue-800';
      case 'TIER2':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'Free';
      case 'TIER1':
        return 'Tier 1';
      case 'TIER2':
        return 'Tier 2';
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <Input
                    label="Name"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    required
                  />
                  <Button type="submit" variant="primary" isLoading={isUpdating}>
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Input
                    label="Current Password"
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
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    helperText="Must be at least 8 characters"
                    required
                  />
                  <Input
                    label="Confirm New Password"
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
                  <Button type="submit" variant="primary" isLoading={isUpdating}>
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Danger Zone
                </h3>
                <p className="text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be
                  certain.
                </p>
                <Button variant="danger" onClick={() => toast.info('Feature coming soon')}>
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getPlanBadgeColor(
                        user.planType
                      )}`}
                    >
                      {getPlanName(user.planType)}
                    </span>
                    <p className="mt-2 text-gray-600">
                      {user.planType === 'FREE' && '1 Resume Credit'}
                      {user.planType === 'TIER1' && '5 Resume Credits'}
                      {user.planType === 'TIER2' && 'Unlimited Resume Credits'}
                    </p>
                  </div>
                  {user.planType !== 'TIER2' && (
                    <Link href="/pricing">
                      <Button variant="primary">Upgrade Plan</Button>
                    </Link>
                  )}
                </div>

                {user.subscriptionActive && user.subscriptionExpiry && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-semibold text-green-600">Active</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Next Billing Date</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(user.subscriptionExpiry)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {user.planType === 'TIER2' && user.subscriptionActive && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCancelModalOpen(true)}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {user.planType === 'TIER2' ? '∞' : user.resumeCredits}
                    </p>
                    <p className="text-gray-600">
                      {user.planType === 'TIER2'
                        ? 'Unlimited Credits'
                        : 'Credits Remaining'}
                    </p>
                  </div>
                  {user.planType !== 'TIER2' && user.resumeCredits === 0 && (
                    <Link href="/pricing">
                      <Button variant="primary">Get More Credits</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center py-8">
                  No billing history available
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Usage Tab */}
        {activeTab === 'ai-usage' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily AI Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {!usageStats ? (
                  <p className="text-gray-600 text-center py-8">
                    Loading usage statistics...
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Bullet Enhancements
                        </span>
                        <span className="text-sm text-gray-600">
                          {usageStats.bulletEnhancements} /{' '}
                          {user.planType === 'FREE' ? '10' : '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
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
                        <span className="text-sm text-gray-600">
                          {usageStats.grammarChecks} /{' '}
                          {user.planType === 'FREE' ? '10' : '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
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
                        <span className="text-sm text-gray-600">
                          {usageStats.summaryGenerations} /{' '}
                          {user.planType === 'FREE' ? '10' : '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
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
                        <span className="text-sm text-gray-600">
                          {usageStats.jdMatches} /{' '}
                          {user.planType === 'FREE' ? '10' : '∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all"
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
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-600 mb-4">
                          You're on the Free plan with a daily limit of 10 AI
                          operations. Upgrade to get unlimited AI assistance.
                        </p>
                        <Link href="/pricing">
                          <Button variant="primary">Upgrade Now</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
