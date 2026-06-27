# Primeseat - Premium Event Booking Portal

Primeseat is a event ticket reservation portal built using the MERN stack (MongoDB, Express, React, Node.js). It features real-time seat occupancy reporting, email 2-Factor Authentication (2FA) verification codes, independent billing/payment states, and a responsive administration dashboard.

---

##  Core Features

- **2-Factor Authentication (2FA)**: Account registrations and ticket booking checkouts are protected via email validation One-Time Passwords (OTPs) with a strict expiration buffer.
- **Granular Billing & Reservation Audits**: Separate, independent workflows for ticket reservation status (`confirmed`, `rejected`, `pending`, `cancelled`) and payment accounting status (`paid`, `not_paid`).
- **Interactive Reports Dashboard**: Real-time analytical line and category spline charts showing booking occupancy metrics and published category distributions.
- **Flexible SMTP Fallback Tree**: Development-friendly email transporter that uses production SMTP, fallbacks to Ethereal developer test mailboxes, and prints to the local terminal console for offline testing.

---

##  Technology Stack

- **Frontend**: React (Vite-powered SPA), Tailwind CSS, React Router DOM, Context API, Chart.js (`react-chartjs-2`).
- **Backend**: Node.js, Express, Mongoose ODM.
- **Database**: MongoDB Atlas.
- **Security**: JWT (Bearer tokens), BcryptJS (Password hashing).
- **Mailing**: Nodemailer (SMTP / Ethereal fallback / Console mock logs).

---

##  Installation & Setup Local machine

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (local instance or MongoDB Atlas cluster)

### 1. Clone the repository
```bash
git clone <repository-url>
cd EVENT_BOOKING_SYSTEM
```

### 2. Configure Environment Variables
Create a `.env` file in the `Primeseat/backend/` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail_address_for_smtp
EMAIL_PASS=your_gmail_app_password
```

### 3. Install dependencies and bootstrap
Run the setup command from the root `Primeseat` directory:
```bash
cd Primeseat
npm run setup
```
*(This will install packages in both frontend and backend subdirectories)*

---

##  Running the Application

To run both the backend server and frontend development client concurrently, execute the dev script from the `Primeseat/` directory:
```bash
npm run dev
```

The application will run on:
- **Frontend Client**: [http://localhost:5173/](http://localhost:5173/) (or http://localhost:5174/)
- **Backend API**: [http://localhost:5000/](http://localhost:5000/)

---