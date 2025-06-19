import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './LandingPage.css';
import { TbBrain, TbChartBar, TbTrendingUp, TbBolt, TbShare, TbUsers, TbMessageCircle, TbTarget} from 'react-icons/tb';
import { FaLinkedin, FaRegCheckCircle, FaRegStar, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', company: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [navbarOpacity, setNavbarOpacity] = useState(1);
  const { user, signOut } = useAuth();
  const [betaApproved, setBetaApproved] = useState(null);
  const navigate = useNavigate();

  // Scroll effect for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = 200; // Start transparency after 200px scroll
      const minOpacity = 0.7; // Minimum opacity (20% transparency)
      
      if (scrollPosition <= maxScroll) {
        const opacity = 1 - (scrollPosition / maxScroll) * (1 - minOpacity);
        setNavbarOpacity(opacity);
      } else {
        setNavbarOpacity(minOpacity);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchBetaApproved = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('beta_approved')
          .eq('id', user.id)
          .single();
        if (!error && profile) {
          setBetaApproved(profile.beta_approved);
        } else {
          setBetaApproved(false);
        }
      } else {
        setBetaApproved(null);
      }
    };
    fetchBetaApproved();
  }, [user]);

  // Early Access request function
  const onRequestEarlyAccess = async (fields) => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    
    try {
      // Check if email already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('beta_access_requests')
        .select('id, status')
        .eq('email', fields.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingRequest) {
        if (existingRequest.status === 'approved') {
          setFormError('You already have beta access! Please sign in to continue.');
        } else if (existingRequest.status === 'pending') {
          setFormError('You already have a pending request. We\'ll review it soon!');
        } else {
          setFormError('Your previous request was not approved. Please contact us for more information.');
        }
        return;
      }

      // Insert new beta access request
      const { error: insertError } = await supabase
        .from('beta_access_requests')
        .insert([{
          first_name: fields.firstName,
          last_name: fields.lastName,
          email: fields.email,
          company: fields.company,
          status: 'pending'
        }]);

      if (insertError) {
        throw insertError;
      }

      setFormSuccess(true);
      setForm({ firstName: '', lastName: '', email: '', company: '' });
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting beta access request:', error);
      setFormError(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // Simple validation
    if (!form.firstName || !form.lastName || !form.email || !form.company) {
      setFormError('All fields are required.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    await onRequestEarlyAccess(form);
  };

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: 'https://calendly.com/sashank-tadimeti/30min'
      });
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <nav className="landing-nav" style={{ backgroundColor: `rgba(255, 255, 255, ${navbarOpacity})` }}>
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
            {/* <Link to="/pricing" className="nav-link">Pricing</Link> */}
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/signin" className="cta-button">Sign In</Link>
            {!user || betaApproved === null ? (
              <button className="sign-in-button" onClick={() => setShowModal(true)}>Get Early Access</button>
            ) : betaApproved ? (
              <>
                <button className="nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button className="sign-in-button" onClick={signOut}>Sign Out</button>
              </>
            ) : (
              <>
                <span className="pending-msg" style={{color:'#f59e0b',marginRight:'1rem'}}>Pending Approval</span>
                <button className="sign-in-button" onClick={signOut}>Sign Out</button>
              </>
            )}
            {betaApproved === true && (
              <Link to="/admin/beta" className="nav-link">Admin</Link>
            )}
          </div>
        </nav>

        <div className="hero-section">
          <div className="hero-bg-orb"></div>
          <div className="hero-stars"></div>
          <div className="hero-text hero-centered">
            <span className="hero-badge"><FaRegStar style={{marginRight: 8}}/> Real Insights. Real Impact.</span>
            <h1>
              <span className="gradient-text-main">Turn Feedback Into</span>
              <br />
              <span className="gradient-text-action">Instant Action</span>
            </h1>
            <p className="hero-subtitle">
              Stop drowning in survey data. EchoBoard delivers AI-powered insights and clear next steps in seconds—without disrupting your workflow.
            </p>
            <div className="cta-buttons">
              <button className="cta-button primary" onClick={() => setShowModal(true)}>Get Early Access</button>
              <button className="cta-button secondary" onClick={openCalendly}>Book a Demo</button>
            </div>
          </div>
        </div>

        <div className="feature-highlights-card">
          <div className="feature-highlights-header-row">
            <h2 className="feature-highlights-title">AI-Powered Survey Analysis</h2>
            <span className="feature-highlights-badge">Live Insights</span>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <TbTrendingUp className="feature-icon feature-icon-blue" />
              <h3>5 Key Themes</h3>
              <div className="feature-benefit feature-benefit-muted">Auto-detected</div>
            </div>
            <div className="feature-card">
              <TbTarget className="feature-icon feature-icon-purple" />
              <h3>Sentiment Analysis</h3>
              <div className="feature-benefit feature-benefit-muted">Real-time tracking</div>
            </div>
            <div className="feature-card">
              <TbBolt className="feature-icon feature-icon-green" />
              <h3>3 Action Items</h3>
              <div className="feature-benefit feature-benefit-muted">Ready to implement</div>
            </div>
          </div>
        </div>

        <div className="value-proposition">
          <h2 className="value-prop-title">Three Core Features That Drive Change</h2>
          <div className="value-prop-subtitle">Transform survey chaos into clear action plans</div>
          <div className="value-points">
            <div className="value-point">
              <span className="value-icon value-icon-blue"><TbBrain /></span>
              <h3>Instant AI Analysis</h3>
              <p className="value-point-desc">Get themes, sentiment scores, and concrete next-step recommendations in seconds.</p>
            </div>
            <div className="value-point">
              <span className="value-icon value-icon-purple"><TbMessageCircle /></span>
              <h3>Natural Language Queries</h3>
              <p className="value-point-desc">Ask your data questions in plain English. No technical expertise required.</p>
            </div>
            <div className="value-point">
              <span className="value-icon value-icon-green"><TbShare /></span>
              <h3>Seamless Distribution</h3>
              <p className="value-point-desc">Auto-publish live reports into your existing intranet or BI tools.</p>
            </div>
          </div>
        </div>

        <div className="how-it-works">
          <h2 className="how-it-works-title">How It Works</h2>
          <div className="how-it-works-subtitle">Four simple steps to actionable insights</div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number-gradient">1</div>
              <h3>Create or Import</h3>
              <p className="step-desc">Set up your survey or import existing data</p>
            </div>
            <div className="step">
              <div className="step-number-gradient">2</div>
              <h3>Configure Teams</h3>
              <p className="step-desc">Organize by teams and projects</p>
            </div>
            <div className="step">
              <div className="step-number-gradient">3</div>
              <h3>Distribute Effortlessly</h3>
              <p className="step-desc">Send and collect responses seamlessly</p>
            </div>
            <div className="step">
              <div className="step-number-gradient">4</div>
              <h3>Explore Insights</h3>
              <p className="step-desc">AI-driven analysis and recommendations</p>
            </div>
          </div>
          <div className="steps-powered-pill">Instant AI-powered insights delivered directly into your team's workflows</div>
        </div>

        <div className="use-cases">
          <h2 className="use-cases-title">Perfect For Every Team</h2>
          <div className="use-cases-subtitle">From HR to product teams—transform any feedback process</div>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <span className="use-case-icon use-case-icon-blue"><TbUsers /></span>
              <h3>HR Pulse Surveys</h3>
              <p className="use-case-desc">Track employee satisfaction and engagement</p>
            </div>
            <div className="use-case-card">
              <span className="use-case-icon use-case-icon-green"><TbMessageCircle /></span>
              <h3>Customer Feedback</h3>
              <p className="use-case-desc">Understand customer needs and pain points</p>
            </div>
            <div className="use-case-card">
              <span className="use-case-icon use-case-icon-purple"><TbTarget /></span>
              <h3>Event Evaluations</h3>
              <p className="use-case-desc">Measure event success and improvement areas</p>
            </div>
            <div className="use-case-card">
              <span className="use-case-icon use-case-icon-orange"><TbBolt /></span>
              <h3>Product Beta Testing</h3>
              <p className="use-case-desc">Gather insights from beta users and testers</p>
            </div>
            <div className="use-case-card">
              <span className="use-case-icon use-case-icon-indigo"><TbChartBar /></span>
              <h3>Executive Reporting</h3>
              <p className="use-case-desc">Deliver strategic insights to leadership</p>
            </div>
            <div className="use-case-card">
              <span className="use-case-icon use-case-icon-pink"><TbTrendingUp /></span>
              <h3>Market Research</h3>
              <p className="use-case-desc">Analyze market trends and opportunities</p>
            </div>
          </div>
        </div>

        <div className="testimonial-section">
          <h2 className="testimonial-title">Pain Points We're Solving</h2>
          <div className="testimonial-subtitle">Real feedback from teams we interviewed</div>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <blockquote>"Existing feedback systems are lousy"</blockquote>
              <div className="testimonial-author-row">
                <span className="testimonial-avatar"><FaUser /></span>
                <span className="testimonial-job">Head of HR, Digital Engagement Agency</span>
              </div>
            </div>
            <div className="testimonial-card">
              <blockquote>"Plenty of survey data, the real challenge is figuring out what it means."</blockquote>
              <div className="testimonial-author-row">
                <span className="testimonial-avatar"><FaUser /></span>
                <span className="testimonial-job">Director of Market Research, Software Consulting Firm</span>
              </div>
            </div>
            <div className="testimonial-card">
              <blockquote>"If AI can suggest next actions, that would be incredibly valuable"</blockquote>
              <div className="testimonial-author-row">
                <span className="testimonial-avatar"><FaUser /></span>
                <span className="testimonial-job">VP of Operations, Management Consulting Firm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="final-cta">
          <h2 className="final-cta-title">Ready to Transform Your Survey Feedback?</h2>
          <div className="final-cta-subtitle">Join our beta program and start turning feedback into action—without disrupting your existing workflows.</div>
          <div className="final-cta-card">
            <div className="final-cta-buttons-row">
              <button className="cta-button primary" onClick={() => setShowModal(true)}>Get Early Access</button>
              <button className="cta-button secondary" onClick={openCalendly}>Book a Demo</button>
            </div>
            <div className="final-cta-features-row">
              <span className="final-cta-feature"><FaRegCheckCircle className="cta-check" />No disruption to existing tools</span>
              <span className="final-cta-feature"><FaRegCheckCircle className="cta-check" />Setup in minutes</span>
              <span className="final-cta-feature"><FaRegCheckCircle className="cta-check" />Instant insights</span>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="early-access-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="early-access-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
              <h2>Request Early Access</h2>
              <form className="early-access-form" onSubmit={handleFormSubmit}>
                <div className="form-row">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleFormChange}
                  disabled={formLoading}
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Company"
                  value={form.company}
                  onChange={handleFormChange}
                  disabled={formLoading}
                />
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">Request submitted! We'll be in touch soon.</div>}
                <button type="submit" className="cta-button primary" disabled={formLoading}>
                  {formLoading ? 'Submitting...' : 'Request Access'}
                </button>
              </form>
            </div>
          </div>
        )}

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
              {/* <Link to="/pricing" className="footer-link">Pricing</Link> */}
              <Link to="/contact" className="footer-link">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
