-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL,
    school_year TEXT NOT NULL,
    evaluation JSONB DEFAULT '{
        "portrait": {"formal": 0},
        "file": {"formal": 0},
        "still-life": {"formal": 0}
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(code, school_year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_candidates_school_year ON candidates(school_year);
CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(code);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and edit candidates from their own school years
-- (Adjust this policy based on your requirements - currently allows all authenticated users)
CREATE POLICY "Users can view candidates"
    ON candidates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert candidates"
    ON candidates FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update candidates"
    ON candidates FOR UPDATE
    TO authenticated
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
