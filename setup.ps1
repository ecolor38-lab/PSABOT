# PSABOT Setup Script
Write-Host "=== PSABOT Setup ===" -ForegroundColor Cyan

# 1. Create .env file
Write-Host "`n[1/4] Creating .env file..." -ForegroundColor Yellow

$envContent = @"
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_agent
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-REPLACE-WITH-YOUR-KEY
SERPAPI_KEY=REPLACE-WITH-YOUR-KEY
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DOCS_SCHEMA_ID=
GOOGLE_DOCS_PROMPT_ID=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
FACEBOOK_PAGE_ID=
FACEBOOK_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_ORGANIZATION_ID=
IMGBB_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
APPROVAL_SECRET=psabot-secret-key-12345
APPROVAL_TIMEOUT_MINUTES=45
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host ".env created!" -ForegroundColor Green

# 2. Check Docker
Write-Host "`n[2/4] Checking Docker..." -ForegroundColor Yellow
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerExists) {
    Write-Host "Docker found!" -ForegroundColor Green
    
    # 3. Start containers
    Write-Host "`n[3/4] Starting PostgreSQL and Redis..." -ForegroundColor Yellow
    docker-compose up -d db redis
    
    Start-Sleep -Seconds 5
    Write-Host "Containers started!" -ForegroundColor Green
} else {
    Write-Host "Docker not found. Install from: https://docker.com/products/docker-desktop" -ForegroundColor Red
    Write-Host "Or install PostgreSQL and Redis manually." -ForegroundColor Yellow
}

# 4. Generate Prisma
Write-Host "`n[4/4] Setting up database..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push --accept-data-loss

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host "`nIMPORTANT: Edit .env file and add your API keys:" -ForegroundColor Yellow
Write-Host "  - OPENAI_API_KEY (from https://platform.openai.com/api-keys)" -ForegroundColor White
Write-Host "  - SERPAPI_KEY (from https://serpapi.com/manage-api-key)" -ForegroundColor White
Write-Host "`nThen run: npm run dev" -ForegroundColor Green


