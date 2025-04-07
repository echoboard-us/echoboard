-- Drop existing tables if they exist
DROP TABLE IF EXISTS survey_insights CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;

-- Create surveys table
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  respondents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false
);

-- Create questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL,
  choices JSONB,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create survey_insights table
CREATE TABLE survey_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  summary TEXT,
  key_findings JSONB,
  sentiment_analysis JSONB,
  trends JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_insights ENABLE ROW LEVEL SECURITY;

-- Policies for surveys table
CREATE POLICY "Users can view their own surveys"
  ON surveys FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create surveys"
  ON surveys FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own surveys"
  ON surveys FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own surveys"
  ON surveys FOR DELETE
  USING (auth.uid() = creator_id);

-- Policies for questions table
CREATE POLICY "Users can view questions of their surveys"
  ON questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = questions.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

CREATE POLICY "Users can create questions for their surveys"
  ON questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = questions.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

CREATE POLICY "Users can update questions of their surveys"
  ON questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = questions.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

CREATE POLICY "Users can delete questions of their surveys"
  ON questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = questions.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

-- Policies for survey_insights table
CREATE POLICY "Users can view insights of their surveys"
  ON survey_insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_insights.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

CREATE POLICY "Users can create insights for their surveys"
  ON survey_insights FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_insights.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

CREATE POLICY "Users can update insights of their surveys"
  ON survey_insights FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_insights.survey_id 
    AND surveys.creator_id = auth.uid()
  ));

CREATE POLICY "Users can delete insights of their surveys"
  ON survey_insights FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_insights.survey_id 
    AND surveys.creator_id = auth.uid()
  ));
