const bcrypt = require('bcrypt');
const pool = require('./config/db');

const doctors = [
  { 
    first: 'Shafiqul', last: 'Islam', specialization: 'Cardiology', 
    degrees: 'MBBS, MD (Cardiology)', email: 'shafiqul.islam@hospital.local', 
    phone: '01711000001', room: '101-A', fee: 1200.00, status: 'Active', 
    join_date: '2023-01-15',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.shafikul islam.jpg'
  },
  { 
    first: 'Farhana', last: 'Rahman', specialization: 'Cardiology', 
    degrees: 'MBBS, FCPS (Medicine)', email: 'farhana.rahman@hospital.local', 
    phone: '01711000002', room: '102-A', fee: 1500.00, status: 'Active', 
    join_date: '2022-11-01',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.farhana rahman.jpg'
  },
  { 
    first: 'Tariq', last: 'Mahmud', specialization: 'Neurology', 
    degrees: 'MBBS, MD (Neurology)', email: 'tariq.mahmud@hospital.local', 
    phone: '01711000003', room: '201-B', fee: 1500.00, status: 'Active', 
    join_date: '2021-05-20',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.tariq mahmud.jpg'
  },
  { 
    first: 'Ayesha', last: 'Siddiqua', specialization: 'Neurology', 
    degrees: 'MBBS, FCPS', email: 'ayesha.siddiqua@hospital.local', 
    phone: '01711000004', room: '202-B', fee: 1000.00, status: 'On Leave', 
    join_date: '2024-02-10',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.ayesha siddiqa.jpg'
  },
  { 
    first: 'Hasan', last: 'Mahmud', specialization: 'Pediatrics', 
    degrees: 'MBBS, DCH, MD (Pediatrics)', email: 'hasan.mahmud@hospital.local', 
    phone: '01711000005', room: '301-C', fee: 800.00, status: 'Active', 
    join_date: '2020-08-15',
    photo: 'https://ui-avatars.com/api/?name=Hasan+Mahmud&background=22D3EE&color=fff&size=200'
  },
  { 
    first: 'Nusrat', last: 'Jahan', specialization: 'Pediatrics', 
    degrees: 'MBBS, FCPS', email: 'nusrat.jahan@hospital.local', 
    phone: '01711000006', room: '302-C', fee: 1000.00, status: 'Active', 
    join_date: '2023-06-01',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.nusrat jahan.jpg'
  },
  { 
    first: 'Rafiqul', last: 'Islam', specialization: 'Orthopedics', 
    degrees: 'MBBS, MS (Ortho)', email: 'rafiqul.islam@hospital.local', 
    phone: '01711000007', room: '401-D', fee: 1200.00, status: 'Active', 
    join_date: '2019-12-01',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.rafiqul islam.jpg'
  },
  { 
    first: 'Salma', last: 'Begum', specialization: 'Orthopedics', 
    degrees: 'MBBS, FCPS (Surgery)', email: 'salma.begum@hospital.local', 
    phone: '01711000008', room: '402-D', fee: 1200.00, status: 'Active', 
    join_date: '2021-03-10',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.salma begum.jpg'
  },
  { 
    first: 'Tahmina', last: 'Akter', specialization: 'Gynecology', 
    degrees: 'MBBS, FCPS (Obs & Gynae)', email: 'tahmina.akter@hospital.local', 
    phone: '01711000009', room: '501-E', fee: 1500.00, status: 'Active', 
    join_date: '2018-07-22',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr,tahmina akter.jpg'
  },
  { 
    first: 'Samira', last: 'Khan', specialization: 'Gynecology', 
    degrees: 'MBBS, DGO, MCPS', email: 'samira.khan@hospital.local', 
    phone: '01711000010', room: '502-E', fee: 1000.00, status: 'Active', 
    join_date: '2022-09-05',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr,samira khan.jpg'
  },
  { 
    first: 'Mizanur', last: 'Rahman', specialization: 'General Surgery', 
    degrees: 'MBBS, FCPS (Surgery)', email: 'mizanur.rahman@hospital.local', 
    phone: '01711000011', room: '601-F', fee: 1500.00, status: 'Active', 
    join_date: '2020-01-20',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.mizanur rahman.jpg'
  },
  { 
    first: 'Kamal', last: 'Hossain', specialization: 'General Surgery', 
    degrees: 'MBBS, MS, FRCS', email: 'kamal.hossain@hospital.local', 
    phone: '01711000012', room: '602-F', fee: 2000.00, status: 'Active', 
    join_date: '2015-11-11',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.kamal hossain.jpg'
  },
  { 
    first: 'Jamila', last: 'Khatun', specialization: 'Dermatology', 
    degrees: 'MBBS, DDV, MD', email: 'jamila.khatun@hospital.local', 
    phone: '01711000013', room: '701-G', fee: 1000.00, status: 'Active', 
    join_date: '2023-04-12',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.jamila khatun.jpg'
  },
  { 
    first: 'Rashedul', last: 'Islam', specialization: 'Dermatology', 
    degrees: 'MBBS, FCPS', email: 'rashedul.islam@hospital.local', 
    phone: '01711000014', room: '702-G', fee: 1200.00, status: 'Active', 
    join_date: '2021-08-30',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.rashedul islam.jpg'
  },
  { 
    first: 'Kazi', last: 'Anis', specialization: 'Psychiatry', 
    degrees: 'MBBS, M.Phil (Psychiatry)', email: 'kazi.anis@hospital.local', 
    phone: '01711000015', room: '801-H', fee: 1500.00, status: 'Active', 
    join_date: '2019-02-14',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.kazi anis.jpg'
  },
  { 
    first: 'Imran', last: 'Chowdhury', specialization: 'Psychiatry', 
    degrees: 'MBBS, FCPS', email: 'imran.chowdhury@hospital.local', 
    phone: '01711000016', room: '802-H', fee: 1200.00, status: 'Active', 
    join_date: '2024-01-05',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.imran-Choudhury.jpg'
  },
  { 
    first: 'Shahinur', last: 'Rahman', specialization: 'Oncology', 
    degrees: 'MBBS, MD (Oncology)', email: 'shahinur.rahman@hospital.local', 
    phone: '01711000017', room: '901-I', fee: 2000.00, status: 'Active', 
    join_date: '2017-06-18',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.shahinur rahman.jpg'
  },
  { 
    first: 'Laila', last: 'Hasan', specialization: 'Oncology', 
    degrees: 'MBBS, FCPS (Radiotherapy)', email: 'laila.hasan@hospital.local', 
    phone: '01711000018', room: '902-I', fee: 1500.00, status: 'Active', 
    join_date: '2020-10-10',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.laila hasan.jpg'
  },
  { 
    first: 'Abdul', last: 'Karim', specialization: 'Internal Medicine', 
    degrees: 'MBBS, FCPS (Medicine)', email: 'abdul.karim@hospital.local', 
    phone: '01711000019', room: '1001-J', fee: 1000.00, status: 'Active', 
    join_date: '2016-03-25',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr.abdul karim.jpg'
  },
  { 
    first: 'Shirin', last: 'Akter', specialization: 'Internal Medicine', 
    degrees: 'MBBS, MRCP (UK)', email: 'shirin.akter@hospital.local', 
    phone: '01711000020', room: '1002-J', fee: 1500.00, status: 'Active', 
    join_date: '2022-05-14',
    photo: 'C:\Users\User\hospital-webapp\backend\database\doctor_photos\dr,shirin akter.jpg'
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const defaultPassword = 'SecureDoc123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    console.log('🚀 Starting insertion of 20 doctors with photos...');

    for (const doc of doctors) {
      // 1. Create the user account
      const userRes = await client.query(
        `INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type) 
         VALUES ($1, $2, $3) RETURNING account_id`,
        [doc.email, hashedPassword, 'DOCTOR']
      );
      
      const accountId = userRes.rows[0].account_id;

      // 2. Create the doctor profile with photo_url
      await client.query(
        `INSERT INTO "DOCTOR" (
          first_name, last_name, specialization, degrees, 
          email, phone, room_number, fee, status, joining_date, account_id, photo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          doc.first, doc.last, doc.specialization, doc.degrees, 
          doc.email, doc.phone, doc.room, doc.fee, doc.status, doc.join_date, 
          accountId, doc.photo
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Successfully seeded 20 doctors with photos!');
    console.log('🔑 Default password for all: SecureDoc123!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed doctors:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seedDatabase();