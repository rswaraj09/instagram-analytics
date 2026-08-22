-- V12__create_comprehensive_schema.sql
-- Create tables for full Instagram Analytics + AI SaaS Platform

-- 1. Account Metrics (Historical snapshots for growth)
CREATE TABLE IF NOT EXISTS account_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    followers_count INT NOT NULL DEFAULT 0,
    following_count INT NOT NULL DEFAULT 0,
    followers_gained INT NOT NULL DEFAULT 0,
    followers_lost INT NOT NULL DEFAULT 0,
    total_posts INT NOT NULL DEFAULT 0,
    total_reels INT NOT NULL DEFAULT 0,
    total_likes BIGINT NOT NULL DEFAULT 0,
    total_comments BIGINT NOT NULL DEFAULT 0,
    total_views BIGINT NOT NULL DEFAULT 0,
    reach BIGINT NOT NULL DEFAULT 0,
    impressions BIGINT NOT NULL DEFAULT 0,
    profile_visits INT NOT NULL DEFAULT 0,
    website_clicks INT NOT NULL DEFAULT 0,
    engagement_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_account_snapshot UNIQUE (account_id, snapshot_date)
);

-- 2. Reels Table
CREATE TABLE IF NOT EXISTS reels (
    id VARCHAR(255) PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    caption TEXT,
    permalink VARCHAR(500),
    thumbnail_url TEXT,
    video_url TEXT,
    duration_seconds DOUBLE PRECISION,
    plays BIGINT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    avg_watch_time_sec DOUBLE PRECISION DEFAULT 0,
    retention_rate DOUBLE PRECISION DEFAULT 0,
    performance_score DOUBLE PRECISION DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(255) PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    media_url TEXT,
    caption TEXT,
    media_type VARCHAR(50),
    views_count INT DEFAULT 0,
    reach INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    exits_count INT DEFAULT 0,
    forward_taps INT DEFAULT 0,
    back_taps INT DEFAULT 0,
    completion_rate DOUBLE PRECISION DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    is_expired BOOLEAN DEFAULT false
);

-- 4. Audience Metrics
CREATE TABLE IF NOT EXISTS audience_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    age_groups JSONB,
    gender_distribution JSONB,
    top_countries JSONB,
    top_cities JSONB,
    languages JSONB,
    active_hours JSONB,
    is_available BOOLEAN NOT NULL DEFAULT true,
    data_source VARCHAR(50) DEFAULT 'INSTAGRAM_GRAPH_API',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Hashtags & Hashtag Performance
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    usage_count INT DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_reach BIGINT DEFAULT 0,
    avg_engagement_rate DOUBLE PRECISION DEFAULT 0.0,
    performance_category VARCHAR(50) DEFAULT 'RECOMMENDED', -- FREQUENTLY_USED, HIGH_PERFORMING, LOW_PERFORMING, RECOMMENDED
    is_saved_group BOOLEAN DEFAULT false,
    group_name VARCHAR(100),
    last_used_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_account_hashtag UNIQUE (account_id, tag_name)
);

-- 6. Content Performance Intelligence Config & Cache
CREATE TABLE IF NOT EXISTS content_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    media_id VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    performance_score DOUBLE PRECISION DEFAULT 0.0,
    performance_rank INT,
    like_weight DOUBLE PRECISION DEFAULT 0.2,
    comment_weight DOUBLE PRECISION DEFAULT 0.3,
    share_weight DOUBLE PRECISION DEFAULT 0.3,
    save_weight DOUBLE PRECISION DEFAULT 0.2,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Competitors
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    profile_picture_url TEXT,
    category VARCHAR(100) DEFAULT 'General',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_competitor UNIQUE (user_id, username)
);

-- 8. Competitor Metrics & Content
CREATE TABLE IF NOT EXISTS competitor_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    total_posts INT DEFAULT 0,
    avg_likes DOUBLE PRECISION DEFAULT 0.0,
    avg_comments DOUBLE PRECISION DEFAULT 0.0,
    engagement_rate DOUBLE PRECISION DEFAULT 0.0,
    posting_frequency_per_week DOUBLE PRECISION DEFAULT 0.0,
    reel_to_post_ratio DOUBLE PRECISION DEFAULT 0.0,
    data_status VARCHAR(50) DEFAULT 'OBSERVED', -- VERIFIED, OBSERVED, ESTIMATED, UNAVAILABLE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitor_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL,
    caption TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    estimated_views INT DEFAULT 0,
    hashtags TEXT,
    published_at TIMESTAMP WITH TIME ZONE
);

-- 9. AI Analysis & Recommendations
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    health_score INT NOT NULL DEFAULT 75,
    growth_summary TEXT,
    content_summary TEXT,
    weaknesses JSONB,
    opportunities JSONB,
    competitor_insights JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- CAPTION, CONTENT_IDEA, REEL_IDEA, POSTING_SCHEDULE, HASHTAG
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    confidence_score DOUBLE PRECISION DEFAULT 0.85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Content Calendar
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    caption TEXT,
    hashtags VARCHAR(500),
    media_type VARCHAR(50) DEFAULT 'POST', -- POST, REEL, STORY
    media_url TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, PUBLISHED
    performance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Reports & Subscriptions
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
    report_title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY, COMPETITOR, AI_INSIGHTS
    format VARCHAR(20) NOT NULL, -- PDF, CSV, EXCEL
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) DEFAULT 'PRO',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_account_metrics_date ON account_metrics(account_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_reels_account ON reels(account_id);
CREATE INDEX IF NOT EXISTS idx_stories_account ON stories(account_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_account ON hashtags(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user ON content_calendar(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_competitor_user ON competitors(user_id);
