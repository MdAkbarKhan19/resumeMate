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
    <div className="min-h-screen bg-surface-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border-b border-white/[0.06] py-16">
        {/* Aurora effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -top-1/2 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-cyan-400/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Choose Your Plan
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto">
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
                  ? 'bg-white/[0.05] backdrop-blur-xl rounded-2xl border-2 border-cyan-500/40 shadow-glow-cyan'
                  : 'bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">
                      {formatCurrency(plan.price)}
                    </span>
                    {plan.interval && (
                      <span className="text-slate-500 ml-2">
                        /{plan.interval === 'monthly' ? 'month' : 'one-time'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-emerald-400 mr-2 mt-0.5 flex-shrink-0"
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
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.ctaLink}>
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full"
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
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Compare Plans
          </h2>
          <Card className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/[0.04]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                        Free
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                        Tier 1
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                        Tier 2
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {features.map((feature, index) => (
                      <tr key={index} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {feature.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-400">
                          {feature.free}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-400">
                          {feature.tier1}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-400">
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
          <h2 className="text-2xl font-bold text-white mb-4">
            All Indian Payment Methods Accepted
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex items-center gap-2 bg-white/[0.04] px-6 py-3 rounded-xl border border-white/[0.06]"
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="text-slate-300 font-medium">{method.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-slate-500">
            Powered by Razorpay - Secure & Trusted Payments
          </p>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06]">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/[0.04] transition-colors rounded-2xl"
                  >
                    <span className="font-semibold text-white">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-slate-500 transition-transform ${
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
                    <div className="px-6 pb-4 text-slate-400 border-t border-white/[0.06] pt-4">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-cyan-600/80 to-violet-600/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-12 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Build Your Perfect Resume?
          </h2>
          <p className="text-xl text-cyan-100/80 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have landed their dream jobs with
            ResumeMate's ATS-optimized resumes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button variant="secondary" size="lg" className="bg-white text-cyan-600 hover:bg-gray-100">
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
