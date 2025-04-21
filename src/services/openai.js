import { OpenAI } from 'openai';

function ensureApiKey() {
  if (!process.env.REACT_APP_OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured. Please add your API key to the .env file.');
    throw new Error('OpenAI API key is missing');
  }
}

ensureApiKey();

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export { openai };

export const generateSurveyInsights = async (survey, responses) => {
  try {
    const payload = {
      survey: {
        id: survey.id || `SURV_${Date.now()}`,
        title: survey.title,
        created_at: survey.created_at || new Date().toISOString(),
        segments: survey.segments || {}
      },
      questions: survey.questions.map(q => ({
        id: q.id,
        text: q.question,
        type: q.type,
        scale: q.type === 'rating' ? [1, 5] : undefined
      })),
      responses: responses.map(r => ({
        respondent_id: r.id || `user_${r.user_id || Math.random().toString(36).substring(2, 10)}`,
        timestamp: r.created_at || new Date().toISOString(),
        answers: r.answers.reduce((acc, answer) => {
          acc[answer.question_id] = answer.answer;
          return acc;
        }, {})
      }))
    };

    const prompt = `You are an expert insights analyst. 
Given the following survey metadata, questions, and all responses, produce a structured JSON object containing:

1. key_findings: 
   • A list of the 3–5 most important, high‑level takeaways.  
2. sentiment_summary: 
   • Overall sentiment (positive/neutral/negative) and breakdown by question or theme.  
3. patterns_and_trends: 
   • Any recurring themes, correlations, or shifts in responses over time or cohorts.  
4. statistical_highlights: 
   • Any notable statistics (e.g. means, medians, % distributions, outliers) that substantiate findings.  
5. areas_for_attention: 
   • Questions or segments where responses indicate issues, concerns, or dissatisfaction.  
6. recommendations: 
   • 3–5 specific, prioritized, actionable steps leadership can take.
7. post_mortem:
   • Analyze the survey responses to identify what went wrong in the project, challenges faced, and lessons learned.
   • Look for responses that indicate project issues, setbacks, difficulties, or areas of improvement.
   • Focus on identifying root causes of issues and potential preventive measures for future projects.
   • IMPORTANT: Always provide at least one issue, challenge, and lesson learned based on the survey responses.
   • If responses don't explicitly mention problems, infer potential issues from negative feedback or low ratings.

Return as JSON only, using the schema described below. Do NOT include any extra text or markdown.

---PAYLOAD---
${JSON.stringify(payload, null, 2)}
---END PAYLOAD---

Schema:
{
  "key_findings": [
    { "title": "string", "description": "string", "supporting_stats": ["string"] }
  ],
  "sentiment_summary": {
    "overall": "positive|neutral|negative",
    "by_question": [
      { "question_id": "string", "sentiment": "positive|neutral|negative", "score": number }
    ]
  },
  "patterns_and_trends": [
    { "pattern": "string", "details": "string" }
  ],
  "statistical_highlights": [
    { "metric": "string", "value": number, "context": "string" }
  ],
  "areas_for_attention": [
    { "question_id": "string", "issue": "string", "severity": "low|medium|high" }
  ],
  "recommendations": [
    { "action": "string", "priority": "low|medium|high", "rationale": "string" }
  ],
  "post_mortem": {
    "issues": [
      { "title": "string", "description": "string", "root_cause": "string", "impact": "string" }
    ],
    "challenges": [
      { "area": "string", "description": "string", "resolution_attempts": "string" }
    ],
    "lessons_learned": [
      { "lesson": "string", "preventive_measure": "string" }
    ]
  }
}`;

    const stream = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4.1-nano",
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      stream: true
    });
    let analysisText = "";
    for await (const chunk of stream) {
      try {
        const delta = chunk.choices[0].delta?.content;
        if (delta) analysisText += delta;
      } catch (err) {
        console.error('Error processing chunk:', err);
        continue;
      }
    }
    let analysisJson;
    try {
      analysisJson = JSON.parse(analysisText);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse AI response as JSON');
    }
    return {
      raw_analysis: analysisText,
      structured_analysis: analysisJson
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
};

export const generateTeamInsights = async (team, actions, memberCount, surveyCount) => {
  try {
    // Build payload
    const payload = {
      team: {
        id: team.id,
        name: team.name,
        description: team.description
      },
      metrics: {
        member_count: memberCount,
        survey_count: surveyCount
      },
      recent_actions: actions.map(a => ({ action: a.action, reason: a.reason, timestamp: a.created_at }))
    };
    const prompt = `You are an expert team analytics specialist.
Given the following team metadata, metrics, and recent member actions with reasons, produce a structured JSON object focusing solely on team/project related insights. Do NOT include unrelated information.
1. key_findings: 3–5 concise insights about team health, engagement, and dynamics.
2. member_metrics: summary statistics (e.g., total members, new members, removals).
3. survey_metrics: number of surveys assigned to this team and insights on survey engagement.
4. action_reason_summary: categorize and summarize reasons for invites, joins, and removals.
5. recommendations: 3 specific, prioritized actions to improve team collaboration and retention.
6. post_mortem: analyze these actions to identify performance issues, challenges faced, and lessons learned for the project/team.
Return JSON only using the schema below, no extra text.
---PAYLOAD---
${JSON.stringify(payload, null, 2)}
---END PAYLOAD---
Schema:
{
  "key_findings":[{"title":"string","description":"string"}],
  "member_metrics":{"string":"number|string"},
  "survey_metrics":{"string":"number|string"},
  "action_reason_summary":[{"reason":"string","summary":"string|object"}],
  "recommendations":[{"action":"string","priority":"string","rationale":"string"}],
  "post_mortem":{
    "issues":[{"title":"string","description":"string","root_cause":"string","impact":"string"}],
    "challenges":[{"area":"string","description":"string","resolution_attempts":"string"}],
    "lessons_learned":[{"lesson":"string","preventive_measure":"string"}]
  }
}`;
    const stream = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4.1-nano',
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      stream: true
    });
    let analysisText = "";
    for await (const chunk of stream) {
      try {
        const delta = chunk.choices[0].delta?.content;
        if (delta) analysisText += delta;
      } catch (err) {
        console.error('Error processing chunk:', err);
        continue;
      }
    }
    let analysisJson;
    try {
      analysisJson = JSON.parse(analysisText);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse AI response as JSON');
    }
    return { raw_analysis: analysisText, structured_analysis: analysisJson };
  } catch (error) {
    console.error('Error generating team insights:', error);
    throw error;
  }
};

export default {
  generateSurveyInsights,
  generateTeamInsights
};