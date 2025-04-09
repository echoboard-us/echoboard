import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Add error handling for missing API key
if (!process.env.REACT_APP_OPENAI_API_KEY) {
  console.error('OpenAI API key is not configured. Please add your API key to the .env file.');
  throw new Error('OpenAI API key is missing');
}

// Export the initialized client
export { openai };

export const generateSurveyInsights = async (survey, responses) => {
  try {
    // Verify API key is available before making the request
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
    }

    // Format the survey data and responses for the prompt
    const surveyData = {
      title: survey.title,
      description: survey.description,
      questions: survey.questions.map(q => ({
        question: q.question,
        type: q.type,
        responses: responses.filter(r => 
          r.answers.some(a => a.question_id === q.id)
        ).map(r => 
          r.answers.find(a => a.question_id === q.id)?.answer
        )
      }))
    };

    // Create a detailed prompt for GPT
    const prompt = `Analyze this survey and its responses:

Survey Title: ${surveyData.title}
Description: ${surveyData.description}

Questions and Responses:
${surveyData.questions.map(q => `
Question: ${q.question}
Type: ${q.type}
Responses: ${q.responses.join(', ')}
`).join('\n')}

Please provide a comprehensive analysis including:
1. Key findings and patterns
2. Sentiment analysis
3. Notable trends
4. Actionable recommendations
5. Areas that need attention
6. Statistical insights where relevant

Format the response in a structured way with clear sections.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.7,
      max_tokens: 1500
    });

    // Parse and structure the response
    const analysis = completion.choices[0].message.content;
    
    return {
      raw_analysis: analysis,
      structured_analysis: {
        summary: analysis.split('\n\n')[0], // First paragraph as summary
        sections: parseAnalysisSections(analysis)
      }
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
};

const parseAnalysisSections = (analysis) => {
  const sections = [];
  let currentSection = null;

  analysis.split('\n').forEach(line => {
    if (line.match(/^[0-9]+\./)) {
      // New numbered section
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: line.replace(/^[0-9]+\.\s*/, '').split(':')[0],
        content: []
      };
    } else if (line.trim() && currentSection) {
      currentSection.content.push(line.trim());
    }
  });

  if (currentSection) sections.push(currentSection);
  return sections;
};

export default {
  generateSurveyInsights
}; 