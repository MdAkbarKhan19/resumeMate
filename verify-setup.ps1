# ResumeMate Setup Verification Script
# Run this to check if all services are configured correctly

Write-Host "🚀 ResumeMate Setup Verification" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$errors = 0
$warnings = 0

# Check if .env file exists
Write-Host "📋 Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file found" -ForegroundColor Green
    
    # Read .env file
    $envContent = Get-Content ".env" -Raw
    
    # Check OpenAI
    if ($envContent -match 'OPENAI_API_KEY="sk-proj-[^"]+"') {
        Write-Host "   ✅ OpenAI API Key configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ OpenAI API Key missing or invalid" -ForegroundColor Red
        $errors++
    }
    
    # Check Database
    if ($envContent -match 'DATABASE_URL="postgresql://[^"]+"') {
        Write-Host "   ✅ Database URL configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Database URL missing" -ForegroundColor Red
        $errors++
    }
    
    # Check AWS S3
    if ($envContent -match 'AWS_ACCESS_KEY_ID="[^"]+"' -and $envContent -match 'AWS_SECRET_ACCESS_KEY="[^"]+"') {
        Write-Host "   ✅ AWS S3 credentials configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  AWS S3 credentials missing (optional for now)" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check Razorpay
    if ($envContent -match 'RAZORPAY_KEY_ID="[^"]+"' -and $envContent -match 'RAZORPAY_KEY_SECRET="[^"]+"') {
        Write-Host "   ✅ Razorpay credentials configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Razorpay credentials missing (optional for now)" -ForegroundColor Yellow
        $warnings++
    }
    
} else {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    $errors++
}

# Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "   ✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    $errors++
}

# Check npm packages
Write-Host "`n📚 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules missing - run 'npm install'" -ForegroundColor Yellow
    $warnings++
}

# Check Prisma
Write-Host "`n🗄️  Checking Prisma..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma\client") {
    Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma Client not generated - run 'npx prisma generate'" -ForegroundColor Yellow
    $warnings++
}

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Errors: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host "   Warnings: $warnings" -ForegroundColor $(if ($warnings -eq 0) { "Green" } else { "Yellow" })

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "`n🎉 Perfect! All checks passed!" -ForegroundColor Green
    Write-Host "   You can now run: npm run dev" -ForegroundColor Green
} elseif ($errors -eq 0) {
    Write-Host "`n✅ Core setup complete!" -ForegroundColor Green
    Write-Host "   You can run the app, but some features may not work until warnings are resolved." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Please fix the errors above before running the app." -ForegroundColor Red
}

Write-Host "`n📖 For detailed setup steps, see: SETUP_STEPS.md" -ForegroundColor Cyan
