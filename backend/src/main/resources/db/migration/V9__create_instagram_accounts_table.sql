CREATE TABLE instagram_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    ig_user_id VARCHAR(255) NOT NULL,
    app_id VARCHAR(255) NOT NULL,
    app_secret VARCHAR(1000) NOT NULL,
    access_token VARCHAR(2000) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP,
    CONSTRAINT uk_account_user_iguser UNIQUE (user_id, ig_user_id)
);

CREATE INDEX idx_instagram_accounts_user_id ON instagram_accounts(user_id);
