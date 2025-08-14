# Deployment Guide

This guide covers how to deploy the Dockerized Ollama Chat application using Docker Compose locally and Fly.io for production.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Fly.io CLI (for production deployment)

## Local Development with Docker Compose

### 1. Environment Setup

Copy the environment template:

```bash
cp env.example .env
```

Edit `.env` with your preferred values. The defaults work for local development.

### 2. Start Services

```bash
# Start all services (PostgreSQL, Ollama, Next.js app)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Database Setup

The database will be automatically set up when the app starts. Prisma migrations will run automatically.

### 4. Ollama Model Setup

After Ollama is running, you need to pull a model:

```bash
# Connect to the Ollama container
docker exec -it dockerize-ollama-app-ollama-1 ollama pull llama2

# Or pull a different model
docker exec -it dockerize-ollama-app-ollama-1 ollama pull codellama
```

### 5. Access the Application

- Application: http://localhost:3000
- Ollama API: http://localhost:11434
- PostgreSQL: localhost:5432

## Production Deployment with Fly.io

### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly

```bash
fly auth login
```

### 3. Create Fly App

```bash
# If this is your first time deploying this app
fly apps create dockerize-ollama-app

# Or use the existing app name from fly.toml
```

### 4. Set Environment Variables

```bash
# Required environment variables
fly secrets set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set DATABASE_URL="your-production-database-url"
fly secrets set API_USERNAME="your-secure-username"
fly secrets set API_PASSWORD="your-secure-password"
fly secrets set OLLAMA_HOST="http://your-ollama-service:11434"

# Public environment variables
fly secrets set NEXT_PUBLIC_API_USERNAME="your-secure-username"
fly secrets set NEXT_PUBLIC_API_PASSWORD="your-secure-password"
```

### 5. Set up Database

You'll need a PostgreSQL database. You can use:

- Fly.io Postgres
- Supabase
- PlanetScale
- Any PostgreSQL provider

For Fly.io Postgres:

```bash
fly postgres create
```

### 6. Deploy

```bash
# Deploy the application
fly deploy

# Or use the deployment script
./scripts/deploy.sh
```

### 7. Set up Ollama Service

You'll need to set up Ollama separately for production. Options:

1. Deploy Ollama on a separate Fly.io app
2. Use a cloud GPU service
3. Use Ollama cloud service (if available)

## Environment Variables Reference

### Required for All Environments

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Full URL of your application

### API Authentication

- `API_USERNAME`: Username for chat API authentication
- `API_PASSWORD`: Password for chat API authentication
- `NEXT_PUBLIC_API_USERNAME`: Public username (same as API_USERNAME)
- `NEXT_PUBLIC_API_PASSWORD`: Public password (same as API_PASSWORD)

### Ollama Configuration

- `OLLAMA_HOST`: URL to your Ollama service

## Troubleshooting

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Database Issues

```bash
# Reset database (development only)
docker-compose down -v
docker-compose up -d

# Run migrations manually
npx prisma migrate deploy
npx prisma generate
```

### Ollama Connection Issues

- Ensure Ollama is running and accessible
- Check firewall settings
- Verify the OLLAMA_HOST environment variable

## Security Notes

1. **Change default credentials**: Never use the default API credentials in production
2. **Use strong passwords**: Generate secure passwords for all accounts
3. **HTTPS only**: Always use HTTPS in production
4. **Environment variables**: Never commit sensitive environment variables to git
5. **Database security**: Use connection pooling and secure database credentials

## Performance Optimization

1. **Ollama Models**: Choose appropriate model sizes based on your hardware
2. **Database**: Use connection pooling for production
3. **Caching**: Consider implementing Redis for session storage
4. **CDN**: Use a CDN for static assets in production

## Monitoring

- Check application logs: `fly logs`
- Monitor resource usage: `fly status`
- Database monitoring: Use your database provider's monitoring tools
