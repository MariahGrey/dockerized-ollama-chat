#!/bin/bash

# Production Deployment script for Dockerized Ollama App

set -e

echo "🚀 Starting production deployment process..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    echo "   export FLYCTL_INSTALL=\"/Users/mariahgrey/.fly\""
    echo "   export PATH=\"\$FLYCTL_INSTALL/bin:\$PATH\""
    exit 1
fi

# Check if logged in to Fly
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly. Please run 'fly auth login' first."
    exit 1
fi

echo "✅ Fly CLI ready"

# Check if required secrets are set
echo "🔐 Checking environment variables..."
REQUIRED_SECRETS=("DATABASE_URL" "NEXTAUTH_SECRET" "API_USERNAME" "API_PASSWORD" "OLLAMA_HOST")

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! fly secrets list | grep -q "$secret"; then
        echo "❌ Missing required secret: $secret"
        echo "Please set it with: fly secrets set $secret=\"your-value\""
        exit 1
    fi
done

echo "✅ All required secrets are configured"

# Build and deploy
echo "🔨 Building and deploying application..."
fly deploy --ha=false

echo "🎉 Deployment completed successfully!"
echo "📱 Your app should be available at: https://dockerize-ollama-app.fly.dev"

# Show app status and logs
echo ""
echo "📊 App status:"
fly status

echo ""
echo "📝 Recent logs:"
fly logs --lines 20
