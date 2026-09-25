-- 1. Create the shadow table to store the audit log
CREATE TABLE IF NOT EXISTS "APPOINTMENT_CANCEL_LOG" (
    log_id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION log_appointment_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the status is being changed to 'Cancelled'
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        INSERT INTO "APPOINTMENT_CANCEL_LOG" (appointment_id, patient_id, doctor_id)
        VALUES (OLD.appointment_id, OLD.patient_id, OLD.doctor_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to the APPOINTMENT table
CREATE TRIGGER trigger_appointment_cancel_log
AFTER UPDATE ON "APPOINTMENT"
FOR EACH ROW
EXECUTE FUNCTION log_appointment_cancellation();