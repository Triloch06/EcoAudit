-- Supabase PostgreSQL Schema for EcoAudit - Community Waste Logger

CREATE TABLE IF NOT EXISTS waste_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    weight FLOAT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    accuracy FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_waste_logs_category ON waste_logs(category);
CREATE INDEX IF NOT EXISTS idx_waste_logs_created_at ON waste_logs(created_at DESC);
