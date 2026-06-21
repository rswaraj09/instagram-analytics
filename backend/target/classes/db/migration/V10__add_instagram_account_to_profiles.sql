ALTER TABLE instagram_profiles
    ADD COLUMN instagram_account_id UUID;

ALTER TABLE instagram_profiles
    ADD CONSTRAINT fk_profiles_instagram_account
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE SET NULL;
