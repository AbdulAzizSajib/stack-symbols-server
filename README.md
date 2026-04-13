# Portfolio Server

Backend API for a personal portfolio built with Node.js, Express, TypeScript, Prisma, PostgreSQL, and Better Auth. The server powers portfolio content, authentication, contact messages, analytics, uploads, and admin-facing content management.

## Features

- REST API for portfolio content: about, profile, projects, skills, testimonials, certifications, education, experience, categories, tags, and users.
- Authentication and session handling with Better Auth.
- Contact message storage and Gmail notification support.
- Page view analytics with custom event tracking and summary endpoints.
- PostgreSQL persistence through Prisma.
- Cloudinary and Multer support for file uploads.
- Validation with Zod and centralized error handling.

## Tech Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Better Auth
- Nodemailer
- GeoIP Lite
- Zod

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm
- PostgreSQL database

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the project root and provide these values:

```dotenv
PORT=5000
NODE_ENV=development

DATABASE_URL=your_postgres_connection_string
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:5000

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

EMAIL_SENDER_SMTP_USER=your_gmail_address
EMAIL_SENDER_SMTP_PASS=your_gmail_app_password
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=465
EMAIL_SENDER_SMTP_FROM=your_gmail_address

FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Prisma Setup

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

## Available Scripts

- `pnpm dev` - run the server in watch mode.
- `pnpm build` - compile TypeScript to the dist folder.
- `pnpm start` - start the compiled app entry point.
- `pnpm typecheck` - run TypeScript without emitting files.

## API Overview

Base path: `/api/v1`

### Public endpoints

- `POST /contact-messages` - create a contact message.
- `POST /page-views` - create a page view or analytics event.

### Admin endpoints

- `GET /page-views` - list page views with pagination and filters.
- `GET /page-views/:id` - get a single page view.
- `GET /page-views/summary` - analytics summary.
- `DELETE /page-views/:id` - delete a page view.
- `GET /contact-messages` - list contact messages.
- `GET /contact-messages/:id` - get a single contact message.
- `PATCH /contact-messages/:id/status` - update contact message status.
- `DELETE /contact-messages/:id` - delete a contact message.

## Page View Analytics

The page view API supports both simple page tracking and custom interaction events.

### Create event payload

```json
{
  "path": "/",
  "referrer": "https://example.com",
  "userAgent": "Mozilla/5.0",
  "eventType": "page_view",
  "section": "hero"
}
```

### Supported event types

- `page_view`
- `cta_click`
- `nav_click`
- `project_open`
- `contact_open`
- `contact_submit`
- `section_view`
- `custom` is used as fallback when an unknown event type is submitted.

### Query filters

- `GET /page-views?eventType=cta_click`
- `GET /page-views?section=contact`
- `GET /page-views?country=BD`
- `GET /page-views?searchTerm=/projects`

### Summary endpoint

`GET /page-views/summary?from=2026-04-01&to=2026-04-30`

Response includes:

- totalViews
- uniqueVisitors
- topSections
- eventBreakdown

## Contact Messages

When a visitor submits the contact form, the message is stored in PostgreSQL and a Gmail notification is sent to the configured SMTP user.

## Project Structure

```text
src/
  app/
    config/
    errorHelpers/
    interfaces/
    lib/
    middleware/
    module/
    shared/
    types/
    utils/
prisma/
  schema.prisma
  migrations/
```

## Notes

- The app uses trusted proxy handling for correct client IP detection behind reverse proxies.
- GeoIP country resolution falls back to proxy-provided country headers when available.
- If you run locally, GeoIP may return null for loopback IPs such as 127.0.0.1 or ::1.
