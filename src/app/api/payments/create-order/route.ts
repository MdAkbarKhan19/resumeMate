import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { RazorpayService } from '@/lib/payment/razorpay';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const createOrderSchema = z.object({
  planType: z.enum(['TIER1', 'TIER2']),
});

/**
 * POST /api/payments/create-order
 * Create Razorpay order for one-time payment (Tier 1)
 */
async function createOrderHandler(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid plan type',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { planType } = validation.data;

    // Check if user already has this plan
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planType: true,
        subscriptionActive: true,
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

    // Prevent duplicate purchases
    if (planType === 'TIER1' && currentUser.planType === 'TIER1') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SUBSCRIBED',
            message: 'You already have this plan',
          },
        },
        { status: 400 }
      );
    }

    if (planType === 'TIER2' && currentUser.subscriptionActive) {
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

    // Get amount based on plan type
    const amount =
      planType === 'TIER1'
        ? parseInt(process.env.RAZORPAY_TIER1_AMOUNT || '149900') // ₹1499
        : parseInt(process.env.RAZORPAY_TIER2_AMOUNT || '199900'); // ₹1999

    // Create Razorpay order
    const receipt = `order_${user.id}_${Date.now()}`;
    const notes = {
      userId: user.id,
      email: user.email,
      planType,
    };

    const razorpayOrder = await RazorpayService.createOrder(amount, receipt, notes);

    // Save order to database
    await prisma.payment.create({
      data: {
        userId: user.id,
        stripePaymentId: razorpayOrder.id, // Using stripePaymentId field for Razorpay order ID
        amount: RazorpayService.paiseToRupees(amount),
        currency: 'INR',
        status: 'PENDING',
        planType,
        metadata: {
          provider: 'RAZORPAY',
          orderId: razorpayOrder.id,
          receipt: razorpayOrder.receipt,
          amount_paise: amount,
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'payment_order_created',
        resource: 'payment',
        resourceId: razorpayOrder.id,
        metadata: {
          planType,
          amount,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Frontend needs this
        receipt: razorpayOrder.receipt,
        planType,
        notes: razorpayOrder.notes,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create payment order',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createOrderHandler);
