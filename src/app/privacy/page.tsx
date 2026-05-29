export const metadata = {
  title: 'Privacy Policy — JDsync',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'May 20, 2026';
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-gray">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

      <h2>1. What we collect</h2>
      <p>
        When you create a JDsync account, we collect your name, email address,
        and the content you place in your resume (work experience, education, skills,
        contact details, etc.). When you make a purchase we receive a payment
        confirmation from our processor (Razorpay) — we do not store your card details.
      </p>

      <h2>2. How we use it</h2>
      <p>
        Your resume content is used to render previews, generate downloads, and power
        AI features such as ATS optimization and bullet enhancement. AI features send
        the relevant portion of your resume to OpenAI's API for inference. We do not
        sell your data, and we do not share it with third parties beyond what is
        required to deliver these features.
      </p>

      <h2>3. Cookies and authentication</h2>
      <p>
        We use cookies and localStorage to keep you signed in. Authentication tokens
        are issued by AWS Cognito. We do not use cookies for advertising tracking.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We keep your account and resumes for as long as your account exists. You can
        delete a resume from your dashboard at any time. To delete your account,
        email us at <a href="mailto:support@prepdunya.com">support@prepdunya.com</a>{' '}
        and we will remove all your data within 7 business days.
      </p>

      <h2>5. Subprocessors</h2>
      <ul>
        <li>AWS (hosting, Cognito authentication, S3 file storage) — ap-south-1 / us-east-1</li>
        <li>Neon (PostgreSQL database)</li>
        <li>OpenAI (AI inference)</li>
        <li>Razorpay (payment processing)</li>
      </ul>

      <h2>6. Contact</h2>
      <p>
        Questions, requests, or data export requests:{' '}
        <a href="mailto:support@prepdunya.com">support@prepdunya.com</a>
      </p>
    </article>
  );
}
