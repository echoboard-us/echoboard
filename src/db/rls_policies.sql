-- Enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy to allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy to allow new user creation during signup
CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Grant necessary permissions to authenticated and anon users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO anon, authenticated;

-- Enable RLS on the surveys table
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own surveys
CREATE POLICY "Users can view own surveys" ON surveys
  FOR SELECT
  USING (creator_id = auth.uid());

-- Policy to allow users to create their own surveys
CREATE POLICY "Users can create surveys" ON surveys
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Policy to allow users to update their own surveys
CREATE POLICY "Users can update own surveys" ON surveys
  FOR UPDATE
  USING (creator_id = auth.uid());

-- Policy to allow users to delete their own surveys
CREATE POLICY "Users can delete own surveys" ON surveys
  FOR DELETE
  USING (creator_id = auth.uid());

-- Enable RLS on the survey_responses table
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read responses to their surveys
CREATE POLICY "Users can view responses to own surveys" ON survey_responses
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_responses.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

-- Policy to allow users to submit responses to any survey
CREATE POLICY "Users can submit responses" ON survey_responses
  FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions for surveys and responses
GRANT ALL ON surveys TO authenticated;
GRANT ALL ON survey_responses TO authenticated; 