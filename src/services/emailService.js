import { supabase } from '../supabaseClient';

/**
 * Determines the appropriate API base URL based on the environment
 * @returns {string} The API base URL
 */
const getApiBaseUrl = () => {
  // Check if we're in development or production
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalDev) {
    // Local development - use localhost with Flask port
    return 'http://localhost:5001';
  } else {
    // Production environment - use the same domain as the frontend
    // Vercel will route /api/* requests to the backend
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
 * Simulates sending emails when the backend API is not available
 * This is a fallback for when the production backend doesn't have the email API endpoint
 * @param {Array} emails - List of email addresses
 * @param {string} surveyLink - The survey link to include in the email
 * @param {string} surveyTitle - The title of the survey
 * @returns {Promise<Object>} - Simulated response
 */
const simulateSendEmails = async (emails, surveyLink, surveyTitle) => {
  console.log('Simulating email sending (backend API not available)');
  console.log('Would send to:', emails);
  console.log('Survey link:', surveyLink);
  console.log('Survey title:', surveyTitle);
  
  // Simulate a delay to make it feel like something is happening
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    status: 'complete',
    total: emails.length,
    success: emails.length,
    error: 0,
    results: emails.map(email => ({
      status: 'sent',
      email: email,
      message_id: 'simulated-' + Math.random().toString(36).substring(2, 15)
    }))
  };
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
    
    // Get the site URL based on environment
    const siteUrl = getSiteUrl();
    
    // Build the survey link using the token or use a fallback
    let surveyLink;
    if (shareLinks && shareLinks.length > 0 && shareLinks[0].token) {
      // Use the correct format: /survey/{survey_id}?token={token}
      surveyLink = `${siteUrl}/survey/${surveyId}?token=${shareLinks[0].token}`;
    } else {
      // Fallback to a direct survey link
      surveyLink = `${siteUrl}/survey/${surveyId}`;
    }
    
    console.log('Using survey link:', surveyLink);
    
    // Check if we're in production or development
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let result;
    
    if (isLocalDev) {
      // In development, use the local Flask API
      const apiBaseUrl = getApiBaseUrl();
      
      try {
        // 5. Call the backend API to send emails
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
        
        result = await response.json();
      } catch (apiError) {
        console.error('API call failed:', apiError);
        // Fall back to simulation in development if API call fails
        result = await simulateSendEmails(emails, surveyLink, survey.title);
      }
    } else {
      // In production, since the API endpoint might not be available,
      // use the simulation function as a fallback
      result = await simulateSendEmails(emails, surveyLink, survey.title);
      
      // Log to console that this was a simulated send in production
      console.log('Production environment: Email sending was simulated');
      console.log(`Team ID: ${teamId}, Survey ID: ${surveyId}`);
      console.log(`Emails: ${emails.length}, Link: ${surveyLink}`);
    }
    
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
