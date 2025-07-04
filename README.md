# Vault: Secure Password & TOTP Manager

## Overview
Vault is a full-stack, open-source password and TOTP (Time-based One-Time Password) manager. It features strong cryptography, a modern web frontend, and a robust Node.js/Express backend. The project is designed for both personal and small team use, with a focus on security and usability.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Cryptography](#cryptography)
- [Backend](#backend)
- [Frontend](#frontend)
- [Database](#database)
- [Setup & Deployment](#setup--deployment)
- [Security Notes](#security-notes)

---

## Features
- Secure password storage (AES-GCM encryption)
- TOTP (2FA) secret management
- User authentication (JWT-based)
- Master password for client-side encryption
- Role-based access (admin/user, optional)
- Audit logging (optional, can be removed for MVP)
- Modern React/Next.js frontend
- Responsive UI with Tailwind CSS

---

## Architecture
```
[User] ⇄ [Frontend (Next.js)] ⇄ [Backend (Express.js)] ⇄ [PostgreSQL (Prisma ORM)]
```
- **Frontend**: Next.js (React), communicates with backend via REST API
- **Backend**: Express.js, handles authentication, API, and database
- **Database**: PostgreSQL, managed via Prisma ORM

---

## Cryptography
- **Client-side encryption**: All sensitive data (passwords, TOTP secrets) are encrypted in the browser using AES-GCM before being sent to the backend.
- **Master Password**: Never leaves the client. Used to derive encryption keys (PBKDF2 or similar).
- **Backend**: Stores only encrypted blobs and metadata. No plaintext secrets are ever stored.
- **TOTP**: Secrets are encrypted and stored, never exposed in plaintext to the backend.
- **Password Hashing**: User passwords are hashed with bcrypt before storage.

---

## Backend
- **Framework**: Node.js with Express.js
- **Authentication**: JWT tokens, with middleware for protected routes
- **ORM**: Prisma for PostgreSQL
- **API Endpoints**: User registration, login, credential CRUD, TOTP CRUD
- **Environment Variables**: Uses dotenv for config (see `.env.example`)
- **Audit Logging**: (Optional) Logs key events for admin review

---

## Frontend
- **Framework**: Next.js (React)
- **UI**: Tailwind CSS for styling
- **State Management**: React Context for auth and master password
- **Encryption**: Uses WebCrypto API for AES-GCM encryption/decryption
- **Features**: Add/edit/delete credentials, TOTP management, master password modal, responsive design

---

## Database
- **User**: Stores user info, hashed password, and role
- **Credential**: Stores encrypted username/password blobs and metadata
- **TOTP**: Stores encrypted TOTP secrets and metadata
- **AuditLog**: (Optional) Stores audit events for admin review

---

## Setup & Deployment
### Local Development
1. Clone the repo
2. Install dependencies in both `backend/` and `frontend/`
3. Set up PostgreSQL and configure `.env` files
4. Run migrations: `npm run migrate` in backend
5. Start backend: `npm run dev` in backend
6. Start frontend: `npm run dev` in frontend

### Production (AWS Example)
- Deploy backend to AWS Lambda or EC2
- Use Amazon RDS for PostgreSQL
- Store secrets in AWS Secrets Manager
- Set environment variables for production
- Use a CDN (CloudFront) for frontend

---

## Security Notes
- **Master password is never sent to the server**
- **All sensitive data is encrypted client-side**
- **JWT tokens are used for session management**
- **Audit logging and admin roles are optional and can be removed for MVP**
- **Regularly update dependencies and review security best practices**

---

## Contributing
Pull requests and issues are welcome! Please see CONTRIBUTING.md for guidelines.

---

## License
MIT 