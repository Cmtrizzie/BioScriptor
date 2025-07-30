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

-- Add admin-specific features
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  target_resource TEXT,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plan_limits (
  id SERIAL PRIMARY KEY,
  tier TEXT NOT NULL UNIQUE,
  max_queries INTEGER,
  max_file_size INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Provider Management
CREATE TABLE IF NOT EXISTS api_providers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  api_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  max_retries INTEGER DEFAULT 2,
  timeout INTEGER DEFAULT 30,
  rate_limit INTEGER DEFAULT 100,
  plan_access JSONB DEFAULT '["free","premium","enterprise"]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Error Logs
CREATE TABLE IF NOT EXISTS api_error_logs (
  id SERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  user_id INTEGER,
  request_data JSONB,
  response_data JSONB,
  resolved BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default API providers
INSERT INTO api_providers (name, type, endpoint, api_key, enabled, priority, plan_access) VALUES
('groq', 'openai', 'https://api.groq.com/openai/v1/chat/completions', '', true, 1, '["premium","enterprise"]'),
('together', 'openai', 'https://api.together.xyz/v1/chat/completions', '', true, 2, '["free","premium","enterprise"]'),
('openrouter', 'openai', 'https://openrouter.ai/api/v1/chat/completions', '', true, 3, '["premium","enterprise"]'),
('cohere', 'cohere', 'https://api.cohere.ai/v1/generate', '', false, 4, '["enterprise"]')
ON CONFLICT (name) DO NOTHING;