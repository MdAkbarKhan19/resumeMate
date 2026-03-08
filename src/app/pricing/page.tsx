'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent, Modal } from '@/components/ui';
import CheckoutButton from '@/components/payment/CheckoutButton';
import { formatCurrency } from '@/lib/utils';

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    interval: null,
    description: 'Perfect for getting started',
    features: [
      '1 Resume Credit',
      '2 Basic Templates',
      'Basic ATS Analysis',
      'Limited AI Assistance (10/day)',
      'PDF Export',
      'Community Support',
    ],
    limitations: [
      'No custom templates',
      'No advanced AI features',
      'No priority support',
    ],
    cta: 'Get Started Free',
    ctaLink: '/auth/signup',
    popular: false,
    color: 'gray',
  },
  {
    id: 'TIER1',
    name: 'Tier 1',
    price: 1499,
    interval: 'one-time',
    description: 'Best for job seekers',
    features: [
      '5 Resume Credits',
      'All 5 Premium Templates',
      'Advanced ATS Analysis',
      'Unlimited AI Assistance',
      'PDF & DOCX Export',
      'Priority Email Support',
      'Job Description Matching',
      'Grammar & Redundancy Check',
      'Lifetime Access',
    ],
    limitations: [],
    cta: 'Get Tier 1',
    ctaLink: '/auth/signup?plan=tier1',
    popular: true,
    color: 'blue',
  },
  {
    id: 'TIER2',
    name: 'Tier 2',
    price: 1999,
    interval: 'monthly',
    description: 'For professionals & recruiters',
    features: [
      'Unlimited Resume Credits',
      'All 5 Premium Templates',
      'Advanced ATS Analysis',
      'Unlimited AI Assistance',
      'PDF & DOCX Export',
      'Priority 24/7 Support',
      'Job Description Matching',
      'Grammar & Redundancy Check',
      'Custom Branding',
      'Team Collaboration (Coming Soon)',
      'API Access (Coming Soon)',
    ],
    limitations: [],
    cta: 'Subscribe Now',
    ctaLink: '/auth/signup?plan=tier2',
    popular: false,
    color: 'purple',
  },
];

const features = [
  { name: 'Resume Credits', free: '1', tier1: '5', tier2: 'Unlimited' },
  { name: 'Templates', free: '2 Basic', tier1: 'All 5 Premium', tier2: 'All 5 Premium' },
  { name: 'ATS Analysis', free: 'Basic', tier1: 'Advanced', tier2: 'Advanced' },
  { name: 'AI Assistance (per day)', free: '10', tier1: 'Unlimited', tier2: 'Unlimited' },
  { name: 'Export Formats', free: 'PDF', tier1: 'PDF & DOCX', tier2: 'PDF & DOCX' },
  { name: 'Job Description Matching', free: '✗', tier1: '✓', tier2: '✓' },
  { name: 'Grammar Check', free: '✗', tier1: '✓', tier2: '✓' },
  { name: 'Redundancy Detection', free: '✗', tier1: '✓', tier2: '✓' },
  { name: 'Custom Branding', free: '✗', tier1: '✗', tier2: '✓' },
  { name: 'Priority Support', free: '✗', tier1: 'Email', tier2: '24/7' },
];

const faqs = [
  {
    question: 'What are Resume Credits?',
    answer:
      'Resume Credits determine how many unique resumes you can create. Free plan includes 1 credit, Tier 1 includes 5 credits, and Tier 2 offers unlimited resume creation.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Yes! You can upgrade from Free to Tier 1 or Tier 2 at any time. For Tier 2 subscribers, you can cancel your subscription anytime, and your access will continue until the end of the billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major Indian payment methods including UPI, Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Wallets (Paytm, PhonePe, Google Pay), and EMI options through Razorpay.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely! We use industry-standard encryption and secure AWS infrastructure to protect your data. Your resumes are stored securely and never shared with third parties.',
  },
  {
    question: 'What is ATS Analysis?',
    answer:
      'ATS (Applicant Tracking System) Analysis checks your resume against common ATS software used by companies. It provides a score and suggestions to improve your resume\'s chances of passing through automated screening.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Tier 1 is a one-time payment with lifetime access and is non-refundable. For Tier 2 monthly subscriptions, you can cancel anytime and won\'t be charged for the next billing cycle.',
  },
  {
    question: 'Can I export my resume after my subscription ends?',
    answer:
      'Yes! All resumes you create remain accessible and can be exported even after your subscription ends. However, you won\'t be able to create new resumes or use AI features without an active plan.',
  },
  {
    question: 'Is there a limit to AI usage?',
    answer:
      'Free plan users get 10 AI operations per day. Tier 1 and Tier 2 users have unlimited AI assistance including bullet enhancement, summary generation, and grammar checking.',
  },
];

const paymentMethods = [
  { name: 'UPI', icon: '📱' },
  { name: 'Credit/Debit Cards', icon: '💳' },
  { name: 'Net Banking', icon: '🏦' },
  { name: 'Wallets', icon: '👛' },
  { name: 'EMI', icon: '💰' },
];

const PricingPage: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setSelectedFaq(selectedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#fafafc]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white py-16">
        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Choose Your Plan
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
            Create professional, ATS-optimized resumes with AI assistance.
            Start free or unlock premium features.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              variant={plan.popular ? 'elevated' : 'bordered'}
              className={`relative ${
                plan.popular
                  ? 'bg-white rounded-2xl border-2 border-indigo-200 shadow-card glow-indigo hover:-translate-y-1 transition-all'
                  : 'bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/25">
                    Most Popular
                  </span>
                </div>
              )}
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {formatCurrency(plan.price)}
                    </span>
                    {plan.interval && (
                      <span className="text-gray-400 ml-2">
                        /{plan.interval === 'monthly' ? 'month' : 'one-time'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <svg
                          className="w-3.5 h-3.5 text-emerald-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.ctaLink}>
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Compare Plans
          </h2>
          <Card className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Free
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Tier 1
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Tier 2
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {features.map((feature, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {feature.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {feature.free}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {feature.tier1}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {feature.tier2}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="mb-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All Indian Payment Methods Accepted
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl border border-gray-100 shadow-sm"
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="text-gray-600 font-medium">{method.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-gray-400">
            Powered by Razorpay - Secure & Trusted Payments
          </p>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-100">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                  >
                    <span className="font-medium text-gray-900">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        selectedFaq === index ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {selectedFaq === index && (
                    <div className="px-6 pb-4 text-gray-500 border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-3xl shadow-xl p-8 md:p-12 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Build Your Perfect Resume?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have landed their dream jobs with
            ResumeMate's ATS-optimized resumes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button variant="secondary" size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg">
                Start Free
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                View Templates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
