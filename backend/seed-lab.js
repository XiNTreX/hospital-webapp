const pool = require('./config/db');
const bcrypt = require('bcryptjs');

const seedLabData = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Checking Laboratory Doctors...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const labEmails = ['lab1@hospital.com', 'lab2@hospital.com'];
    const labDetails = [
      { first: 'Amina', last: 'Haque', spec: 'Pathology' },
      { first: 'Tariq', last: 'Zaman', spec: 'Biochemistry' }
    ];

    for (let i = 0; i < labEmails.length; i++) {
      const existingUser = await client.query(`SELECT account_id FROM "USER_ACCOUNT" WHERE email = $1`, [labEmails[i]]);
      
      if (existingUser.rows.length === 0) {
        const acc = await client.query(
          `INSERT INTO "USER_ACCOUNT" (email, password_hash, role) VALUES ($1, $2, 'DOCTOR') RETURNING account_id`,
          [labEmails[i], hashedPassword]
        );
        await client.query(
          `INSERT INTO "DOCTOR" (account_id, first_name, last_name, specialization, doctor_type) 
           VALUES ($1, $2, $3, $4, 'Laboratory')`,
          [acc.rows[0].account_id, labDetails[i].first, labDetails[i].last, labDetails[i].spec]
        );
        console.log(`Created Lab Doctor: ${labEmails[i]}`);
      }
    }

    console.log('Fetching existing tests from database...');
    const testsRes = await client.query('SELECT test_id, name FROM "TEST"');
    console.log(`Found ${testsRes.rows.length} tests in database.`);

    // Clear old parameters to ensure a clean refresh
    await client.query('TRUNCATE TABLE "TEST_PARAMETER" RESTART IDENTITY CASCADE');

    for (const test of testsRes.rows) {
      const tName = test.name.toLowerCase();
      let params = [];

      if (tName.includes('cbc') || tName.includes('blood count')) {
        params = [
          ['Hemoglobin', '13.8 - 17.2 g/dL'], 
          ['WBC Count', '4.5 - 11.0 x 10^9/L'], 
          ['Platelets', '150 - 450 x 10^9/L'], 
          ['RBC Count', '4.5 - 5.9 x 10^12/L']
        ];
      } else if (tName.includes('lipid')) {
        params = [
          ['Total Cholesterol', '< 200 mg/dL'], 
          ['HDL Cholesterol', '> 40 mg/dL'], 
          ['LDL Cholesterol', '< 100 mg/dL'], 
          ['Triglycerides', '< 150 mg/dL']
        ];
      } else if (tName.includes('sugar') || tName.includes('fbs')) {
        params = [['Fasting Glucose', '70 - 100 mg/dL']];
      } else if (tName.includes('hba1c')) {
        params = [['HbA1c Level', '< 5.7%']];
      } else if (tName.includes('liver function') || tName.includes('lft')) {
        params = [
          ['Total Bilirubin', '0.1 - 1.2 mg/dL'], 
          ['ALT (SGPT)', '7 - 56 U/L'], 
          ['AST (SGOT)', '10 - 40 U/L'], 
          ['Alkaline Phosphatase', '44 - 147 IU/L']
        ];
      } else if (tName.includes('kidney function') || tName.includes('kft')) {
        params = [
          ['Blood Urea Nitrogen', '7 - 20 mg/dL'], 
          ['Serum Creatinine', '0.6 - 1.2 mg/dL']
        ];
      } else if (tName.includes('thyroid')) {
        params = [
          ['Total T3', '80 - 200 ng/dL'], 
          ['Total T4', '4.5 - 11.2 mcg/dL'], 
          ['TSH', '0.4 - 4.0 mIU/L']
        ];
      } else if (tName.includes('urine') || tName.includes('urinalysis')) {
        params = [
          ['Color', 'Pale Yellow'], 
          ['pH', '4.5 - 8.0'], 
          ['Protein', 'Negative'], 
          ['Glucose', 'Negative']
        ];
      } else if (tName.includes('x-ray') || tName.includes('mri') || tName.includes('ct scan') || tName.includes('ultrasound') || tName.includes('dexa')) {
        params = [
          ['Imaging Findings', 'Normal Anatomy / No Acute Abnormality'],
          ['Impression', 'Unremarkable Study']
        ];
      } else if (tName.includes('ecg') || tName.includes('echocardiogram')) {
        params = [
          ['Heart Rhythm', 'Normal Sinus Rhythm'], 
          ['Ejection Fraction', '55% - 70%']
        ];
      } else if (tName.includes('covid') || tName.includes('pcr')) {
        params = [
          ['SARS-CoV-2 RNA', 'Negative'],
          ['Specimen Quality', 'Acceptable']
        ];
      } else if (tName.includes('electrolyte')) {
        params = [
          ['Sodium (Na+)', '135 - 145 mEq/L'], 
          ['Potassium (K+)', '3.5 - 5.0 mEq/L'], 
          ['Chloride (Cl-)', '96 - 106 mEq/L']
        ];
      } else if (tName.includes('iron')) {
        params = [
          ['Serum Iron', '60 - 170 mcg/dL'], 
          ['TIBC', '240 - 450 mcg/dL'], 
          ['Ferritin', '12 - 300 ng/mL']
        ];
      } else if (tName.includes('widal') || tName.includes('typhoid')) {
        params = [
          ['S. Typhi O', '< 1:80'], 
          ['S. Typhi H', '< 1:80']
        ];
      } else if (tName.includes('prothrombin') || tName.includes('pt/inr')) {
        params = [
          ['Prothrombin Time (PT)', '11 - 13.5 seconds'], 
          ['INR', '0.8 - 1.1']
        ];
      } else {
        // Fallback mapping for any other test in your 35 list
        params = [
          [`${test.name} Parameter`, 'Standard Normal Range'],
          ['Clinical Status', 'Normal / Negative']
        ];
      }

      for (const param of params) {
        await client.query(
          `INSERT INTO "TEST_PARAMETER" (test_id, parameter_name, normal_range) VALUES ($1, $2, $3)`,
          [test.test_id, param[0], param[1]]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Successfully seeded parameters for all 35 database tests!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
};

seedLabData();