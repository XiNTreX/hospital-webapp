const pool = require('./config/db');

const testData = [
  ['Complete Blood Count (CBC)', 400],
  ['Lipid Profile', 800],
  ['Fasting Blood Sugar (FBS)', 150],
  ['HbA1c', 600],
  ['Liver Function Test (LFT)', 900],
  ['Kidney Function Test (KFT)', 850],
  ['Thyroid Profile (TSH, T3, T4)', 1200],
  ['Urinalysis', 200],
  ['Chest X-Ray', 600],
  ['ECG (Electrocardiogram)', 300],
  ['Echocardiogram', 1500],
  ['Ultrasound Whole Abdomen', 1200],
  ['MRI Brain', 7000],
  ['CT Scan Abdomen', 4500],
  ['Vitamin D (25-OH)', 1500],
  ['Vitamin B12', 1200],
  ['C-Reactive Protein (CRP)', 500],
  ['Dengue NS1 Antigen', 600],
  ['COVID-19 RT-PCR', 1500],
  ['Bone Density (DEXA)', 2500]
];

const seedTests = async () => {
  try {
    // Clear existing data to prevent duplicates
    await pool.query('TRUNCATE TABLE "TEST" RESTART IDENTITY CASCADE;');

    for (const test of testData) {
      await pool.query(
        `INSERT INTO "TEST" (name, cost) VALUES ($1, $2)`,
        test
      );
    }
    console.log('✅ Successfully seeded 20 medical tests.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedTests();