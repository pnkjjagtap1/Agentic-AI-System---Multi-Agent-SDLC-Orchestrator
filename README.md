# Agentic AI System - Multi-Agent SDLC Orchestrator

Production-ready multi-agent AI system for automated software development lifecycle estimation using Claude AI. Demonstrates sequential agent orchestration, PM feedback loops, and real-world project analysis.



## Overview

This agentic AI system orchestrates multiple specialized AI agents sequentially to analyze software project requirements and generate comprehensive project estimations. Each agent (Architect, Engineer, QA, DevOps, Technical Writer) reviews previous agent outputs, receives PM feedback when needed, and produces specialized analysis.

The system demonstrates core concepts in agentic AI: agent autonomy, specialized role-based processing, context awareness, iterative refinement through feedback loops, and sequential orchestration patterns.

## Key Features

- 5 Specialized AI Agents: Architect, Engineer, QA, DevOps, Technical Writer working sequentially
- PM Feedback Loop: Product Manager reviews outputs and requests revisions
- Revision Capability: Agents can revise responses based on PM questions (max 2 rounds)
- Real-Time Display: Watch agent outputs appear as they complete
- First Draft > Question > Revision Workflow: Shows iterative refinement process
- Professional Estimation: Generates client-ready project estimations
- Production-Ready: FastAPI backend, React frontend, error handling, CORS support
- Async/Await Pattern: Proper handling of sequential API calls

## What is an Agentic AI System?

An agentic AI system uses multiple AI agents working together autonomously toward a goal. In this implementation:

Sequential Processing: Agents work in order, each reading and building on previous outputs. No parallel execution - strict waterfall methodology enforced.

Context Passing: The output from Agent N becomes input for Agent N+1. This is done through string injection into system prompts, not through direct function calls.

Agent Autonomy: Each agent makes independent decisions within their domain expertise (defined by system prompt). They don't communicate directly - only through the PM.

PM Oversight: A Product Manager (Claude) evaluates each agent's work, scores it 1-5, and asks clarifying questions if needed. This adds a real feedback loop.

Specialized Roles: Each agent has distinct expertise encoded in their system prompt. They focus only on their domain (architecture, engineering, testing, etc).

Iterative Refinement: If an agent scores below 4, they get one chance to revise based on PM feedback. This mimics real code review processes.

## System Architecture

The system has three main layers:

Frontend Layer: React Single Page Application running on localhost:3001. Manages orchestration state, displays agent outputs in real-time, handles user input, and manages the revision workflow. Built with React Hooks and pure CSS.

Backend Layer: FastAPI server running on localhost:8000. Acts as a simple proxy to Claude API. Receives requests with system_prompt and user_message, calls Claude, and returns responses. Includes CORS middleware for local development.

AI Layer: Claude Opus 4 from Anthropic. Processes all agent logic. Each agent has a distinct system prompt that defines their role. The backend routes requests to Claude and returns structured responses.

Data flows like this: User enters requirement -> Frontend orchestrates calls -> Frontend sends POST to Backend -> Backend calls Claude -> Claude returns response -> Frontend displays output -> Next agent processes previous output -> Repeat.

## How It Works

Sequential Agent Processing

The orchestration follows this pattern for each of the 5 agents:

Round 1 - Initial Response:
1. Agent receives requirement plus all previous agent outputs as context
2. Agent produces initial response (first draft)
3. PM evaluates response with score 1-5
4. If score >= 4, agent is done. Move to next agent.
5. If score < 4, go to Round 2.

Round 2 - Revision (if needed):
1. PM asks clarifying question based on first draft
2. Agent revises response addressing the question
3. PM re-evaluates with new score
4. If score >= 4, agent is done. Move to next agent.
5. If score < 4, user gets intervention panel to accept/reject/terminate.

Context Window Management

Each agent receives accumulated context:

Requirement: [original user requirement]

Previous outputs:
Architect: [architecture output]
Engineer: [engineering output]
QA: [qa output]
...

Please provide your analysis based on the above.

This ensures each agent understands the full context of decisions made by previous agents.

Real-Time UI Updates

As agents complete:
1. Agent name + score appears immediately
2. First draft is displayed
3. If revision needed, PM question appears
4. Revised answer replaces first draft
5. Final score and reasoning shown
6. UI moves to next agent
7. Loading indicator shows during processing

Users see the entire feedback loop in real-time, not just final results.

## Getting Started

Prerequisites

You need:
- Node.js 18 or higher
- Python 3.10 or higher
- Claude API key from https://console.anthropic.com

Setup (15 minutes)

1. Clone and navigate:
git clone https://github.com/yourusername/agentic-ai-system.git
cd agentic-ai-system

2. Setup Frontend:
cd agile-orchestrator-frontend
npm install
echo "REACT_APP_CLAUDE_API_KEY=sk-ant-your-key-here" > .env.local

3. Setup Backend:
cd ../agile-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env

Replace sk-ant-your-key-here with your actual Claude API key.

## Running the System

Terminal 1 - Start Backend:
cd agile-backend
source venv/bin/activate
python agile_backend.py

You should see: INFO: Uvicorn running on http://127.0.0.1:8000

Terminal 2 - Start Frontend:
cd agile-orchestrator-frontend
npm start

You should see: Compiled successfully! and browser opens to http://localhost:3001

Using the System

1. Open http://localhost:3001 in browser
2. Enter a project requirement (e.g., "Build a real-time chat app with encryption")
3. Click "Start Agile Analysis"
4. Watch as agents complete sequentially with real-time output
5. See PM feedback and revisions as they happen
6. Get final project estimation when all agents complete

## Technical Deep Dive

Async/Await Pattern

The system is built on proper async handling:

const orchestrateAgile = async (requirement) => {
  for (let agent of agents) {
    // First round
    const response = await callClaudeAPI(systemPrompt, message);
    // Waits for actual API response before continuing
    
    const score = await generatePMScore(role, response);
    // Waits for PM score before proceeding
    
    if (score < 4) {
      // Second round if needed
      const question = await generatePMQuestion(role, response);
      const revised = await callClaudeAPI(systemPrompt, revisionMessage);
      const finalScore = await generatePMScore(role, revised);
    }
  }
}

Without await, the code would proceed immediately and previousOutput would be a Promise object instead of actual text. This would break the orchestration. With await, we pause execution until Claude responds, then get the actual text to pass to the next agent.

State Management

React state tracks the entire orchestration:

orchestration = {
  phases: [
    {
      role: 'Architect',
      icon: '🏗️',
      firstDraft: 'Full architecture response...',
      pmQuestion: 'How will you handle 10k concurrent users?',
      revisedAnswer: 'Revised architecture addressing scalability...',
      score: 4,
      feedback: 'Good scalability approach',
      completed: true
    },
    // ... more agents
  ]
}

When orchestration state updates, React re-renders and displays new outputs. Users see outputs appearing in real-time as orchestration progresses.

## Project Structure

agentic-ai-system/
├── agile-orchestrator-frontend/
│   ├── src/
│   │   ├── App.js              # Main orchestrator component
│   │   ├── App.css             # Styling with animations
│   │   └── index.js
│   ├── package.json            # React dependencies
│   ├── .env.local              # API key (not committed)
│   └── node_modules/
│
├── agile-backend/
│   ├── agile_backend.py        # FastAPI server
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # API key (not committed)
│   └── venv/                   # Virtual environment
│
└── README.md

## Technology Stack

Frontend: React 18, JavaScript, CSS3 (animations, flexbox), Fetch API

Backend: Python 3.10+, FastAPI, Anthropic SDK, CORS middleware

AI: Claude Opus 4 from Anthropic, system/user prompt roles, structured responses

Development: No build tools, pure React (CRA), simple Python (no async frameworks)

## Performance Metrics

- Setup time: 15 minutes
- Per-run duration: 30-40 seconds
- Number of agents: 5
- Max revisions per agent: 2
- Total HTTP calls: 7-10 per orchestration
- Tokens used: 15-25K per run
- API cost: $0.18-0.46 per estimation

The actual cost depends on which Claude model you use. Opus 4 is expensive but produces better agent responses.

## Use Cases

Automated Project Scoping: Use as a tool to quickly estimate software projects without manual analysis. Better than manual estimation for consistency.

Portfolio Project: Demonstrates understanding of multi-agent AI systems, prompt engineering, async programming, and system design. Excellent for interviews.

Learning Resource: Study how agents communicate, how feedback loops work, how to handle context windows in LLMs, and how to build production-ready AI systems.

Production Template: Take this as a starting point and customize agents for your specific domain (customer service, data analysis, content creation, etc).

Interview Preparation: Talk about agentic AI patterns, orchestration strategies, cost optimization, and scaling considerations.

## Interview Talking Points

On Agentic AI: "This system demonstrates that agents don't need complex direct communication. Context passing through prompts is simple but powerful. Each agent focuses on its expertise and produces output. The PM acts as a quality gate."

On Async/Await: "Without await, previousOutput would be a Promise object instead of text. The next agent would get invalid input. Await pauses execution until Claude responds, ensuring we get actual data before proceeding."

On State Management: "React state tracks the entire orchestration pipeline. Each agent completion updates state, which triggers a re-render, displaying new outputs in real-time. This is how users see the workflow unfold."

On Cost Optimization: "Token count scales with context. The final agent sees all previous outputs, so it's most expensive. We could use cheaper models for later agents or summarize context at each step to reduce tokens."

On Scaling: "Currently sequential to enforce waterfall. For truly parallel agents, we'd need a coordination layer. We could also add human-in-the-loop approval between agents, or add database persistence to save estimations."

## Common Questions

Q: Why does this use Claude multiple times?
A: Each agent needs to think independently based on its expertise. Calling Claude multiple times with different system prompts gives us autonomous agents with distinct roles.

Q: Why not use parallel agents?
A: Waterfall methodology requires sequential processing. Each agent needs previous agent's output as context. Could parallelize agents that don't depend on each other, but adds complexity.

Q: How do I reduce API costs?
A: Use cheaper models (Sonnet, Haiku) for later agents. Summarize context at each step to reduce token count. Or batch multiple projects together.

Q: Can I customize the agents?
A: Yes. Edit the systemPrompt for each agent in App.js. Change instructions, add constraints, modify output format. Experiment with different prompts.

Q: How do I deploy this?
A: Frontend is just static files - deploy to Vercel, Netlify, or any CDN. Backend needs a server - deploy to AWS, Google Cloud, Heroku, Railway, etc. Need to handle HTTPS and auth for production.

## Configuration

Backend Environment Variables (.env):
- ANTHROPIC_API_KEY: Your Claude API key (required)

Frontend Environment Variables (.env.local):
- REACT_APP_CLAUDE_API_KEY: Your Claude API key (required)

Port Configuration:
- Frontend: http://localhost:3001 (configured in npm start)
- Backend: http://localhost:8000 (configured in agile_backend.py)





Star this repo if you find it useful!