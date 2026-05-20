#!/bin/bash
# Run this ONCE on a fresh Ubuntu 22.04 EC2 instance as root (or with sudo).
# Usage: curl -s https://raw.githubusercontent.com/YOUR_REPO/main/deploy/setup-ec2.sh | sudo bash

set -e

echo "=== ResumeMate EC2 Setup ==="

# ── Node.js 20 ────────────────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ── PM2 ───────────────────────────────────────────────────────────────────────
npm install -g pm2

# ── Nginx ─────────────────────────────────────────────────────────────────────
apt-get install -y nginx

# ── Chromium dependencies (for Puppeteer) ─────────────────────────────────────
apt-get install -y \
  libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 \
  libx11-xcb1 libxshmfence1 fonts-liberation ca-certificates \
  wget gnupg --no-install-recommends

# ── Certbot (Let's Encrypt SSL) ───────────────────────────────────────────────
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# ── Log directory ─────────────────────────────────────────────────────────────
mkdir -p /var/log/resumemate
chown ubuntu:ubuntu /var/log/resumemate

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p /var/www/resumemate
chown ubuntu:ubuntu /var/www/resumemate

# ── Nginx config (replace yourdomain.com with your actual domain) ─────────────
cat > /etc/nginx/sites-available/resumemate << 'NGINX'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP → HTTPS (certbot will update this)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # PDF downloads can be large — increase timeout
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files — cache aggressively
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/resumemate /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# ── PM2 startup on reboot ──────────────────────────────────────────────────────
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash

echo ""
echo "=== Setup complete! Next steps: ==="
echo "1. Upload your app to /var/www/resumemate"
echo "2. Create /var/www/resumemate/.env.production with your env vars"
echo "3. Run: cd /var/www/resumemate && npm ci --production && npm run build"
echo "4. Run: pm2 start ecosystem.config.js && pm2 save"
echo "5. Get SSL: certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
