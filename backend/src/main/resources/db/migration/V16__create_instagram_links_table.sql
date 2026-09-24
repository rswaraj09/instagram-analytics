CREATE TABLE IF NOT EXISTS instagram_links (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    campaign_id UUID,
    url VARCHAR(1000) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    shortcode_or_handle VARCHAR(255),
    author_handle VARCHAR(255),
    caption_snippet VARCHAR(1000),
    thumbnail_url VARCHAR(1000),
    likes INT,
    comments INT,
    views BIGINT,
    reach BIGINT,
    impressions BIGINT,
    shares INT,
    saves INT,
    is_authorized_connected_account BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_instagram_links_user_id ON instagram_links(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_links_campaign_id ON instagram_links(campaign_id);
