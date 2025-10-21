-- Enable Realtime for Bids Table
-- Migration: enable_realtime_bids.sql
-- Purpose: Allow real-time subscriptions to bids table for UI updates
-- Context: BidView and Home.tsx subscribe to bid changes to auto-refresh UI and update badge count

BEGIN;

-- Add bids table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE bids;

COMMIT;
