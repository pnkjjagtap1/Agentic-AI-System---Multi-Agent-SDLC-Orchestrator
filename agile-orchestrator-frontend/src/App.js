import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [requirement, setRequirement] = useState('');
  const [orchestration, setOrchestration] = useState(null);
  const [loading, setLoading] = useState(false);

  const agents = [
    {
      id: 'architect',
      role: 'Software Architect',
      icon: '🏗️',
      systemPrompt: `You are a Software Architect. Analyze requirements and design a system architecture. 
Be concise. Provide: system design, technology stack, scalability approach. 
Keep response under 400 words. Focus on clarity over detail.`
    },
    {
      id: 'engineer',
      role: 'Software Engineer',
      icon: '💻',
      systemPrompt: `You are a Senior Software Engineer. Break down development effort.
Provide: estimated LOC, development timeline, tech choices, dependencies.
Keep response under 400 words. Be realistic about timelines.`
    },
    {
      id: 'qa',
      role: 'QA Engineer',
      icon: '🧪',
      systemPrompt: `You are a QA Engineer. Plan testing strategy based on architecture and development plan.
Provide: test cases count, testing timeline, quality metrics, risk areas.
Keep response under 350 words. Focus on coverage and critical paths.`
    },
    {
      id: 'devops',
      role: 'DevOps Engineer',
      icon: '🔧',
      systemPrompt: `You are a DevOps Engineer. Plan infrastructure and deployment.
Provide: infrastructure needs, deployment timeline, monitoring approach, cost estimates.
Keep response under 350 words. Include cloud/hosting considerations.`
    },
    {
      id: 'docs',
      role: 'Technical Writer',
      icon: '📚',
      systemPrompt: `You are a Technical Writer. Estimate documentation needs.
Provide: documentation scope, timeline, user manuals, API docs, training materials.
Keep response under 300 words. Be specific about deliverables.`
    }
  ];

  const callClaudeAPI = async (systemPrompt, userMessage) => {
    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          user_message: userMessage
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return data.response || 'No response received';
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const generatePMQuestion = async (agentRole, agentOutput) => {
    try {
      const response = await callClaudeAPI(
        'You are a Product Manager. Ask ONE clarifying question.',
        `${agentRole} response:\n${agentOutput}\n\nAsk ONE specific question to improve this.`
      );
      return response || 'Please provide more detail.';
    } catch (error) {
      return 'Please clarify your approach.';
    }
  };

  const generatePMScore = async (agentRole, agentOutput) => {
    try {
      const response = await callClaudeAPI(
        'You are a PM evaluating responses. Score 1-5.',
        `Rate ${agentRole}'s response:\n${agentOutput}\n\nRespond: "Score: X" then reason.`
      );

      const lines = response.split('\n');
      const scoreMatch = lines[0] ? lines[0].match(/\d/) : null;
      const score = scoreMatch ? parseInt(scoreMatch[0]) : 3;
      const reason = lines.slice(1).join(' ').trim() || 'Score assigned';

      return { score, reason };
    } catch (error) {
      return { score: 3, reason: 'Unable to score' };
    }
  };

  const generatePMEstimation = async (allOutputs) => {
    try {
      const summaryData = allOutputs.map(o => `${o.role}: ${o.finalOutput}`).join('\n---\n');

      const response = await callClaudeAPI(
        'You are a Senior Project Manager creating estimations.',
        `Based on this team analysis:\n${summaryData}\n\nCreate a professional project estimation with: Overview, Scope, Team Needed, Effort Hours, Timeline, Cost, Risks, Assumptions, Quality Metrics.`
      );

      return response || 'Unable to generate estimation';
    } catch (error) {
      return 'Estimation generation failed';
    }
  };

  const orchestrateAgile = async (req) => {
    if (!req.trim()) return;

    setLoading(true);
    setOrchestration({
      phases: [],
      started: true,
      userIntervention: null
    });

    const allOutputs = [];

    for (let agentIndex = 0; agentIndex < agents.length; agentIndex++) {
      const agent = agents[agentIndex];
      let previousOutput = '';
      let satisfied = false;

      try {
        for (let round = 1; round <= 2 && !satisfied; round++) {
          let agentOutput;

          if (round === 1) {
            const userMsg = allOutputs.length === 0 
              ? `Requirement: ${req}`
              : `Requirement: ${req}\n\nPrevious team input:\n${allOutputs.map(o => `${o.role}: ${o.finalOutput}`).join('\n\n')}`;

            agentOutput = await callClaudeAPI(agent.systemPrompt, userMsg);
          } else {
            const pmQuestion = await generatePMQuestion(agent.role, previousOutput);
            agentOutput = await callClaudeAPI(agent.systemPrompt, `Please revise addressing this: ${pmQuestion}`);
          }

          previousOutput = agentOutput || 'No response';

          const pmEval = await generatePMScore(agent.role, previousOutput);

          setOrchestration(prev => ({
            ...prev,
            phases: [...(prev?.phases || []), {
              role: agent.role,
              icon: agent.icon,
              output: previousOutput,
              score: pmEval.score,
              feedback: pmEval.reason,
              completed: true
            }]
          }));

          if (pmEval.score >= 4) {
            satisfied = true;
          } else if (round === 2) {
            setOrchestration(prev => ({
              ...prev,
              userIntervention: {
                agentRole: agent.role,
                agentIndex,
                currentOutput: previousOutput,
                score: pmEval.score,
                allOutputs
              }
            }));
            setLoading(false);
            return;
          }
        }

        allOutputs.push({
          role: agent.role,
          finalOutput: previousOutput
        });

      } catch (error) {
        console.error(`Error with ${agent.role}:`, error);
        setLoading(false);
        return;
      }
    }

    setOrchestration(prev => ({
      ...prev,
      generatingEstimation: true
    }));

    const estimation = await generatePMEstimation(allOutputs);

    setOrchestration(prev => ({
      ...prev,
      phases: [...(prev?.phases || []), {
        role: 'Project Manager (Final Estimation)',
        icon: '📊',
        output: estimation,
        isFinal: true,
        score: 5,
        completed: true
      }],
      generatingEstimation: false
    }));

    setLoading(false);
  };

  const handleUserIntervention = (action) => {
    if (action === 'accept') {
      const intervention = orchestration.userIntervention;
      intervention.allOutputs.push({
        role: agents[intervention.agentIndex].role,
        finalOutput: intervention.currentOutput
      });
      setOrchestration(prev => ({ ...prev, userIntervention: null }));
    } else if (action === 'terminate') {
      setOrchestration(null);
      setRequirement('');
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Agile SDLC Orchestrator</h1>
        <p>Collaborative project estimation with PM feedback loops</p>
      </div>

      {!orchestration && (
        <div className="input-section">
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Describe your software project requirement..."
            className="input-area"
          />
          <button
            onClick={() => orchestrateAgile(requirement)}
            disabled={!requirement.trim() || loading}
            className="start-btn"
          >
            {loading ? 'Analyzing...' : 'Start Agile Analysis'}
          </button>
        </div>
      )}

      {orchestration && orchestration.userIntervention && (
        <div className="intervention-panel">
          <h3>Agent Performance Issue</h3>
          <p>{orchestration.userIntervention.agentRole} needs improvement (Score: {orchestration.userIntervention.score}/5)</p>
          <div className="intervention-buttons">
            <button onClick={() => handleUserIntervention('accept')} className="btn-accept">
              Accept and Continue
            </button>
            <button onClick={() => handleUserIntervention('terminate')} className="btn-terminate">
              Terminate
            </button>
          </div>
        </div>
      )}

      {orchestration && !orchestration.userIntervention && orchestration.phases && (
        <div className="phases-container">
          <div className="phases-header">
            <h2>Analysis Results</h2>
            <span className="phase-count">{orchestration.phases.length} outputs</span>
          </div>

          {orchestration.phases.map((phase, idx) => (
            <div key={idx} className={`phase-card ${phase.isFinal ? 'final' : ''}`}>
              <div className="phase-header">
                <span className="icon">{phase.icon}</span>
                <div className="phase-info">
                  <h3>{phase.role}</h3>
                  {!phase.isFinal && <span className="meta">Score: {phase.score}/5</span>}
                </div>
                {phase.completed && <span className="completed-badge">✓</span>}
              </div>
              <div className="phase-output">{phase.output}</div>
              {!phase.isFinal && phase.feedback && (
                <div className="pm-feedback">PM: {phase.feedback}</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="loading-next">
              <div className="spinner-small"></div>
              <p>Generating final estimation...</p>
            </div>
          )}
        </div>
      )}

      {orchestration && !orchestration.userIntervention && orchestration.phases && !loading && (
        <button
          onClick={() => {
            setOrchestration(null);
            setRequirement('');
          }}
          className="reset-btn"
        >
          Start New Analysis
        </button>
      )}
    </div>
  );
};

export default App;