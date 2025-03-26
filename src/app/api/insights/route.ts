import { NextResponse } from 'next/server'

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const insights = [
    {
      id: 1,
      text: 'Employee satisfaction has increased by 15% in the last quarter',
      category: 'positive',
      timestamp: '2024-03-26T10:00:00Z',
    },
    {
      id: 2,
      text: 'Communication challenges identified in the engineering team',
      category: 'negative',
      timestamp: '2024-03-26T09:30:00Z',
    },
    {
      id: 3,
      text: 'Positive feedback on the new remote work policy',
      category: 'positive',
      timestamp: '2024-03-26T09:00:00Z',
    },
    {
      id: 4,
      text: 'Suggestions for improving team collaboration tools',
      category: 'neutral',
      timestamp: '2024-03-26T08:30:00Z',
    },
  ]

  return NextResponse.json({ insights })
} 