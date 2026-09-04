const pool = require('./config/db');

const updates = [
  { email: 'shafiqul.islam@hospital.local', photo: '/doctors/dr.shafikul-islam.svg' },
  { email: 'farhana.rahman@hospital.local', photo: '/doctors/dr.farhana rahman.svg' },
  { email: 'tariq.mahmud@hospital.local', photo: '/doctors/dr.tariq-mahmud.svg' },
  { email: 'ayesha.siddiqua@hospital.local', photo: '/doctors/dr.ayesha siddiqa.svg' },
  { email: 'hasan.mahmud@hospital.local', photo: '/doctors/dr.hasan mahmud.svg' },
  { email: 'nusrat.jahan@hospital.local', photo: '/doctors/dr.nusrat-jahan.svg' },
  { email: 'rafiqul.islam@hospital.local', photo: '/doctors/dr.rafiqul-islam.svg' },
  { email: 'salma.begum@hospital.local', photo: '/doctors/dr.salma-begum.svg' },
  { email: 'tahmina.akter@hospital.local', photo: '/doctors/dr.tahmina akter.svg' },
  { email: 'samira.khan@hospital.local', photo: '/doctors/dr.samira khan.svg' },
  { email: 'mizanur.rahman@hospital.local', photo: '/doctors/dr.mizanur-rahman.svg' },
  { email: 'kamal.hossain@hospital.local', photo: '/doctors/dr.kamal hossain.svg' },
  { email: 'jamila.khatun@hospital.local', photo: '/doctors/dr.jamila khatun.svg' },
  { email: 'rashedul.islam@hospital.local', photo: '/doctors/dr.rashedul-islam.svg' },
  { email: 'kazi.anis@hospital.local', photo: '/doctors/dr.kazi anis.svg' },
  { email: 'imran.chowdhury@hospital.local', photo: '/doctors/dr.imran-Choudhury.svg' },
  { email: 'shahinur.rahman@hospital.local', photo: '/doctors/dr.shahinur-rahman.svg' },
  { email: 'laila.hasan@hospital.local', photo: '/doctors/dr.laila-hasan.svg' },
  { email: 'abdul.karim@hospital.local', photo: '/doctors/dr.abdul karim.svg' },
  { email: 'shirin.akter@hospital.local', photo: '/doctors/dr.shirin akter.svg' }
];

async function updatePhotos() {
  try {
    for (const doc of updates) {
      await pool.query('UPDATE \"DOCTOR\" SET photo_url = $1 WHERE email = $2', [doc.photo, doc.email]);
      console.log('✅ Updated:', doc.email);
    }
    console.log('🎉 All photos updated to SVG!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    pool.end();
    process.exit();
  }
}
updatePhotos();
