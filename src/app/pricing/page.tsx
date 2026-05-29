'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import CheckoutButton from '@/components/payment/CheckoutButton';
import { getDisplayPlans } from '@/lib/payment/plans';

// Comparison table — kept simple, anchored against international benchmarks.
const comparisonRows: {
  feature: string;
  free: string | boolean;
  pack: string | boolean;
  pro: string | boolean;
}[] = [
  { feature: 'Active resumes',          free: '1',     pack: '1',  pro: 'Unlimited' },
  { feature: 'ATS optimizations',       free: '3 / mo', pack: '5',  pro: 'Unlimited' },
  { feature: 'PDF download',            free: 'With watermark', pack: 'No watermark', pro: 'No watermark' },
  { feature: 'Templates',               free: 'Both',  pack: 'Both', pro: 'Both' },
  { feature: 'Advanced customization',  free: false,   pack: true, pro: true },
  { feature: 'Auto-fit font sizing',    free: true,    pack: true, pro: true },
  { feature: 'Resume import (PDF/DOCX)', free: true,   pack: true, pro: true },
  { feature: 'AI bullet enhancement',   free: '10 / day', pack: 'Unlimited', pro: 'Unlimited' },
  { feature: 'Priority support',        free: false,   pack: false, pro: true },
];

const faqs = [
  {
    question: 'Which plan should I pick?',
    answer:
      'If you\'re applying to one specific job, grab the ₹149 Single Resume Pack — pay once, no subscription. If you\'re actively job-hunting, Pro Monthly (₹299) is the sweet spot. Pro Annual (₹1,999) is the best value if you know you\'ll use it for 6+ months.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. Cancel from your Dashboard → Settings. Your access continues until the end of the paid period, then auto-downgrades to Free. We never charge after cancellation.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'UPI and Credit/Debit Cards (Visa, Mastercard, RuPay) and Net Banking — all secured via Razorpay.',
  },
  {
    question: 'Will my resume look the same in the downloaded PDF as in the preview?',
    answer:
      'Yes — both render from the same template engine with the same data, colors, fonts, and font-size settings. What you see is what you download.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'The ₹149 pack is non-refundable. Subscriptions can be cancelled anytime; you keep access until the period ends and won\'t be billed again.',
  },
  {
    question: 'Will the AI changes look authentic?',
    answer:
      "Yes — our optimizer doesn't blanket-add keywords. It picks the single best-matching bullet for each JD keyword and shows you every change before you apply it, so you can edit or reject anything.",
  },
];

type IconKey = 'upi' | 'card' | 'bank';
const paymentMethods: { name: string; icon: IconKey }[] = [
  { name: 'UPI', icon: 'upi' },
  { name: 'Credit / Debit Cards', icon: 'card' },
  { name: 'Net Banking', icon: 'bank' },
];

const PAYMENT_ICONS: Record<IconKey, React.ReactNode> = {
  upi: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="6" y="3" width="12" height="18" rx="2.5" />
      <path d="M11 18h2" strokeLinecap="round" />
    </svg>
  ),
  card: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" strokeLinecap="round" />
    </svg>
  ),
  bank: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 10l9-6 9 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v8M9 10v8M15 10v8M19 10v8" strokeLinecap="round" />
      <path d="M3 20h18" strokeLinecap="round" />
    </svg>
  ),
};

const renderFeatureCell = (val: string | boolean) => {
  if (val === true) {
    return (
      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (val === false) {
    return (
      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }
  return <span className="text-gray-500">{val}</span>;
};

const PricingPage: React.FC = () => {
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
  const plans = getDisplayPlans();

  const toggleFaq = (index: number) => {
    setSelectedFaq(selectedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#fafafc]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white py-16">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Pricing that fits your job hunt
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
            Pay once for a single application, or subscribe for unlimited.
            <span className="block mt-2 text-base text-indigo-200">
              From ₹149 · Best price guaranteed · Cancel anytime
            </span>
          </p>
        </div>
      </div>

      {/* Pricing cards — 5 plans in a responsive grid (1 → 2 → 5 cols) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-white rounded-2xl transition-all flex flex-col ${
                plan.popular
                  ? 'border-2 border-indigo-300 shadow-lg shadow-indigo-200/40 hover:-translate-y-1'
                  : 'border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow shadow-indigo-500/25 whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.savingsLabel && !plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                    {plan.savingsLabel}
                  </span>
                </div>
              )}

              <CardContent className="p-5 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500 min-h-[2rem]">{plan.tagline}</p>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline">
                    <span className="text-sm text-gray-500 mr-0.5">₹</span>
                    <span className="text-3xl font-extrabold text-gray-900">
                      {plan.displayAmount}
                    </span>
                    <span className="text-gray-400 ml-1.5 text-sm">{plan.cadence}</span>
                  </div>
                  {plan.id === 'pro_quarterly' && (
                    <p className="text-xs text-gray-400 mt-1">~₹233 / month</p>
                  )}
                  {plan.id === 'pro_annual' && (
                    <p className="text-xs text-gray-400 mt-1">~₹167 / month</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 mt-0.5 bg-emerald-50 rounded-full inline-flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-xs text-gray-600 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.kind === 'free' ? (
                  <Link href="/auth/signup" className="block">
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                    >
                      Get Started Free
                    </Button>
                  </Link>
                ) : (
                  <CheckoutButton
                    planId={plan.id}
                    size="md"
                    variant={plan.popular ? 'primary' : 'outline'}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/25 border-0'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                    }`}
                    buttonText={plan.kind === 'one_time' ? `Buy for ₹${plan.displayAmount}` : `Choose ${plan.name}`}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Best-price-guaranteed badge */}
        <div className="mb-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">Best price guaranteed</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Honest pricing for job seekers. No subscription traps.
            </p>
          </div>
        </div>

        {/* Compare-feature table */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6">
            Compare features
          </h2>
          <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Free</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Pack ₹149</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-700">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comparisonRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm text-gray-700">{row.feature}</td>
                        <td className="px-6 py-3 text-sm text-center">{renderFeatureCell(row.free)}</td>
                        <td className="px-6 py-3 text-sm text-center">{renderFeatureCell(row.pack)}</td>
                        <td className="px-6 py-3 text-sm text-center">{renderFeatureCell(row.pro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment methods */}
        <div className="mb-16 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Payment methods accepted
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm text-gray-700"
              >
                <span className="text-indigo-600">{PAYMENT_ICONS[method.icon]}</span>
                <span className="font-medium text-sm">{method.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Secured by Razorpay · UPI · Cards · Net Banking
          </p>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently asked
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${selectedFaq === index ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {selectedFaq === index && (
                    <div className="px-6 pb-4 text-gray-500 border-t border-gray-100 pt-4 text-sm">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Closing CTA */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-3xl shadow-xl p-8 md:p-12 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Try it free — no card needed
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Upload your existing resume or start from scratch. Run 3 ATS optimizations
            on us — see the score jump before you pay a rupee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button variant="secondary" size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg">
                Start Free
              </Button>
            </Link>
            <Link href="/builder">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Go to Builder
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
