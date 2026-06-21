CREATE TABLE spreadsheet_rows (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    row_order INT NOT NULL DEFAULT 0,
    profile_url VARCHAR(500),
    username VARCHAR(255),
    post_url VARCHAR(500),
    followers_count BIGINT,
    following_count BIGINT,
    total_posts INT,
    likes_count BIGINT,
    comments_count BIGINT,
    views_count BIGINT,
    reach BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_spreadsheet_rows_user_id ON spreadsheet_rows(user_id);
