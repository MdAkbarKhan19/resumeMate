import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { RazorpayService } from '@/lib/payment/razorpay';
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
 * Verify Razorpay payment signature and update user plan
 */
async function verifyPaymentHandler(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
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

    // Verify signature
    const isValid = RazorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Payment signature verification failed',
          },
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await RazorpayService.fetchPayment(razorpay_payment_id);

    // Find payment record in database
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        stripePaymentId: razorpay_order_id,
        userId: user.id,
      },
    });

    if (!paymentRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment record not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if payment is already processed
    if (paymentRecord.status === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_PROCESSED',
            message: 'Payment already processed',
          },
        },
        { status: 400 }
      );
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        status: 'COMPLETED',
        metadata: {
          ...(paymentRecord.metadata as any || {}),
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

    // Update user plan based on payment type
    if (paymentRecord.planType === 'TIER1') {
      // One-time payment - give 5 resume credits
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planType: 'TIER1',
          resumeCredits: { increment: 5 },
        },
      });
    } else if (paymentRecord.planType === 'TIER2') {
      // Subscription - activate unlimited access
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      await prisma.user.update({
        where: { id: user.id },
        data: {
          planType: 'TIER2',
          subscriptionActive: true,
          subscriptionExpiry: endDate,
        },
      });
    }

    // Log audit event
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
          planType: paymentRecord.planType,
        } as Prisma.JsonObject,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Fetch updated user details
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
        user: updatedUser,
        message: 'Payment verified successfully',
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify payment',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(verifyPaymentHandler);
