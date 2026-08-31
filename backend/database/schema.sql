-- ==========================================
-- 1. DROP EXISTING TABLES (Reverse Dependency Order)
-- ==========================================
DROP TABLE IF EXISTS "PRESCRIPTION_MEDICINE" CASCADE;
DROP TABLE IF EXISTS "MEDICINE" CASCADE;
DROP TABLE IF EXISTS "TEST_REPORT" CASCADE;
DROP TABLE IF EXISTS "TEST" CASCADE;
DROP TABLE IF EXISTS "OPERATION" CASCADE;
DROP TABLE IF EXISTS "PRESCRIPTION" CASCADE;
DROP TABLE IF EXISTS "APPOINTMENT" CASCADE;
DROP TABLE IF EXISTS "DUTY_SCHEDULE" CASCADE;
DROP TABLE IF EXISTS "IPD" CASCADE;
DROP TABLE IF EXISTS "BLOOD_REQUEST" CASCADE;
DROP TABLE IF EXISTS "AMBULANCE_REQUEST" CASCADE;
DROP TABLE IF EXISTS "AMBULANCE" CASCADE;
DROP TABLE IF EXISTS "DEPARTMENT" CASCADE;
DROP TABLE IF EXISTS "DRIVER" CASCADE;
DROP TABLE IF EXISTS "BLOOD_DONOR" CASCADE;
DROP TABLE IF EXISTS "PATIENT" CASCADE;
DROP TABLE IF EXISTS "DOCTOR" CASCADE;
DROP TABLE IF EXISTS "ADMIN" CASCADE;
DROP TABLE IF EXISTS "USER_ACCOUNT" CASCADE;
DROP TYPE IF EXISTS user_type_enum CASCADE;

-- ==========================================
-- 2. CREATE ENUMS & CORE ACCOUNTS
-- ==========================================
CREATE TYPE user_type_enum AS ENUM ('ADMIN', 'DOCTOR', 'PATIENT', 'BLOOD_DONOR','DRIVER');

CREATE TABLE "USER_ACCOUNT" (
    account_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type user_type_enum NOT NULL
);

CREATE TABLE "ADMIN" (
    admin_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    account_id INT UNIQUE NOT NULL,
    FOREIGN KEY (account_id) REFERENCES "USER_ACCOUNT"(account_id) ON DELETE CASCADE
);

CREATE TABLE "DOCTOR" (
    doctor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    degrees VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    room_number VARCHAR(20),
    fee DECIMAL(10, 2),
    status VARCHAR(50),
    joining_date DATE,
    account_id INT UNIQUE NOT NULL,
    FOREIGN KEY (account_id) REFERENCES "USER_ACCOUNT"(account_id) ON DELETE CASCADE
);

CREATE TABLE "PATIENT" (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    blood_group VARCHAR(5),
    address TEXT,
    account_id INT UNIQUE NOT NULL,
    FOREIGN KEY (account_id) REFERENCES "USER_ACCOUNT"(account_id) ON DELETE CASCADE
);

CREATE TABLE "BLOOD_DONOR" (
    donor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_regular BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    eligibility BOOLEAN DEFAULT TRUE,
    last_donation_date DATE,
    donation_count INT DEFAULT 0,
    account_id INT UNIQUE NOT NULL,
    FOREIGN KEY (account_id) REFERENCES "USER_ACCOUNT"(account_id) ON DELETE CASCADE
);

-- ==========================================
-- 3. CLINICAL & HOSPITAL WORKFLOW
-- ==========================================
CREATE TABLE "DUTY_SCHEDULE" (
    schedule_id SERIAL PRIMARY KEY,
    duty_date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL,
    duty_type VARCHAR(50) NOT NULL,
    doctor_id INT NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES "DOCTOR"(doctor_id) ON DELETE CASCADE
);

CREATE TABLE "APPOINTMENT" (
    appointment_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    serial_no INT,
    status VARCHAR(50) NOT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES "DOCTOR"(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES "PATIENT"(patient_id) ON DELETE CASCADE
);

CREATE TABLE "PRESCRIPTION" (
    prescription_id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    diagnosis TEXT,
    advice TEXT,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES "DOCTOR"(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES "PATIENT"(patient_id) ON DELETE CASCADE
);

CREATE TABLE "MEDICINE" (
    medicine_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE "PRESCRIPTION_MEDICINE" (
    id SERIAL PRIMARY KEY,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    before_after_meal VARCHAR(50) NOT NULL,
    prescription_id INT NOT NULL,
    medicine_id INT NOT NULL,
    FOREIGN KEY (prescription_id) REFERENCES "PRESCRIPTION"(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES "MEDICINE"(medicine_id) ON DELETE CASCADE
);

CREATE TABLE "OPERATION" (
    operation_id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES "DOCTOR"(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES "PATIENT"(patient_id) ON DELETE CASCADE
);

CREATE TABLE "TEST" (
    test_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL
);

CREATE TABLE "TEST_REPORT" (
    report_id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    result TEXT,
    status VARCHAR(50) NOT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    test_id INT NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES "DOCTOR"(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES "PATIENT"(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES "TEST"(test_id) ON DELETE CASCADE
);

CREATE TABLE "IPD" (
    ipd_id SERIAL PRIMARY KEY,
    bed_number VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    fee_per_day DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    admission_date DATE DEFAULT CURRENT_DATE,
    discharge_date DATE,
    patient_id INT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES "PATIENT"(patient_id) ON DELETE CASCADE
);

-- ==========================================
-- 4. LOGISTICS & EMERGENCY SERVICES
-- ==========================================
-- CREATE TABLE "DRIVER" (
--     driver_id SERIAL PRIMARY KEY,
--     first_name VARCHAR(100) NOT NULL,
--     last_name VARCHAR(100) NOT NULL,
--     license_no VARCHAR(100) UNIQUE NOT NULL,
--     phone VARCHAR(20) NOT NULL,
--     status VARCHAR(50) NOT NULL
-- );
CREATE TABLE "DRIVER" (
    driver_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_no VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    account_id INT UNIQUE NOT NULL,
    FOREIGN KEY (account_id) REFERENCES "USER_ACCOUNT"(account_id) ON DELETE CASCADE
);

CREATE TABLE "DEPARTMENT" (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_id INT,
    FOREIGN KEY (manager_id) REFERENCES "ADMIN"(admin_id) ON DELETE SET NULL
);

CREATE TABLE "AMBULANCE" (
    ambulance_id SERIAL PRIMARY KEY,
    ambulance_no VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    driver_id INT,
    department_id INT,
    FOREIGN KEY (driver_id) REFERENCES "DRIVER"(driver_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES "DEPARTMENT"(department_id) ON DELETE SET NULL
);

CREATE TABLE "AMBULANCE_REQUEST" (
    request_id SERIAL PRIMARY KEY,
    pickup_location TEXT NOT NULL,
    drop_location TEXT NOT NULL,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    patient_id INT NOT NULL,
    ambulance_id INT,
    handled_by_id INT,
    FOREIGN KEY (patient_id) REFERENCES "PATIENT"(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (ambulance_id) REFERENCES "AMBULANCE"(ambulance_id) ON DELETE SET NULL,
    FOREIGN KEY (handled_by_id) REFERENCES "ADMIN"(admin_id) ON DELETE SET NULL
);

CREATE TABLE "BLOOD_REQUEST" (
    request_id SERIAL PRIMARY KEY,
    blood_group_needed VARCHAR(5) NOT NULL,
    units_needed INT NOT NULL,
    request_date DATE DEFAULT CURRENT_DATE,
    need_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    patient_id INT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES "PATIENT"(patient_id) ON DELETE CASCADE
);