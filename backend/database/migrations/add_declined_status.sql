ALTER TABLE "BLOOD_DONATION"
  DROP CONSTRAINT IF EXISTS "BLOOD_DONATION_status_check";

ALTER TABLE "BLOOD_DONATION"
  ADD CONSTRAINT "BLOOD_DONATION_status_check"
  CHECK (status IN ('Pending', 'Pledged', 'Fulfilled', 'Cancelled', 'Declined'));