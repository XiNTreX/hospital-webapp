-- Allow 'Pending' on BLOOD_DONATION (drop old constraint, re-add)
ALTER TABLE "BLOOD_DONATION"
  DROP CONSTRAINT IF EXISTS "BLOOD_DONATION_status_check";

ALTER TABLE "BLOOD_DONATION"
  ADD CONSTRAINT "BLOOD_DONATION_status_check"
  CHECK (status IN ('Pending', 'Pledged', 'Fulfilled', 'Cancelled'));

-- Track referral slots awaiting acceptance
ALTER TABLE "BLOOD_REQUEST"
  ADD COLUMN IF NOT EXISTS units_pending INT DEFAULT 0;

-- Backfill: any existing Pledged referral becomes Pending so it doesn't double-count
UPDATE "BLOOD_DONATION"
SET status = 'Pending'
WHERE donation_type = 'REFERRED'
  AND referred_donor_id IS NOT NULL
  AND status = 'Pledged';

UPDATE "BLOOD_REQUEST" br
SET units_pending = sub.cnt
FROM (
  SELECT request_id, COUNT(*) AS cnt
  FROM "BLOOD_DONATION"
  WHERE status = 'Pending' AND donation_type = 'REFERRED'
  GROUP BY request_id
) sub
WHERE br.request_id = sub.request_id;