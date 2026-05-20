import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { RazorpayService } from '@/lib/payment/razorpay';
import { getPlan, getRazorpayPlanId } from '@/lib/payment/plans';
import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(2),
  contact: z.string().min(10),
});

/**
 * POST /api/payments/create-subscription
 *
 * Creates a Razorpay SUBSCRIPTION for any plan whose `kind` is
 * `subscription` — currently Pro Monthly, Pro Quarterly, Pro Annual.
 *
 * The cycle length (period/interval) is configured on the Razorpay
 * plan itself in the dashboard; we just pass the matching plan ID
 * and the `total_count` that bounds the subscription to one year.
 */
async function createSubscriptionHandler(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    const validation = createSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid subscription details',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }
    const { planId, name, contact } = validation.data;

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Unknown plan' } },
        { status: 400 }
      );
    }
    if (plan.kind !== 'subscription') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WRONG_ENDPOINT',
            message: `Plan "${plan.id}" is a ${plan.kind} plan — use the create-order endpoint instead.`,
          },
        },
        { status: 400 }
      );
    }

    const razorpayPlanId = getRazorpayPlanId(plan);
    if (!razorpayPlanId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: `Razorpay plan ID is not configured for ${plan.id}. Set the ${plan.razorpayPlanEnv} environment variable.`,
          },
        },
        { status: 500 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, subscriptionActive: true, subscriptionId: true },
    });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }
    if (currentUser.subscriptionActive && currentUser.subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ALREADY_SUBSCRIBED', message: 'You already have an active subscription' },
        },
        { status: 400 }
      );
    }

    const notes = {
      userId: currentUser.id,
      email: currentUser.email,
      planId: plan.id,
      planType: plan.userPlanType,
    };

    const subscription = await RazorpayService.createSubscription(
      razorpayPlanId,
      1,                       // customer_notify
      1,                       // quantity
      notes,
      { name, email: currentUser.email, contact },
      plan.totalCount,         // forward the per-plan total_count (12 / 4 / 1)
    );

    await prisma.payment.create({
      data: {
        userId: currentUser.id,
        stripePaymentId: subscription.id,
        amount: RazorpayService.paiseToRupees(plan.amountPaise),
        currency: 'INR',
        status: 'PENDING',
        planType: plan.userPlanType,
        planDuration: plan.planDuration,
        metadata: {
          provider: 'RAZORPAY',
          kind: 'subscription',
          planId: plan.id,
          subscriptionId: subscription.id,
          razorpayPlanId: subscription.plan_id,
          customerId: subscription.customer_id,
          shortUrl: subscription.short_url,
          totalCount: plan.totalCount,
          cycleMonths: plan.cycleMonths,
        } as Prisma.JsonObject,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'subscription_created',
        resource: 'payment',
        resourceId: subscription.id,
        metadata: { planId: plan.id, subscriptionId: subscription.id } as Prisma.JsonObject,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        kind: 'subscription',
        subscriptionId: subscription.id,
        razorpayPlanId: subscription.plan_id,
        status: subscription.status,
        shortUrl: subscription.short_url,
        currentStart: subscription.current_start,
        currentEnd: subscription.current_end,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        planId: plan.id,
        planName: plan.name,
      },
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create subscription' } },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createSubscriptionHandler);
