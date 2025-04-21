import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSearch, FaCalendar, FaBriefcase, 
  FaRobot, FaGripVertical, FaTimes, FaDownload 
} from 'react-icons/fa';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie 
} from 'recharts';
import html2pdf from 'html2pdf.js';
import './Dashboard.css';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('Weekly');
  const [currentTeam, setCurrentTeam] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [lastUpdated] = useState(new Date().toLocaleString());
  const [teamOptions, setTeamOptions] = useState([]);
  const [aiSidePanelExpanded, setAiSidePanelExpanded] = useState(false);
  const [statCards, setStatCards] = useState([]);
  const [dashboardCards, setDashboardCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [surveyFilter, setSurveyFilter] = useState('all'); // 'all', 'template', 'custom'
  const [dynamicPromptSuggestions, setDynamicPromptSuggestions] = useState([]); // State for dynamic suggestions
  
  // Date range picker state
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 6))); // Default to 6 months ago
  const [endDate, setEndDate] = useState(new Date()); // Default to today
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- OpenAI API Call Implementation --- 
  const callOpenAI = async (prompt) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key not found. Make sure REACT_APP_OPENAI_API_KEY is set.");
      throw new Error("API key missing");
    }

    console.log("--- Calling OpenAI API ---");
    // Using fetch API similar to potential Insights implementation
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", { // Or your specific endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // Or gpt-4 or your preferred model
          messages: [
            // You might need a system message depending on the prompt structure
            // { role: "system", content: "You are a helpful analytics assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.5, // Adjust as needed
          max_tokens: 1000, // Adjust as needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(`OpenAI API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("--- OpenAI API Response Received ---");

      // Extract the JSON content - check the actual response structure
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        // Sometimes the model might wrap the JSON in ```json ... ```
        const jsonMatch = content.match(/```json\n?(\{.*\})\n?```/s);
        if (jsonMatch && jsonMatch[1]) {
          return jsonMatch[1];
        } else {
          // Assume it's raw JSON if no markdown fences
          return content;
        }
      } else {
        console.error('Unexpected OpenAI response structure:', data);
        throw new Error("Could not extract content from OpenAI response");
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error; // Re-throw to be caught by fetchDataAndGenerateDashboard
    }
  };

  const fetchDataAndGenerateDashboard = useCallback(async (teamId, userQuery = '', currentFilter = 'all') => {
    console.log(`fetchDataAndGenerateDashboard called with teamId: ${teamId}, query: ${userQuery}, filter: ${currentFilter}`);
    if (!teamId) return;
    console.log(`Fetching data for team: ${teamId}, Filter: ${currentFilter}`);
    setIsLoading(true);
    setStatCards([]); // Clear previous cards on new fetch
    setDashboardCards([]); // Clear previous cards on new fetch

    try {
      // 1. Fetch Survey Responses based on filter
      const { data: responseData, error: responsesError } = await supabase
        .rpc('get_survey_responses_for_team', {
          selected_team_id: teamId,
          filter_type: currentFilter // Pass the filter type here
        });

      if (responsesError) throw responsesError;
      console.log(`Fetched ${responseData?.length || 0} responses with filter: ${currentFilter}`);

      if (!responseData || responseData.length === 0) { // Check if responseData is null/empty
        console.log('No survey responses found for this team and filter.');
        // Optionally set state to show a "No data" message
        setStatCards([]);
        setDashboardCards([]);
        setIsLoading(false);
        return;
      }

      // --- Generate Dynamic Prompt Suggestions --- 
      try {
        const suggestionPrompt = `
Based on the following survey response data (filtered by: ${currentFilter}):
${JSON.stringify(responseData.slice(0, 10), null, 2)} ${responseData.length > 10 ? '\n... (data truncated for brevity)' : ''}
Generate exactly 3 concise and relevant question suggestions (as a JSON array of strings) that a user might ask about this data. Focus on potential trends, comparisons, or key metrics.
Example format: ["What is the overall satisfaction trend?", "Compare responses between Q1 and Q2", "Which area needs most improvement?"]
Return ONLY the JSON array.
`;
        const suggestionsResultString = await callOpenAI(suggestionPrompt);
        let suggestionsResult = [];
        try {
           suggestionsResult = JSON.parse(suggestionsResultString);
           if (Array.isArray(suggestionsResult)) {
             setDynamicPromptSuggestions(suggestionsResult.slice(0, 3)); // Ensure max 3 suggestions
             console.log('Dynamic suggestions generated:', suggestionsResult.slice(0, 3));
           } else {
             console.warn('OpenAI suggestion response was not an array:', suggestionsResultString);
             setDynamicPromptSuggestions([]); // Fallback to empty
           }
        } catch (suggestionParseError) {
            console.error("Failed to parse JSON suggestions from OpenAI:", suggestionParseError);
            console.error("Raw OpenAI Suggestion Response:", suggestionsResultString);
            setDynamicPromptSuggestions([]); // Fallback to empty on parse error
        }
      } catch (suggestionError) {
        console.error('Error generating prompt suggestions:', suggestionError);
        setDynamicPromptSuggestions([]); // Fallback to empty on API error
      }
      // --- End Dynamic Prompt Suggestions ---

      // 2. Construct Prompt for OpenAI
      const prompt = `
Given the following survey response data for team ID ${teamId} (filtered by: ${currentFilter}):
 
${JSON.stringify(responseData, null, 2)}
 
${userQuery ? `The user has specifically asked: '${userQuery}'. Please prioritize generating insights and visualizations directly related to this request.` : 'Generate a general overview dashboard based on the data.'}
 
Create a JSON object containing two arrays: 'stat_cards' and 'dashboard_cards'.
 
Instructions:
1. 'stat_cards': An array of objects, each representing a key statistic. Each object must have 'id' (string, snake_case), 'title' (string), and 'value' (number or string).
2. 'dashboard_cards': An array of objects, each representing a chart. Each object must have 'id' (string, snake_case, matching a stat card id), 'title' (string, matching a stat card title), 'type' (string, 'line', 'bar', or 'pie'), and 'data' (object structured for Recharts: { labels: string[], datasets: { label: string, data: number[] }[] }).
3. **CRITICAL CONSTRAINT:** The number of objects in the 'stat_cards' array MUST exactly equal the number of objects in the 'dashboard_cards' array. Each stat card must have a corresponding dashboard card with the same 'id' and 'title'.
4. If a specific user query is provided above, tailor the generated cards to answer that query as directly as possible, even if it results in fewer cards than a general overview might produce. Otherwise, provide a relevant general summary relevant to the filtered data (${currentFilter}).
5. Ensure the JSON is valid and only contains the specified structure.
 
Produce the JSON spec now.
`;

      // 3. Call OpenAI
      const openAIResultString = await callOpenAI(prompt);
      let openAIResult = {};
      try {
         openAIResult = JSON.parse(openAIResultString);
      } catch (parseError) {
          console.error("Failed to parse JSON from OpenAI:", parseError);
          console.error("Raw OpenAI Response String:", openAIResultString);
          // Handle error - maybe set state to show an error message
          setIsLoading(false);
          return; // Stop execution if parsing fails
      }

      console.log('OpenAI Result:', openAIResult);

      // 4. Update state
      setStatCards(openAIResult.stat_cards || []);
      const validDashboardCards = (openAIResult.dashboard_cards || []).filter(
        card => card.data && card.data.datasets && card.data.datasets.length > 0 && card.data.datasets[0].data
      );
      setDashboardCards(validDashboardCards);

    } catch (error) {
      console.error('Error processing dashboard generation:', error);
      // Handle error state, maybe show a message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("Dashboard: Initial useEffect running...");
    const fetchInitialData = async () => {
      console.log("Dashboard: fetchInitialData started.");
      try {
        console.log('Starting initial data fetch process...');
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Auth error or no user:', authError);
          throw authError;
        }
        console.log('User obtained:', user.id);

        const { data: teamMemberships, error: membershipError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id);

        if (membershipError) {
          console.error('Error fetching team memberships:', membershipError);
          throw membershipError;
        }

        const teamIds = teamMemberships ? teamMemberships.map(m => m.team_id) : [];
        console.log('Dashboard: User Team IDs:', teamIds);

        let teams = [];
        if (teamIds.length > 0) {
          const { data: teamDetails, error: teamDetailsError } = await supabase
            .from('teams')
            .select('id, name')
            .in('id', teamIds); 

          if (teamDetailsError) {
            console.error('Error fetching team details:', teamDetailsError);
            throw teamDetailsError;
          }
          teams = teamDetails || [];
        } else {
          console.log('Dashboard: User is not a member of any teams.');
        }

        console.log("Dashboard: Teams fetched:", teams);

        setTeamOptions(teams);
        console.log("Dashboard: Team options set.");

        if (teams.length > 0) {
          setCurrentTeam(prevTeam => {
            if (!prevTeam) { 
              const firstTeam = teams[0];
              console.log('Setting initial team:', firstTeam);
              return firstTeam;
            }
            console.log('Dashboard: Current team already exists, not setting initial team.');
            return prevTeam;
          });
        } else {
          console.log('User is not part of any teams.');
        }
      } catch (error) {
        console.error('Dashboard: Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currentTeam?.id) {
      console.log(`Team or Filter changed. Fetching data for team ${currentTeam.id} with filter ${surveyFilter}`);
      fetchDataAndGenerateDashboard(currentTeam.id, '', surveyFilter);
    } else {
      console.log("Team or Filter changed, but no current team selected.");
      setStatCards([]);
      setDashboardCards([]);
    }
  }, [currentTeam, surveyFilter, fetchDataAndGenerateDashboard]);

  const handleAiQuery = (e) => {
    e.preventDefault();
    if (currentTeam?.id) {
      fetchDataAndGenerateDashboard(currentTeam.id, aiQuery, surveyFilter);
    }
  };

  const toggleAiPanel = () => {
    setAiSidePanelExpanded(!aiSidePanelExpanded);
  };

  const handleExportToPDF = () => {
    try {
      if (!currentTeam) {
        alert("Please select a team first before exporting.");
        return;
      }

      const element = document.querySelector('.dashboard-container');
      if (!element) {
        console.error("Dashboard container not found");
        return;
      }

      const teamName = typeof currentTeam === 'string' 
        ? currentTeam 
        : (currentTeam.name || 'Dashboard');
      
      const filename = `${teamName.replace(/\s+/g, '_')}_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
      
      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      const aiPanel = document.querySelector('.ai-side-panel');
      let originalDisplay = 'block';
      
      if (aiPanel) {
        originalDisplay = aiPanel.style.display || 'block';
        aiPanel.style.display = 'none';
      }
      
      console.log("Generating PDF...");
      
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          if (aiPanel) {
            aiPanel.style.display = originalDisplay;
          }
          console.log("PDF generated successfully");
        })
        .catch(error => {
          console.error("Error generating PDF:", error);
          if (aiPanel) {
            aiPanel.style.display = originalDisplay;
          }
          alert("Failed to generate PDF. Please try again.");
        });
    } catch (error) {
      console.error("Error in PDF export:", error);
      alert("An error occurred while trying to export the PDF. Please try again.");
    }
  };

  const handleTeamChange = (event) => {
    const selectedTeamId = event.target.value;
    console.log("Dashboard: Team selected:", selectedTeamId);
    const selectedTeam = teamOptions.find(team => team.id === selectedTeamId);
    if (selectedTeam) {
      console.log("Dashboard: Setting current team:", selectedTeam);
      setCurrentTeam(selectedTeam);
    } else {
      console.error("Dashboard: Selected team not found in options", selectedTeamId);
    }
  };

  const handleDateRangeChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setShowDatePicker(false);
    

    console.log(`Date range changed: ${newStartDate.toLocaleDateString()} - ${newEndDate.toLocaleDateString()}`);
  };

  const setDateRange = (range) => {
    const end = new Date();
    let start = new Date();
    
    switch(range) {
      case 'last7days':
        start.setDate(end.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(end.getDate() - 30);
        break;
      case 'last3months':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'last6months':
        start.setMonth(end.getMonth() - 6);
        break;
      case 'lastyear':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        // Default to last 6 months
        start.setMonth(end.getMonth() - 6);
    }
    
    handleDateRangeChange(start, end);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-title-section">
        <h1>Dashboard</h1>
        <p>Your own customizable insights dashboard for monitoring performance metrics and analytics.</p>
      </div>

      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            {/* Team Selector */}
            <div className="team-switcher">
              <FaBriefcase />
              <select 
                value={currentTeam?.id || ''}
                onChange={handleTeamChange}
                className="team-select"
              >
                <option value="" disabled>Select a Team</option> {/* Add a default option */}
                {teamOptions && teamOptions.length > 0 ? (
                  teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))
                ) : (
                  <option value="" disabled>Loading teams...</option> /* Indicate loading */
                )}
              </select>
            </div>
          </div>

          <div className="header-filters">
            <div className="date-range-picker">
              <div className="date-display" onClick={() => setShowDatePicker(!showDatePicker)}>
                <FaCalendar />
                <span>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</span>
              </div>
              
              {showDatePicker && (
                <div className="date-picker-dropdown">
                  <div className="date-picker-header">
                    <h4>Select Date Range</h4>
                    <button onClick={() => setShowDatePicker(false)} className="close-btn">×</button>
                  </div>
                  
                  <div className="date-inputs">
                    <div className="date-input">
                      <label>Start Date:</label>
                      <input 
                        type="date" 
                        value={startDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) {
                            setStartDate(newDate);
                          }
                        }}
                        max={endDate.toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="date-input">
                      <label>End Date:</label>
                      <input 
                        type="date" 
                        value={endDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) {
                            setEndDate(newDate);
                          }
                        }}
                        min={startDate.toISOString().split('T')[0]}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className="preset-ranges">
                    <button onClick={() => setDateRange('last7days')}>Last 7 Days</button>
                    <button onClick={() => setDateRange('last30days')}>Last 30 Days</button>
                    <button onClick={() => setDateRange('last3months')}>Last 3 Months</button>
                    <button onClick={() => setDateRange('last6months')}>Last 6 Months</button>
                    <button onClick={() => setDateRange('lastyear')}>Last Year</button>
                  </div>
                  
                  <div className="date-picker-actions">
                    <button 
                      className="apply-btn"
                      onClick={() => handleDateRangeChange(startDate, endDate)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="segment-selector">
              <select 
                value={surveyFilter}
                onChange={(e) => setSurveyFilter(e.target.value)}
                className="filter-select" // Add a class for potential styling
              >
                <option value="all">All Surveys</option>
                <option value="template">Template Only</option>
                <option value="custom">Custom Only</option>
              </select>
            </div>
          </div>

          <div className="header-right">
            <button 
              className={`ai-toggle-button ${aiSidePanelExpanded ? 'active' : ''}`}
              onClick={toggleAiPanel}
              title="AI Assistant"
            >
              <FaRobot />
            </button>
          </div>
        </div>
      </div>

      <div className="stats-overview">
        {isLoading && statCards.length === 0 && <p className="loading-message">Loading stats...</p>}
        {!isLoading && statCards.length === 0 && <p className="no-data-message">No stats to display for the selected filter.</p>}
        {statCards.map((stat) => (
          <div key={stat.id} className="stat-card" draggable="true">
            <div className="stat-card-header">
              <FaGripVertical className="drag-handle" />
              <span className="stat-title">{stat.title}</span>
            </div>
            <div className="stat-card-body">
              {/* Use a generic icon or map based on title/id if needed */} 
              <FaCalendar className="stat-icon" /> 
              <div className="stat-value-section">
                <span className="stat-value">{stat.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-cards">
        {isLoading && dashboardCards.length === 0 && <p className="loading-message">Loading charts...</p>}
        {!isLoading && dashboardCards.length === 0 && <p className="no-data-message">No charts to display for the selected filter.</p>}
        {dashboardCards.map((card) => (
          <div key={card.id} className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">{card.title}</h2>
              <div className="card-actions">
                <div className="view-toggle">
                  <button 
                    className={`toggle-btn ${viewMode === 'Weekly' ? 'active' : ''}`}
                    onClick={() => setViewMode('Weekly')}
                  >
                    Weekly
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'Monthly' ? 'active' : ''}`}
                    onClick={() => setViewMode('Monthly')}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                {card.type === 'line' && (
                  <AreaChart data={card.data.datasets[0].data.map((value, i) => ({ name: card.data.labels[i], value })) } >
                    <defs>
                      <linearGradient id={`color-${card.id || 'default'}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill={`url(#color-${card.id || 'default'})`} 
                      name={card.data.datasets[0].label}
                    />
                  </AreaChart>
                )}
                {card.type === 'bar' && (
                  <BarChart data={card.data.datasets[0].data.map((value, i) => ({ name: card.data.labels[i], value }))} >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name={card.data.datasets[0].label} />
                  </BarChart>
                )}
                {card.type === 'pie' && (
                  <PieChart>
                    <Pie 
                      data={card.data.datasets[0].data.map((value, i) => ({ name: card.data.labels[i], value }))} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      fill="#8884d8" 
                      label
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
                {!['line', 'bar', 'pie'].includes(card.type) && (
                   <div>Unsupported chart type: {card.type}</div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className={`ai-side-panel ${aiSidePanelExpanded ? 'expanded' : ''}`}>
        <div className="panel-header">
          <h3>Echo AI Assistant</h3>
          <button className="close-ai-panel-btn" onClick={toggleAiPanel}>
            <FaTimes />
          </button>
        </div>
        
        <div className="ai-query-section">
          <form className="ai-query-form" onSubmit={handleAiQuery}>
            <input
              type="text"
              placeholder="Ask about your metrics..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
            <button type="submit" className="ai-button">
              <FaSearch />
            </button>
          </form>
        </div>

        <div className="prompt-suggestions">
          <h4>Suggestions:</h4>
          <div className="suggestion-buttons-container">
            {isLoading && dynamicPromptSuggestions.length === 0 && <p>Loading suggestions...</p>}
            {!isLoading && dynamicPromptSuggestions.length === 0 && <p>No suggestions available.</p>}
            {dynamicPromptSuggestions.map((prompt, index) => (
              <button
                key={index}
                className="prompt-suggestion"
                onClick={() => setAiQuery(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="footer-left">
          <span>Last updated: {lastUpdated}</span>
        </div>
        <div className="footer-right">
          <button className="footer-button" onClick={handleExportToPDF}>
            <FaDownload /> Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;