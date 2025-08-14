# Dockerized Ollama Chat

A Next.js application that provides a chat interface for Ollama language models, with user authentication and query history. Fully containerized with Docker for easy deployment.

## Features

- 🤖 Chat interface with Ollama language models
- 👤 User authentication (signup/signin)
- 📝 Query history for logged-in users
- 🐳 Fully containerized with Docker
- 🚀 Production-ready deployment configurations

## Prerequisites

- Docker and Docker Compose V2
- Git

## Quick Start with Docker

1. Clone the repository:

```bash
git clone https://github.com/your-username/dockerize-ollama-app.git
cd dockerize-ollama-app
```

2. Create a `.env` file using the template:

```bash
cp env.example .env
```

Edit the `.env` file with your preferred values (the defaults work for local development).

3. Start all services using Docker Compose:

```bash
docker-compose up -d
```

This will start:

- The Next.js application on port 3000
- Ollama service on port 11434
- PostgreSQL database on port 5432

4. Pull an Ollama model:

```bash
# Wait for Ollama to start, then pull a model
docker exec -it dockerize-ollama-app-ollama-1 ollama pull llama2
```

5. Access the application at `http://localhost:3000`

## Environment Variables

Key environment variables in your `.env` file:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Random string for session security
- `API_USERNAME` / `API_PASSWORD`: Basic auth for the chat API
- `OLLAMA_HOST`: URL to your Ollama service

See `env.example` for all available options and defaults.

## Database Setup

The database will automatically be initialized when you first run the containers. Prisma migrations run automatically on startup.

To manually manage the database:

```bash
# Run database migrations manually
docker-compose exec nextjs npx prisma migrate deploy

# Access Prisma Studio (database GUI)
npx prisma studio
```

## Development

For local development:

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

## Docker Commands

Common commands you'll need:

- `docker-compose up -d`: Start all services in detached mode
- `docker-compose down`: Stop all services
- `docker-compose logs -f`: Follow the logs
- `docker-compose ps`: List running containers
- `docker-compose up -d --build`: Rebuild and start containers

## Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick deployment to Fly.io:

```bash
# Install Fly CLI and login
fly auth login

# Deploy
./scripts/deploy.sh
```

## Troubleshooting

1. **Database connection fails:**

```bash
# Restart the database container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

2. **Ollama isn't responding:**

```bash
# Check if Ollama container is running
docker-compose ps ollama

# Check Ollama logs
docker-compose logs ollama

# List available models
docker exec -it dockerize-ollama-app-ollama-1 ollama list

# Pull a model if none exist
docker exec -it dockerize-ollama-app-ollama-1 ollama pull llama2
```

3. **Application isn't responding:**

```bash
# Check application logs
docker-compose logs nextjs

# Rebuild the application
docker-compose up -d --build nextjs
```

4. **Authentication issues:**

- Check that `NEXTAUTH_SECRET` is set in your `.env` file
- Verify `NEXTAUTH_URL` matches your application URL
- Clear browser cookies and try again

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Authentication**: NextAuth v5
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Ollama for language model inference
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose
