const pool = require('./config/db');

const run = async () => {
  try {
    const result = await pool.query(`
      UPDATE "DRIVER"
      SET status = 'Available'
      WHERE status = 'On Trip'
        AND driver_id NOT IN (
          SELECT driver_id FROM "AMBULANCE_REQUEST"
          WHERE driver_id IS NOT NULL
            AND status IN ('Accepted', 'En Route', 'Arrived', 'Picked Up')
        )
    `);
    console.log(`✅ Reset ${result.rowCount} driver(s) to Available`);
  } catch (err) {
    console.error('❌', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();