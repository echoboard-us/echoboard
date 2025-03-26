# EchoBoard - AI-Powered Survey Analytics Platform

EchoBoard is a modern survey analytics platform that leverages AI to provide real-time insights from survey data. Built with Next.js, TypeScript, and TailwindCSS, it offers a powerful and intuitive interface for analyzing survey responses and team feedback.

## Features

- 📊 Real-time analytics dashboard
- 🤖 AI-powered insights generation
- 📈 Interactive charts and visualizations
- 🎯 Team performance tracking
- 🔄 Sentiment analysis
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Charts**: Chart.js
- **UI Components**: Tremor
- **Database**: Supabase (planned)
- **AI Integration**: OpenAI API (planned)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/echoboard.git
   cd echoboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   └── types/        # TypeScript types
├── public/           # Static assets
└── styles/          # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Tremor for beautiful UI components
- Chart.js for powerful charting capabilities
