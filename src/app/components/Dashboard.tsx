"use client";

import { Card, Title, Text } from "@tremor/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const responseData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Survey Responses",
      data: [65, 59, 80, 81, 56, 55],
      fill: false,
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1,
    },
  ],
};

const sentimentData = {
  labels: ["Positive", "Neutral", "Negative"],
  datasets: [
    {
      data: [300, 150, 100],
      backgroundColor: [
        "rgb(75, 192, 192)",
        "rgb(255, 205, 86)",
        "rgb(255, 99, 132)",
      ],
    },
  ],
};

const metrics = [
  {
    title: "Total Surveys",
    value: "24",
    description: "Active surveys in the last 30 days",
  },
  {
    title: "Response Rate",
    value: "85%",
    description: "Average response rate across all surveys",
  },
  {
    title: "AI Insights Generated",
    value: "156",
    description: "Actionable insights from AI analysis",
  },
  {
    title: "Team Engagement",
    value: "92%",
    description: "Team members actively participating",
  },
];

interface Insight {
  id: number;
  text: string;
  category: "positive" | "negative" | "neutral";
  timestamp: string;
}

export default function Dashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await fetch("/api/insights");
        const data = await response.json();
        setInsights(data.insights);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="space-y-2">
            <Title>{metric.title}</Title>
            <Text className="text-2xl font-bold">{metric.value}</Text>
            <Text className="text-sm text-gray-500">{metric.description}</Text>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Title>Survey Response Trends</Title>
          <div className="mt-4 h-72">
            <Line
              data={responseData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                },
              }}
            />
          </div>
        </Card>

        <Card>
          <Title>Sentiment Analysis</Title>
          <div className="mt-4 h-72">
            <Doughnut
              data={sentimentData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      <Card>
        <Title>Recent AI Insights</Title>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className={`rounded-lg border p-4 hover:bg-gray-50 ${
                  insight.category === "positive"
                    ? "border-green-200 bg-green-50"
                    : insight.category === "negative"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Text>{insight.text}</Text>
                <Text className="mt-2 text-sm text-gray-500">
                  {new Date(insight.timestamp).toLocaleString()}
                </Text>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
