import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { RazorpayService } from '@/lib/payment/razorpay';
import { getPlan, PLAN_CATALOG } from '@/lib/payment/plans';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/**
 * POST /api/payments/verify
 *
 * Called after Razorpay Checkout completes a ONE-TIME order. Verifies
 * the signature, marks the Payment row as COMPLETED, and credits the
 * user according to the plan that was attached on order creation.
 *
 * (Subscription renewals go through the /api/webhooks/razorpay handler
 * since they fire server-side, not in the browser.)
 */
async function verifyPaymentHandler(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    const validation = verifyPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment details',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validation.data;

    const isValid = RazorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Payment signature verification failed' } },
        { status: 400 }
      );
    }

    const payment = await RazorpayService.fetchPayment(razorpay_payment_id);

    const paymentRecord = await prisma.payment.findFirst({
      where: { stripePaymentId: razorpay_order_id, userId: user.id },
    });
    if (!paymentRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' } },
        { status: 404 }
      );
    }

    if (paymentRecord.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PROCESSED', message: 'Payment already processed' } },
        { status: 400 }
      );
    }

    // Resolve which plan this order was for — we stashed planId on the metadata
    // at order creation. Fallback to the legacy planType→TIER1=pack mapping for
    // old records.
    const meta = (paymentRecord.metadata ?? {}) as Record<string, any>;
    let plan = meta.planId ? getPlan(String(meta.planId)) : null;
    if (!plan && paymentRecord.planType === 'TIER1') plan = PLAN_CATALOG.pack;
    if (!plan) {
      return NextResponse.json(
        { success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Could not resolve plan for this payment' } },
        { status: 500 }
      );
    }

    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        status: 'COMPLETED',
        metadata: {
          ...meta,
          payment_id: payment.id,
          order_id: payment.order_id,
          method: payment.method,
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa,
          card_id: payment.card_id,
          captured: payment.captured,
          amount_paid: payment.amount,
          fee: payment.fee,
          tax: payment.tax,
          created_at: payment.created_at,
        } as Prisma.JsonObject,
      },
    });

    // Apply the plan to the user. One-time packs grant credits; subscription
    // plans extend the subscriptionExpiry (verify only fires for one-time today,
    // but we keep the branch correct in case a subscription's first charge ever
    // routes through here).
    if (plan.kind === 'one_time') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planType: plan.userPlanType,
          resumeCredits: { increment: plan.creditsGranted ?? 0 },
        },
      });
    } else if (plan.kind === 'subscription') {
      const months = plan.cycleMonths ?? 1;
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planType: plan.userPlanType,
          subscriptionActive: true,
          subscriptionExpiry: expiry,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'payment_verified',
        resource: 'payment',
        resourceId: payment.id,
        metadata: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: payment.amount,
          method: payment.method,
          planId: plan.id,
        } as Prisma.JsonObject,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planType: true,
        resumeCredits: true,
        subscriptionActive: true,
        subscriptionExpiry: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          orderId: payment.order_id,
          amount: RazorpayService.formatAmount(payment.amount),
          method: RazorpayService.getPaymentMethodName(payment.method),
          status: payment.status,
        },
        plan: { id: plan.id, name: plan.name },
        user: updatedUser,
        message: 'Payment verified successfully',
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify payment' } },
      { status: 500 }
    );
  }
}

export const POST = withAuth(verifyPaymentHandler);
