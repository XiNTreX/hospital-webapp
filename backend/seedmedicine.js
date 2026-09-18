const pool = require('./config/db');

const medicineData = [
  // Antipyretics & Analgesics (Pain/Fever)
  ['Napa (Paracetamol)', '500mg', 1.20],
  ['Napa Extra', '500mg/65mg', 2.50],
  ['Napa Extend', '665mg', 2.00],
  ['Ace (Paracetamol)', '500mg', 1.20],
  ['Flamax (Ibuprofen)', '400mg', 3.00],
  ['Voltalin (Diclofenac)', '50mg', 4.00],
  ['Ketrolac (Ketorolac)', '10mg', 5.00],
  ['Naproxen', '500mg', 6.00],
  ['Xeldrin', '20mg', 3.50],
  ['Flexi (Meloxicam)', '7.5mg', 4.00],

  // Anti-ulcerants (Gastric/Acidity)
  ['Seclo (Omeprazole)', '20mg', 5.00],
  ['Maxpro (Esomeprazole)', '20mg', 7.00],
  ['Pantron (Pantoprazole)', '40mg', 8.00],
  ['Sergel (Esomeprazole)', '20mg', 7.00],
  ['Losectil (Omeprazole)', '20mg', 5.00],
  ['Emax (Esomeprazole)', '40mg', 9.00],
  ['Nexum', '20mg', 8.00],
  ['Finix (Rabeprazole)', '20mg', 6.00],
  ['Progut', '20mg', 5.00],
  ['Rabemac', '20mg', 6.00],

  // Antibiotics
  ['Moxacil (Amoxicillin)', '500mg', 10.00],
  ['Zithrox (Azithromycin)', '500mg', 35.00],
  ['Ciprocin (Ciprofloxacin)', '500mg', 12.00],
  ['Azithral', '500mg', 35.00],
  ['Ceftron (Ceftriaxone)', '1g', 120.00],
  ['Cef-3 (Cefixime)', '200mg', 25.00],
  ['Fimox', '500mg', 10.00],
  ['Fluclox (Flucloxacillin)', '500mg', 15.00],
  ['Amodis (Metronidazole)', '400mg', 3.00],
  ['Flagyl', '400mg', 3.00],

  // Antihistamines & Asthma (Allergy/Cold)
  ['Alatrol (Cetirizine)', '10mg', 2.50],
  ['Fexo (Fexofenadine)', '120mg', 8.00],
  ['Deslor (Desloratadine)', '5mg', 5.00],
  ['Monas (Montelukast)', '10mg', 15.00],
  ['Montair', '10mg', 15.00],
  ['Windel Plus', 'Inhaler', 250.00],
  ['Bexitrol', 'Inhaler', 300.00],
  ['Azmasol', 'Inhaler', 180.00],
  ['Doxiva', '200mg', 6.00],
  ['Remcor', '10mg', 12.00],

  // Anti-diabetics
  ['Comet (Metformin)', '500mg', 4.00],
  ['Secrin (Glimepiride)', '2mg', 6.00],
  ['Diamicron', '60mg', 10.00],
  ['Galvus Met', '50mg/500mg', 22.00],
  ['Linamac (Linagliptin)', '5mg', 18.00],
  ['Glymep', '2mg', 5.00],
  ['Janumet', '50mg/500mg', 25.00],
  ['Jardiance', '10mg', 40.00],
  ['Trajenta', '5mg', 35.00],
  ['Amaryl', '2mg', 8.00],

  // Cardiovascular & Hypertension
  ['Losartan', '50mg', 9.00],
  ['Bizoran', '5mg/20mg', 15.00],
  ['Atova (Atorvastatin)', '10mg', 12.00],
  ['Rosuva (Rosuvastatin)', '10mg', 18.00],
  ['Amlocal (Amlodipine)', '5mg', 6.00],
  ['Cardizem', '30mg', 5.00],
  ['Angilock', '50mg', 8.00],
  ['Propranolol', '10mg', 3.00],
  ['Clopidogrel', '75mg', 12.00],
  ['Ecosprin', '75mg', 2.00],

  // Vitamins & Supplements
  ['Aristocal D', '500mg/200IU', 6.00],
  ['Calbo D', '500mg/200IU', 6.00],
  ['B50 Forte', 'Complex', 3.00],
  ['Neuro-B', 'Complex', 5.00],
  ['Zinc B', '20mg', 4.00],
  ['Ceevit (Vitamin C)', '250mg', 2.00],
  ['Aristovit', 'Multivitamin', 4.00],
  ['Beklo', 'Complex', 3.00],
  ['Nurobion', 'Complex', 8.00],
  ['Supradyn', 'Multivitamin', 7.00],

  // Gastrointestinal & Antispasmodic
  ['Algin (Tiemonium)', '50mg', 4.00],
  ['Viset', '50mg', 4.00],
  ['Joytrip', '150mg', 5.00],
  ['Motigut (Domperidone)', '10mg', 3.00],
  ['Emodium', '2mg', 4.00],
  ['Normagut', 'Probiotic', 15.00],
  ['Omidon', '10mg', 3.00],
  ['Deflux', '10mg', 4.00],
  ['Avolac', '100ml', 80.00],
  ['Emanera', '20mg', 7.00],

  // Neurological & Psychiatric
  ['Rivotril (Clonazepam)', '0.5mg', 5.00],
  ['Lexotanil', '3mg', 6.00],
  ['Disopan', '2mg', 4.00],
  ['Amitriptyline', '25mg', 3.00],
  ['Escitalopram', '10mg', 8.00],
  ['Sertraline', '50mg', 10.00],
  ['Frisium', '10mg', 12.00],
  ['Epilim', '200mg', 15.00],
  ['Valproate', '200mg', 12.00],
  ['Melatonin', '3mg', 10.00],

  // Topicals, Drops & Others
  ['Viodin (Povidone-Iodine)', 'Ointment', 45.00],
  ['Pevisone', 'Cream', 55.00],
  ['Betnovate', 'Ointment', 40.00],
  ['Nix Rub', 'Ointment', 35.00],
  ['Savlon', 'Antiseptic', 50.00],
  ['Neosporin', 'Ointment', 60.00],
  ['Fucidin', 'Ointment', 85.00],
  ['Caladryl', 'Lotion', 70.00],
  ['Miconazole', 'Cream', 45.00],
  ['Clotrimazole', 'Cream', 40.00]
];

const seedMedicines = async () => {
  try {
    await pool.query('TRUNCATE TABLE "MEDICINE" RESTART IDENTITY CASCADE;');
    for (const med of medicineData) {
      await pool.query(
        `INSERT INTO "MEDICINE" (name, dosage, price) VALUES ($1, $2, $3)`,
        med
      );
    }
    console.log('✅ Successfully seeded 100 medicines into the MEDICINE table.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedMedicines();