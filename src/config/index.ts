// AWS SDK Configuration
export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// S3 Configuration
export const s3Config = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'resumemate-uploads',
  region: process.env.AWS_REGION || 'us-east-1',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ],
};

// Cognito Configuration
export const cognitoConfig = {
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
  clientId: process.env.AWS_COGNITO_CLIENT_ID || '',
  region: process.env.AWS_COGNITO_REGION || 'us-east-1',
};

// OpenAI Configuration
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  maxTokens: 2000,
  temperature: 0.7,
};

// Stripe Configuration
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  tier1PriceId: process.env.STRIPE_TIER1_PRICE_ID || '',
  tier2PriceId: process.env.STRIPE_TIER2_PRICE_ID || '',
};

// JWT Configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Rate Limiting Configuration
export const rateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
};

// Payment Configuration (Razorpay)
export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  tier1Amount: parseInt(process.env.RAZORPAY_TIER1_AMOUNT || '149900'), // ₹1499 in paise
  tier2Amount: parseInt(process.env.RAZORPAY_TIER2_AMOUNT || '199900'), // ₹1999 in paise
  tier1PlanId: process.env.RAZORPAY_TIER1_PLAN_ID || '',
  tier2PlanId: process.env.RAZORPAY_TIER2_PLAN_ID || '',
};

// Feature Flags
export const featureFlags = {
  enableAI: process.env.ENABLE_AI_FEATURES === 'true',
  enableJDMatching: process.env.ENABLE_JD_MATCHING === 'true',
  enablePayments: process.env.ENABLE_PAYMENTS === 'true',
};

// App Configuration
export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Plan Limits
export const planLimits = {
  FREE: {
    resumesAllowed: 1,
    aiCallsPerMonth: 5,
    exportsAllowed: 1,
    hasWatermark: false,
  },
  TIER1: {
    resumesAllowed: 5,
    aiCallsPerMonth: 50,
    exportsAllowed: 5,
    hasWatermark: false,
  },
  TIER2: {
    resumesAllowed: -1, // Unlimited
    aiCallsPerMonth: -1, // Unlimited
    exportsAllowed: -1, // Unlimited
    hasWatermark: false,
  },
};

// Export pricing information
export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    type: 'FREE' as const,
    price: 0,
    currency: 'USD',
    features: [
      '1 resume download',
      'Basic templates',
      '5 AI suggestions',
      'ATS score checking',
      'PDF export',
    ],
  },
  {
    id: 'tier1',
    name: 'Starter Pack',
    type: 'TIER1' as const,
    price: 15,
    currency: 'USD',
    credits: 5,
    features: [
      '5 resume downloads',
      'All templates',
      '50 AI suggestions',
      'Job description matching',
      'PDF & DOCX export',
      'No watermark',
    ],
    stripePriceId: process.env.STRIPE_TIER1_PRICE_ID,
  },
  {
    id: 'tier2',
    name: 'Unlimited Pro',
    type: 'TIER2' as const,
    price: 20,
    currency: 'USD',
    duration: 'monthly' as const,
    features: [
      'Unlimited resumes',
      'All premium templates',
      'Unlimited AI assistance',
      'Advanced JD matching',
      'Priority support',
      'PDF & DOCX export',
      'Version history',
    ],
    stripePriceId: process.env.STRIPE_TIER2_PRICE_ID,
  },
];
