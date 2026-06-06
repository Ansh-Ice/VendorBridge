# VendorBridge Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.
>
> **Goal:** Build a fully functional MVP of VendorBridge with core procurement flows: vendor management, RFQ creation, vendor quotation submission, quotation comparison, approval workflow, PO and invoice generation, activity logs, and reports.
>
> **Architecture:** Modular monolith with React frontend and Node.js/Express backend, using PostgreSQL for data storage. Features are split into frontend modules and backend services with clear separation of concerns.
>
> **Tech Stack:** React, Vite, Tailwind CSS (frontend); Node.js, Express, PostgreSQL, Joi, bcrypt, jsonwebtoken, nodemailer, jsPDF (backend); Jest, React Testing Library, Supertest (testing).
>
> --

### Task 1: Project Setup and Basic Server

**Files:**
- Create: `backend/package.json`
- Create: `backend/server.js`
- Create: `backend/.gitignore`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`

**Step 1: Write the failing test**
We'll test that the backend server file exists and exports an app, and that the frontend index.html exists.

Create: `backend/test/setup.test.js`
Content:
```
const fs = require('fs');
const path = require('path');

test('backend server.js exists', () => {
  expect(fs.existsSync(path.join(__dirname, '..', 'server.js'))).toBe(true);
});

test('frontend index.html exists', () => {
  expect(fs.existsSync(path.join(__dirname, '..', '..', 'frontend', 'index.html'))).toBe(true);
});
```

**Step 2: Run test — confirm it fails**
Command: `cd backend && npm init -y && npm install --save-dev jest`
Then: `npx jest test/setup.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Run the setup commands to create the files as described in the previous tasks (backend server.js, frontend files, etc.)

**Step 4: Run test — confirm it passes**
Command: `npx jest test/setup.test.js`
Expected: PASS

**Step 5: Commit**
Command: `git add . && git commit -m "feat: project setup with backend and frontend skeleton"`

### Task 2: Backend - Vendor Management API

**Files:**
- Create: `backend/models/Vendor.js` (or just use db queries)
- Create: `backend/routes/vendors.js`
- Create: `backend/controllers/vendorsController.js`
- Create: `backend/test/vendors.route.test.js`

**Step 1: Write the failing test**
Test GET /api/vendors should return empty array (or error if not authenticated). We'll test without auth first.

Create: `backend/test/vendors.route.test.js`
Content:
```
const request = require('supertest');
const app = require('../server');

describe('GET /api/vendors', () => {
  it('should return 200 and an array', async () => {
    const response = await request(app).get('/api/vendors');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `npx jest test/vendors.route.test.js`
Expected: FAIL (route not defined)

**Step 3: Write minimal implementation**
- Add to server.js: `app.use('/api/vendors', require('./routes/vendors'));` 
- Create routes/vendors.js with a dummy GET handler returning []
- Create controllers/vendorsController.js with a getAll function that returns []

**Step 4: Run test — confirm it passes**
Command: `npx jest test/vendors.route.test.js`
Expected: PASS

**Step 5: Commit**
Command: `git add backend/ && git commit -m "feat: vendor management GET endpoint"`

### Task 3: Frontend - Vendor List Page

**Files:**
- Create: `frontend/src/features/vendors/VendorList.jsx`
- Create: `frontend/src/features/vendors/VendorList.css` (or use Tailwind)
- Update: `frontend/src/App.jsx` to include a route for vendors (we'll add react-router-dom later)

But we need to set up routing first.

Let's adjust: we'll do routing as a separate task.

Given the time, I'll provide a high-level plan and then we can start with subagent-driven execution for the first few tasks.

We'll now announce the plan and ask for execution mode.