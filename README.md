#  NetSettle Backend  
REST API for Trip Expense Splitting & Group Settlements

NetSettle Backend is the powerful server-side component of **NetSettle** — a full-stack application that simplifies tracking and settling shared expenses for group trips, friends, college outings, and travel buddies.

It handles secure authentication, trip management, expense recording, balance calculations, and simplified settlement logic.

## Live API

**Production URL:**  
https://netsettle-backend.onrender.com

(Frontend consuming this API → https://netsettle-frontend.vercel.app/)

##  Core Features

- **Authentication**  
  - User registration & login  
  - Secure password hashing with bcrypt  
  - JWT-based authentication  
  - HTTP-only cookie session persistence  

- **Trip Management**  
  - Create new trips  
  - Edit trip details  
  - View user's trip history  
  - Delete trips  

- **Expense & Settlement Engine**  
  - Record shared expenses with split details  
  - Calculate net balances per participant  
  - Generate clear settle-up recommendations  
  - Support for simple payment request links  

## 🛠 Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** MongoDB + Mongoose  
- **Authentication:** JWT + bcrypt  
- **Session:** HTTP-only cookies  
- **Deployment:** Render  

##  Backend Project Structure

```bash
netsettle_backend/
├── db/
│   ├── expenseschema.js
│   ├── netbalances.js
│   ├── settlement.js
│   ├── tripmodel.js
│   └── usermodel.js
│
├── middlewre.js
├── tokencheckmiddleware.js
├── script.js
│
├── .gitignore
├── package-lock.json
└── package.json
```
## ⚙️ Installation & Setup
### Prerequisites

- Node.js ≥ 16  
- MongoDB (local or Atlas)  

### Steps

1. Clone the repository

```bash
git clone https://github.com/your-username/netsettle_backend.git
cd netsettle_backend
```
2.Install dependencies

```
npm install
```

3.Create .env file in the root directory

envMONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret_key
PORT=5000
Optional:
NODE_ENV=development

4.Start the server

```bash
node script.js
# or with nodemon (recommended for development)
npm run dev
```
-Server will be available at:
http://localhost:5000
###  API Endpoints Overview
(Assuming standard REST naming — update with your actual routes)
```bash
POST /api/auth/signup → Register new user
POST /api/auth/login  → Login & receive token/cookie
GET  /api/trips        → List user's trips
POST /api/trips        → Create new trip
GET  /api/trips/:id    → Get trip details
PUT  /api/trips/:id    → Update trip
DELETE /api/trips/:id  → Delete trip
POST /api/expenses     → Add expense to trip
GET  /api/trips/:id/balances → View current balances
GET  /api/trips/:id/settle   → Get settlement suggestions
```
###  Frontend Integration
This backend is actively consumed by:
Live Frontend: https://netsettle-frontend.vercel.app/

CORS is configured to allow requests from the Vercel frontend domain.
###  Planned Enhancements

Role-based access control (admin / member)
Optimized minimal-transaction settlement algorithm
Detailed expense analytics & charts data endpoints
Payment gateway integration (webhooks)
Invite system / shareable trip links
Expense categories & filtering

#### 👨‍💻 Author
Ankush.

Full-Stack Portfolio Project — NetSettle Backend

Made with focus on clean code, security, and real-world usability for group travel expense management.

