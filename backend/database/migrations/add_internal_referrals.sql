-- Link a referral to an actual donor account
ALTER TABLE "BLOOD_DONATION"
  ADD COLUMN IF NOT EXISTS referred_donor_id INT
    REFERENCES "BLOOD_DONOR"(donor_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_blood_donation_referred_donor
  ON "BLOOD_DONATION"(referred_donor_id, status);