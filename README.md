# Dockerized Ollama Chat

A Next.js application that provides a chat interface for Ollama language models, containerized with Docker.

## Prerequisites

- Docker and Docker Compose V2
- Git
- Ollama installed locally (for development)

## Quick Start with Docker

1. Clone the repository:

```bash
git clone https://github.com/MariahGrey/dockerized-ollama-chat.git
cd dockerized-ollama-chat
```

2. Create a `.env` file in the root directory using the example as a template:

```bash
cp .env.example .env
```

3. Make sure Ollama is running locally:

```bash
ollama run llama2
# or whatever model you prefer to use
```

4. Start the application using Docker Compose:

```bash
docker compose up -d
```

This will start:

- The Next.js application on port 3000
- PostgreSQL database on port 5432

5. Access the application at `http://localhost:3000`

## Environment Variables

Required environment variables in your `.env`:

- `NEXTAUTH_URL`: Your application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Random string for session security
- `DATABASE_URL`: PostgreSQL connection string

## Database Setup

The database will automatically be initialized when you first run the containers. To manually manage the database:

```bash
# Run database migrations
docker compose exec app npx prisma migrate deploy

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

- `docker compose up -d`: Start all services in detached mode
- `docker compose down`: Stop all services
- `docker compose logs -f`: Follow the logs
- `docker compose ps`: List running containers
- `docker compose up -d --build`: Rebuild and start containers

## Troubleshooting

1. If the database connection fails:

```bash
# Restart the database container
docker compose restart db

# Check database logs
docker compose logs db
```

2. If Ollama isn't responding:

- Ensure Ollama is running locally
- Check if the model is downloaded (`ollama list`)
- Try restarting the Ollama service

3. If the application isn't responding:

```bash
# Check application logs
docker compose logs app
```
