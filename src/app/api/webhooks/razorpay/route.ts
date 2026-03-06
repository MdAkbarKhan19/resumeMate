import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/payment/razorpay';
import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const isValid = RazorpayService.verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload.payment || event.payload.subscription || event.payload.refund;

    console.log('Razorpay webhook event:', eventType, payload.id);

    switch (eventType) {
      case 'payment.authorized':
        await handlePaymentAuthorized(payload);
        break;
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;
      case 'subscription.completed':
        await handleSubscriptionCompleted(payload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;
      case 'subscription.resumed':
        await handleSubscriptionResumed(payload);
        break;
      case 'refund.created':
        await handleRefundCreated(payload);
        break;
      default:
        console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentAuthorized(payment: any) {
  console.log('Payment authorized:', payment.id);

  await prisma.payment.updateMany({
    where: {
      stripePaymentId: payment.order_id,
    },
    data: {
      status: 'PENDING', // Keep as PENDING until captured
      metadata: payment as Prisma.JsonObject,
    },
  });
}

async function handlePaymentCaptured(payment: any) {
  console.log('Payment captured:', payment.id);

  const paymentRecord = await prisma.payment.findFirst({
    where: {
      stripePaymentId: payment.order_id,
    },
    include: {
      user: true,
    },
  });

  if (!paymentRecord) {
    console.error('Payment record not found for order:', payment.order_id);
    return;
  }

  await prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      status: 'COMPLETED',
      metadata: payment as Prisma.JsonObject,
    },
  });

  // Update user plan if not already done
  if (paymentRecord.planType === 'TIER1' && paymentRecord.user.planType !== 'TIER1') {
    await prisma.user.update({
      where: { id: paymentRecord.userId },
      data: {
        planType: 'TIER1',
        resumeCredits: { increment: 5 },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: paymentRecord.userId,
      action: 'payment_captured',
      resource: 'payment',
      resourceId: payment.id,
      metadata: {
        orderId: payment.order_id,
        amount: payment.amount,
        method: payment.method,
      } as Prisma.JsonObject,
      ipAddress: 'razorpay_webhook',
      userAgent: 'razorpay_webhook',
    },
  });
}

async function handlePaymentFailed(payment: any) {
  console.log('Payment failed:', payment.id);

  await prisma.payment.updateMany({
    where: {
      stripePaymentId: payment.order_id,
    },
    data: {
      status: 'FAILED',
      metadata: payment as Prisma.JsonObject,
    },
  });
}

async function handleSubscriptionActivated(subscription: any) {
  console.log('Subscription activated:', subscription.id);

  const paymentRecord = await prisma.payment.findFirst({
    where: {
      stripePaymentId: subscription.id,
    },
  });

  if (!paymentRecord) {
    console.error('Payment record not found for subscription:', subscription.id);
    return;
  }

  await prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      status: 'COMPLETED',
      metadata: subscription as Prisma.JsonObject,
    },
  });

  const endDate = new Date(subscription.current_end * 1000);

  await prisma.user.update({
    where: { id: paymentRecord.userId },
    data: {
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionId: subscription.id,
      subscriptionExpiry: endDate,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: paymentRecord.userId,
      action: 'subscription_activated',
      resource: 'subscription',
      resourceId: subscription.id,
      metadata: {
        subscriptionId: subscription.id,
        endDate: endDate.toISOString(),
      } as Prisma.JsonObject,
      ipAddress: 'razorpay_webhook',
      userAgent: 'razorpay_webhook',
    },
  });
}

async function handleSubscriptionCharged(subscription: any) {
  console.log('Subscription charged:', subscription.id);

  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id },
  });

  if (!user) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  const amount = RazorpayService.paiseToRupees(
    parseInt(process.env.RAZORPAY_TIER2_AMOUNT || '199900')
  );

  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: `sub_charge_${subscription.id}_${Date.now()}`,
      amount,
      currency: 'INR',
      status: 'COMPLETED',
      planType: 'TIER2',
      metadata: subscription as Prisma.JsonObject,
    },
  });

  const endDate = new Date(subscription.current_end * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionExpiry: endDate,
    },
  });
}

async function handleSubscriptionCompleted(subscription: any) {
  console.log('Subscription completed:', subscription.id);

  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id },
  });

  if (!user) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionActive: false,
      planType: 'FREE',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'subscription_completed',
      resource: 'subscription',
      resourceId: subscription.id,
      metadata: subscription as Prisma.JsonObject,
      ipAddress: 'razorpay_webhook',
      userAgent: 'razorpay_webhook',
    },
  });
}

async function handleSubscriptionCancelled(subscription: any) {
  console.log('Subscription cancelled:', subscription.id);

  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id },
  });

  if (!user) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionActive: false,
      planType: 'FREE',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'subscription_cancelled',
      resource: 'subscription',
      resourceId: subscription.id,
      metadata: subscription as Prisma.JsonObject,
      ipAddress: 'razorpay_webhook',
      userAgent: 'razorpay_webhook',
    },
  });
}

async function handleSubscriptionPaused(subscription: any) {
  console.log('Subscription paused:', subscription.id);

  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id },
  });

  if (!user) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionActive: false,
    },
  });
}

async function handleSubscriptionResumed(subscription: any) {
  console.log('Subscription resumed:', subscription.id);

  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id },
  });

  if (!user) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  const endDate = new Date(subscription.current_end * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionActive: true,
      subscriptionExpiry: endDate,
    },
  });
}

async function handleRefundCreated(refund: any) {
  console.log('Refund created:', refund.id);

  const paymentRecord = await prisma.payment.findFirst({
    where: {
      metadata: {
        path: ['payment_id'],
        equals: refund.payment_id,
      },
    },
  });

  if (!paymentRecord) {
    console.error('Payment record not found for refund:', refund.payment_id);
    return;
  }

  await prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      status: 'REFUNDED',
      metadata: {
        ...((paymentRecord.metadata as any) || {}),
        refund: refund,
      } as Prisma.JsonObject,
    },
  });

  if (paymentRecord.planType === 'TIER1') {
    await prisma.user.update({
      where: { id: paymentRecord.userId },
      data: {
        resumeCredits: { decrement: 5 },
        planType: 'FREE',
      },
    });
  }

  if (paymentRecord.planType === 'TIER2') {
    await prisma.user.update({
      where: { id: paymentRecord.userId },
      data: {
        subscriptionActive: false,
        planType: 'FREE',
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: paymentRecord.userId,
      action: 'refund_created',
      resource: 'payment',
      resourceId: refund.id,
      metadata: refund as Prisma.JsonObject,
      ipAddress: 'razorpay_webhook',
      userAgent: 'razorpay_webhook',
    },
  });
}
