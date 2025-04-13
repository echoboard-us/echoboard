import { OpenAI } from "openai";

// Mock data for insights
const mockInsightsResponse = {
  key_findings: [
    {
      title: "High Overall Satisfaction",
      description: "Most respondents reported positive experiences",
      supporting_stats: ["85% positive responses"],
    },
  ],
  sentiment_summary: {
    overall: "positive",
    by_question: [{ question_id: "q1", sentiment: "positive", score: 4.2 }],
  },
  patterns_and_trends: [
    {
      pattern: "Consistent Feedback",
      details: "Responses show consistent patterns across segments",
    },
  ],
  statistical_highlights: [
    { metric: "Average Rating", value: 4.2, context: "Out of 5 stars" },
  ],
  areas_for_attention: [
    { question_id: "q2", issue: "Some concerns noted", severity: "low" },
  ],
  recommendations: [
    {
      action: "Continue current practices",
      priority: "medium",
      rationale: "Maintaining high satisfaction",
    },
  ],
};

export const generateSurveyInsights = async (survey, responses) => {
  try {
    // Return mock data instead of making API call
    return {
      raw_analysis: JSON.stringify(mockInsightsResponse),
      structured_analysis: mockInsightsResponse,
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    throw error;
  }
};

export default {
  generateSurveyInsights,
};
