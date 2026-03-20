
# Lance Wallet Service

A fintech wallet service built with Node.js, TypeScript, PostgreSQL, and React.
Implements a double-entry ledger system for financial correctness, atomic transfers,
and concurrency-safe operations.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Design Decisions](#key-design-decisions)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup (Without Docker)](#local-setup-without-docker)
- [Local Setup (With Docker)](#local-setup-with-docker)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing with Thunder Client](#testing-with-thunder-client)
- [Security](#security)
- [Assumptions](#assumptions)
- [Scaling to 10 Million Transactions Per Day](#scaling-to-10-million-transactions-per-day)
- [Screenshots](#screen-shots)

---

## Architecture Overview
```
┌─────────────────┐         ┌─────────────────┐        ┌─────────────────┐
│                 │  HTTP   │                 │  SQL   │                 │
│  React Frontend │────────▶│  Express API    │───────▶│   PostgreSQL    │
│  (Vite, port   │◀────────│  (port 3000)    │◀───────│   (port 5432)   │
│   5173)         │  JSON   │                 │  Prisma│                 │
└─────────────────┘         └─────────────────┘        └─────────────────┘
```

The system is split into two fully independent applications:

- **Backend** — REST API built with Express and TypeScript. Handles all financial
  logic, authentication, and database operations via Prisma ORM.

- **Frontend** — React SPA built with Vite and TypeScript. Communicates with the
  backend over HTTP. Authentication is handled via HttpOnly cookies — the token
  is never accessible to JavaScript.

- **Database** — PostgreSQL with a ledger-based data model. Balances are never
  stored directly; they are always derived by summing ledger entries.

---

## Key Design Decisions

### 1. Ledger-Based Balance (Not a Balance Column)

Most basic wallet implementations store a `balance` column and update it on every
transaction. This is unsafe — concurrent updates can cause race conditions and
partial failures can cause money to disappear.

Instead, every money movement is recorded as an immutable ledger entry:
```
A deposit of ₦5,000 creates:
  ledger_entries: { wallet_id: X, type: 'credit', amount: 5000 }

A transfer of ₦1,000 from Alice to Bob creates:
  ledger_entries: { wallet_id: Alice, type: 'debit',  amount: 1000 }
  ledger_entries: { wallet_id: Bob,   type: 'credit', amount: 1000 }
```

Balance is always calculated on demand:
```
balance = SUM(credits) - SUM(debits) for a given wallet
```

Nothing is ever updated or deleted. This gives a complete, auditable history of
every money movement.

### 2. Atomic Transfers with Database Transactions

All transfer operations are wrapped in a Prisma `$transaction` block. Either both
the debit and credit ledger entries are written, or neither is. There is no
in-between state where money leaves one wallet without arriving in another.

### 3. Concurrency Control via SELECT FOR UPDATE

Before processing a transfer, the sender's wallet row is locked:
```sql
SELECT id FROM wallets WHERE id = $1 FOR UPDATE
```

This prevents two concurrent transfers from reading the same balance simultaneously
and both succeeding when only one should. The second request waits for the lock to
be released, then reads the updated balance — and fails correctly if funds are
insufficient.

### 4. Idempotency Keys

Every deposit and transfer request accepts an `Idempotency-Key` header. If the
same key is submitted twice (network retry, double click), the second request
returns the original result instead of creating a duplicate transaction. This is
critical in financial systems where clients may retry failed requests.

### 5. HttpOnly Cookie Authentication

JWT tokens are stored in HttpOnly cookies, not localStorage. This means the token
is completely invisible to JavaScript — XSS attacks cannot steal it. The backend
sets the cookie on login and clears it on logout. The frontend never touches the
token directly.

---

## Project Structure
```
lance-wallet-service/
│
├── backend/                        # Independent Node.js + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema and models
│   │   └── migrations/             # Auto-generated migration history
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts               # Prisma client singleton
│   │   │   └── env.ts              # Environment variable validation
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts  # Register, login, logout handlers
│   │   │   └── wallet.controller.ts# Deposit, transfer, balance, history
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts  # JWT cookie verification
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      # /auth/* routes with validation
│   │   │   └── wallet.routes.ts    # /wallet/* routes with validation
│   │   ├── services/
│   │   │   ├── auth.service.ts     # Auth business logic
│   │   │   └── wallet.service.ts   # Ledger, transfer, balance logic
│   │   ├── types/
│   │   │   └── index.ts            # Shared TypeScript interfaces
│   │   └── index.ts                # Express app entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Independent React + Vite SPA
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.ts            # Axios instance with cookie auth
│   │   │   ├── auth.ts             # Register, login API calls
│   │   │   └── wallet.ts           # Deposit, transfer, balance API calls
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Global auth state
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx  # Route guard for authenticated pages
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Deposit.tsx
│   │   │   ├── Transfer.tsx
│   │   │   └── Transactions.tsx
│   │   ├── types/
│   │   │   └── index.ts            # Shared TypeScript interfaces
│   │   ├── App.tsx                 # Router and route definitions
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Tailwind v4 with @theme config
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Orchestrates all three services
├── .gitignore
└── README.md
```

---

## Prerequisites

Make sure you have the following installed before proceeding:

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) v14 or higher
- [Git](https://git-scm.com/)
- [Docker + Docker Compose](https://www.docker.com/) (optional — for Docker setup)

---

## Local Setup (Without Docker)

This approach runs the backend and frontend directly on your machine using your
local PostgreSQL installation.

### 1. Clone the repository
```bash
git clone https://github.com/Nobiscumdeus/lance-wallet-service.git
cd lance-wallet-service
```

### 2. Create the PostgreSQL database

Open your PostgreSQL shell or any GUI (pgAdmin, TablePlus, DBeaver) and run:
```sql
CREATE DATABASE lance_wallet;
```

### 3. Set up the backend
```bash
cd backend
```

Copy the example environment file and fill in your values:
```bash
cp .env.example .env
```

Open `.env` and update:
```env
PORT=3000

# Use this for local PostgreSQL
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/lance_wallet"

# For a remote database (AWS RDS, Supabase, Neon etc.) replace the URL above:
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/lance_wallet"

JWT_SECRET=pick_a_long_random_string_here
NODE_ENV=development
```

Install dependencies and run migrations:
```bash
npm install
npx prisma migrate dev --name init
```

The migrate command creates all tables in your database automatically. You will
see output confirming each migration was applied.

Start the backend:
```bash
npm run dev
```

The API is now running at `http://localhost:3000`. Verify with:
```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }
```

### 4. Set up the frontend

Open a new terminal tab:
```bash
cd frontend
```

Copy the environment file:
```bash
cp .env.example .env
```

The default `.env` already points to the local backend:
```env
VITE_API_URL=http://localhost:3000
```

Install dependencies and start:
```bash
npm install
npm run dev
```

The frontend is now running at `http://localhost:5173`.

---

## Local Setup (With Docker)

This approach runs everything — PostgreSQL, backend, and frontend — in containers
with a single command. No local PostgreSQL installation needed.

### 1. Clone the repository
```bash
git clone https://github.com/Nobiscumdeus/lance-wallet-service.git
cd lance-wallet-service
```

### 2. Create backend environment file
```bash
cp backend/.env.example backend/.env
```

The Docker Compose setup uses its own internal network so the database host is
`postgres` (the service name), not `localhost`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/lance_wallet"
JWT_SECRET=pick_a_long_random_string_here
NODE_ENV=development
```

### 3. Create frontend environment file
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_API_URL=http://localhost:3000
```

### 4. Start all services
```bash
docker-compose up --build
```

Docker will:
- Pull and start a PostgreSQL container
- Build and start the backend container
- Build and start the frontend container
- Run database migrations automatically on first start

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:5173   |
| Backend  | http://localhost:3000   |
| Postgres | localhost:5432          |

To stop everything:
```bash
docker-compose down
```

To stop and delete the database volume (full reset):
```bash
docker-compose down -v
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port the API runs on. Defaults to 3000 |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key used to sign JWT tokens. Use a long random string |
| `NODE_ENV` | No | `development` or `production`. Affects cookie security and logging |
| `FRONTEND_URL` | Production only | Allowed CORS origin in production |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL of the backend API |

---

## API Documentation

All wallet endpoints require authentication. The JWT token is set automatically
as an HttpOnly cookie after login — no manual token handling needed.

### Auth

#### POST /auth/register
Create a new user and wallet.

**Request body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### POST /auth/login
Log in and receive a session cookie.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

---

#### POST /auth/logout
Clear the session cookie.

---

### Wallet

All wallet endpoints require the session cookie to be present (set automatically
after login).

#### POST /wallet/deposit
Deposit funds into the authenticated user's wallet.

**Headers:**
```
Idempotency-Key: any-unique-string
```

**Request body:**
```json
{
  "amount": 5000
}
```

**Response:**
```json
{
  "message": "Deposit successful",
  "transaction": { "id": "uuid", "type": "deposit", "status": "completed" },
  "balance": "5000.00"
}
```

---

#### POST /wallet/transfer
Transfer funds to another user.

**Headers:**
```
Idempotency-Key: any-unique-string
```

**Request body:**
```json
{
  "toUserId": "recipient-user-uuid",
  "amount": 1000
}
```

---

#### GET /wallet/balance
Get the current wallet balance.

**Response:**
```json
{
  "walletId": "uuid",
  "balance": "4000.00",
  "currency": "NGN"
}
```

---

#### GET /wallet/transactions
Get paginated transaction history.

**Query params:**
```
?page=1&limit=20
```

---

## Testing with Thunder Client

Install the [Thunder Client](https://www.thunderclient.com/) extension in VS Code.
In Thunder Client settings, enable **Save Cookies** so the session cookie persists
between requests automatically.

### Recommended test flow

Run these requests in order to validate the entire system:

**Step 1 — Register Alice**
```
POST http://localhost:3000/auth/register
Body: { "name": "Alice", "email": "alice@test.com", "password": "password123" }
```
Copy Alice's `id` from the response.

**Step 2 — Register Bob**
```
POST http://localhost:3000/auth/register
Body: { "name": "Bob", "email": "bob@test.com", "password": "password123" }
```
Copy Bob's `id` from the response.

**Step 3 — Login as Alice**
```
POST http://localhost:3000/auth/login
Body: { "email": "alice@test.com", "password": "password123" }
```
Cookie is set automatically.

**Step 4 — Deposit into Alice's wallet**
```
POST http://localhost:3000/wallet/deposit
Header: Idempotency-Key: dep-001
Body: { "amount": 5000 }
```
Expected balance: 5000.00

**Step 5 — Check Alice's balance**
```
GET http://localhost:3000/wallet/balance
```
Expected: `"balance": "5000.00"`

**Step 6 — Transfer from Alice to Bob**
```
POST http://localhost:3000/wallet/transfer
Header: Idempotency-Key: txn-001
Body: { "toUserId": "BOB_ID_HERE", "amount": 1000 }
```
Expected: Alice balance 4000.00, Bob balance 1000.00

**Step 7 — Test idempotency (duplicate prevention)**
```
POST http://localhost:3000/wallet/transfer
Header: Idempotency-Key: txn-001   ← same key as Step 6
Body: { "toUserId": "BOB_ID_HERE", "amount": 1000 }
```
Expected: Returns original transaction — no duplicate created.

**Step 8 — Test insufficient funds**
```
POST http://localhost:3000/wallet/transfer
Header: Idempotency-Key: txn-002
Body: { "toUserId": "BOB_ID_HERE", "amount": 999999 }
```
Expected: `400 Insufficient funds`

**Step 9 — View Alice's transaction history**
```
GET http://localhost:3000/wallet/transactions?page=1&limit=10
```
Expected: One deposit entry, one transfer debit entry.

**Step 10 — Login as Bob and check his balance**
```
POST http://localhost:3000/auth/login
Body: { "email": "bob@test.com", "password": "password123" }

GET http://localhost:3000/wallet/balance
```
Expected: `"balance": "1000.00"`

---

## Security

- **HttpOnly Cookies** — JWT tokens are stored in HttpOnly cookies. JavaScript
  cannot read them, preventing XSS-based token theft.
- **Bcrypt** — passwords are hashed with bcrypt at 12 salt rounds before storage.
  Plain text passwords are never persisted.
- **Helmet** — sets secure HTTP response headers to protect against common web
  vulnerabilities including XSS, clickjacking, and MIME sniffing.
- **Input Validation** — all request inputs are validated with express-validator
  before reaching any business logic.
- **Idempotency Keys** — prevents duplicate financial operations from network
  retries or double submissions.
- **Generic Auth Errors** — login returns the same error message for wrong email
  and wrong password, preventing user enumeration attacks.
- **CORS** — restricted to the known frontend origin. Wildcard `*` is not used.
- **NUMERIC type for money** — PostgreSQL NUMERIC(20,2) is used for all monetary
  values instead of FLOAT, preventing floating point rounding errors.

---

## Assumptions

- One wallet per user. The wallet is created automatically at registration.
- Currency is NGN by default. Multi-currency support was not in scope.
- User ID is used to identify transfer recipients. In production this would be
  replaced with a search by email or a username lookup.
- Idempotency keys are generated client-side (UUID v4). In production the client
  should generate and store these before making a request so they survive retries.
- Amounts are received as numbers in the API and stored as NUMERIC(20,2).
  The minimum transfer/deposit amount is 0.01.
- No email verification flow — users are active immediately after registration.
  Production would require email confirmation.

---

## Scaling to 10 Million Transactions Per Day

10 million transactions per day is roughly 115 transactions per second on average,
with peaks likely 5-10x that during busy periods. Here is how this system would
evolve to handle that load.

### Database

**Read replicas** — balance checks and transaction history are read-heavy
operations. Routing all reads to PostgreSQL read replicas keeps the primary
database free for writes only.

**Connection pooling** — at high concurrency, opening a new database connection
per request becomes expensive. PgBouncer sits between the application and
PostgreSQL, pooling and reusing connections efficiently.

**Table partitioning** — the `ledger_entries` table will grow very large over time.
Partitioning it by date (monthly or weekly) keeps query performance fast as data
grows into the hundreds of millions of rows.

**Archiving** — entries older than a defined period (e.g. 2 years) move to cold
storage or a data warehouse like BigQuery, keeping the active table lean.

### Application

**Horizontal scaling** — the backend is stateless (auth lives in cookies verified
against a secret, not server memory). Multiple instances can run behind a load
balancer with no shared state concerns.

**Asynchronous processing** — at high volume, transfers can be accepted immediately
and processed via a job queue (BullMQ + Redis or AWS SQS). The API returns a
`pending` status instantly, and a background worker processes and settles the
transaction. This decouples request handling from processing time.

**Caching** — frequently read data like wallet balances can be cached in Redis
with a short TTL (e.g. 5 seconds). This dramatically reduces database load for
dashboard reads while keeping data reasonably fresh.

### Infrastructure

**Containerisation** — the existing Docker setup maps directly to Kubernetes for
orchestration. Pods scale horizontally based on CPU or request queue depth.

**CDN** — the React frontend is fully static after build. Serving it from a CDN
(CloudFront, Vercel, Netlify) removes frontend traffic from the origin entirely.

**Multi-region** — for a fintech platform serving multiple geographies, active
passive or active-active database replication across regions reduces latency and
provides disaster recovery.

### Observability

**Structured logging** — all requests and errors emit structured JSON logs
(using a library like Pino) that feed into a log aggregator like Datadog or
the ELK stack.

**Distributed tracing** — each transaction gets a trace ID that follows it through
the API, queue, and database. This makes debugging failures across services fast.

**Alerting** — monitors on failed transaction rate, p99 latency, and queue depth
with automated alerts before issues affect users.

**Reconciliation jobs** — scheduled background jobs that verify ledger consistency,
flagging any wallet where the sum of ledger entries does not match expectations.
This is a financial system safety net.


## Screenshots

### Login
![Dashboard](./screenshots/login.png)

### Registration
![Register](./screenshots/register.png)

### Dashboard
![Dashboard](./screenshots/dashboard.png)
