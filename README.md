# Eventy Backend

The **Eventy Backend** is a robust API built with NestJS, serving as the core engine for the Eventy platform. It handles authentication, data management, and business logic to ensure a seamless experience for both organizers and participants.

## 🚀 Key Features

- **Secure Authentication**: Implementation of JWT-based sessions and Google OAuth 2.0 integration for flexible login options.
- **Robust API Services**: Complete CRUD operations for:
  - **Events**: Detailed management including multi-date support and location data.
  - **Tickets**: Automated ticket generation and secure booking transactions.
  - **Users**: Comprehensive profile management and role-based access control.
  - **Categories**: Dynamic event classification.
- **Media Processing**: Integrated file upload system using `sharp` for optimized image handling.
- **Data Integrity**: Powered by Prisma ORM with structured PostgreSQL migrations and strong relational mapping.
- **Standardized Error Handling**: Global exception filters providing consistent API responses.
- **Input Validation**: Rigorous data validation and transformation using `class-validator` and `class-transformer`.

## 🛠 Tech Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Security**: Passport.js, JWT, Bcrypt
- **Image Processing**: Sharp
- **Validation**: Class-validator, Zod

## 🏗 Architecture
The backend follows a modular architecture, promoting high maintainability and scalability. Each core feature is encapsulated within its own module, following the official NestJS best practices.
