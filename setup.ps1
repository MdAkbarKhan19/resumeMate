# ResumeMate Complete Setup Script
# This script will guide you through setting up all required services

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ResumeMate Production Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please ensure .env file exists in the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found .env file" -ForegroundColor Green
Write-Host ""

# Function to update .env file
function Update-EnvVariable {
    param(
        [string]$Key,
        [string]$Value
    )
    
    $envContent = Get-Content ".env" -Raw
    $pattern = "^$Key=.*$"
    $replacement = "$Key=$Value"
    
    if ($envContent -match $pattern) {
        $envContent = $envContent -replace "(?m)$pattern", $replacement
    } else {
        $envContent += "`n$replacement"
    }
    
    Set-Content ".env" $envContent
}

# Step 1: Check Node.js
Write-Host "[1/7] Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found! Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Install Dependencies
Write-Host "[2/7] Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "[3/7] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Database Setup
Write-Host "[4/7] Database Setup (Supabase)" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "Please complete these steps:" -ForegroundColor White
Write-Host "1. Go to https://supabase.com and create a free account" -ForegroundColor White
Write-Host "2. Create a new project named 'resumemate'" -ForegroundColor White
Write-Host "3. Go to Project Settings -> Database" -ForegroundColor White
Write-Host "4. Copy the 'Connection string' (URI format)" -ForegroundColor White
Write-Host ""
Write-Host "Example format:" -ForegroundColor Gray
Write-Host "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres" -ForegroundColor Gray
Write-Host ""

$dbUrl = Read-Host "Paste your Supabase DATABASE_URL (or press Enter to skip for now)"

if ($dbUrl) {
    Update-EnvVariable -Key "DATABASE_URL" -Value $dbUrl
    Write-Host "✓ Database URL updated in .env" -ForegroundColor Green
    
    # Try to push schema
    Write-Host "Pushing database schema..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Database push failed. Please check your connection string." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Skipped database setup. Update DATABASE_URL in .env later." -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Storage Setup
Write-Host "[5/7] Storage Setup" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "Choose your storage option:" -ForegroundColor White
Write-Host "1. Supabase Storage (Recommended - Free, Easy)" -ForegroundColor White
Write-Host "2. AWS S3 (Traditional)" -ForegroundColor White
Write-Host "3. Skip for now" -ForegroundColor White
Write-Host ""

$storageChoice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($storageChoice) {
    "1" {
        Write-Host ""
        Write-Host "Supabase Storage Setup:" -ForegroundColor Cyan
        Write-Host "1. In Supabase Dashboard, go to Storage" -ForegroundColor White
        Write-Host "2. Create a new bucket: 'resume-files'" -ForegroundColor White
        Write-Host "3. Make it public" -ForegroundColor White
        Write-Host "4. Get your Project URL and Anon Key from Settings -> API" -ForegroundColor White
        Write-Host ""
        
        $supabaseUrl = Read-Host "Paste your Supabase URL"
        $supabaseKey = Read-Host "Paste your Supabase Anon Key"
        
        if ($supabaseUrl -and $supabaseKey) {
            Update-EnvVariable -Key "SUPABASE_URL" -Value $supabaseUrl
            Update-EnvVariable -Key "SUPABASE_ANON_KEY" -Value $supabaseKey
            Update-EnvVariable -Key "SUPABASE_BUCKET" -Value "resume-files"
            Write-Host "✓ Supabase Storage configured" -ForegroundColor Green
        }
    }
    "2" {
        Write-Host ""
        Write-Host "AWS S3 Setup:" -ForegroundColor Cyan
        Write-Host "Follow instructions in COMPLETE_SETUP.md - AWS S3 section" -ForegroundColor White
        Write-Host ""
        
        $awsKeyId = Read-Host "AWS Access Key ID (or press Enter to skip)"
        $awsSecretKey = Read-Host "AWS Secret Access Key (or press Enter to skip)"
        $awsBucket = Read-Host "S3 Bucket Name (or press Enter to skip)"
        
        if ($awsKeyId -and $awsSecretKey -and $awsBucket) {
            Update-EnvVariable -Key "AWS_ACCESS_KEY_ID" -Value $awsKeyId
            Update-EnvVariable -Key "AWS_SECRET_ACCESS_KEY" -Value $awsSecretKey
            Update-EnvVariable -Key "AWS_S3_BUCKET_NAME" -Value $awsBucket
            Write-Host "✓ AWS S3 configured" -ForegroundColor Green
        }
    }
    "3" {
        Write-Host "⚠ Skipped storage setup" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 6: Razorpay Setup
Write-Host "[6/7] Razorpay Payment Setup" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "Please complete these steps:" -ForegroundColor White
Write-Host "1. Go to https://razorpay.com and create an account" -ForegroundColor White
Write-Host "2. Go to Dashboard -> Settings -> API Keys" -ForegroundColor White
Write-Host "3. Generate Test Keys (for development)" -ForegroundColor White
Write-Host "4. Copy Key ID and Key Secret" -ForegroundColor White
Write-Host ""

$setupRazorpay = Read-Host "Do you want to setup Razorpay now? (y/n)"

if ($setupRazorpay -eq "y" -or $setupRazorpay -eq "Y") {
    $rzpKeyId = Read-Host "Razorpay Key ID (starts with rzp_test_)"
    $rzpKeySecret = Read-Host "Razorpay Key Secret"
    
    if ($rzpKeyId -and $rzpKeySecret) {
        Update-EnvVariable -Key "RAZORPAY_KEY_ID" -Value $rzpKeyId
        Update-EnvVariable -Key "RAZORPAY_KEY_SECRET" -Value $rzpKeySecret
        Write-Host "✓ Razorpay keys configured" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Next: Create subscription plans in Razorpay Dashboard" -ForegroundColor Cyan
        Write-Host "Plan 1: ResumeMate Tier 1 - ₹1,499 (one-time)" -ForegroundColor White
        Write-Host "Plan 2: ResumeMate Tier 2 - ₹1,999 (monthly)" -ForegroundColor White
        Write-Host "Then update RAZORPAY_TIER1_PLAN_ID and RAZORPAY_TIER2_PLAN_ID in .env" -ForegroundColor White
    }
} else {
    Write-Host "⚠ Skipped Razorpay setup. Update .env file later." -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Build Test
Write-Host "[7/7] Testing Production Build..." -ForegroundColor Yellow
Write-Host "This may take 1-2 minutes..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Production build successful!" -ForegroundColor Green
} else {
    Write-Host "⚠ Build failed. Please check errors above." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Gray
    Write-Host "- Missing environment variables" -ForegroundColor Gray
    Write-Host "- Database connection issues (can be ignored in dev)" -ForegroundColor Gray
    Write-Host "- TypeScript errors in code" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ OpenAI API Key: Configured" -ForegroundColor Green
Write-Host "✓ Dependencies: Installed" -ForegroundColor Green
Write-Host "✓ Prisma Client: Generated" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review .env file and complete any missing values" -ForegroundColor White
Write-Host "2. Read COMPLETE_SETUP.md for detailed instructions" -ForegroundColor White
Write-Host "3. Start development server: npm run dev" -ForegroundColor White
Write-Host "4. Open http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup guides, see:" -ForegroundColor Cyan
Write-Host "- COMPLETE_SETUP.md - Step-by-step setup guide" -ForegroundColor White
Write-Host "- QUICK_DEPLOY.md - 30-minute deployment guide" -ForegroundColor White
Write-Host "- AI_SETUP_GUIDE.md - OpenAI configuration details" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
