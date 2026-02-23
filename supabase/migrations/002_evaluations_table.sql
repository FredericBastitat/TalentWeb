-- Create evaluations table (separate evaluations per evaluator)
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    evaluator_id INTEGER NOT NULL CHECK (evaluator_id BETWEEN 1 AND 3),
    evaluation JSONB DEFAULT '{
        "portrait": {"formal": 0},
        "file": {"formal": 0},
        "still-life": {"formal": 0}
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(candidate_id, evaluator_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate ON evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);

-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policies (all authenticated users can read/write)
CREATE POLICY "Users can view evaluations"
    ON evaluations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert evaluations"
    ON evaluations FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update evaluations"
    ON evaluations FOR UPDATE
    TO authenticated
    USING (true);

-- Auto-update timestamp trigger (reuses existing function)
CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
