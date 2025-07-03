# 🚖 CabWire – Scalable Ride-Sharing Backend System

**CabWire** is a robust, enterprise-grade backend solution for real-time ride-sharing platforms. Built with TypeScript, Node.js, Express, and MongoDB, it’s designed with scalability, modularity, and security at its core. This backend supports real-time ride booking, live tracking, role-based access control, and integrated communication features — tailored for client delivery and production deployment.

---

## 🔥 Key Features

- 🔌 **Modular Architecture** — Clean separation of concerns across User, Driver, Ride, Payment, and Notification modules.
- 🔐 **JWT Authentication & Role-based Authorization** — Separate roles for User, Driver, and Admin secured using industry best practices.
- 📍 **Live Ride Booking & Tracking** — Real-time booking with driver-matching and status updates via Socket.IO.
- 💰 **Dynamic Fare Engine** — Automatic fare calculation based on ride type, distance, and duration.
- 📡 **Real-time Communication (WebRTC-ready)** — Placeholder for audio call integration between users and drivers.
- 📨 **Notification System** — SMS (Twilio/Vonage) and Email (NodeMailer) support for OTP, alerts, and status updates.
- 📁 **File Uploads** — Secure document/image uploads using Multer with local or cloud storage options.
- 🛡 **Input Validation** — Strong validation using Zod and Mongoose schemas.
- 📈 **Advanced Logging & Monitoring** — Winston with daily log rotation, Morgan for API logs.
- 🧹 **Code Quality Tools** — ESLint, Prettier, and optional Husky for Git hooks.

---

## 🛠 Tech Stack

| Layer           | Tool / Library          |
| --------------- | ----------------------- |
| **Language**    | TypeScript              |
| **Runtime**     | Node.js                 |
| **Framework**   | Express.js              |
| **Database**    | MongoDB + Mongoose      |
| **Auth**        | JWT + Bcrypt            |
| **Validation**  | Zod + Mongoose          |
| **File Upload** | Multer                  |
| **Sockets**     | Socket.IO               |
| **Email**       | NodeMailer              |
| **Logger**      | Winston + Morgan        |
| **Dev Tools**   | ESLint, Prettier, Husky |

---

## 🚀 Getting Started

### ✅ Prerequisites

Ensure the following are installed:

- Node.js (v18+)
- npm or yarn
- MongoDB (local or cloud)

---

### 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourcompany/cabwire-backend.git
   cd cabwire-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**

   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   IP_ADDRESS=0.0.0.0

   # Database
   DATABASE_URL=mongodb://127.0.0.1:27017/cabwire

   # Security
   BCRYPT_SALT_ROUNDS=12
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE_IN=1d

   # Email
   EMAIL_FROM=your-email@gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_PORT=587
   EMAIL_HOST=smtp.gmail.com
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

---

## 🧪 Testing

To run the unit tests:

```bash
npm test
```

---

## 🗂 Project Modules

| Module           | Responsibility                                                |
| ---------------- | ------------------------------------------------------------- |
| **User**         | Registration, login, profile management                       |
| **Driver**       | Verification, availability status, ride handling              |
| **Ride**         | Ride types, status flow, fare calculation                     |
| **RideBooking**  | Request and accept rides with real-time status updates        |
| **Payment**      | Stripe/manual payment logic (upcoming)                        |
| **Notification** | Email and SMS alerts, future push notification support        |
| **Chat/Call**    | WebRTC-ready endpoints for future real-time audio integration |
| **Admin Panel**  | User, driver, ride, and system management                     |

---

## 🛡 Code Quality & Standards

- **Linting**:
  ```bash
  npm run lint
  ```
- **Formatting**:
  ```bash
  npm run format
  ```
- **Git Hooks (optional)**:  
  Set up Husky to enforce linting/prettier pre-commit.

---

## 🤝 Contribution Guidelines

> 🚫 This is a client-facing, company-level project.  
> All contributors must follow the internal Git flow, use semantic commits, and submit PRs for review before merging into `main`.

---

## 📄 License

**Private Repository – All rights reserved.**  
© [Your Company Name]. Unauthorized use, reproduction, or distribution is prohibited.

---

## 📬 Contact

**Company:** Your Company Name  
**Developer:** Zulkar Naeem Rabby  
**Email:** [rabby@example.com](mailto:rabby@example.com)  
**GitHub Repo:** [github.com/yourcompany/cabwire-backend](https://github.com/yourcompany/cabwire-backend)

---
