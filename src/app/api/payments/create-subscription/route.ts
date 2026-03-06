import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { RazorpayService } from '@/lib/payment/razorpay';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  name: z.string().min(2),
  contact: z.string().min(10),
});

/**
 * POST /api/payments/create-subscription
 * Create Razorpay subscription for recurring payment (Tier 2)
 */
async function createSubscriptionHandler(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid customer details',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { name, contact } = validation.data;

    // Check if user already has active subscription
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        subscriptionActive: true,
        subscriptionId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    if (currentUser.subscriptionActive && currentUser.subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SUBSCRIBED',
            message: 'You already have an active subscription',
          },
        },
        { status: 400 }
      );
    }

    // Get plan ID from environment
    const planId = process.env.RAZORPAY_TIER2_PLAN_ID;

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Subscription plan not configured',
          },
        },
        { status: 500 }
      );
    }

    // Create subscription
    const notes = {
      userId: user.id,
      email: user.email,
      planType: 'TIER2',
    };

    const subscription = await RazorpayService.createSubscription(
      planId,
      1, // Notify customer
      1, // Quantity
      notes,
      {
        name,
        email: currentUser.email,
        contact,
      }
    );

    // Save subscription to database
    await prisma.payment.create({
      data: {
        userId: user.id,
        stripePaymentId: subscription.id, // Using stripePaymentId for Razorpay subscription ID
        amount: RazorpayService.paiseToRupees(
          parseInt(process.env.RAZORPAY_TIER2_AMOUNT || '199900')
        ),
        currency: 'INR',
        status: 'PENDING',
        planType: 'TIER2',
        metadata: {
          provider: 'RAZORPAY',
          subscriptionId: subscription.id,
          planId: subscription.plan_id,
          customerId: subscription.customer_id,
          shortUrl: subscription.short_url,
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'subscription_created',
        resource: 'payment',
        resourceId: subscription.id,
        metadata: {
          planType: 'TIER2',
          subscriptionId: subscription.id,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        status: subscription.status,
        shortUrl: subscription.short_url,
        currentStart: subscription.current_start,
        currentEnd: subscription.current_end,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create subscription',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createSubscriptionHandler);
