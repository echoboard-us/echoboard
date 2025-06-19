import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PricingPage.css';
import { FaCheck, FaLinkedin } from 'react-icons/fa';

// Individual plans
const individualPlans = [
  {
    name: 'Free',
    price: '$0',
    subtitle: 'per month',
    features: [
      '1 survey / month',
      '200 responses / month',
      'Basic themes & sentiment',
      '1 custom dashboard',
      'Email distribution & embed code',
      'Exportable CSV reports'
    ],
    cta: 'Join Waitlist',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$20',
    subtitle: 'per month',
    features: [
      '10 surveys / month',
      '1,000 responses / month',
      'Unlimited themes & sentiment',
      '1 dynamic dashboard + NL-query',
      'Action item recommendations',
      'Exportable CSV & slide decks',
      'Priority email support'
    ],
    cta: 'Coming Soon',
    highlight: true,
  },
  {
    name: 'Pro+',
    price: '$100',
    subtitle: 'per month',
    features: [
      'Unlimited surveys & responses',
      'Unlimited dashboards + NL-query',
      'Advanced action recommendations',
      'Custom branding',
      'Exportable CSV & slide decks',
      'Dedicated email support'
    ],
    cta: 'Coming Soon',
    highlight: false,
  },
];

// Team & Enterprise plans
const teamPlans = [
  {
    name: 'Team',
    price: '$25',
    subtitle: 'per month / user',
    features: [
      'Unlimited surveys & responses',
      'Up to 5 dynamic dashboards',
      'Team & project management',
      'Shared insights & saved queries',
      'Embed live reports',
      'Priority support'
    ],
    cta: 'Coming Soon',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    subtitle: 'Contact Sales',
    features: [
      'Unlimited everything',
      'SLA-backed uptime & response times',
      'Dedicated onboarding & training',
      'Custom integrations (SSO, BI connectors, webhooks)',
      'Advanced usage analytics & audit logs'
    ],
    cta: 'Coming Soon',
    highlight: false,
  },
];

const PricingPage = () => {
  const [planType, setPlanType] = useState('individual');
  const plans = planType === 'individual' ? individualPlans : teamPlans;

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Navbar */}
        <nav className="landing-nav">
          <div className="logo-container">
            <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <div className="logo-icon-container">
                <img 
                  src="/icon-transparent.png" 
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
            <Link to="/signin" className="sign-in-button">Log in</Link>
          </div>
        </nav>

        {/* Pricing Content */}
        <div className="pricing-container">
          <div className="pricing-header">
            <h1 className="pricing-title">Pricing</h1>
            <p className="pricing-subtitle">All-in-one survey insights suite. Powered by AI.</p>
            <p className="pricing-desc">Collect, analyze, and act on feedback with EchoBoard. Choose the plan that fits your team.</p>
            <div className="billing-toggle">
              <span className={planType === 'individual' ? 'active' : ''} onClick={() => setPlanType('individual')}>Individual</span>
              <div className="toggle-switch" onClick={() => setPlanType(planType === 'individual' ? 'team' : 'individual')}>
                <div className={planType === 'team' ? 'switch yearly' : 'switch'}></div>
              </div>
              <span className={planType === 'team' ? 'active' : ''} onClick={() => setPlanType('team')}>Team & Enterprise</span>
            </div>
          </div>
          <div className="pricing-cards">
            {plans.map((plan, idx) => (
              <div className={`pricing-card${plan.highlight ? ' highlight' : ''}`} key={plan.name}>
                <div className="plan-header">
                  <h2>{plan.name}</h2>
                  <div className="plan-price">{plan.price}<span className="plan-period">{plan.subtitle}</span></div>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}><FaCheck className="check-icon" /> {feature}</li>
                  ))}
                </ul>
                {plan.name === 'Free' ? (
                  <div className="free-plan-cta-wrapper">
                    <button className="plan-cta crossed-out" disabled>{plan.cta}</button>
                    <div className="free-trial-badge">Enjoy Free Trial 🎉</div>
                  </div>
                ) : (
                  <button className="plan-cta">{plan.cta}</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <img 
                src="/icon-transparent.png" 
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

export default PricingPage; 