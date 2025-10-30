-- Email Support Migration
-- Copyright Mark Skiba, 2025 All rights reserved
-- Adds Gmail API integration support with OAuth credentials and email tracking

-- Store user Gmail credentials
CREATE TABLE IF NOT EXISTS user_email_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gmail',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

-- Enable RLS
ALTER TABLE user_email_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own credentials
CREATE POLICY user_email_credentials_select ON user_email_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_email_credentials_insert ON user_email_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_email_credentials_update ON user_email_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_email_credentials_delete ON user_email_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Email tracking table
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  rfp_id INTEGER REFERENCES rfps(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  has_attachments BOOLEAN DEFAULT FALSE,
  labels TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own emails
CREATE POLICY email_messages_select ON email_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY email_messages_insert ON email_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY email_messages_update ON email_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY email_messages_delete ON email_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_email_messages_user_id ON email_messages(user_id);
CREATE INDEX idx_email_messages_session_id ON email_messages(session_id);
CREATE INDEX idx_email_messages_rfp_id ON email_messages(rfp_id);
CREATE INDEX idx_email_messages_gmail_message_id ON email_messages(gmail_message_id);
CREATE INDEX idx_email_messages_created_at ON email_messages(created_at DESC);
CREATE INDEX idx_email_messages_direction ON email_messages(direction);

-- Add updated_at trigger for user_email_credentials
CREATE OR REPLACE FUNCTION update_email_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_email_credentials_updated_at
BEFORE UPDATE ON user_email_credentials
FOR EACH ROW
EXECUTE FUNCTION update_email_credentials_updated_at();

-- Add updated_at trigger for email_messages
CREATE OR REPLACE FUNCTION update_email_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_messages_updated_at
BEFORE UPDATE ON email_messages
FOR EACH ROW
EXECUTE FUNCTION update_email_messages_updated_at();
