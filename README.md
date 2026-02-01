# 🚀 Ascendra - The Agentic Student Companion

> **Transforming student support from reactive to proactive through Agentic AI**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

## 🌟 Vision

Ascendra is a **Digital Life-Force** that addresses the interconnected "Polycrisis" of modern education:

```
Financial Stress → Anxiety → Academic Failure → Career Crisis
```

We break this cycle by building an **Agentic AI companion** that ensures no student falls through the cracks.

---

## 🧠 Why Agentic AI?

| Feature | Traditional Chatbot | Ascendra (Agentic) |
|---------|---------------------|----------------------|
| **Logic** | Answers prompts | Operates on Goals |
| **Reasoning** | Pattern matching | Chain-of-Thought planning |
| **Persistence** | Session-based | Long-term Memory |
| **Action** | Gives advice | Tool-Use: Calendars, APIs, Alerts |

### Example of Agentic Reasoning:
```
📊 Observation: Student says "I can't sleep because of my loan"
🔍 Analysis: Checks profile (₹40L debt) + calendar (Exam in 2 days)
⚡ Actions:
   1. Suggests 5-min breathing exercise (Immediate)
   2. Finds 3 tutoring gigs matching skills (Financial)
   3. Rearranges study schedule for rest (Academic)
```

---

## 🚀 Core Features

### 🧘 Neural Guardian (Mental Health)
- Sentiment Trend Analysis with crisis detection
- AI-powered journaling with mood insights
- Digital Detox Protocol
- Crisis Hot-Routing to helplines

### 💼 Skill-to-Market Syncer (Career)
- Curriculum Gap Analysis
- 48-hour Micro-Project Generator
- Mock Interview Agent
- Resume Auto-Evolution

### 💰 Scholarship Hunter (Finance)
- Automated Scholarship Matching
- Debt-Burn Rate Calculator
- Micro-Gig Aggregator
- Subscription Audit Agent

### 👥 Peer-Mesh (Social)
- **AI-Powered Peer Matchmaking** - Real user matching based on skills & interests
- **Skill-Swap Marketplace** - Connect to exchange skills
- **Connection System** - Send/accept connection requests
- Shared Goal Rooms

### 📚 Academic Catalyst
- Content Distiller (PDF → Quizzes, Flashcards)
- Learning Style Optimizer
- Study Plan Generator
- Ethics Guard

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Express.js, MongoDB, Socket.io, JWT |
| **AI Service** | FastAPI, Google Gemini 2.0-flash |
| **Database** | MongoDB Atlas |

---

## 📁 Project Structure

```
ascendra/
├── frontend/                 # React + Vite Application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── api/             # API client (Axios)
│   │   ├── store/           # Zustand state management
│   │   └── App.jsx          # Main app with routes
│   ├── .env.example         # Environment template
│   └── vite.config.js       # Vite configuration
│
├── backend/                  # Express.js Server
│   ├── controllers/         # Route handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   ├── .env.example         # Environment template
│   └── server.js            # Entry point
│
└── ai-service/              # Python FastAPI Backend
    ├── main.py              # FastAPI app with all endpoints
    ├── requirements.txt     # Python dependencies
    └── .env.example         # Environment template
```

---

## 🔧 Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/Ascendra
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8000
```

### AI Service (`ai-service/.env`)
```env
GEMINI_API_KEY=your-gemini-api-key
PORT=8000
DEBUG=False
BACKEND_URL=http://localhost:5000
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- Python 3.10+ ([Download](https://www.python.org/))
- MongoDB Atlas account ([Sign up](https://cloud.mongodb.com/))
- Google Gemini API Key ([Get here](https://aistudio.google.com/app/apikey))

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/ascendra.git
cd ascendra

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install AI service dependencies
cd ../ai-service
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
# Frontend
cd frontend
cp .env.example .env
# Edit .env with your values

# Backend
cd ../backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# AI Service
cd ../ai-service
cp .env.example .env
# Edit .env with your Gemini API key
```

### 3. Run All Services

```bash
# Terminal 1: Frontend (port 5173)
cd frontend && npm run dev

# Terminal 2: Backend (port 5000)
cd backend && node server.js

# Terminal 3: AI Service (port 8000)
cd ai-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Visit **http://localhost:5173** 🎉





## 🔐 Security Checklist for Production

- [ ] Use strong, unique `JWT_SECRET` (32+ characters)
- [ ] Enable HTTPS (free with Render/Vercel/Railway)
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables (never commit `.env` files)
- [ ] Configure CORS properly for your domain
- [ ] Enable MongoDB Atlas IP whitelist (or allow all for cloud hosting)
- [ ] Rotate API keys periodically
- [ ] Set up error monitoring (Sentry recommended)

---

## 📊 API Endpoints

### Backend (Express.js - Port 5000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/user/profile` | GET/PUT | User profile |
| `/api/social/find-matches` | GET | AI peer matchmaking |
| `/api/social/connect` | POST | Send connection request |
| `/api/social/connection-requests` | GET | Get pending requests |
| `/api/social/respond-request` | POST | Accept/reject request |
| `/api/social/connections` | GET | Get connections |
| `/api/journal/*` | CRUD | Journal entries |
| `/api/tasks/*` | CRUD | Task management |

### AI Service (FastAPI - Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | AI chat with reasoning |
| `/api/analyze-mood` | POST | Mood analysis |
| `/api/analyze-skills` | POST | Skill gap analysis |
| `/api/search-scholarships` | POST | Scholarship search |
| `/api/distill-content` | POST | Content distillation |
| `/api/generate-flashcards` | POST | Flashcard generation |
| `/api/mock-interview` | POST | Interview practice |
| `/api/study-plan` | POST | Study plan creation |
| `/api/digital-detox` | POST | Digital detox plan |
| `/api/micro-gigs` | POST | Find micro-gigs |

---

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Check your `MONGODB_URI` is correct
- Ensure your IP is whitelisted in MongoDB Atlas (use `0.0.0.0/0` for cloud hosting)
- Verify network connectivity

**AI Service Not Responding:**
- Check `GEMINI_API_KEY` is valid
- Ensure the AI service is running on port 8000
- Check for Python package issues: `pip install -r requirements.txt`

**Frontend Can't Connect to Backend:**
- Verify `VITE_API_URL` points to correct backend URL
- Check CORS settings in backend
- For production, ensure HTTPS is configured

**Render Free Tier Sleeping:**
- Free tier services sleep after 15 min of inactivity
- First request after sleep takes ~30 seconds
- Consider upgrading to paid tier for production

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



---

<p align="center">
  <strong>🚀 Ascendra - Your Beacon in the Storm</strong><br>
  Built with ❤️ for students everywhere
</p>
