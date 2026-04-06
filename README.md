# Voucher Management System

A full-stack voucher management application with role-based access control. Employees create and submit vouchers for review; Admins approve, reject, or delete them.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Node.js, Express, TypeScript            |
| Database   | PostgreSQL, Prisma ORM                  |
| Auth       | JWT (jsonwebtoken), bcryptjs            |
| Validation | Zod                                     |
| Frontend   | React, TypeScript, Vite, Tailwind CSS   |
| Infra      | Docker Compose                          |

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Docker)

### Option 1: With Docker (recommended)

```bash
docker-compose up --build
```

This starts PostgreSQL, the backend (port 3000), and the frontend (port 5173). The backend automatically runs migrations and seeds the database.

Open http://localhost:5173 in your browser.

### Option 2: Without Docker

**1. Start PostgreSQL** and create a database called `voucher_db`.

**2. Backend**

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string if needed
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend runs on http://localhost:3000.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173.

## Seed Data (Test Accounts)

| Role     | Email           | Password |
|----------|-----------------|----------|
| Admin    | admin@test.com  | admin123 |
| Employee | emp1@test.com   | emp123   |
| Employee | emp2@test.com   | emp123   |

The seed script also creates 7 sample vouchers in various statuses.

## API Endpoints

All endpoints return errors as `{ error: string, details?: any }`.

### Auth

#### POST /api/auth/register

Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "EMPLOYEE"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "EMPLOYEE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/login

**Request:**
```json
{
  "email": "emp1@test.com",
  "password": "emp123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Employee One",
    "email": "emp1@test.com",
    "role": "EMPLOYEE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Vouchers (JWT Protected)

All voucher endpoints require `Authorization: Bearer <token>` header.

#### POST /api/vouchers

Create a new voucher (Employee only). Status defaults to DRAFT.

**Request:**
```json
{
  "title": "Office Supplies",
  "description": "Pens and paper",
  "amount": 150.50
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Office Supplies",
  "description": "Pens and paper",
  "amount": "150.50",
  "status": "DRAFT",
  "rejectionReason": null,
  "createdBy": "user-uuid",
  "creator": { "id": "user-uuid", "name": "Employee One", "email": "emp1@test.com" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/vouchers?page=1&limit=10

List vouchers with pagination. Employees see only their own; Admins see all.

**Response (200):**
```json
{
  "data": [ /* array of vouchers */ ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### GET /api/vouchers/:id

Get a single voucher by ID. Employees can only view their own.

#### PUT /api/vouchers/:id

Update a voucher (Employee only). Only REJECTED vouchers can be edited. Status resets to DRAFT.

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "amount": 200.00
}
```

#### DELETE /api/vouchers/:id

Delete a voucher (Admin only).

**Response (200):**
```json
{
  "message": "Voucher deleted successfully"
}
```

#### POST /api/vouchers/:id/submit

Submit a DRAFT voucher for review (Employee only). Changes status to PENDING.

#### POST /api/vouchers/:id/approve

Approve a PENDING voucher (Admin only). Changes status to APPROVED.

#### POST /api/vouchers/:id/reject

Reject a PENDING voucher (Admin only). Requires a rejection reason.

**Request:**
```json
{
  "rejectionReason": "Amount exceeds department budget"
}
```

## Business Rules

1. Employees can only view/edit their own vouchers
2. Only REJECTED vouchers can be edited (resets status to DRAFT)
3. APPROVED vouchers are completely immutable
4. Rejection must include a non-empty `rejectionReason`
5. Admins cannot create vouchers; Employees cannot approve/reject

## Environment Variables

| Variable     | Description                     | Default                                                        |
|--------------|---------------------------------|----------------------------------------------------------------|
| DATABASE_URL | PostgreSQL connection string    | postgresql://postgres:postgres@localhost:5432/voucher_db        |
| JWT_SECRET   | Secret key for JWT signing      | (required, set in .env)                                        |
| PORT         | Backend server port             | 3000                                                           |

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers (auth, vouchers)
│   │   ├── middleware/      # JWT auth + role guard
│   │   ├── routes/          # Express route definitions
│   │   ├── utils/           # Prisma client, Zod validation
│   │   ├── index.ts         # App entry point
│   │   └── seed.ts          # Database seed script
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Employee/Admin dashboards
│   │   ├── components/      # Reusable UI (StatusBadge)
│   │   ├── api/             # Axios instance + API functions
│   │   ├── App.tsx          # Routes + protected route guard
│   │   └── main.tsx         # Entry point
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Known Limitations / Future Improvements

- **No refresh tokens** — JWT expires after 24h; user must log in again
- **No email verification** — registration is open without email confirmation
- **No audit trail** — approvals/rejections don't track who performed the action
- **Client-side filtering** — status filter on Employee Dashboard filters the current page only, not server-side
- **No file attachments** — vouchers are text/amount only; receipts/invoices not supported
- **No search** — no full-text search across voucher titles or descriptions
- **No password reset** — no forgot-password flow
- **No rate limiting** — API endpoints are not rate-limited
- **No tests** — no unit or integration test coverage
