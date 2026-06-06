# VendorBridge Design Document

## Overview
VendorBridge is a Procurement & Vendor Management ERP platform designed to streamline procurement processes through a centralized system managing vendors, RFQs, quotations, approvals, purchase orders, and invoices.

## Architecture Overview
- **Frontend**: React (SPA) with React Router for navigation
- **Backend**: Node.js/Express REST API
- **Database**: PostgreSQL (hosted locally or on a managed service, but not using Supabase/Firebase/Mongo Atlas as per constraints)
- **Authentication**: JWT-based stateless authentication
- **State Management**: React Context + useReducer for global state (or Redux Toolkit if preferred)
- **Styling**: Tailwind CSS for utility-first styling
- **Build Tools**: Vite for frontend dev server & bundling, Nodemon for backend

## Components & Responsibilities

### Frontend Modules
1. **Auth Module** (`src/features/auth`)
   - Login, Signup, Forgot Password pages
   - JWT token storage (httpOnly cookie or localStorage with refresh token)
   - Role-based route guards

2. **Dashboard** (`src/features/dashboard`)
   - Analytics cards (pending approvals, active RFQs, recent POs, recent invoices)
   - Quick action buttons (Create RFQ, Manage Vendors, etc.)

3. **Vendor Management** (`src/features/vendors`)
   - Vendor list/table with search/filter
   - Vendor form (create/edit)
   - Vendor status toggles, category selection, GST details, contact info

4. **RFQ Creation** (`src/features/rfq`)
   - RFQ form with title, product/service details, quantity, attachments, deadline, vendor assignment (multi-select)
   - Draft/save functionality

5. **Vendor Quotation Submission** (`src/features/quotations`)
   - Vendor portal view (if separate) or vendor view within app
   - Quotation form: pricing, delivery timelines, notes
   - Editable before submission, submission confirmation

6. **Quotation Comparison** (`src/features/comparison`)
   - Side-by-side table of received quotations
   - Highlight lowest price, delivery timeline comparison
   - Vendor rating indicators (if implemented)
   - Sorting/filtering by price, delivery date, vendor rating

7. **Approval Workflow** (`src/features/approvals`)
   - List of RFQs/quotations pending approval
   - Approve/reject buttons with remarks input
   - Approval timeline/history per RFQ
   - Status tracking (pending, approved, rejected)

8. **Purchase Order & Invoice Generation** (`src/features/pos-invoices`)
   - Auto-generated PO number (format: PO-YYYY-####)
   - Invoice generation from approved PO
   - Tax calculations (GST, etc.), total calculations
   - Download PDF (using jsPDF or similar)
   - Print invoice (window.print())
   - Send invoice via email (backend API call)
   - Status updates (draft, sent, paid)

9. **Activity Logs & Notifications** (`src/features/activity`)
   - Timeline of procurement activities (RFQ created, quotation submitted, approved, PO generated, invoice sent)
   - Real-time notifications (using Socket.IO or polling)
   - Audit log table with filters

10. **Reports & Analytics** (`src/features/reports`)
    - Vendor performance analytics (on-time delivery, quotation accuracy)
    - Procurement statistics (total spend, PO count)
    - Spending summaries by category/department
    - Monthly procurement trends (charts using Chart.js or Recharts)
    - Exportable reports (CSV/PDF)

### Backend Modules
1. **Auth Service** (`src/routes/auth.js`)
   - Register, login, logout, refresh token
   - Password hashing (bcrypt)
   - Role-based access control middleware

2. **Vendor Service** (`src/routes/vendors.js`)
   - CRUD operations for vendors
   - Search/filter/pagination

3. **RFQ Service** (`src/routes/rfqs.js`)
   - Create RFQ, assign vendors, set deadline
   - Retrieve RFQs with associated quotations

4. **Quotation Service** (`src/routes/quotations.js`)
   - Submit/update quotation for an RFQ by vendor
   - Retrieve quotations for comparison

5. **Approval Service** (`src/routes/approvals.js`)
   - Record approval/rejection with remarks
   - Transition RFQ status to approved/rejected
   - Trigger PO generation on approval

6. **PO/Invoice Service** (`src/routes/pos-invoices.js`)
   - Generate PO from approved quotation
   - Generate invoice from PO
   - Calculate taxes/totals
   - PDF generation endpoint
   - Email sending endpoint (using nodemailer or similar)

7. **Activity Log Service** (`src/routes/activity.js`)
   - Log actions (create, update, approve, generate) with user/vendor info
   - Retrieve activity logs with filtering

8. **Report Service** (`src/routes/reports.js`)
   - Aggregated queries for analytics
   - Export data as CSV/JSON

## Data Flow
1. **User Authentication** → JWT issued → stored on frontend → attached to API requests via Authorization header.
2. **Vendor Management** → CRUD operations via Vendor Service → persisted in `vendors` table.
3. **RFQ Creation** → Procurement Officer creates RFQ → stored in `rfqs` table with `created_by` (user ID) and `status: 'draft'` → can assign multiple vendors.
4. **Quotation Submission** → Vendors (logged in as vendor role) view assigned RFQs → submit quotation → stored in `quotations` table linked to RFQ and vendor.
5. **Comparison & Approval** → Procurement Officer views quotations via Quotation Service → selects best → triggers approval workflow → Approval Service creates approval record → updates RFQ status to `approved`.
6. **PO/Invoice Generation** → Upon approval, PO Service creates PO document (auto-number) → Invoice Service creates invoice from PO → PDF generation and email sending.
7. **Activity Logging** → Each major action logs to `activity_logs` table.
8. **Reporting** → Report Service runs aggregated queries on `vendors`, `rfqs`, `quotations`, `pos`, `invoices` tables for dashboards.

## Error Handling Approach
- **Backend**: Centralized error-handling middleware; async wrapper for route handlers; validation using Joi or express-validator; return appropriate HTTP status codes (400, 401, 403, 404, 500) with JSON error messages.
- **Frontend**: Axios interceptors to catch errors; display user-friendly messages via toast/notifications; redirect to login on 401; global error boundary for unexpected errors.
- **Database**: Use transactions for operations that span multiple tables (e.g., PO + invoice creation) to ensure consistency.
- **Logging**: Winston or pino for server-side logs; frontend logs to console in development, to external service (if any) in production.

## Testing Strategy
- **Unit Tests**: Jest for backend services and utility functions; React Testing Library for frontend components.
- **Integration Tests**: Supertest for API endpoints; Cypress or Playwright for end-to-end user flows (login → create RFQ → submit quotation → approve → generate PO/invoice).
- **Test Coverage Goal**: 80%+ for critical paths (auth, vendor, RFQ, quotation, approval, PO/invoice).
- **CI/CD**: GitHub Actions workflow to run tests on push/pull request; optionally deploy to staging environment.

## Success Criteria
- All core features (vendor mgmt, RFQ, quotation submission/comparison, approval, PO/invoice generation, activity logs, reports) functional end-to-end.
- Responsive UI usable on desktop and tablet.
- Secure authentication and role-based access.
- No use of prohibited services (Supabase/Firebase/Mongo Atlas); PostgreSQL used for data storage.
- Clean, modular code with clear separation of concerns.
- Proper error handling and validation.
- Demo-ready for hackathon presentation.

## Next Steps (to be detailed in implementation plan)
1. Setup repository with frontend/backend folders.
2. Initialize PostgreSQL database and define schema.
3. Implement authentication API and frontend login/signup.
4. Build vendor management CRUD.
5. Implement RFQ creation and vendor assignment.
6. Build quotation submission and comparison.
7. Implement approval workflow.
8. Develop PO and invoice generation with PDF/email.
9. Add activity logging and notifications.
10. Create reports and analytics dashboard.
11. Write unit/integration tests.
12. Perform end-to-end testing and bug fixing.
13. Prepare final demo and presentation.
