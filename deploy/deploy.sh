#!/bin/bash

# Japanese Flashcard - Deploy Script
# For Ubuntu 24.04 with Node.js pre-installed

set -e

echo "🚀 Starting deployment..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Project directory: $PROJECT_DIR"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install --production

# Create data directory for SQLite
mkdir -p data
mkdir -p uploads

# Build frontend
echo "🔨 Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# Install PM2 globally if not exists
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Stop existing PM2 process if exists
pm2 delete japanese-flashcard-api 2>/dev/null || true

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
cd "$PROJECT_DIR/backend"
pm2 start src/index.js \
    --name "japanese-flashcard-api" \
    --max-memory-restart 300M \
    --env production

# Save PM2 process list
pm2 save

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Configure Nginx: sudo cp $SCRIPT_DIR/nginx.conf /etc/nginx/sites-available/japanese-flashcard"
echo "   2. Enable site: sudo ln -sf /etc/nginx/sites-available/japanese-flashcard /etc/nginx/sites-enabled/"
echo "   3. Remove default: sudo rm -f /etc/nginx/sites-enabled/default"
echo "   4. Reload Nginx: sudo systemctl reload nginx"
echo "   5. Setup PM2 startup: pm2 startup && pm2 save"
echo ""
echo "🌐 Your app will be available at: http://your-ec2-ip"
