-- Stores grammY session data (conversation state) per Telegram chat_id
-- This table is managed entirely by the StorageAdapter in lib/telegram/storage.ts
CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id      bigint      PRIMARY KEY,
  session_data jsonb       NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Allow service role full access (RLS bypassed by service key)
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;
