# DevError

A collaborative issue tracking platform for software teams to report bugs, request features, and manage issue workflows efficiently.

## Live Demo

- Live URL: https://dev-error-ashy.vercel.app/

---

## Features

- User authentication with JWT
- Role-based authorization system
- Contributor and maintainer roles
- Create, update, view, and delete issues
- Issue filtering and sorting
- Password hashing with bcrypt
- PostgreSQL database integration
- Modular Express architecture
- TypeScript support
- Environment-based configuration

---

## Tech Stack

| Technology | Description |
|---|---|
| Node.js | Backend runtime |
| TypeScript | Strongly typed JavaScript |
| Express.js | Backend framework |
| PostgreSQL | Relational database |
| Raw SQL | Database queries using `pool.query()` |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| dotenv | Environment variable management |

---

## User Roles

### Contributor
- Register and log in
- Create issues
- View all issues
- Update own issue while status is `open`

### Maintainer
- All contributor permissions
- Update any issue
- Delete any issue
- Change issue status independently

---

## Authentication Flow

1. User registers or logs in
2. Server validates credentials
3. JWT token is generated
4. Client stores token
5. Token is sent in the `Authorization` header
6. Protected routes verify token and permissions

Example:

```http
Authorization: <JWT_TOKEN>
```

---

## Project Structure

```bash
src/
│
├── config/
├── db/
├── middleware/
├── module/
│   ├── auth/
│   └── user/
├── types/
│
├── app.ts
└── server.ts
```

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/deverror.git
```

### 2. Navigate to the project directory

```bash
cd deverror
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create `.env` file

```env
PORT=8000

DATABASE_URL=your_postgresql_database_url

JWT_SECRET=your_secret_key

NODE_ENV=development
```

### 5. Run the development server

```bash
npm run dev
```

### 6. Build the project

```bash
npm run build
```

### 7. Start production server

```bash
npm start
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login user |

---

### Issues

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/issues` | Create issue |
| GET | `/api/issues` | Get all issues |
| GET | `/api/issues/:id` | Get single issue |
| PATCH | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue |

---

## Query Parameters

### Get All Issues

```http
GET /api/issues?sort=newest&type=bug&status=open

---

## Database Schema Summary

### Users Table

| Field | Type |
|---|---|
| id | Serial Primary Key |
| name | String |
| email | Unique String |
| password | Hashed String |
| role | contributor / maintainer |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### Issues Table

| Field | Type |
|---|---|
| id | Serial Primary Key |
| title | String |
| description | Text |
| type | bug / feature_request |
| status | open / in_progress / resolved |
| reporter_id | Integer |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## Deployment

- Backend deployed on Vercel
- PostgreSQL hosted on NeonDB 

---

## Author

Developed by Abdul Ahad
