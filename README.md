# Driver Location Tracking Backend API

A RESTful backend service built with Node.js, Express, and SQLite for receiving, validating, storing, and synchronizing driver location records.

The backend is designed to support offline-first mobile applications through single and bulk location ingestion, database-level duplicate prevention, and paginated location history retrieval.

---

## Project Overview

The Driver Location Tracking Backend provides API endpoints for the Flutter mobile application.

It receives location records, validates incoming data, stores records in SQLite, and prevents duplicate database entries using unique location identifiers.

### Key Features

- RESTful API architecture.
- Single location submission.
- Bulk location synchronization.
- Request payload validation.
- SQLite database integration.
- Duplicate record prevention.
- Transaction-based bulk processing.
- Location history retrieval.
- Pagination support.
- API health monitoring.
- Synchronization activity logging.
- Automated API testing with Jest and Supertest.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| SQLite | Database |
| better-sqlite3 | SQLite database integration |
| Jest | Automated testing |
| Supertest | HTTP API testing |
| dotenv | Environment configuration |
| cors | Cross-origin resource sharing |
| nodemon | Development server restart |

---

## Project Structure

```text
driver_location_tracking_backend/
│
├── database/
│   ├── driver_tracking.sqlite
│   └── driver_tracking_test.sqlite
│
├── src/
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │   └── location_controller.js
│   │
│   ├── routes/
│   │   └── location_routes.js
│   │
│   ├── services/
│   │
│   ├── middleware/
│   │
│   ├── utils/
│   │
│   └── server.js
│
├── tests/
│   └── location_api.test.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation and Setup

### Prerequisites

- Node.js
- npm
- Windows, Linux, or macOS

### 1. Clone Repository

```bash
git clone <YOUR_BACKEND_REPOSITORY_URL>
cd driver_location_tracking_backend
```

### 2. Install