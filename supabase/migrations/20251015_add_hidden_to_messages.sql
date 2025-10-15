-- Add hidden column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;
