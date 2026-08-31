# FleetPesa

A fleet remittance and shortfall-tracking platform built for owners running small fleets (10–15 matatus) in Kenya.

## Problem

Fleet owners managing 10–15 vehicles typically collect daily remittances from drivers by cash hand-off, with no digital record and no verification. Short payments and forgotten ones go unnoticed for weeks — quiet losses that eat into profit.

FleetPesa replaces the notebook with a digital remittance system: drivers submit payments directly through the platform, payments are instantly matched to vehicle, and shortfalls are flagged the moment they happen — not weeks later.

Drivers can also prompt a boarding customer's phone directly for the fare — an M-Pesa STK push is sent to the passenger, who enters their PIN to confirm. No cash changes hands, and every fare is recorded with a reference and Safaricom transaction code.

**Target users**
- **Fleet owner accounts** — a fleet business (which may have multiple staff/admin users) that needs to see revenue, outstanding balances, and remittance status in under 5 seconds, whether at a desk or checking from a phone.
- **Drivers** — need to submit a remittance and prompt customers for fare payment in as few taps as possible, almost always from a phone.

Both roles can use FleetPesa on mobile or desktop — the UI is responsive across the whole app. Since owners and drivers alike mostly check the app on their phones between trips or on the go, the design is **mobile-first**: every screen is built and tested for mobile first, then scaled up for larger screens.

**Scope note:** vehicle maintenance tracking and automated tax remittance were part of our original concept but have been descoped for this build to keep the project focused, per instructor guidance. Both are noted as future work — see [Known Issues / Future Work](#known-issues--future-work).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (JSX, Vite), React Router |
| Backend | Flask, Flask-JWT-Extended, Flask-Bcrypt |
| ORM / Serialization | SQLAlchemy, Marshmallow |
| Database | PostgreSQL |
| Styling | Tailwind CSS + shadcn/ui components |
| Backend dependency management | Pipenv |

## Project Structure

```
Fleet-Pesa/
├── README.md
├── GIT_FLOW.md
├── STRUCTURE.md
├── .gitignore
├── backend/     # Flask backend + PostgreSQL
├── frontend/    # React frontend (Vite, JSX)
└── docs/        # ERD, project pitch, git-flow and other relevant project documents
```

See `STRUCTURE.md` for the full file-by-file breakdown and task ownership, and `GIT_FLOW.md` for our branching and PR workflow.

## Features

- Role-based login (Admin / Driver), scoped to a Fleet Owner account
- Owner dashboard: fleet revenue, outstanding balances, active drivers, fleet performance chart, driver remittance table
- Owner fleet management: add and remove vehicles from the fleet list
- Vehicle detail view: profile, remittance history, driver assignment history
- Driver assignment: assign or reassign a driver to a vehicle, with full history preserved
- Driver remittance entry: numeric input, one-tap submit, confirmation state
- **Customer fare payment prompt**: the driver triggers an M-Pesa STK push directly to a boarding passenger's phone to pay their fare — the passenger enters their M-Pesa PIN on their own phone to confirm, no cash handled
- M-Pesa confirmation receipt: reference number + Safaricom transaction code shown once payment confirms
- Shortfall detail modal: expected vs. actual comparison, "Flag for Follow-up"
- Full CRUD across two related resources: **Vehicles** ↔ **Remittances**

## Data Model (summary)

**Updated 2026-08-25, approved by instructor 2026-08-26** — see [Data Model Change Log](#data-model-change-log-2026-08-25) below for the full reasoning.

- **FleetOwner** — id, account_name, created_at — represents the fleet/business account itself, not an individual person. Supports multiple admin users under one account.
- **User** — id, fleet_owner_id (FK → FleetOwner, nullable — set only for admin users), username, name, phone, password_hash, role (`admin` / `driver`)
- **Vehicle** — id, plate_number, vehicle_type, fleet_owner_id (FK → FleetOwner), daily_expected_amount, is_active (soft-delete flag)
- **DriverAssignment** — id, vehicle_id (FK), driver_id (FK → User), assigned_at, unassigned_at (nullable) — the single source of truth for which driver is on which vehicle, and when. A vehicle's *current* driver is the row where `unassigned_at IS NULL`.
- **Remittance** — id, vehicle_id (FK), expected_amount, actual_amount, status (`paid`/`short`), payment_status (`pending`/`confirmed`/`failed`), mpesa_reference, mpesa_transaction_code, flagged_for_followup (bool), submitted_at — no direct driver reference; the driver on record is derived by joining `vehicle_id` against `DriverAssignment` at `submitted_at`
- **FarePayment** — id, vehicle_id (FK), customer_phone, amount, mpesa_reference, mpesa_transaction_code, payment_status (`pending`/`confirmed`/`failed`), requested_at — records each customer fare payment prompt separately from driver remittances; driver derived the same way as Remittance, via `vehicle_id` + `DriverAssignment`

Full ERD: see `docs/ERD.png` / `docs/fleetpesa.dbml`.

### Data Model Change Log (2026-08-25)

Per instructor feedback in the Aug 25 standup (and approved in the Aug 26 standup), the schema changed from an earlier version where `Vehicle` had two direct foreign keys to `User` (`owner_id` and `driver_id`), and `Remittance`/`FarePayment` each carried their own `driver_id` as well:

1. **`Vehicle` now links to exactly one entity — `FleetOwner`, not `User`.** The "owner" of a fleet is modeled as an account (supporting multiple admin staff and future per-seat billing), not tied to a single person.
2. **`Vehicle.driver_id` was removed entirely.** It duplicated the same information already tracked in `DriverAssignment`, creating two different paths to reach "who's driving this vehicle" — flagged by our instructor as an avoidable redundancy.
3. **`Remittance.driver_id` and `FarePayment.driver_id` were also removed.** Same reasoning — a driver was reachable from these tables both directly and indirectly (via `Vehicle` → `DriverAssignment`), which is the redundant "circle" pattern our instructor called out. The driver on record for any transaction is now derived by matching `vehicle_id` and the transaction's timestamp against `DriverAssignment`.

**Trade-off worth noting:** looking up "who submitted this remittance" now requires a timestamp-range join against `DriverAssignment` instead of reading a single column. This was a deliberate choice to eliminate the redundancy, not an oversight.

## API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create a new admin or driver account. Admin signup creates a matching `FleetOwner` account. |
| POST | `/auth/login` | Log in, returns JWT |
| POST | `/auth/refresh` | Refresh an access token |
| GET | `/auth/me` | Get the authenticated user |
| GET | `/` | API health check |
| GET | `/vehicles` | List all vehicles for the logged-in fleet owner account |
| POST | `/vehicles` | Add a vehicle |
| GET | `/vehicles/<id>` | Get one vehicle's details |
| PATCH | `/vehicles/<id>` | Update a vehicle |
| DELETE | `/vehicles/<id>` | Remove a vehicle (soft-delete via `is_active`) |
| POST | `/vehicles/<id>/assign-driver` | Assign or reassign a driver to a vehicle — closes the previous `DriverAssignment` row and opens a new one, atomically |
| GET | `/vehicles/<id>/driver-history` | List all past and current driver assignments for a vehicle |
| GET | `/vehicles/<id>/remittances?status=paid&from=YYYY-MM-DD&to=YYYY-MM-DD` | List remittances for a vehicle with optional status and date filters |
| GET | `/driver-assignments` | List driver assignments for the authenticated fleet |
| GET | `/driver-assignments/<id>` | Get one driver assignment |
| PATCH | `/driver-assignments/<id>/unassign` | Close an active driver assignment |
| GET | `/remittances` | List remittances (filterable by vehicle) |
| POST | `/remittances` | Submit a new remittance |
| GET | `/remittances/<id>` | Get one remittance |
| PATCH | `/remittances/<id>` | Update a remittance (e.g. flag for follow-up) |
| POST | `/remittances/<id>/prompt` | Flag an outstanding remittance for follow-up |
| POST | `/fare-payments` | Driver prompts a customer's phone to pay a fare — initiates an M-Pesa STK push to the passenger |
| GET | `/fare-payments/<id>` | Get one fare payment — used to poll for confirmation and display the receipt |
| POST | `/fare-payments/mpesa-callback` | Safaricom Daraja webhook — confirms a customer fare payment |
| PATCH | `/users/me` | Update the authenticated user's profile |
| PATCH | `/users/me/password` | Change the authenticated user's password |

All protected routes require an `Authorization: Bearer <token>` header. The `mpesa-callback` route is a public webhook protected by the `MPESA_CALLBACK_SECRET` shared secret in the `X-MPESA-CALLBACK-SECRET` header rather than a JWT. Full Safaricom Daraja certificate/signature validation is still pending.

## Setup Instructions

### Backend (Flask + Pipenv + PostgreSQL)

Requires a local PostgreSQL server running. Create a database and user before starting:

```bash
createdb fleetpesa
```

Then:

```bash
cd backend
pipenv install --dev
pipenv shell
cp .env.example .env           # set DATABASE_URL=postgresql://<user>:<password>@localhost:5432/fleetpesa
flask db upgrade               # create/migrate the PostgreSQL schema
python seed.py                 # optional: load sample data
flask run                      # runs on http://localhost:5000
```

Run tests:
```bash
pipenv run pytest
```

**Note:** the backend now uses PostgreSQL (via `psycopg2-binary`) instead of SQLite — make sure `psycopg2-binary` is listed in the `Pipfile` and that `DATABASE_URL` in `.env` points to a real PostgreSQL instance before running the app or migrations.

### Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env           # set VITE_API_URL=http://localhost:5000/api
npm run dev                    # runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser. Use the role toggle on the login screen to sign in as an Admin or a Driver.

## Contributing

See `GIT_FLOW.md` for our full branching workflow. Summary: clone from `dev` (default branch), create a `ft-<feature>` branch for your task, commit incrementally, open a PR into `dev`, and wait for QA review before merge. Never push directly to `dev` or `main`. **All work must land as an actual Pull Request to be counted — code sitting only on a local machine is not merged and cannot be evaluated.**

## Known Issues / Future Work

- **Maintenance tracking** — descoped from this build. Planned as a future addition: mileage-based service due dates, maintenance alerts, and a "Mark as Serviced" action.
- **Automated tax remittance** — descoped from this build. Originally planned as a one-click M-Pesa-to-KRA remittance using Safaricom's API; kept as a future roadmap item rather than built now, to keep the current scope manageable.
- **M-Pesa integration** uses the Safaricom Daraja sandbox, not production — a mocked/simulated callback is an acceptable fallback if sandbox credentials become a blocker, since it keeps the same data model and API shape.
- **M-Pesa callback signature validation** currently uses an application shared secret as an interim safeguard; full Safaricom Daraja certificate/signature validation remains incomplete.
- **Fare-payment creation** currently generates a local `mpesa_reference`; a real Daraja STK push is not yet wired, so production M-Pesa confirmation remains deferred.
- **Customer fare payments** are recorded per-trip but not yet reconciled automatically against a specific remittance — an owner currently views fare payment totals separately from the driver's daily remittance rather than in one combined ledger.
- Remittance status thresholds (what counts as "short" vs "late") are currently hardcoded and not yet configurable per owner.
- No real-time updates — the dashboard requires a refresh to reflect a driver's newly submitted remittance or a customer's fare payment.
- Image upload for vehicle photos is not yet implemented (placeholder image used).
- Looking up "who submitted a remittance/fare payment" requires a timestamp-range join against `DriverAssignment` rather than a stored column — a deliberate trade-off (see Data Model Change Log above), but worth monitoring for query performance as data grows.

## Team

Members: Munira Hassan (Team Lead), Jared Kiprop, Simon Hiuhu, Vincent Maina, Bright Mahonga, Gabriel Mutavi, Fredrick Nyamweya.

Technical Mentor: Sam Tomashi
