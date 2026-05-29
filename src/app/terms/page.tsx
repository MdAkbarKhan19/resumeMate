export const metadata = {
  title: 'Terms of Service — JDsync',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'May 20, 2026';
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-gray">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

      <h2>1. Acceptance</h2>
      <p>
        By creating an account or using JDsync, you agree to these terms. If you
        do not agree, do not use the service.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for keeping your password safe. You must be at least 16
        years old. You may not create accounts using false identities or use the
        service to misrepresent your professional history.
      </p>

      <h2>3. Plans and billing</h2>
      <p>
        JDsync is offered on three tiers: Free, Pack (one-time), and Pro
        (subscription). Plan limits and pricing are listed on{' '}
        <a href="/pricing">/pricing</a>. Subscriptions auto-renew until you cancel.
        Cancellation takes effect at the end of the current billing period.
      </p>

      <h2>4. AI-generated content</h2>
      <p>
        JDsync uses AI to suggest improvements to your resume. You are
        responsible for reviewing AI suggestions and ensuring they accurately
        represent your experience. We do not guarantee that AI-suggested content
        will be factually correct, and we are not liable for any misrepresentation
        in a resume you submit to an employer.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service to generate fraudulent or impersonating resumes</li>
        <li>Attempt to bypass plan limits, watermarking, or payment gates</li>
        <li>Scrape, resell, or redistribute the service</li>
        <li>Submit content that violates third-party rights</li>
      </ul>

      <h2>6. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these terms. You may
        delete your account at any time by emailing{' '}
        <a href="mailto:support@prepdunya.com">support@prepdunya.com</a>.
      </p>

      <h2>7. Disclaimer</h2>
      <p>
        JDsync is provided "as is". We do not guarantee job placement, interview
        callbacks, or any specific outcome from using the service. To the maximum
        extent permitted by law, our total liability is limited to the amount you
        paid us in the preceding 12 months.
      </p>

      <h2>8. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes will be resolved in
        the courts of Bangalore, Karnataka.
      </p>

      <h2>9. Contact</h2>
      <p>
        <a href="mailto:support@prepdunya.com">support@prepdunya.com</a>
      </p>
    </article>
  );
}
