/**
 * Razorpay Payment Service
 * Handles all payment operations including orders, subscriptions, and webhooks
 * Supports: UPI, Cards, Net Banking, Wallets, EMI, and all Indian payment methods
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number | string;
  amount_paid: number | string;
  amount_due: number | string;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, any>;
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: number;
  created_at: number;
  expire_by: number;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at: number | null;
  remaining_count: number;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string; // card, netbanking, wallet, emi, upi
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null; // UPI ID
  email: string;
  contact: string;
  notes: Record<string, any>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  created_at: number;
}

export class RazorpayService {
  /**
   * Create a one-time payment order (Tier 1)
   */
  static async createOrder(
    amount: number, // in paise (100 paise = 1 INR)
    receipt: string,
    notes: Record<string, any> = {}
  ): Promise<RazorpayOrder> {
    try {
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt,
        notes,
        payment_capture: true, // Auto capture payment
      });

      return order as unknown as RazorpayOrder;
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Create a Razorpay subscription.
   *
   * `total_count` is how many billing cycles before the subscription auto-ends.
   * Callers pass it per plan: monthly=12, quarterly=4, annual=1 (all = one year).
   */
  static async createSubscription(
    planId: string,
    customerNotify: number = 1,
    quantity: number = 1,
    notes: Record<string, any> = {},
    customerDetails?: {
      name: string;
      email: string;
      contact: string;
    },
    totalCount: number = 12,
  ): Promise<RazorpaySubscription> {
    try {
      const subscriptionData: any = {
        plan_id: planId,
        customer_notify: customerNotify,
        quantity,
        total_count: totalCount,
        notes,
      };

      if (customerDetails) {
        const customer = await razorpay.customers.create({
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.contact,
          notes,
        });
        subscriptionData.customer_id = customer.id;
      }

      const subscription = await razorpay.subscriptions.create(subscriptionData);

      return subscription as unknown as RazorpaySubscription;
    } catch (error) {
      console.error('Razorpay create subscription error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Fetch payment details by payment ID
   */
  static async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment as unknown as RazorpayPayment;
    } catch (error) {
      console.error('Razorpay fetch payment error:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Fetch order details by order ID
   */
  static async fetchOrder(orderId: string): Promise<RazorpayOrder> {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return order as unknown as RazorpayOrder;
    } catch (error) {
      console.error('Razorpay fetch order error:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Fetch subscription details
   */
  static async fetchSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return subscription as unknown as RazorpaySubscription;
    } catch (error) {
      console.error('Razorpay fetch subscription error:', error);
      throw new Error('Failed to fetch subscription details');
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = false
  ): Promise<RazorpaySubscription> {
    try {
      const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      return subscription as unknown as RazorpaySubscription;
    } catch (error) {
      console.error('Razorpay cancel subscription error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Pause a subscription
   */
  static async pauseSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
    try {
      const subscription = await razorpay.subscriptions.pause(subscriptionId);
      return subscription as unknown as RazorpaySubscription;
    } catch (error) {
      console.error('Razorpay pause subscription error:', error);
      throw new Error('Failed to pause subscription');
    }
  }

  /**
   * Resume a paused subscription
   */
  static async resumeSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
    try {
      const subscription = await razorpay.subscriptions.resume(subscriptionId);
      return subscription as unknown as RazorpaySubscription;
    } catch (error) {
      console.error('Razorpay resume subscription error:', error);
      throw new Error('Failed to resume subscription');
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(
    paymentId: string,
    amount?: number, // Optional: partial refund in paise
    notes: Record<string, any> = {}
  ): Promise<any> {
    try {
      const refundData: any = {
        notes,
      };

      if (amount) {
        refundData.amount = amount;
      }

      const refund = await razorpay.payments.refund(paymentId, refundData);
      return refund;
    } catch (error) {
      console.error('Razorpay refund error:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Verify payment signature for security
   * This should be called after receiving payment callback from frontend
   */
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');

      return generated_signature === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Get payment methods available for order
   */
  static async fetchPaymentMethods(orderId: string): Promise<any> {
    try {
      const methods = await razorpay.orders.fetchPayments(orderId);
      return methods;
    } catch (error) {
      console.error('Razorpay fetch payment methods error:', error);
      throw new Error('Failed to fetch payment methods');
    }
  }

  /**
   * Create a payment link for easy sharing
   */
  static async createPaymentLink(
    amount: number,
    description: string,
    customerDetails: {
      name: string;
      email: string;
      contact: string;
    },
    notes: Record<string, any> = {}
  ): Promise<any> {
    try {
      const paymentLink = await razorpay.paymentLink.create({
        amount,
        currency: 'INR',
        description,
        customer: {
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.contact,
        },
        notify: {
          sms: true,
          email: true,
        },
        reminder_enable: true,
        notes,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        callback_method: 'get',
      });

      return paymentLink;
    } catch (error) {
      console.error('Razorpay create payment link error:', error);
      throw new Error('Failed to create payment link');
    }
  }

  /**
   * Convert rupees to paise
   */
  static rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  /**
   * Convert paise to rupees
   */
  static paiseToRupees(paise: number): number {
    return paise / 100;
  }

  /**
   * Format amount for display
   */
  static formatAmount(paise: number): string {
    const rupees = this.paiseToRupees(paise);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees);
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodName(method: string): string {
    const methods: Record<string, string> = {
      card: 'Credit/Debit Card',
      netbanking: 'Net Banking',
      wallet: 'Wallet',
      emi: 'EMI',
      upi: 'UPI',
      cardless_emi: 'Cardless EMI',
      paylater: 'Pay Later',
      bank_transfer: 'Bank Transfer',
      offline: 'Offline',
      app: 'App',
    };

    return methods[method] || method;
  }
}
