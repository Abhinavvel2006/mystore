# MyStore

A modern, responsive ecommerce storefront built with React. MyStore includes product listing, cart management, Razorpay checkout, and a Node/Express backend.

Razorpay uses the credentials in `Backend/.env` and supports backend-configured
UPI, cards, net banking and wallets. From the project root, start with
`npm --prefix Backend start` and `npm run dev` in separate terminals. If already
inside `Backend`, use `npm start`. See [payment setup and testing](Backend/PAYMENTS.md) for method
settings, webhook recovery and live deployment requirements.

Signed-in customers can open **My Account** from the round profile avatar to save
their name, age, location, contact number, delivery address, and preferred payment
method. Google accounts use their profile photo; other accounts show initials.
See [account setup](Backend/ACCOUNTS.md) for session and Firebase configuration.
Restart an already-running backend after updating, then sign in again to create
an authenticated account session.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Running the app](#running-the-app)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Frontend ↔ Backend integration](#frontend--backend-integration)
- [Backend (Node / Express)](#backend-node--express)
  - [Backend features](#backend-features)
  - [Backend quickstart](#backend-quickstart)
  - [Example API endpoints](#example-api-endpoints)
  - [Environment variables for backend](#environment-variables-for-backend)
  - [Database options](#database-options)
  - [Docker (backend)](#docker-backend)
  - [Security & production notes](#security--production-notes)
- [API & integrations](#api--integrations)
- [Deployment](#deployment)
- [Testing](#testing)
- [Linting & formatting](#linting--formatting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## Features

- Product listing with filters and categories
- Product detail pages with images, descriptions, and reviews
- Shopping cart with add/remove/update quantity
- Checkout flow (order review & submission)
- User authentication (signup/login) — optional depending on backend
- Admin area for product & order management — optional
- Responsive design for mobile/tablet/desktop
- Basic accessibility considerations

---

## Tech stack

- Frontend: React (JavaScript)
- Styling: CSS (plain CSS / CSS modules / Tailwind — choose your preference)
- State management: React Context / Redux (optional)
- Routing: React Router
- Backend: Node.js + Express (optional, documented below)
- Database: MongoDB (recommended) or PostgreSQL / MySQL
- Build tools: Vite or Create React App (adjust commands below depending on setup)
- Razorpay for payments, Firebase for supported sign-in methods, Axios or fetch for API calls

---

## Getting started

### Prerequisites

- Node.js (>= 16 recommended)
- npm (>= 8) or yarn / pnpm
- Optional: Docker (if you want to run the app in containers)

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/Abhinavvel2006/mystore.git
   cd mystore
   ```

2. Install frontend dependencies
   ```bash
   # npm
   npm install

   # or yarn
   yarn

   # or pnpm
   pnpm install
   ```

### Environment variables

Create a `.env` file in the project root (do NOT commit secrets). Example `.env.example`:

```env
# Frontend
VITE_API_URL=http://localhost:5000/api
# Razorpay credentials belong only in Backend/.env.
# Add other keys you need for the app (auth, analytics, etc.)
```

> If using Create React App use REACT_APP_* env names; if using Vite use VITE_* env names.

### Running the app

Start the development server (frontend):

```bash
# npm
npm start

# yarn
yarn start

# pnpm
pnpm start
```

Build for production:

```bash
# npm
npm run build
```

---

## Available scripts

Common scripts (adjust depending on package.json):

- npm start — start dev server
- npm run build — build production bundle
- npm test — run tests
- npm run lint — run linter (ESLint)
- npm run format — run Prettier

---

## Project structure

A recommended project layout:

```
src/
├─ assets/           # images, fonts
├─ components/       # reusable components (Button, Header, ProductCard)
├─ pages/            # page-level components (Home, Product, Cart, Checkout)
├─ contexts/         # React context providers (CartContext, AuthContext)
├─ hooks/            # custom hooks
├─ services/         # API clients (e.g., api.js using fetch/axios)
├─ utils/            # helpers and utilities
├─ styles/           # global styles and variables
├─ App.jsx
└─ index.jsx
```

If you add a backend, the recommended layout is:

```
backend/
├─ src/
│  ├─ controllers/
│  ├─ models/
│  ├─ routes/
│  ├─ middleware/
│  └─ server.js
├─ .env.example
├─ package.json
└─ Dockerfile
```

---

## Frontend ↔ Backend integration

- The frontend should call the backend API (e.g., VITE_API_URL or REACT_APP_API_URL).
- In development, configure a proxy so you can use relative paths:
  - Create React App: add `"proxy": "http://localhost:4000"` to frontend package.json.
  - Vite: configure dev server proxy in `vite.config.js`:
    ```js
    // vite.config.js
    export default {
      server: {
        proxy: {
          '/api': 'http://localhost:4000'
        }
      }
    }
    ```
- Use fetch or Axios to call endpoints. Example service:
  ```js
  // src/services/api.js
  const API = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL;
  export async function fetchProducts() {
    const res = await fetch(`${API}/products`);
    return res.json();
  }
  ```

---

## Backend (Node / Express)

This project includes documentation to add a Node.js + Express backend. The backend is optional but recommended for production features (orders, stored products, auth, payments).

### Backend features

- REST API for products, orders, auth
- CORS enabled for frontend origin
- JWT-based auth (example)
- Admin routes for managing products & orders
- Optional DB integration (MongoDB via Mongoose shown below)
- Dockerfile and .env.example included for deployment

### Backend quickstart (recommended folder: /backend)

1. Create backend folder and init
   ```bash
   mkdir backend
   cd backend
   npm init -y
   npm install express cors dotenv mongoose bcrypt jsonwebtoken
   npm install --save-dev nodemon
   ```

2. Add scripts to backend/package.json
   ```json
   "scripts": {
     "start": "node src/server.js",
     "dev": "nodemon src/server.js"
   }
   ```

3. Example minimal server (backend/src/server.js)
   ```js
   const express = require('express');
   const cors = require('cors');
   const dotenv = require('dotenv');

   dotenv.config();
   const app = express();
   app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
   app.use(express.json());

   // Simple in-memory store (replace with DB)
   const products = [
     { id: '1', name: 'Sample Product', price: 19.99, description: '...' }
   ];

   app.get('/api/products', (req, res) => res.json(products));
   app.get('/api/products/:id', (req, res) => {
     const p = products.find(p => p.id === req.params.id);
     if (!p) return res.status(404).json({ message: 'Not found' });
     res.json(p);
   });

   app.post('/api/orders', (req, res) => {
     // In production save to DB
     console.log('Order received', req.body);
     res.status(201).json({ id: Date.now().toString(), ...req.body });
   });

   const PORT = process.env.PORT || 4000;
   app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
   ```

4. Add `.env.example` (backend/.env.example)
   ```
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/mystore
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```

5. Run backend in development:
   ```bash
   cd backend
   npm run dev
   ```

### Example API endpoints

- GET /api/expenses — read the existing `myapp.Expense` collection
- GET /api/revenues — read the existing `myapp.Revenue` collection
- GET /api/products — list products
- GET /api/products/:id — product detail
- POST /api/orders — create order
- POST /api/auth/login — login (returns JWT)
- POST /api/auth/register — create user (example)
- Protected admin routes: POST /api/admin/products, GET /api/admin/orders

Add controllers, route files, and middleware (auth middleware to verify JWT) as the codebase grows.

### Expense and revenue records

The admin **Expenses & revenue** page (`/admin/payment`) reads the exact,
case-sensitive `Expense` and `Revenue` collections in the database configured
by `MONGO_URI`. Empty collections show zero totals and empty ledgers. Captured
Razorpay orders automatically add one revenue receipt and deduct purchased stock.
Duplicate payment callbacks do not duplicate revenue or stock deductions.
The finance page itself remains read-only and preserves existing manual entries.

Expense documents support `title`, `category`, numeric `amount`, and `date`.
Revenue documents support `title`, `source`, numeric `amount`, and `date`.
The page displays amounts in INR. Dates can be MongoDB dates or ISO
date strings. Refresh reloads both ledgers; export includes the loaded records.
These finance endpoints are read-only. Run `npm run test:finance` from `Backend`
to check collection mapping, empty results, errors, and read-only behavior.

Login and signup share the same responsive account layout. Their Phone buttons
open the phone/OTP dialog using the existing Firebase configuration in `.env`.
Firebase Phone authentication and the applicable domain/SMS settings must be
configured in the Firebase project for real SMS delivery. Successful phone
verification uses the existing storefront profile storage; it does not create
a MongoDB user record. Both account and finance requests support `VITE_API_URL`
(including `/api`), defaulting to `http://localhost:5000/api`.

### Environment variables for backend

- PORT — server port
- MONGO_URI — database connection string (if using MongoDB)
- JWT_SECRET — secret for signing tokens
- FRONTEND_URL — allowed origin for CORS
- RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — server-side Razorpay credentials
- RAZORPAY_PAYMENT_METHODS — comma-separated checkout methods (default: upi,card,netbanking,wallet)
- RAZORPAY_WEBHOOK_SECRET — separate signing secret for payment recovery webhooks

### Database options

- Recommended: MongoDB + Mongoose (quick to wire up).
  - Example connect:
    ```js
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    ```
- Alternatives: PostgreSQL (pg / Sequelize / TypeORM), MySQL, or a hosted DB (Mongo Atlas, RDS).
- For simple development, you can use a JSON file or in-memory store (not for production).

### Docker (backend)

Example Dockerfile for the backend:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/server.js"]
```

Compose example to run frontend + backend (docker-compose.yml):
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - PORT=4000
      - MONGO_URI=${MONGO_URI}
    ports:
      - '4000:4000'
  frontend:
    build: .
    ports:
      - '3000:3000'
```

### Security & production notes

- Never store secrets in client code. Only expose the Razorpay Key ID on the frontend.
- Use https in production and secure cookies (httpOnly) for auth tokens when possible.
- Rate-limit endpoints and validate inputs.
- Use environment-specific configurations and monitor logs.
- Create payment orders, verify signatures and capture payments only on the backend.

---

## API & integrations

This frontend expects an API to provide product and order data. Typical endpoints:

- GET /api/products
- GET /api/products/:id
- POST /api/orders
- POST /api/auth/login
- POST /api/auth/register
- GET /api/orders/:id (admin)

Payment integration:

- Razorpay Standard Checkout is connected to the cart and backend.
- Keep the secret key in `Backend/.env`; see [payment setup](Backend/PAYMENTS.md).

Auth integration (example):

- Firebase Auth, Auth0, or a custom JWT-based backend. Store tokens securely (httpOnly cookie recommended for production).

---

## Deployment

Popular options:

- Vercel — connect repo and deploy frontend; set environment variables via dashboard.
- Render / Heroku / DigitalOcean — suitable for Node backends.
- Docker — create images and deploy to your registry or cloud provider.

Example (deploying backend to Render or Heroku):
1. Push backend to GitHub (e.g., `backend` folder).
2. Link repository on Render/Heroku and set environment variables.
3. Deploy.

---

## Testing

Add tests using your preferred framework:
- Backend: Jest + Supertest for API routes
- Frontend: Jest + React Testing Library

Example backend test:
```bash
npm install --save-dev jest supertest
```

---

## Linting & formatting

Recommended tools:

- ESLint (with Node/Express and React configs)
- Prettier for formatting
- Husky + lint-staged for git hooks

Example scripts:
```json
"lint": "eslint 'src/**/*.{js,jsx,ts,tsx}'",
"format": "prettier --write 'src/**/*.{js,jsx,css,md}'"
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: git checkout -b feat/awesome-feature
3. Commit your changes: git commit -m "feat: add awesome feature"
4. Push to your branch: git push origin feat/awesome-feature
5. Open a Pull Request

Please include tests and update the README where relevant.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details. (Change license if needed.)

---

## Acknowledgements

- React community & libraries
- Design inspirations and component libraries you used
- Tutorials and sample code repositories

---

## Contact

Project maintained by Abhinavvel2006 — add your email or other contact method here.
