This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database

### Setup

This project uses Prisma with PostgreSQL. The database is automatically configured when running with Docker, but for local development:

1. Make sure PostgreSQL is running locally or update your `.env` file with your database URL:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/ollama_chat"
```

2. Run database migrations:

```bash
npx prisma migrate dev
```

3. (Optional) Seed the database:

```bash
npx prisma db seed
```

### Database Management

- **Generate Prisma Client**:

```bash
npx prisma generate
```

- **Open Prisma Studio** (database GUI):

```bash
npx prisma studio
```

- **Reset Database**:

```bash
npx prisma db reset
```

### Schema Updates

1. Update the schema in `prisma/schema.prisma`
2. Create a new migration:

```bash
npx prisma migrate dev --name your_migration_name
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
