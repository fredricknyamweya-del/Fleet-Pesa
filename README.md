# FleetPesa

A fleet remittance and shortfall-tracking platform built for owners running small fleets (10–15 matatus) in Kenya.

## Problem

Fleet owners managing 10–15 vehicles typically collect daily remittances from drivers by cash hand-off, with no digital record and no verification. Short payments and forgotten ones go unnoticed for weeks — quiet losses that eat into profit.

FleetPesa replaces the notebook with a digital remittance system: drivers submit payments directly through the platform, payments are instantly matched to driver and vehicle, and shortfalls are flagged the moment they happen — not weeks later.

Drivers can also prompt a boarding customer's phone directly for the fare — an M-Pesa STK push is sent to the passenger, who enters their PIN to confirm. No cash changes hands, and every fare is recorded with a reference and Safaricom transaction code.

**Target users**
- **Fleet owners** — need to see revenue, outstanding balances, and remittance status in under 5 seconds, whether they're at a desk or checking from their phone.
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
└── docs/        # ERD, project pitch, git-flow and other relevant project documents-
```

See `STRUCTURE.md` for the full file-by-file breakdown and task ownership, and `GIT_FLOW.md` for our branching and PR workflow.

## Features

- Role-based login (Owner / Driver)
- Owner dashboard: fleet revenue, outstanding balances, active drivers, fleet performance chart, driver remittance table
- Owner fleet management: add and remove vehicles from the fleet list
- Vehicle detail view: profile, remittance history
- Driver remittance entry: numeric input, one-tap submit, confirmation state
- **Customer fare payment prompt**: the driver triggers an M-Pesa STK push directly to a boarding passenger's phone to pay their fare — the passenger enters their M-Pesa PIN on their own phone to confirm, no cash handled
- M-Pesa confirmation receipt: reference number + Safaricom transaction code shown once payment confirms
- Shortfall detail modal: expected vs. actual comparison, "Flag for Follow-up"
- Full CRUD across two related resources: **Vehicles** ↔ **Remittances**

## Data Model (summary)

- **User** — id, name, phone, role (`owner` / `driver`), password_hash
- **Vehicle** — id, plate_number, type, owner_id (FK → User), driver_id (FK → User)
- **Remittance** — id, vehicle_id (FK), driver_id (FK), expected_amount, actual_amount, status (`paid`/`late`/`short`), timestamp, flagged_for_followup (bool)
- **FarePayment** — id, vehicle_id (FK), driver_id (FK), customer_phone, amount, mpesa_reference, mpesa_transaction_code, payment_status (`pending`/`confirmed`/`failed`), requested_at — records each customer fare payment prompt separately from driver remittances, since a fare payment is money coming from a passenger, not a driver-to-owner remittance

Full ERD: see `docs/ERD.png`.

## API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create a new owner or driver account |
| POST | `/auth/login` | Log in, returns JWT |
| GET | `/vehicles` | List all vehicles for the logged-in owner |
| POST | `/vehicles` | Add a vehicle |
| GET | `/vehicles/<id>` | Get one vehicle's details |
| PATCH | `/vehicles/<id>` | Update a vehicle |
| DELETE | `/vehicles/<id>` | Remove a vehicle |
| GET | `/remittances` | List remittances (filterable by vehicle/driver) |
| POST | `/remittances` | Submit a new remittance |
| PATCH | `/remittances/<id>` | Update a remittance (e.g. flag for follow-up) |
| POST | `/fare-payments` | Driver prompts a customer's phone to pay a fare — initiates an M-Pesa STK push to the passenger |
| GET | `/fare-payments/<id>` | Get one fare payment — used to poll for confirmation and display the receipt |
| POST | `/fare-payments/mpesa-callback` | Safaricom Daraja webhook — confirms a customer fare payment |

All protected routes require an `Authorization: Bearer <token>` header. The `mpesa-callback` route is a public webhook validated by Safaricom's own request signature rather than a JWT.

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

Open `http://localhost:5173` in your browser. Use the role toggle on the login screen to sign in as an Owner or a Driver.

## Contributing

See `GIT_FLOW.md` for our full branching workflow. Summary: clone from `dev` (default branch), create a `ft-<feature>` branch for your task, commit incrementally, open a PR into `dev`, and wait for QA review before merge. Never push directly to `dev` or `main`.

## Known Issues / Future Work

- **Maintenance tracking** — descoped from this build. Planned as a future addition: mileage-based service due dates, maintenance alerts, and a "Mark as Serviced" action.
- **Automated tax remittance** — descoped from this build. Originally planned as a one-click M-Pesa-to-KRA remittance using Safaricom's API; kept as a future roadmap item rather than built now, to keep the current scope manageable.
- **M-Pesa integration** uses the Safaricom Daraja sandbox, not production — a mocked/simulated callback is an acceptable fallback if sandbox credentials become a blocker, since it keeps the same data model and API shape.
- **Customer fare payments** are recorded per-trip but not yet reconciled automatically against a specific remittance — an owner currently views fare payment totals separately from the driver's daily remittance rather than in one combined ledger.
- Remittance status thresholds (what counts as "short" vs "late") are currently hardcoded and not yet configurable per owner.
- No real-time updates — the dashboard requires a refresh to reflect a driver's newly submitted remittance or a customer's fare payment.
- Image upload for vehicle photos is not yet implemented (placeholder image used).

## Team

Members: Munira Hassan (Team Lead), Jared Kiprop, Simon Hiuhu, Vincent Maina, Bright Mahonga, Gabriel Mutavi, Fredrick Nyamweya.

Technical Mentor: Sam Tomashi