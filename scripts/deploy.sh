#!/bin/bash

# Deployment script for Dockerized Ollama App

set -e

echo "🚀 Starting deployment process..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in to Fly
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly. Please run 'fly auth login' first."
    exit 1
fi

echo "✅ Fly CLI ready"

# Build and deploy
echo "🔨 Building and deploying application..."
fly deploy

echo "🎉 Deployment completed successfully!"
echo "📱 Your app should be available at: https://dockerize-ollama-app.fly.dev"

# Optional: Show app status
echo ""
echo "📊 App status:"
fly status
