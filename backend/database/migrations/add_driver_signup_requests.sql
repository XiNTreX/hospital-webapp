CREATE TABLE IF NOT EXISTS "DRIVER_SIGNUP_REQUEST" (
    request_id      SERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    license_no      VARCHAR(100) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    rejection_reason TEXT,
    requested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     TIMESTAMP,
    reviewed_by     INT REFERENCES "ADMIN"(admin_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_driver_signup_status
  ON "DRIVER_SIGNUP_REQUEST"(status, requested_at DESC);