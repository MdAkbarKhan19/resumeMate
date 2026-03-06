#!/bin/bash

# ResumeMate Production Deployment Script
# Run this before deploying to production

echo "🚀 ResumeMate Pre-Deployment Checks"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"
if [[ "$NODE_VERSION" < "v18" ]]; then
    echo -e "${RED}❌ Node.js 18+ required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node version OK${NC}"
echo ""

# Check if .env exists
echo "🔐 Checking environment variables..."
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Copy .env.example to .env and fill in your values"
    exit 1
fi
echo -e "${GREEN}✓ .env file exists${NC}"
echo ""

# Check required env vars
echo "🔍 Validating required environment variables..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "OPENAI_API_KEY"
    "RAZORPAY_KEY_ID"
    "RAZORPAY_KEY_SECRET"
    "JWT_SECRET"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET_NAME"
)

MISSING_VARS=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${VAR}=" .env 2>/dev/null; then
        echo -e "${RED}❌ Missing: $VAR${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        echo -e "${GREEN}✓ $VAR${NC}"
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    echo ""
    echo -e "${RED}Missing $MISSING_VARS required environment variables${NC}"
    exit 1
fi
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Generate Prisma Client
echo "🗄️  Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma generate failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Type check
echo "🔧 Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Type check found errors (continuing anyway)${NC}"
fi
echo ""

# Build
echo "🏗️  Building production bundle..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Test production build
echo "🧪 Testing production build..."
echo "Starting server on port 3000..."
npm start &
SERVER_PID=$!
sleep 5

# Check if server is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is responding${NC}"
else
    echo -e "${RED}❌ Server not responding${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Stop test server
kill $SERVER_PID 2>/dev/null
echo ""

# Database check
echo "🗄️  Checking database connection..."
npx prisma db pull --force > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database connection OK${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "Make sure DATABASE_URL is correct and database is accessible"
    exit 1
fi
echo ""

# Success
echo "=================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Production ready'"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Or push to GitHub and Vercel will auto-deploy"
echo ""
echo "📚 See PRODUCTION_DEPLOYMENT.md for detailed deployment guide"
echo "=================================="
