-- V13__create_campaign_tables.sql
-- Campaign Management and Analysis schema

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(100) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),
    start_date DATE,
    end_date DATE,
    budget DOUBLE PRECISION DEFAULT 0.0,
    total_spend DOUBLE PRECISION DEFAULT 0.0,
    revenue DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, ACTIVE, COMPLETED, PAUSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    media_id VARCHAR(255),
    media_type VARCHAR(50) NOT NULL, -- POST, REEL, STORY
    caption TEXT,
    permalink VARCHAR(500),
    thumbnail_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    reach BIGINT DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    saves INT DEFAULT 0,
    views BIGINT DEFAULT 0,
    link_clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_name VARCHAR(255) NOT NULL,
    handle VARCHAR(100),
    followers INT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    engagements INT DEFAULT 0,
    content_count INT DEFAULT 1,
    cost DOUBLE PRECISION DEFAULT 0.0,
    conversions INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    reach BIGINT DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    saves INT DEFAULT 0,
    video_views BIGINT DEFAULT 0,
    profile_visits INT DEFAULT 0,
    follower_growth INT DEFAULT 0,
    link_clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    spend DOUBLE PRECISION DEFAULT 0.0,
    revenue DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_campaign_metric_date UNIQUE (campaign_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS campaign_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- REACH, ENGAGEMENT, FOLLOWERS, WEBSITE_TRAFFIC, LEADS, SALES, CONVERSIONS
    target_value DOUBLE PRECISION NOT NULL,
    current_value DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
    age_groups TEXT,
    gender_distribution TEXT,
    top_countries TEXT,
    top_cities TEXT,
    interests TEXT,
    follower_reach BIGINT DEFAULT 0,
    non_follower_reach BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contents_campaign ON campaign_contents(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_campaign ON campaign_influencers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign ON campaign_metrics(campaign_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_campaign_goals_campaign ON campaign_goals(campaign_id);
