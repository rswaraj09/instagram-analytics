-- V14__multi_account_support.sql
-- Enhancements for Multi-Instagram Account Management

-- 1. Add missing fields to instagram_accounts
ALTER TABLE instagram_accounts
    ADD COLUMN IF NOT EXISTS username VARCHAR(255),
    ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'BUSINESS',
    ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'CONNECTED',
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_successful_sync TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_failed_sync TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS sync_error_message TEXT;

-- 2. Junction table for Multi-Account Campaigns
CREATE TABLE IF NOT EXISTS campaign_accounts (
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, account_id)
);

-- 3. Add instagram_account_id to instagram_posts if missing
ALTER TABLE instagram_posts
    ADD COLUMN IF NOT EXISTS instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL;

-- 4. Backfill existing instagram_accounts
UPDATE instagram_accounts
SET username = COALESCE(username, account_name),
    display_name = COALESCE(display_name, account_name),
    connection_status = COALESCE(connection_status, 'CONNECTED');

-- Mark first account per user as default if no default exists
UPDATE instagram_accounts a
SET is_default = TRUE
WHERE a.id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
        FROM instagram_accounts
    ) sub WHERE sub.rn = 1
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_default ON instagram_accounts(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_campaign_accounts_campaign ON campaign_accounts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_accounts_account ON campaign_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_account ON instagram_posts(instagram_account_id);
