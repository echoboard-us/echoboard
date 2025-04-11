-- Create a junction table for teams and surveys
create table if not exists public.team_surveys (
    id uuid default uuid_generate_v4() primary key,
    team_id uuid references public.teams(id) on delete cascade,
    survey_id uuid references public.surveys(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete cascade,
    unique(team_id, survey_id)
);

-- Add RLS policies
alter table public.team_surveys enable row level security;

-- Policy for inserting team surveys (team admins and members can add surveys)
create policy "Team members can add surveys to teams"
    on public.team_surveys
    for insert
    with check (
        auth.uid() in (
            select user_id from team_members
            where team_id = team_surveys.team_id
            and (role = 'admin' or role = 'member')
        )
    );

-- Policy for viewing team surveys (team members can view)
create policy "Team members can view team surveys"
    on public.team_surveys
    for select
    using (
        auth.uid() in (
            select user_id from team_members
            where team_id = team_surveys.team_id
        )
    );

-- Policy for deleting team surveys (only team admins)
create policy "Team admins can delete team surveys"
    on public.team_surveys
    for delete
    using (
        auth.uid() in (
            select user_id from team_members
            where team_id = team_surveys.team_id
            and role = 'admin'
        )
    );

-- Add indexes for better query performance
create index if not exists team_surveys_team_id_idx on public.team_surveys(team_id);
create index if not exists team_surveys_survey_id_idx on public.team_surveys(survey_id); 