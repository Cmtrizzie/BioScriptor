
-- Add new fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_query_reset TIMESTAMP DEFAULT NOW();

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  target_resource VARCHAR(255),
  details TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create index on admin_logs for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);

-- Update existing users to have proper status
UPDATE users SET status = 'active' WHERE status IS NULL;
