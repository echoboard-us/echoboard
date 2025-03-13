import React, { createContext, useContext, useState } from 'react';

const SurveyContext = createContext();

export const SurveyProvider = ({ children }) => {
  const [surveys, setSurveys] = useState([
    {
      id: 1,
      title: "Q2 Employee Satisfaction",
      description: "Quarterly survey to measure employee satisfaction, engagement, and gather feedback on company culture and work environment.",
      respondents: 124,
      status: "Active",
      date: "2 days ago",
      questions: []
    },
    {
      id: 2,
      title: "Project Feedback – Mobile App",
      description: "Gathering feedback on the recent mobile app development project, focusing on team collaboration, resource allocation, and timeline management.",
      respondents: 32,
      status: "Completed",
      date: "1 week ago",
      questions: []
    },
    {
      id: 3,
      title: "Management Effectiveness",
      description: "Assessment of management effectiveness across departments, focusing on leadership qualities, communication, and decision-making processes.",
      respondents: 78,
      status: "Completed",
      date: "2 weeks ago",
      questions: []
    },
    {
      id: 4,
      title: "New Hire Onboarding Experience",
      description: "Survey for recent hires to evaluate the effectiveness of our onboarding process, training materials, and initial support systems.",
      respondents: 15,
      status: "Active",
      date: "3 weeks ago",
      questions: []
    },
    {
      id: 5,
      title: "Remote Work Assessment",
      description: "Evaluation of remote work policies, tools, and practices to identify areas for improvement and ensure team productivity.",
      respondents: 0,
      status: "Draft",
      date: "1 day ago",
      questions: []
    },
    {
      id: 6,
      title: "Customer Support Satisfaction",
      description: "Measuring customer satisfaction with our support team, response times, and issue resolution effectiveness.",
      respondents: 210,
      status: "Completed",
      date: "1 month ago",
      questions: []
    }
  ]);

  const addSurvey = (newSurvey) => {
    const surveyWithId = {
      ...newSurvey,
      id: Date.now(),
      respondents: 0,
      status: "Draft",
      date: "Just now"
    };
    setSurveys([surveyWithId, ...surveys]);
    return surveyWithId;
  };

  const updateSurvey = (id, updatedSurvey) => {
    setSurveys(surveys.map(survey => 
      survey.id === id ? { ...survey, ...updatedSurvey } : survey
    ));
  };

  const deleteSurvey = (id) => {
    setSurveys(surveys.filter(survey => survey.id !== id));
  };

  return (
    <SurveyContext.Provider value={{ surveys, addSurvey, updateSurvey, deleteSurvey }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurveys = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurveys must be used within a SurveyProvider');
  }
  return context;
}; 