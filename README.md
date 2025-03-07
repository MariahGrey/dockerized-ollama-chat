# Dockerized Ollama Chat App

This is a Next.js application with Ollama integration, containerized using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/) or npm

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd dockerize-ollama-chat
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration.

## Running the Application

### Using Docker

1. Start the Docker containers:

```bash
docker-compose up -d
```

This will start:

- The Next.js application
- Ollama service
- Any other required services

2. Access the application at [http://localhost:3000](http://localhost:3000)

To stop the containers:

```bash
docker-compose down
```

### Development Mode (without Docker)

1. Start the development server:

```bash
yarn dev
# or
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) with your browser

## Development Tools

- **Formatting Code**:

```bash
yarn format
```

- **Checking Code Format**:

```bash
yarn format:check
```

- **Linting**:

```bash
yarn lint
```

## Project Structure

```
dockerize-ollama-chat/
├── src/              # Application source code
├── public/           # Static files
├── prisma/           # Database schema and migrations
├── Dockerfile        # Next.js application container
├── docker-compose.yml # Docker services configuration
└── ...
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Ollama Documentation](https://ollama.ai/docs)
