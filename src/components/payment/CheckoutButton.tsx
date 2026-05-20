'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/Alert';
import { getPlan } from '@/lib/payment/plans';

interface CheckoutButtonProps {
  /** Catalog plan id: 'pack' | 'pro_monthly' | 'pro_quarterly' | 'pro_annual' */
  planId: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  planId,
  buttonText,
  variant = 'primary',
  size = 'md',
  className,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const plan = getPlan(planId);

  // Free tier should never render a paying button — surface a clear error
  // so callers don't accidentally wire this up to the free CTA.
  if (!plan) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        Unknown plan
      </Button>
    );
  }
  if (plan.kind === 'free') {
    return null;
  }

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error('Failed to load payment gateway. Please try again.');
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Fetch user for prefill
      const userResp = await fetch('/api/auth/me', { headers: authHeaders });
      const userJson = await userResp.json();
      const userInfo = userJson?.data?.user || {};

      if (plan.kind === 'one_time') {
        // ---- Orders API path ----
        const orderResp = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ planId: plan.id }),
        });
        const orderJson = await orderResp.json();
        if (!orderResp.ok || !orderJson.success) {
          toast.error(orderJson.error?.message || 'Failed to create order');
          setIsLoading(false);
          return;
        }
        const order = orderJson.data;

        const rzp = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: 'ResumeMate',
          description: plan.name,
          order_id: order.orderId,
          prefill: {
            name: userInfo.name || '',
            email: userInfo.email || '',
            contact: userInfo.phone || '',
          },
          theme: { color: '#4f46e5' },
          handler: async (response: any) => {
            try {
              const verifyResp = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyJson = await verifyResp.json();
              if (verifyResp.ok && verifyJson.success) {
                toast.success(`${plan.name} unlocked. Redirecting...`);
                onSuccess?.();
                setTimeout(() => (window.location.href = '/dashboard'), 1500);
              } else {
                toast.error(verifyJson.error?.message || 'Payment verification failed');
              }
            } catch {
              toast.error('Could not verify payment. Please contact support.');
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              toast.info('Payment cancelled');
            },
          },
        });
        rzp.open();
        return;
      }

      // ---- Subscriptions API path (Pro Monthly/Quarterly/Annual) ----
      // Razorpay subscriptions need a customer name + contact upfront; we
      // collect what we have and prompt for the rest only if missing.
      let contact = userInfo.phone || '';
      let name = userInfo.name || '';
      if (!contact || contact.length < 10) {
        const entered = window.prompt('Enter your 10-digit mobile number for the subscription:');
        if (!entered) {
          setIsLoading(false);
          toast.info('Subscription cancelled');
          return;
        }
        contact = entered.replace(/\D/g, '').slice(0, 10);
        if (contact.length !== 10) {
          toast.error('Invalid mobile number');
          setIsLoading(false);
          return;
        }
      }
      if (!name || name.length < 2) {
        const entered = window.prompt('Enter your name for the subscription:');
        if (!entered) {
          setIsLoading(false);
          return;
        }
        name = entered.trim();
      }

      const subResp = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ planId: plan.id, name, contact }),
      });
      const subJson = await subResp.json();
      if (!subResp.ok || !subJson.success) {
        toast.error(subJson.error?.message || 'Failed to create subscription');
        setIsLoading(false);
        return;
      }
      const sub = subJson.data;

      // Open Razorpay Checkout in subscription mode. On success the webhook
      // (subscription.activated) flips the user's plan server-side — no need
      // for a /verify round-trip from the browser.
      const rzp = new window.Razorpay({
        key: sub.key,
        subscription_id: sub.subscriptionId,
        name: 'ResumeMate',
        description: plan.name,
        prefill: { name, email: userInfo.email || '', contact },
        theme: { color: '#4f46e5' },
        handler: () => {
          toast.success(`${plan.name} active. Redirecting...`);
          onSuccess?.();
          setTimeout(() => (window.location.href = '/dashboard'), 1500);
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast.info('Subscription cancelled');
          },
        },
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred during checkout');
      setIsLoading(false);
    }
  };

  const defaultLabel = plan.kind === 'one_time' ? `Pay ₹${plan.displayAmount}` : `Subscribe ₹${plan.displayAmount}`;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCheckout}
      isLoading={isLoading}
      className={className}
    >
      {buttonText || defaultLabel}
    </Button>
  );
};

export default CheckoutButton;
