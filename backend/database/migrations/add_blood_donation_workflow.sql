CREATE TABLE IF NOT EXISTS "BLOOD_DONATION" (
    donation_id           SERIAL PRIMARY KEY,
    request_id            INT NOT NULL REFERENCES "BLOOD_REQUEST"(request_id) ON DELETE CASCADE,
    donor_id              INT NOT NULL REFERENCES "BLOOD_DONOR"(donor_id) ON DELETE CASCADE,
    donation_type         VARCHAR(20) NOT NULL CHECK (donation_type IN ('SELF', 'REFERRED')),
    referred_name         VARCHAR(200),
    referred_phone        VARCHAR(20),
    referred_blood_group  VARCHAR(5),
    referred_last_donation DATE,
    referred_age          INT,
    status                VARCHAR(20) NOT NULL DEFAULT 'Pledged'
                          CHECK (status IN ('Pledged', 'Fulfilled', 'Cancelled')),
    pledged_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at          TIMESTAMP,
    cancelled_at          TIMESTAMP,
    notes                 TEXT
);

ALTER TABLE "BLOOD_REQUEST"
  ADD COLUMN IF NOT EXISTS units_pledged   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS units_fulfilled INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_blood_donation_request
  ON "BLOOD_DONATION"(request_id);

CREATE INDEX IF NOT EXISTS idx_blood_donation_donor_status
  ON "BLOOD_DONATION"(donor_id, status);

CREATE INDEX IF NOT EXISTS idx_blood_request_status_bg
  ON "BLOOD_REQUEST"(status, blood_group_needed);