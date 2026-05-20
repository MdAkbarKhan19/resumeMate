#!/bin/bash
# Run this from your LOCAL machine to push and deploy updates to EC2.
# Usage: ./deploy/deploy.sh
#
# Prerequisites:
#   export EC2_HOST=ec2-xx-xx-xx-xx.compute.amazonaws.com
#   export EC2_KEY=~/.ssh/resumemate-key.pem
#   (or put them in deploy/.env.deploy)

set -e

if [ -f "deploy/.env.deploy" ]; then
  source deploy/.env.deploy
fi

EC2_HOST="${EC2_HOST:?Set EC2_HOST}"
EC2_KEY="${EC2_KEY:?Set EC2_KEY}"
EC2_USER="${EC2_USER:-ubuntu}"
APP_DIR="/var/www/resumemate"

echo "=== Deploying ResumeMate to $EC2_HOST ==="

# 1. Build locally first to catch errors before uploading
echo "→ Building..."
npm run build

# 2. Sync source to EC2 (exclude node_modules and .next — rebuilt on server)
echo "→ Uploading..."
rsync -azP --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env*' \
  --exclude='deploy/.env.deploy' \
  -e "ssh -i $EC2_KEY" \
  ./ "$EC2_USER@$EC2_HOST:$APP_DIR/"

# 3. Install dependencies and build on server
echo "→ Installing and building on server..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'REMOTE'
set -e
cd /var/www/resumemate
npm ci --include=dev
npm run build
REMOTE

# 4. Zero-downtime reload via PM2
echo "→ Reloading app..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'REMOTE'
set -e
cd /var/www/resumemate
pm2 reload resumemate --update-env || pm2 start ecosystem.config.js
pm2 save
REMOTE

echo "=== Deploy complete! ==="
