export const metadata = {
  title: 'Refund Policy — ResumeMate',
};

export default function RefundPolicyPage() {
  const lastUpdated = 'May 20, 2026';
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-gray">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

      <h2>Free trial</h2>
      <p>
        ResumeMate offers a free tier so you can try the full builder, watermarked
        PDF download, and a limited number of AI features before paying. We
        encourage you to use the free tier first.
      </p>

      <h2>Pack purchases (one-time)</h2>
      <p>
        Pack purchases (₹149) are refundable within <strong>7 days</strong> of
        purchase, provided you have not yet downloaded a clean PDF or used more than
        2 of the 5 included ATS optimizations. To request a refund, email{' '}
        <a href="mailto:support@prepdunya.com">support@prepdunya.com</a> with your
        payment reference number.
      </p>

      <h2>Pro subscriptions (monthly / quarterly / annual)</h2>
      <p>
        Subscription charges are refundable within <strong>7 days</strong> of the
        initial purchase. Subsequent renewal charges are non-refundable, but you can
        cancel at any time and your access continues until the end of the period
        you paid for.
      </p>

      <h2>Failed payments</h2>
      <p>
        If a payment was charged but the corresponding credits or subscription did
        not activate within 1 hour, email us with your Razorpay payment ID and we
        will either reconcile the entitlement or refund the charge — your choice.
      </p>

      <h2>Refund timing</h2>
      <p>
        Approved refunds are processed within 3 business days. Razorpay typically
        credits the funds back to your original payment method within 5-10 business
        days depending on your bank.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:support@prepdunya.com">support@prepdunya.com</a>
      </p>
    </article>
  );
}
