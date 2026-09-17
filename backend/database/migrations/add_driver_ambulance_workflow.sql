-- ==========================================
-- Driver Ambulance Workflow Enhancements
-- ==========================================

-- Direct driver assignment on requests + full status timestamps
ALTER TABLE "AMBULANCE_REQUEST"
  ADD COLUMN IF NOT EXISTS driver_id INT REFERENCES "DRIVER"(driver_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS en_route_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20);

-- Helpful index for driver dashboards
CREATE INDEX IF NOT EXISTS idx_amb_req_driver_status
  ON "AMBULANCE_REQUEST"(driver_id, status);

CREATE INDEX IF NOT EXISTS idx_amb_req_status
  ON "AMBULANCE_REQUEST"(status);