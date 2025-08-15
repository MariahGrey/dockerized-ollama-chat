# Production Deployment Guide for Fly.io

This guide will help you deploy your Dockerized Ollama Chat application to production on Fly.io.

## Prerequisites ✅

- [x] Fly CLI installed and configured
- [x] Logged into Fly.io (`fly auth login`)
- [ ] Credit card added to Fly.io account
- [ ] PostgreSQL database created
- [ ] Ollama service set up

## Step 1: Add Credit Card to Fly.io

Since your trial has ended, you need to add a credit card:

1. Visit: https://fly.io/dashboard/mariah-grey/billing
2. Add a payment method
3. This enables you to create databases and deploy apps

## Step 2: Create PostgreSQL Database

Choose one of these options:

### Option A: Fly.io Managed Postgres (Recommended)

```bash
export FLYCTL_INSTALL="/Users/mariahgrey/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Create managed Postgres (after adding credit card)
fly mpg create --name dockerize-ollama-db --region sea
```

### Option B: External Database

Use services like:

- Supabase (free tier available)
- PlanetScale (free tier available)
- Neon (free tier available)
- Railway (free tier available)

## Step 3: Set Up Ollama Service

You have several options for Ollama in production:

### Option A: Deploy Ollama on Fly.io (Recommended)

```bash
# Create a separate app for Ollama
fly apps create dockerize-ollama-service --org personal

# Create fly.toml for Ollama
cat > ollama-fly.toml << 'EOF'
app = 'dockerize-ollama-service'
primary_region = 'sea'

[build]
  image = 'ollama/ollama:latest'

[[vm]]
  memory = '4gb'
  cpu_kind = 'shared'
  cpus = 4

[http_service]
  internal_port = 11434
  force_https = false
  auto_stop_machines = 'suspend'
  auto_start_machines = true
  min_machines_running = 0

[mounts]
  source = 'ollama_data'
  destination = '/root/.ollama'
EOF

# Deploy Ollama
fly deploy --config ollama-fly.toml

# Pull a model
fly ssh console --app dockerize-ollama-service
ollama pull llama2
exit
```

### Option B: Use Ollama Cloud or External Service

If available in your region, use Ollama's cloud service or another LLM API.

## Step 4: Configure Environment Variables

Set all required secrets:

```bash
export FLYCTL_INSTALL="/Users/mariahgrey/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
API_USERNAME="secure_$(openssl rand -hex 8)"
API_PASSWORD=$(openssl rand -base64 32)

# Set database URL (replace with your actual database URL)
fly secrets set DATABASE_URL="postgresql://username:password@hostname:port/database"

# Set authentication secrets
fly secrets set NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
fly secrets set NEXTAUTH_URL="https://dockerize-ollama-app.fly.dev"

# Set API credentials
fly secrets set API_USERNAME="$API_USERNAME"
fly secrets set API_PASSWORD="$API_PASSWORD"
fly secrets set NEXT_PUBLIC_API_USERNAME="$API_USERNAME"
fly secrets set NEXT_PUBLIC_API_PASSWORD="$API_PASSWORD"

# Set Ollama host (adjust based on your setup)
fly secrets set OLLAMA_HOST="http://dockerize-ollama-service.flycast:11434"

# Production rate limiting (adjust based on your budget)
fly secrets set MAX_REQUESTS_PER_MINUTE="50"
fly secrets set MAX_REQUESTS_PER_MINUTE_AUTH="100"
fly secrets set AUTH_MAX_REQUESTS_PER_HOUR="10"
fly secrets set CACHE_TTL_MS="600000"
fly secrets set MAX_TOKENS="500"
```

## Step 5: Deploy the Application

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run the deployment
./scripts/deploy.sh
```

Or deploy manually:

```bash
export FLYCTL_INSTALL="/Users/mariahgrey/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

fly deploy --ha=false
```

## Step 6: Verify Deployment

1. Check app status:

```bash
fly status
```

2. View logs:

```bash
fly logs -f
```

3. Test the application:

```bash
curl https://dockerize-ollama-app.fly.dev/api/health
```

4. Access the web interface:
   - Visit: https://dockerize-ollama-app.fly.dev

## Step 7: Set Up Monitoring

1. View real-time logs:

```bash
fly logs -f
```

2. Monitor resource usage:

```bash
fly status
fly dashboard
```

3. Set up alerts in the Fly.io dashboard

## Troubleshooting

### Common Issues:

1. **Build fails**: Check Dockerfile and dependencies
2. **Database connection fails**: Verify DATABASE_URL
3. **Ollama not responding**: Check OLLAMA_HOST and service status
4. **Authentication issues**: Verify NEXTAUTH_SECRET and URLs

### Debug Commands:

```bash
# SSH into the app
fly ssh console

# Check environment variables
fly secrets list

# View detailed logs
fly logs --lines 100

# Restart the app
fly apps restart dockerize-ollama-app
```

## Security Checklist

- [x] Strong, unique NEXTAUTH_SECRET generated
- [x] Secure API credentials generated
- [x] HTTPS enforced (handled by Fly.io)
- [x] Database connection encrypted
- [x] Rate limiting enabled
- [x] Environment variables not in code

## Cost Optimization

1. **Auto-suspend**: Configured to suspend when idle
2. **Right-sizing**: Start with 2GB RAM, adjust based on usage
3. **Rate limiting**: Prevents abuse and excessive usage
4. **Caching**: Reduces Ollama API calls

## Scaling

To scale your application:

```bash
# Scale vertically (more resources)
fly scale memory 4096
fly scale cpu 4

# Scale horizontally (more instances)
fly scale count 2
```

## Next Steps

1. Set up custom domain (optional)
2. Configure CDN for static assets
3. Set up monitoring and alerting
4. Plan backup strategy for database
5. Consider Redis for session storage at scale

## Support

- Fly.io Documentation: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- Application logs: `fly logs`
