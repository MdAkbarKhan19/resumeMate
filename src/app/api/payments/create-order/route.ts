import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { RazorpayService } from '@/lib/payment/razorpay';
import { getPlan } from '@/lib/payment/plans';
import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createOrderSchema = z.object({
  planId: z.string().min(1),
});

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay ORDER for any plan whose `kind` is `one_time`
 * (currently only the ₹149 Single Resume Pack). Subscription plans go
 * through /api/payments/create-subscription instead.
 *
 * Plan amounts + metadata are read from PLAN_CATALOG so the client can't
 * spoof the price by tampering with the request body.
 */
async function createOrderHandler(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid plan',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const plan = getPlan(validation.data.planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Unknown plan' } },
        { status: 400 }
      );
    }
    if (plan.kind !== 'one_time') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WRONG_ENDPOINT',
            message: `Plan "${plan.id}" is a ${plan.kind} plan — use the correct endpoint.`,
          },
        },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, planType: true, subscriptionActive: true },
    });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const receipt = `ord_${currentUser.id.slice(0, 8)}_${Date.now()}`;
    const notes = {
      userId: currentUser.id,
      email: currentUser.email,
      planId: plan.id,
      planType: plan.userPlanType,
    };

    const razorpayOrder = await RazorpayService.createOrder(plan.amountPaise, receipt, notes);

    await prisma.payment.create({
      data: {
        userId: currentUser.id,
        stripePaymentId: razorpayOrder.id, // legacy column; holds the Razorpay order ID
        amount: RazorpayService.paiseToRupees(plan.amountPaise),
        currency: 'INR',
        status: 'PENDING',
        planType: plan.userPlanType,
        planDuration: plan.planDuration,
        creditsGranted: plan.creditsGranted ?? null,
        metadata: {
          provider: 'RAZORPAY',
          kind: 'order',
          planId: plan.id,
          orderId: razorpayOrder.id,
          receipt: razorpayOrder.receipt,
          amount_paise: plan.amountPaise,
        } as Prisma.JsonObject,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'payment_order_created',
        resource: 'payment',
        resourceId: razorpayOrder.id,
        metadata: { planId: plan.id, amount_paise: plan.amountPaise } as Prisma.JsonObject,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        kind: 'order',
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        receipt: razorpayOrder.receipt,
        planId: plan.id,
        planName: plan.name,
        notes: razorpayOrder.notes,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment order' } },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createOrderHandler);
