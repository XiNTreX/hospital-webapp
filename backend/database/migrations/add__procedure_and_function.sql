CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    total_patients BIGINT,
    total_doctors BIGINT,
    total_appointments BIGINT,
    pending_tests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM "PATIENT"),
        (SELECT COUNT(*) FROM "DOCTOR"),
        (SELECT COUNT(*) FROM "APPOINTMENT"),
        (SELECT COUNT(*) FROM "TEST_REPORT" WHERE status != 'Completed');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE approve_driver(p_request_id INT, p_admin_id INT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_email VARCHAR;
    v_pass VARCHAR;
    v_fname VARCHAR;
    v_lname VARCHAR;
    v_license VARCHAR;
    v_phone VARCHAR;
    v_account_id INT;
BEGIN
    SELECT email, password_hash, first_name, last_name, license_no, phone
    INTO v_email, v_pass, v_fname, v_lname, v_license, v_phone
    FROM "DRIVER_SIGNUP_REQUEST"
    WHERE request_id = p_request_id AND status = 'Pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending request not found or already processed.';
    END IF;

    INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type)
    VALUES (v_email, v_pass, 'DRIVER')
    RETURNING account_id INTO v_account_id;

    INSERT INTO "DRIVER" (first_name, last_name, license_no, phone, status, account_id)
    VALUES (v_fname, v_lname, v_license, v_phone, 'Available', v_account_id);

    UPDATE "DRIVER_SIGNUP_REQUEST"
    SET status = 'Approved', 
        reviewed_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka'), 
        reviewed_by = p_admin_id
    WHERE request_id = p_request_id;
END;
$$;