'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/Alert';
import { formatCurrency } from '@/lib/utils';

interface CheckoutButtonProps {
  planType: 'TIER1' | 'TIER2';
  amount: number;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  planType,
  amount,
  buttonText,
  variant = 'primary',
  size = 'md',
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setIsLoading(false);
        return;
      }

      // Create order
      const token = localStorage.getItem('token');
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType, amount }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        toast.error(orderData.error || 'Failed to create order');
        setIsLoading(false);
        return;
      }

      // Get user info
      const userResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy',
        amount: orderData.amount,
        currency: 'INR',
        name: 'ResumeMate',
        description: `${planType === 'TIER1' ? 'Tier 1' : 'Tier 2'} Plan`,
        order_id: orderData.orderId,
        prefill: {
          name: userData.name,
          email: userData.email,
          contact: userData.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              toast.success('Payment successful! Your plan has been upgraded.');
              onSuccess?.();
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 2000);
            } else {
              toast.error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            toast.error('Failed to verify payment. Please contact support.');
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred during checkout');
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCheckout}
      isLoading={isLoading}
    >
      {buttonText || `Pay ${formatCurrency(amount)}`}
    </Button>
  );
};

export default CheckoutButton;
