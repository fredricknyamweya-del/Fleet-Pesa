"""
FleetPesa seed data.

Schema note (2026-08-25): seeded against the updated ERD —
fleet_owners is the account entity; vehicles link only to
fleet_owner_id (no owner_id/driver_id); driver_assignments is the
single source of truth for who's driving which vehicle; remittances
and fare_payments carry NO direct driver_id — the driver on a
transaction is derived by joining vehicle_id against
driver_assignments at the transaction's timestamp.

This script cannot run successfully until FleetOwner, updated
User/Vehicle, DriverAssignment, and updated Remittance/FarePayment
models exist in the codebase. Written ahead of that so it's ready
to run the moment those land.
"""

from datetime import datetime, timedelta

from app import app
from extensions import db
from models.fleet_owner import FleetOwner
from models.user import User
from models.vehicle import Vehicle
from models.driver_assignment import DriverAssignment
from models.remittance import Remittance
from models.fare_payment import FarePayment


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # ------------------------------------------------------------------
        # 1. Fleet owners (accounts) — seeded first, nothing depends on
        #    anything else
        # ------------------------------------------------------------------
        tomashi_circle = FleetOwner(account_name="Tomashi Circle")
        rainbow_shuttle = FleetOwner(account_name="Rainbow Shuttle Sacco")
        db.session.add_all([tomashi_circle, rainbow_shuttle])
        db.session.commit()

        # ------------------------------------------------------------------
        # 2. Users — admins linked to a fleet_owner, drivers left unlinked
        #    (fleet_owner_id stays null; a driver's fleet connection comes
        #    through driver_assignments, not this column)
        # ------------------------------------------------------------------
        admin_moses = User(
            fleet_owner_id=tomashi_circle.id,
            username="owner_moses",
            name="Moses Kiptoo",
            phone="+254712345001",
            password_hash="",
            role="admin",
        )
        admin_grace = User(
            fleet_owner_id=tomashi_circle.id,
            username="owner_grace",
            name="Grace Wanjiru",
            phone="+254712345002",
            password_hash="",
            role="admin",
        )
        admin_peter = User(
            fleet_owner_id=rainbow_shuttle.id,
            username="owner_peter",
            name="Peter Mwangi",
            phone="+254712345006",
            password_hash="",
            role="admin",
        )
        driver_james = User(
            username="driver_james",
            name="James Otieno",
            phone="+254712345003",
            password_hash="",
            role="driver",
        )
        driver_alex = User(
            username="driver_alex",
            name="Alex Kimutai",
            phone="+254712345004",
            password_hash="",
            role="driver",
        )
        driver_lucy = User(
            username="driver_lucy",
            name="Lucy Nafula",
            phone="+254712345005",
            password_hash="",
            role="driver",
        )
        db.session.add_all(
            [admin_moses, admin_grace, admin_peter, driver_james, driver_alex, driver_lucy]
        )
        for user in [
            admin_moses,
            admin_grace,
            admin_peter,
            driver_james,
            driver_alex,
            driver_lucy,
        ]:
            user.set_password("fleetpesa123")
        db.session.commit()

        # ------------------------------------------------------------------
        # 3. Vehicles — linked only to fleet_owner_id, no driver_id column
        # ------------------------------------------------------------------
        vehicle_kaa = Vehicle(
            plate_number="KAA 123X",
            vehicle_type="matatu",
            fleet_owner_id=tomashi_circle.id,
            daily_expected_amount=3000,
            is_active=True,
        )
        vehicle_kbb = Vehicle(
            plate_number="KBB 456Y",
            vehicle_type="matatu",
            fleet_owner_id=tomashi_circle.id,
            daily_expected_amount=2500,
            is_active=True,
        )
        vehicle_kcc = Vehicle(
            plate_number="KCC 789Z",
            vehicle_type="matatu",
            fleet_owner_id=rainbow_shuttle.id,
            daily_expected_amount=3500,
            is_active=True,
        )
        vehicle_kdd_retired = Vehicle(
            plate_number="KDD 000A",
            vehicle_type="matatu",
            fleet_owner_id=tomashi_circle.id,
            daily_expected_amount=2000,
            is_active=False,  # soft-deleted — retired vehicle, history preserved
        )
        db.session.add_all([vehicle_kaa, vehicle_kbb, vehicle_kcc, vehicle_kdd_retired])
        db.session.commit()

        # ------------------------------------------------------------------
        # 4. Driver assignments — the ONLY place driver-to-vehicle is
        #    recorded. Includes a CLOSED assignment (proves history is
        #    preserved on reassignment) and OPEN assignments (current
        #    driver) for the active vehicles.
        # ------------------------------------------------------------------
        now = datetime.utcnow()

        # vehicle_kaa: was driven by Alex, reassigned to James -- history preserved
        assignment_kaa_closed = DriverAssignment(
            vehicle_id=vehicle_kaa.id,
            driver_id=driver_alex.id,
            assigned_at=now - timedelta(days=30),
            unassigned_at=now - timedelta(days=10),
        )
        assignment_kaa_current = DriverAssignment(
            vehicle_id=vehicle_kaa.id,
            driver_id=driver_james.id,
            assigned_at=now - timedelta(days=10),
            unassigned_at=None,  # current driver
        )

        # vehicle_kbb: only ever had one driver, still current
        assignment_kbb_current = DriverAssignment(
            vehicle_id=vehicle_kbb.id,
            driver_id=driver_lucy.id,
            assigned_at=now - timedelta(days=20),
            unassigned_at=None,
        )

        # vehicle_kcc: Rainbow Shuttle's vehicle, driven by James as well
        # (a driver can be linked to vehicles across different accounts
        # in this seed only to exercise the query logic -- not necessarily
        # a real-world scenario)
        assignment_kcc_current = DriverAssignment(
            vehicle_id=vehicle_kcc.id,
            driver_id=driver_james.id,
            assigned_at=now - timedelta(days=5),
            unassigned_at=None,
        )

        db.session.add_all(
            [
                assignment_kaa_closed,
                assignment_kaa_current,
                assignment_kbb_current,
                assignment_kcc_current,
            ]
        )
        db.session.commit()

        # ------------------------------------------------------------------
        # 5. Remittances — no driver_id column. Driver on record is
        #    derived via vehicle_id + submitted_at against
        #    driver_assignments.
        # ------------------------------------------------------------------
        remittance_paid = Remittance(
            vehicle_id=vehicle_kaa.id,
            expected_amount=3000,
            actual_amount=3000,
            status="paid",
            payment_status="confirmed",
            mpesa_reference="FP-1001",
            mpesa_transaction_code="SFC1AAABBB",
            flagged_for_followup=False,
            submitted_at=now - timedelta(days=1),
        )
        remittance_short = Remittance(
            vehicle_id=vehicle_kaa.id,
            expected_amount=3000,
            actual_amount=2200,
            status="short",
            payment_status="confirmed",
            mpesa_reference="FP-1002",
            mpesa_transaction_code="SFC1CCCDDD",
            flagged_for_followup=True,
            submitted_at=now,
        )
        remittance_pending = Remittance(
            vehicle_id=vehicle_kbb.id,
            expected_amount=2500,
            actual_amount=2500,
            status="paid",
            payment_status="pending",
            mpesa_reference="FP-1003",
            mpesa_transaction_code=None,
            flagged_for_followup=False,
            submitted_at=now,
        )
        db.session.add_all([remittance_paid, remittance_short, remittance_pending])
        db.session.commit()

        # ------------------------------------------------------------------
        # 6. Fare payments — same pattern, no driver_id column.
        # ------------------------------------------------------------------
        fare_confirmed = FarePayment(
            vehicle_id=vehicle_kaa.id,
            customer_phone="+254798765001",
            amount=100,
            mpesa_reference="FARE-2001",
            mpesa_transaction_code="SFC2EEEFFF",
            payment_status="confirmed",
            requested_at=now - timedelta(hours=2),
        )
        fare_pending = FarePayment(
            vehicle_id=vehicle_kbb.id,
            customer_phone="+254798765002",
            amount=80,
            mpesa_reference="FARE-2002",
            mpesa_transaction_code=None,
            payment_status="pending",
            requested_at=now - timedelta(minutes=5),
        )
        fare_failed = FarePayment(
            vehicle_id=vehicle_kcc.id,
            customer_phone="+254798765003",
            amount=150,
            mpesa_reference="FARE-2003",
            mpesa_transaction_code=None,
            payment_status="failed",
            requested_at=now - timedelta(hours=1),
        )
        db.session.add_all([fare_confirmed, fare_pending, fare_failed])
        db.session.commit()

        print("Seed complete:")
        print(f"  fleet_owners:      {FleetOwner.query.count()}")
        print(f"  users:             {User.query.count()}")
        print(f"  vehicles:          {Vehicle.query.count()}")
        print(f"  driver_assignments:{DriverAssignment.query.count()}")
        print(f"  remittances:       {Remittance.query.count()}")
        print(f"  fare_payments:     {FarePayment.query.count()}")


if __name__ == "__main__":
    seed()