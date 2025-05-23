import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { TbDeviceAnalytics, TbBrain, TbChartBar, TbMail } from 'react-icons/tb';
import { FaLinkedin } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <nav className="landing-nav">
          <div className="logo-container">
            <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <div className="logo-icon-container">
                <img 
                  src="/echoboard logo transparent.png" 
                  alt="EchoBoard Logo" 
                  className="landing-logo"
                />
              </div>
              <span className="logo-text">EchoBoard</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/signin" className="sign-in-button">Sign In</Link>
          </div>
        </nav>

        <div className="hero-section">
          <div className="hero-bg-orb"></div>
          <div className="hero-stars"></div>
          <div className="hero-text hero-centered">
            <span className="hero-badge">Real Insights. Real Impact.</span>
            <h1>Transform your team's feedback<br/> into actionable insights.</h1>
            <p className="hero-subtitle">
              EchoBoard helps you collect, analyze, and act on survey data to drive meaningful organizational change.
            </p>
            <div className="cta-buttons">
              <Link to="/signup" className="cta-button primary">Start Your Free Trial</Link>
            </div>
          </div>
        </div>

        <div className="value-proposition">
          <h2>Unlock actionable insights—without disrupting your existing workflows.</h2>
          <div className="value-points">
            <div className="value-point">
              <TbBrain className="value-icon" />
              <h3>Instant AI Analysis</h3>
              <p>In seconds, surface top themes, sentiment scores, and concrete next-step recommendations.</p>
            </div>
            <div className="value-point">
              <TbChartBar className="value-icon" />
              <h3>Custom Dashboards & Natural-Language Queries</h3>
              <p>Build drag-and-drop dashboards and ask your data questions in plain English.</p>
            </div>
            <div className="value-point">
              <TbMail className="value-icon" />
              <h3>Seamless Email & Embed Distribution</h3>
              <p>Send survey links and auto-publish live reports into your intranet or BI tools.</p>
            </div>
          </div>
        </div>

        <div className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create or Import Your Survey</h3>
              <p>Start from scratch or choose one of our proven templates.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Configure Teams & Projects</h3>
              <p>Set up your workspaces, assign projects, and invite collaborators in seconds.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Distribute Survey Effortlessly</h3>
              <p>Launch via email or embed a live link in your existing tools.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Explore AI-Driven Insights</h3>
              <p>Interact with dynamic dashboards and export your findings.</p>
            </div>
          </div>
          <p className="steps-footer">Powered by a retrieval-augmented pipeline and OpenAI LLMs.</p>
        </div>

        <div className="use-cases">
          <h2>Use Cases</h2>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <div className="use-case-icon">
                <TbDeviceAnalytics />
              </div>
              <h3>HR Pulse Surveys</h3>
              <p>Real-time employee sentiment & engagement drivers.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">
                <TbChartBar />
              </div>
              <h3>Customer Feedback</h3>
              <p>Instant NPS trends, verbatim themes, and follow-up actions.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">
                <TbBrain />
              </div>
              <h3>Event Evaluations</h3>
              <p>Post-event takeaways and prioritized improvement steps.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">
                <TbMail />
              </div>
              <h3>Product Beta Testing</h3>
              <p>Rapid synthesis of A/B feedback into clear, actionable recommendations.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">
                <TbDeviceAnalytics />
              </div>
              <h3>Executive Reporting</h3>
              <p>Slide-ready insights with one click.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">
                <TbChartBar />
              </div>
              <h3>Market Research</h3>
              <p>Deep-dive thematic analysis at scale.</p>
            </div>
          </div>
        </div>

        <div className="testimonial-section">
          <div className="testimonial-title">What We Heard</div>
          <div className="testimonial-content">
            <div className="testimonial-quote q1">
              <span className="quote-icon">"</span>
              <blockquote>
                "Existing feedback systems are lousy"
              </blockquote>
            </div>
            <div className="testimonial-quote q2">
              <span className="quote-icon">"</span>
              <blockquote>
                "No early warning systems"
              </blockquote>
            </div>
            <div className="testimonial-quote q3">
              <span className="quote-icon">"</span>
              <blockquote>
                "Plenty of survey data, the real challenge is figuring out what it means."
              </blockquote>
            </div>
            <div className="testimonial-quote q4">
              <span className="quote-icon">"</span>
              <blockquote>
                "We need to see how sentiment changes over time"
              </blockquote>
            </div>
            <div className="testimonial-quote q5">
              <span className="quote-icon">"</span>
              <blockquote>
                "If AI can suggest next actions, that would be incredibly valuable"
              </blockquote>
            </div>
          </div>
        </div>

        <div className="final-cta">
          <div className="cta-content">
            <h2>Ready to Transform Your Survey Feedback?</h2>
            <Link to="/signup" className="cta-button primary">Start Your Free Trial</Link>
            <p className="cta-note">No credit card required • 14-day free trial</p>
          </div>
        </div>

        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <img 
                src="/echoboard logo transparent.png" 
                alt="EchoBoard Logo" 
                className="footer-logo-img"
              />
              <span className="footer-tagline">EchoBoard: AI-Driven Survey Insights</span>
            </div>
            <div className="footer-links">
              <a href="https://www.linkedin.com/company/echoboard-us" target="_blank" rel="noopener noreferrer" className="footer-link linkedin-link">
                <FaLinkedin style={{ verticalAlign: 'middle', fontSize: '1.3em', marginRight: '0.5em' }} />
              </a>
              <Link to="/pricing" className="footer-link">Pricing</Link>
              <Link to="/contact" className="footer-link">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
