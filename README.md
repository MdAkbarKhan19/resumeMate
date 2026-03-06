# ResumeMate - AI-Powered Resume Builder

A comprehensive, production-ready resume creation web application with AI-powered content optimization, ATS compatibility checking, and job description matching.

## 🚀 Features

- **Multiple Resume Templates**: 4-5 modern, ATS-compliant templates
- **Smart Input Methods**: Manual entry or resume upload with AI parsing
- **AI Content Optimization**: Bullet point enhancement, grammar checking, redundancy detection
- **Job Description Matching**: Real-time ATS score and keyword analysis
- **Multi-format Export**: Download as PDF or DOCX
- **Secure Authentication**: Email/password and Google OAuth
- **Flexible Pricing**: Free tier, one-time purchase, or subscription
- **Mobile Responsive**: Fully optimized for all devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Headless UI
- **State Management**: Zustand + SWR
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: AWS Cognito + JWT
- **File Storage**: AWS S3
- **AI Services**: OpenAI GPT-4, AWS Textract, AWS Comprehend
- **Payments**: Stripe
- **PDF Generation**: Puppeteer
- **DOCX Generation**: docx library

### Infrastructure
- **Cloud**: AWS (S3, Cognito, Textract, Comprehend, Lambda)
- **Deployment**: Vercel / AWS Amplify
- **Monitoring**: AWS CloudWatch, Sentry
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- AWS Account with configured services
- OpenAI API key
- Stripe account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resumemate.git
   cd resumemate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Setup database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
resumemate/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── resume/            # Resume builder components
│   │   ├── templates/         # Resume templates
│   │   ├── ui/                # Reusable UI components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Core libraries
│   │   ├── ai/                # AI service integrations
│   │   ├── aws/               # AWS SDK configurations
│   │   ├── db/                # Database client
│   │   ├── stripe/            # Stripe integration
│   │   └── utils/             # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # Zustand stores
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Helper utilities
│   ├── config/                # Configuration files
│   └── styles/                # Global styles
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── tests/                     # Test files

```

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy

### AWS Amplify
1. Configure amplify.yml
2. Connect repository
3. Deploy

## 📊 Database Schema

See `prisma/schema.prisma` for the complete database schema.

## 🎨 Resume Templates

The application includes 5 ATS-optimized templates:
1. **Modern Two-Column**: Contemporary design with color accents
2. **Minimalist Single-Column**: Clean, traditional layout
3. **Professional Corporate**: Conservative business style
4. **Creative ATS-Optimized**: Design-forward yet parseable
5. **Hybrid Flexible**: Adaptable one/two-column layout

## 💳 Payment Plans

- **Free Tier**: 1 resume download, limited AI features
- **Tier 1**: $15 - Generate 5 resumes (one-time)
- **Tier 2**: $20/month - Unlimited resumes and AI features

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@resumemate.com or open an issue.

## 🙏 Acknowledgments

- Design inspired by modern resume builders
- AI capabilities powered by OpenAI
- Cloud infrastructure by AWS
- Payment processing by Stripe
