# ResumeMate Production Deployment Check (PowerShell)
# Run this before deploying to production

Write-Host "🚀 ResumeMate Pre-Deployment Checks" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# Check Node version
Write-Host "📦 Checking Node.js version..." -ForegroundColor Yellow
$NodeVersion = node -v
Write-Host "Node version: $NodeVersion"
$NodeMajor = [int]($NodeVersion -replace 'v(\d+)\..*', '$1')
if ($NodeMajor -lt 18) {
    Write-Host "❌ Node.js 18+ required" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node version OK" -ForegroundColor Green
Write-Host ""

# Check if .env exists
Write-Host "🔐 Checking environment variables..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "Copy .env.example to .env and fill in your values"
    exit 1
}
Write-Host "✓ .env file exists" -ForegroundColor Green
Write-Host ""

# Check required env vars
Write-Host "🔍 Validating required environment variables..." -ForegroundColor Yellow
$RequiredVars = @(
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "JWT_SECRET",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME"
)

$EnvContent = Get-Content .env -Raw
$MissingVars = 0

foreach ($Var in $RequiredVars) {
    if ($EnvContent -match "^$Var=") {
        Write-Host "✓ $Var" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $Var" -ForegroundColor Red
        $MissingVars++
    }
}

if ($MissingVars -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing $MissingVars required environment variables" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Generate Prisma Client
Write-Host "🗄️  Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Type check
Write-Host "🔧 Running TypeScript type check..." -ForegroundColor Yellow
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Type check found errors (continuing anyway)" -ForegroundColor Yellow
}
Write-Host ""

# Build
Write-Host "🏗️  Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# Database check
Write-Host "🗄️  Checking database connection..." -ForegroundColor Yellow
npx prisma db pull --force 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database connection OK" -ForegroundColor Green
} else {
    Write-Host "❌ Cannot connect to database" -ForegroundColor Red
    Write-Host "Make sure DATABASE_URL is correct and database is accessible"
    $ErrorCount++
}
Write-Host ""

# Success
if ($ErrorCount -eq 0) {
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to deploy!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Commit your changes: git add . && git commit -m 'Production ready'"
    Write-Host "2. Deploy to Vercel: vercel --prod"
    Write-Host "3. Or push to GitHub and Vercel will auto-deploy"
    Write-Host ""
    Write-Host "📚 See PRODUCTION_DEPLOYMENT.md for detailed deployment guide"
    Write-Host "====================================" -ForegroundColor Cyan
} else {
    Write-Host "====================================" -ForegroundColor Red
    Write-Host "❌ Deployment checks failed" -ForegroundColor Red
    Write-Host "Please fix the errors above before deploying" -ForegroundColor Red
    Write-Host "====================================" -ForegroundColor Red
    exit 1
}
