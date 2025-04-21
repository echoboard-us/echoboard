import { supabase } from '../supabaseClient';

/**
 * Determines the appropriate API base URL based on the environment
 * @returns {string} The API base URL
 */
const getApiBaseUrl = () => {
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalDev) {
    // Local development - use localhost with Flask port
    return 'http://localhost:5001';
  } else {
    // Production environment - use the same domain as the frontend
    return window.location.origin;
  }
};

/**
 * Gets the appropriate site URL based on the environment
 * @returns {string} The site URL
 */
const getSiteUrl = () => {
  // Check if we're in development or production
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalDev) {
    // Use the environment variable for local development
    return process.env.REACT_APP_SITE_URL || window.location.origin;
  } else {
    // In production, always use www.echoboard.us
    return 'https://www.echoboard.us';
  }
};

/**
 * Sends a survey to all members of a team
 * @param {string} teamId - The ID of the team
 * @param {string} surveyId - The ID of the survey to send
 * @returns {Promise<Object>} - Response object with status and message
 */
export const sendSurveyToTeam = async (teamId, surveyId) => {
  try {
    // 1. Get the survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('title, description')
      .eq('id', surveyId)
      .single();
    
    if (surveyError) throw surveyError;
    
    // 2. Get all team members' emails
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select(`
        user_id,
        profiles:user_id (
          email
        )
      `)
      .eq('team_id', teamId);
    
    if (teamError) throw teamError;
    
    // 3. Extract emails from team members
    const emails = teamMembers
      .filter(member => member.profiles && member.profiles.email)
      .map(member => member.profiles.email);
    
    if (emails.length === 0) {
      return { 
        status: 'error', 
        message: 'No valid email addresses found for team members' 
      };
    }
    
    // 4. Get the most recent survey share token from the survey_share_links table
    const { data: shareLinks, error: shareLinksError } = await supabase
      .from('survey_share_links')
      .select('token, created_at')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (shareLinksError) {
      console.warn('Error fetching share token:', shareLinksError);
      // Continue with default link if there's an error
    }
    
    const siteUrl = getSiteUrl();
    
    let surveyLink;
    if (shareLinks && shareLinks.length > 0 && shareLinks[0].token) {
      // Use the correct format: /survey/{survey_id}?token={token}
      surveyLink = `${siteUrl}/survey/${surveyId}?token=${shareLinks[0].token}`;
    } else {
      surveyLink = `${siteUrl}/survey/${surveyId}`;
    }
    
    console.log('Using survey link:', surveyLink);
    
    const apiBaseUrl = getApiBaseUrl();
    console.log('Using API base URL:', apiBaseUrl);
    
    const response = await fetch(`${apiBaseUrl}/api/send-survey-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails: emails,
        survey_id: surveyId,
        survey_title: survey.title,
        survey_description: survey.description,
        survey_link: surveyLink
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    return { 
      status: 'success', 
      message: `Survey sent to ${emails.length} team members`,
      details: result
    };
  } catch (error) {
    console.error('Error sending survey to team:', error);
    return { 
      status: 'error', 
      message: error.message || 'An error occurred while sending the survey'
    };
  }
};
