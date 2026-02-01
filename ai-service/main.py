"""
Ascendra - Agentic AI Service
Main FastAPI application with Gemini-powered agents
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Configure Gemini - check both possible env var names
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("WARNING: No Gemini API key found! Set GEMINI_API_KEY or GOOGLE_API_KEY in .env")

# Initialize the new Genai client
client = genai.Client(api_key=api_key)

app = FastAPI(
    title="Ascendra AI Service",
    description="Agentic AI backend for student companion platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5175", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    userId: str
    conversationHistory: Optional[List[Dict[str, Any]]] = []
    userProfile: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    content: str
    reasoning: str
    actions: List[str]
    category: str
    sentiment: Optional[str] = None
    urgency: Optional[str] = None

class MoodAnalysisRequest(BaseModel):
    journalEntry: str
    recentMoods: Optional[List[int]] = []

class SkillGapRequest(BaseModel):
    currentSkills: List[Dict[str, Any]]
    targetRole: str

class ScholarshipMatchRequest(BaseModel):
    profile: Dict[str, Any]
    financialNeed: float

class ContentDistillRequest(BaseModel):
    content: str
    contentType: str = "notes"
    learningStyle: str = "visual"
    format: Optional[str] = None  # Alternative parameter for output format

class ScholarshipSearchRequest(BaseModel):
    country: str = "India"
    educationLevel: str = "undergraduate"  # undergraduate, postgraduate, phd
    field: Optional[str] = None  # engineering, medical, arts, etc.
    category: Optional[str] = None  # merit, need-based, sports, minority, women, etc.
    eligibilityCriteria: Optional[Dict[str, Any]] = None  # income, percentage, caste, etc.
    keywords: Optional[str] = None

class FlashcardGenerateRequest(BaseModel):
    topic: str
    count: int = 5

# System prompts for different agent personalities
SYSTEM_PROMPTS = {
    "general": """You are Ascendra, an empathetic and intelligent agentic AI companion for students.
You help with mental health, career guidance, financial planning, social connections, and academics.
Always be supportive, non-judgmental, and provide actionable advice.
When you detect stress or crisis signals, prioritize mental health support.
Format your reasoning process clearly to show how you're thinking through the problem.""",

    "mental_health": """You are the Neural Guardian module of Ascendra.
Your role is to support student mental health through:
- Empathetic listening and validation
- Recognizing signs of distress (sleep issues, isolation, academic struggles)
- Suggesting appropriate interventions (breathing exercises, journaling, professional help)
- Crisis detection - if you detect self-harm or suicidal ideation, immediately provide crisis hotline numbers
Never diagnose conditions. Always encourage professional help for serious concerns.
Be warm, understanding, and never dismissive of feelings.""",

    "career": """You are the Skill-to-Market Syncer module of Ascendra.
Your role is to help students with career development:
- Analyze skill gaps between current abilities and industry requirements
- Suggest relevant internships, jobs, and freelance opportunities
- Recommend micro-projects to build missing skills
- Help with resume optimization and interview preparation
- Connect students with alumni mentors
Be practical, motivating, and realistic about market conditions.""",

    "finance": """You are the Scholarship Hunter module of Ascendra.
Your role is to help students with financial wellness:
- Find matching scholarships and grants
- Suggest appropriate micro-gigs for earning
- Analyze spending patterns and subscriptions
- Create debt repayment strategies
- Provide financial literacy education
Be empathetic about financial stress while being practical about solutions.""",

    "social": """You are the Peer-Mesh module of Ascendra.
Your role is to foster healthy social connections:
- Match students for skill-swapping opportunities
- Suggest study groups and goal-oriented communities
- Detect signs of isolation and loneliness
- Help migrant/first-gen students find local resources
- Monitor for toxic group dynamics
Promote positive interactions while respecting privacy preferences.""",

    "academic": """You are the Academic Catalyst module of Ascendra.
Your role is to optimize academic success:
- Prioritize tasks based on deadlines and cognitive load
- Break down complex assignments into manageable steps
- Distill learning content into preferred formats
- Coordinate peer study sessions
- Check for academic integrity issues
Be supportive but also help students maintain academic honesty."""
}

# Model configuration - can be overridden via environment variable
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

def get_gemini_response(prompt: str) -> str:
    """Generate content using Gemini API with the new google.genai package"""
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        # If quota exceeded, provide helpful error
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            raise Exception(f"Gemini API quota exceeded. Please wait or get a new API key from https://aistudio.google.com/app/apikey")
        raise e

def get_gemini_model():
    """Legacy wrapper - returns a mock model object for backwards compatibility"""
    class GeminiModelWrapper:
        def generate_content(self, prompt: str):
            class Response:
                def __init__(self, text):
                    self.text = text
            return Response(get_gemini_response(prompt))
    return GeminiModelWrapper()

def classify_message(message: str) -> str:
    """Classify the message into a category"""
    message_lower = message.lower()
    
    mental_keywords = ['stress', 'anxious', 'anxiety', 'depressed', 'sad', 'overwhelmed', 
                       'lonely', 'sleep', 'tired', 'burnout', 'panic', 'worried', 'scared',
                       'hopeless', 'help me', 'feeling', 'mental', 'therapy', 'counselor']
    career_keywords = ['job', 'internship', 'career', 'skill', 'resume', 'interview', 
                       'company', 'work', 'professional', 'industry', 'hiring', 'salary']
    finance_keywords = ['money', 'scholarship', 'loan', 'debt', 'afford', 'pay', 'budget',
                        'financial', 'gig', 'earn', 'subscription', 'fees', 'tuition']
    social_keywords = ['friends', 'group', 'club', 'meet', 'connect', 'community', 
                       'lonely', 'study group', 'partner', 'team', 'classmates']
    academic_keywords = ['assignment', 'exam', 'study', 'deadline', 'professor', 'course',
                         'homework', 'project', 'grade', 'class', 'learn', 'quiz', 'test']
    
    scores = {
        'mental': sum(1 for kw in mental_keywords if kw in message_lower),
        'career': sum(1 for kw in career_keywords if kw in message_lower),
        'finance': sum(1 for kw in finance_keywords if kw in message_lower),
        'social': sum(1 for kw in social_keywords if kw in message_lower),
        'academic': sum(1 for kw in academic_keywords if kw in message_lower)
    }
    
    max_category = max(scores, key=scores.get)
    return max_category if scores[max_category] > 0 else 'general'

def detect_urgency(message: str) -> str:
    """Detect urgency level of the message"""
    message_lower = message.lower()
    
    critical_keywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'self-harm',
                        'hurt myself', 'no point living', 'give up on life']
    high_keywords = ['emergency', 'urgent', 'asap', 'immediately', 'crisis', 'desperate',
                    'deadline today', 'due tomorrow', 'panic attack']
    
    if any(kw in message_lower for kw in critical_keywords):
        return 'critical'
    if any(kw in message_lower for kw in high_keywords):
        return 'high'
    return 'medium'

def analyze_sentiment(message: str) -> str:
    """Simple sentiment analysis"""
    positive = ['happy', 'great', 'good', 'excited', 'grateful', 'proud', 'confident']
    negative = ['sad', 'angry', 'frustrated', 'worried', 'stressed', 'anxious', 'upset']
    
    message_lower = message.lower()
    pos_count = sum(1 for w in positive if w in message_lower)
    neg_count = sum(1 for w in negative if w in message_lower)
    
    if pos_count > neg_count:
        return 'positive'
    elif neg_count > pos_count:
        return 'negative'
    return 'neutral'

@app.get("/")
async def root():
    return {"message": "Ascendra AI Service is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint with agentic reasoning"""
    try:
        # Classify and analyze the message
        category = classify_message(request.message)
        urgency = detect_urgency(request.message)
        sentiment = analyze_sentiment(request.message)
        
        # Handle critical urgency (crisis)
        if urgency == 'critical':
            return ChatResponse(
                content="""I'm really concerned about what you've shared. Your feelings are valid, and I want you to know you're not alone.

Please reach out to a crisis helpline right now:
🇮🇳 India: iCall - 9152987821 | Vandrevala Foundation - 1860-2662-345
🇺🇸 USA: National Suicide Prevention Lifeline - 988
🌍 International: https://findahelpline.com

I'm here for you, but trained professionals can provide immediate support. Would you like me to help you find local mental health resources?""",
                reasoning="Detected crisis keywords indicating potential self-harm. Prioritizing immediate safety by providing crisis resources before any other assistance.",
                actions=["crisis_alert_triggered", "hotline_numbers_provided", "flag_for_counselor_review"],
                category="mental",
                sentiment="negative",
                urgency="critical"
            )
        
        # Build conversation context
        system_prompt = SYSTEM_PROMPTS.get(category, SYSTEM_PROMPTS["general"])
        
        # Add user context if available
        if request.userProfile:
            name = request.userProfile.get('name', 'there')
            system_prompt += f"\n\nYou're speaking with {name}."
            if request.userProfile.get('profile'):
                profile = request.userProfile['profile']
                if profile.get('isFirstGen'):
                    system_prompt += " They are a first-generation college student."
                if profile.get('isMigrant'):
                    system_prompt += " They are studying away from their home city."
        
        # Build chat history
        history_text = ""
        for msg in request.conversationHistory[-5:]:  # Last 5 messages
            role = "User" if msg.get('role') == 'user' else "Assistant"
            history_text += f"{role}: {msg.get('content', '')}\n"
        
        # Construct the prompt with reasoning chain
        full_prompt = f"""{system_prompt}

Previous conversation:
{history_text}

Current user message: {request.message}

Please respond with:
1. REASONING: Explain your thought process (what the user needs, what context matters, what approach to take)
2. ACTIONS: List any actions you're taking or recommending (as a comma-separated list)
3. RESPONSE: Your actual response to the user

IMPORTANT - Format your RESPONSE section using proper Markdown:
- Use **bold** for emphasis and key points
- Use bullet points (•) for lists
- Use numbered lists for steps or sequences
- Use ### for section headers when appropriate
- Use > for important callouts or quotes
- Use emojis sparingly for warmth and visual appeal 😊
- Keep paragraphs short and readable

Format:
REASONING: [your reasoning]
ACTIONS: [action1, action2, ...]
RESPONSE: [your well-formatted markdown response]"""

        # Call Gemini
        model = get_gemini_model()
        response = model.generate_content(full_prompt)
        
        # Parse the response
        response_text = response.text
        
        reasoning = ""
        actions = []
        content = response_text
        
        if "REASONING:" in response_text:
            parts = response_text.split("REASONING:")
            if len(parts) > 1:
                rest = parts[1]
                if "ACTIONS:" in rest:
                    reasoning = rest.split("ACTIONS:")[0].strip()
                    rest = rest.split("ACTIONS:")[1]
                    if "RESPONSE:" in rest:
                        actions_text = rest.split("RESPONSE:")[0].strip()
                        actions = [a.strip() for a in actions_text.split(",") if a.strip()]
                        content = rest.split("RESPONSE:")[1].strip()
                    else:
                        content = rest.strip()
                elif "RESPONSE:" in rest:
                    reasoning = rest.split("RESPONSE:")[0].strip()
                    content = rest.split("RESPONSE:")[1].strip()
        
        return ChatResponse(
            content=content,
            reasoning=reasoning or f"Classified as {category} query. Sentiment: {sentiment}. Urgency: {urgency}.",
            actions=actions or [f"processed_{category}_query"],
            category=category,
            sentiment=sentiment,
            urgency=urgency
        )
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-mood")
async def analyze_mood(request: MoodAnalysisRequest):
    """Analyze journal entry for mood and sentiment"""
    try:
        model = get_gemini_model()
        
        prompt = f"""Analyze this journal entry for emotional content and provide supportive insights.

Journal Entry: {request.journalEntry}

Recent mood scores (1-10): {request.recentMoods}

Provide a warm, formatted response with:

### 🎭 Emotions Detected
List the primary emotions with emojis

### 📊 Overall Sentiment
Positive/Neutral/Negative with brief explanation

### ⚠️ Patterns to Note
Any concerning patterns observed

### 💭 Reflection
A brief, empathetic reflection for the user (2-3 sentences)

### 💡 Suggested Action
One helpful intervention or activity

Use **bold** for emphasis, bullet points for lists, and keep the tone warm and supportive."""

        response = model.generate_content(prompt)
        
        return {"success": True, "analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-skills")
async def analyze_skill_gaps(request: SkillGapRequest):
    """Analyze skill gaps for a target role"""
    try:
        model = get_gemini_model()
        
        skills_text = ", ".join([f"{s['name']} ({s.get('level', 0)}%)" for s in request.currentSkills])
        
        prompt = f"""Analyze skill gaps for someone targeting: {request.targetRole}

Current skills: {skills_text}

Provide a well-formatted analysis:

### 🎯 Target Role: {request.targetRole}

### ❌ Missing Skills
List each missing skill with importance level (🔴 Critical, 🟡 Important, 🟢 Nice-to-have)

### 📋 Priority Learning Path
Numbered list of skills in order of priority

### 🛠️ Micro-Projects
For each missing skill, suggest a hands-on project:
- **Skill**: Project idea (estimated time)

### ⏱️ Timeline
Estimated time to become job-ready

### 🔄 Alternative Roles
Related roles to consider while building skills

Use **bold** for skill names, bullet points for lists, and emojis for visual appeal."""

        response = model.generate_content(prompt)
        
        return {"success": True, "analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match-scholarships")
async def match_scholarships(request: ScholarshipMatchRequest):
    """Find matching scholarships based on profile"""
    try:
        model = get_gemini_model()
        
        prompt = f"""Based on this student profile, suggest relevant scholarships they might qualify for:

Profile: {request.profile}
Financial Need Level: {request.financialNeed}

Provide 5 types of scholarships they should look for, including:
1. Category (merit, need-based, diversity, field-specific, etc.)
2. Typical eligibility criteria
3. Where to find them
4. Application tips

Format as JSON array of scholarship opportunities."""

        response = model.generate_content(prompt)
        
        return {"success": True, "scholarships": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search-scholarships")
async def search_scholarships(request: ScholarshipSearchRequest):
    """Search for real scholarships based on user criteria"""
    try:
        model = get_gemini_model()
        
        # Build a comprehensive prompt for scholarship search
        criteria_text = f"""
Country: {request.country}
Education Level: {request.educationLevel}
Field of Study: {request.field or 'Any'}
Category: {request.category or 'All types'}
Additional Keywords: {request.keywords or 'None'}
"""
        
        if request.eligibilityCriteria:
            criteria_text += f"\nEligibility Details: {request.eligibilityCriteria}"
        
        prompt = f"""You are a scholarship research expert. Find REAL scholarships matching these criteria:

{criteria_text}

Provide 5-8 scholarships in this JSON format (NO markdown, just pure JSON):
{{
    "scholarships": [
        {{
            "name": "Scholarship name",
            "provider": "Organization name",
            "amount": "Amount (e.g., '₹50,000/year')",
            "eligibility": ["criteria 1", "criteria 2"],
            "deadline": "Deadline or 'Varies'",
            "applicationUrl": "https://example.com",
            "description": "Brief description",
            "category": "merit/need-based/minority/women",
            "field": "Applicable fields",
            "source": "Source portal"
        }}
    ],
    "tips": ["Tip 1", "Tip 2"],
    "additionalResources": ["https://buddy4study.com", "https://scholarships.gov.in"]
}}

Return ONLY valid JSON, no explanations or markdown."""

        response = model.generate_content(prompt)
        response_text = response.text
        print(f"Gemini response: {response_text[:500]}")  # Debug log
        
        # Try to parse as JSON
        import json
        try:
            # Clean the response - remove markdown code blocks if present
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            
            parsed_data = json.loads(clean_text.strip())
            return {"success": True, "data": parsed_data}
        except json.JSONDecodeError as je:
            print(f"JSON parse error: {je}")
            # Return a fallback structure
            return {
                "success": True, 
                "data": {
                    "scholarships": [],
                    "tips": ["Try visiting buddy4study.com for scholarship listings"],
                    "additionalResources": ["https://buddy4study.com", "https://scholarships.gov.in"]
                },
                "rawData": response_text
            }
            
    except Exception as e:
        print(f"Search scholarship error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/distill-content")
async def distill_content(request: ContentDistillRequest):
    """Distill learning content into preferred format"""
    try:
        model = get_gemini_model()
        
        # Support both format parameter and learningStyle for flexibility
        output_format = request.format or request.learningStyle
        
        format_instructions = {
            "summary": "Create a concise summary with:\n### 📝 Key Summary\nUse **bold** for key terms, bullet points for main ideas, and a brief conclusion.",
            "bullet-points": "Create a structured outline:\n### 📋 Main Topics\nUse • for main points, ◦ for sub-points, and **bold** for key terms.",
            "flashcards": "Create 5-7 flashcard Q&A pairs:\n### 🎴 Flashcards\nFormat each as:\n**Q:** Question here\n**A:** Answer here\n---",
            "mind-map": "Create a text-based mind map:\n### 🧠 Mind Map\nUse indentation and arrows (→) to show relationships between concepts.",
            "quiz": "Create a 5-question quiz:\n### 📝 Quiz\n**Q1.** Question\na) Option b) Option c) Option d) Option\n✅ **Answer:** Correct option with explanation",
            "visual": "Create visual-friendly content:\n### 👁️ Visual Summary\nUse diagrams (described in text), **bold headers**, color-coded sections (🔴🟡🟢), and structured layouts.",
            "auditory": "Write conversationally:\n### 🎧 Audio-Style Explanation\nUse 'Imagine...', 'Think of it like...', analogies, and a friendly tone as if explaining to a friend.",
            "reading": "Provide detailed explanations:\n### 📖 Detailed Notes\nUse headers, **bold definitions**, examples in *italics*, and numbered references.",
            "kinesthetic": "Include hands-on content:\n### ✋ Practice Activities\nProvide exercises, step-by-step tutorials, and 'Try this:' prompts for active learning."
        }
        
        instruction = format_instructions.get(output_format, format_instructions["summary"])
        
        prompt = f"""Distill this content for a student.

Task: {instruction}

Content to distill:
{request.content[:4000]}

Format your response using proper Markdown:
- Use **bold** for key terms and concepts
- Use bullet points (•) for lists
- Use numbered lists (1. 2. 3.) for sequential steps
- Use ### headers for sections
- Use > blockquotes for important notes
- Use `code` formatting for technical terms

Provide clear, well-organized, visually appealing output that helps the student learn effectively."""

        response = model.generate_content(prompt)
        
        return {"success": True, "distilled": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ethics-check")
async def ethics_check(content: Dict[str, str]):
    """Check content for academic integrity issues"""
    try:
        model = get_gemini_model()
        
        prompt = f"""Review this student submission for academic integrity concerns:

{content.get('text', '')[:2000]}

Check for:
1. Signs of AI-generated content that should be disclosed
2. Potential plagiarism patterns
3. Over-reliance on external sources without proper citation
4. Any ethical concerns

Provide constructive feedback, not accusations. Help the student improve their work's originality.

Format: JSON with keys: concerns (array), suggestions (array), overallAssessment (string)"""

        response = model.generate_content(prompt)
        
        return {"success": True, "review": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-flashcards")
async def generate_flashcards(request: FlashcardGenerateRequest):
    """Generate AI flashcards for a given topic"""
    try:
        model = get_gemini_model()
        
        prompt = f"""Generate {request.count} educational flashcards about: {request.topic}

Each flashcard should:
1. Have a clear, specific question
2. Have a comprehensive but concise answer
3. Cover different aspects of the topic
4. Be suitable for studying/revision

Return ONLY a valid JSON array with this exact format (no markdown, no code blocks):
[
  {{"question": "What is...?", "answer": "It is..."}},
  {{"question": "How does...?", "answer": "By..."}}
]

Generate exactly {request.count} flashcards covering key concepts of {request.topic}."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up response - remove markdown code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            flashcards = json.loads(response_text)
            return {"success": True, "flashcards": flashcards, "topic": request.topic}
        except json.JSONDecodeError:
            # Try to extract JSON array from response
            import re
            match = re.search(r'\[[\s\S]*\]', response_text)
            if match:
                flashcards = json.loads(match.group())
                return {"success": True, "flashcards": flashcards, "topic": request.topic}
            
            # Fallback: return raw text
            return {
                "success": False, 
                "error": "Failed to parse flashcards",
                "raw": response_text
            }
            
    except Exception as e:
        print(f"Generate flashcards error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class PeerMatchRequest(BaseModel):
    userId: str
    interests: List[str] = []
    skills: List[str] = []
    seekingSkills: List[str] = []
    college: Optional[str] = None


class MockInterviewRequest(BaseModel):
    role: str
    experience: str = "entry"
    questionType: str = "behavioral"  # behavioral, technical, case


class ProjectForgeRequest(BaseModel):
    skill: str
    level: str = "beginner"
    timeframe: str = "48 hours"


class DebtCalculatorRequest(BaseModel):
    loans: list  # [{"name": "...", "amount": float, "interestRate": float, "minPayment": float}]
    monthlyBudget: float
    strategy: str = "avalanche"  # "avalanche" or "snowball"


class MicroGigRequest(BaseModel):
    skills: list
    availability: str = "10-15 hours/week"
    preferredType: str = "online"  # "online", "offline", "both"


class SubscriptionAuditRequest(BaseModel):
    subscriptions: list  # [{"name": "...", "cost": float, "frequency": "monthly", "usage": "high/medium/low"}]
    monthlyIncome: float


class GrantWriterRequest(BaseModel):
    projectTitle: str
    projectDescription: str
    grantType: str = "research"
    requestedAmount: float = 0


class StudyPlanRequest(BaseModel):
    topic: str
    duration: str = "2 hours"
    goal: str = "exam-prep"  # exam-prep, deep-learning, quick-review, project-work


class DigitalDetoxRequest(BaseModel):
    screenTime: dict  # {"social": hours, "entertainment": hours, "productive": hours}
    goal: str = "moderate"  # gentle, moderate, aggressive
    currentMood: float = None


class WellnessInsightsRequest(BaseModel):
    wellness: dict  # {"sleepHours": int, "waterGlasses": int, "exerciseMinutes": int, "stressLevel": int, "caffeine": int}
    moodHistory: list = []
    averageMood: float = None


@app.post("/api/find-peer-matches")
async def find_peer_matches(request: PeerMatchRequest):
    """AI-powered peer matchmaking based on interests and skills"""
    try:
        model = get_gemini_model()
        
        prompt = f"""As a peer matching AI for students, analyze this profile and suggest ideal peer matches:

User Profile:
- Interests: {', '.join(request.interests) if request.interests else 'Not specified'}
- Skills they can teach: {', '.join(request.skills) if request.skills else 'Not specified'}
- Skills they want to learn: {', '.join(request.seekingSkills) if request.seekingSkills else 'Not specified'}
- College: {request.college or 'Not specified'}

Generate 3-5 ideal peer match profiles with:
1. Type of connection (study buddy, project partner, skill mentor, etc.)
2. Match score (60-95%)
3. Reason for match
4. Suggested collaboration activity

Return ONLY valid JSON (no markdown):
{{
    "matches": [
        {{"name": "Study Partner Type", "type": "study-group", "matchScore": 85, "reason": "Similar interests in...", "activity": "Weekly study sessions"}},
        ...
    ]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "matches": data.get("matches", [])}
        except json.JSONDecodeError:
            # Fallback demo matches
            return {
                "success": True,
                "matches": [
                    {"name": "Study Buddy", "type": "study-group", "matchScore": 85, "reason": "Shared academic interests", "activity": "Group study sessions"},
                    {"name": "Project Partner", "type": "project", "matchScore": 78, "reason": "Complementary skill sets", "activity": "Collaborative projects"},
                    {"name": "Skill Mentor", "type": "mentorship", "matchScore": 72, "reason": "Can help with skills you want to learn", "activity": "Peer tutoring"}
                ]
            }
            
    except Exception as e:
        print(f"Peer match error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mock-interview")
async def mock_interview(request: MockInterviewRequest):
    """Generate mock interview questions and evaluate responses"""
    try:
        model = get_gemini_model()
        
        prompt = f"""You are an expert interviewer for {request.role} positions.
Generate 5 {request.questionType} interview questions for {request.experience}-level candidates.

For each question, provide:
1. The interview question
2. What the interviewer is looking for
3. A model answer framework
4. Common mistakes to avoid

Return ONLY valid JSON:
{{
    "questions": [
        {{
            "question": "...",
            "lookingFor": ["key point 1", "key point 2"],
            "modelAnswer": "Framework for answering...",
            "avoid": ["Common mistake 1"]
        }}
    ],
    "tips": ["General tip 1", "General tip 2"]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "interview": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to parse interview questions"}
            
    except Exception as e:
        print(f"Mock interview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/project-forge")
async def project_forge(request: ProjectForgeRequest):
    """Generate a micro-project to build a specific skill"""
    try:
        model = get_gemini_model()
        
        prompt = f"""Create a {request.timeframe} micro-project to help a {request.level} developer learn {request.skill}.

The project should be:
1. Achievable within {request.timeframe}
2. Hands-on and practical
3. Portfolio-worthy
4. Have clear milestones

Return ONLY valid JSON:
{{
    "projectName": "Name of the project",
    "description": "Brief description",
    "learningOutcomes": ["What they will learn"],
    "techStack": ["Technologies used"],
    "milestones": [
        {{"hour": 0, "task": "Setup and planning", "deliverable": "Project skeleton"}},
        {{"hour": 6, "task": "Core feature 1", "deliverable": "..."}}
    ],
    "stretchGoals": ["Optional enhancements"],
    "resources": ["Helpful links or docs"]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "project": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to generate project"}
            
    except Exception as e:
        print(f"Project forge error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/debt-calculator")
async def debt_calculator(request: DebtCalculatorRequest):
    """Calculate optimal debt repayment strategy"""
    try:
        model = get_gemini_model()
        
        loans_info = "\n".join([f"- {l.get('name', 'Loan')}: ₹{l.get('amount', 0)}, {l.get('interestRate', 0)}% APR, min ₹{l.get('minPayment', 0)}/month" 
                                for l in request.loans])
        
        prompt = f"""You are a financial advisor helping a student create a debt repayment plan.

LOANS:
{loans_info}

Monthly budget for debt repayment: ₹{request.monthlyBudget}
Strategy preference: {request.strategy} (avalanche = highest interest first, snowball = smallest balance first)

Create a detailed repayment plan that shows:
1. Monthly payment allocation for each loan
2. Estimated payoff timeline
3. Total interest saved compared to minimum payments
4. Month-by-month projection for the first 12 months

Return ONLY valid JSON:
{{
    "strategy": "{request.strategy}",
    "totalDebt": 0,
    "monthlyPayment": {request.monthlyBudget},
    "estimatedPayoffMonths": 0,
    "totalInterestSaved": 0,
    "paymentOrder": ["Loan names in order of priority"],
    "monthlyBreakdown": [
        {{"month": 1, "payments": [{{"loan": "...", "amount": 0, "remaining": 0}}], "totalRemaining": 0}}
    ],
    "tips": ["Money saving tips"],
    "debtFreeDate": "Month Year"
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "plan": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to generate debt plan"}
            
    except Exception as e:
        print(f"Debt calculator error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/micro-gigs")
async def find_micro_gigs(request: MicroGigRequest):
    """Find suitable micro-gigs based on skills and availability"""
    try:
        model = get_gemini_model()
        
        prompt = f"""You are a career advisor helping a college student find micro-gigs.

STUDENT PROFILE:
- Skills: {', '.join(request.skills)}
- Availability: {request.availability}
- Preference: {request.preferredType} work

Find 8-10 suitable micro-gig opportunities. Include:
1. Platform-based gigs (Fiverr, Upwork, Toptal, etc.)
2. Local opportunities (tutoring, freelance, etc.)
3. Student-specific opportunities

Return ONLY valid JSON:
{{
    "gigs": [
        {{
            "title": "Gig title",
            "platform": "Platform name or 'Local'",
            "type": "online/offline",
            "earningPotential": "₹X - ₹Y per hour/task",
            "skillMatch": 85,
            "requirements": ["Requirement 1"],
            "howToStart": "Brief steps to get started",
            "pros": ["Pro 1"],
            "cons": ["Con 1"]
        }}
    ],
    "topRecommendation": "Best gig based on profile",
    "weeklyEarningEstimate": "₹X - ₹Y",
    "tips": ["Tip for maximizing earnings"]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "gigs": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to find gigs"}
            
    except Exception as e:
        print(f"Micro gigs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/subscription-audit")
async def subscription_audit(request: SubscriptionAuditRequest):
    """Audit subscriptions and suggest optimizations"""
    try:
        model = get_gemini_model()
        
        subs_info = "\n".join([f"- {s.get('name', 'Sub')}: ₹{s.get('cost', 0)}/{s.get('frequency', 'monthly')}, Usage: {s.get('usage', 'medium')}" 
                               for s in request.subscriptions])
        
        prompt = f"""You are a financial advisor auditing a student's subscriptions.

CURRENT SUBSCRIPTIONS:
{subs_info}

Monthly Income: ₹{request.monthlyIncome}

Analyze each subscription and provide:
1. Value assessment (keep/cancel/downgrade)
2. Alternative suggestions
3. Total potential savings
4. Subscription-to-income ratio analysis

Return ONLY valid JSON:
{{
    "totalMonthly": 0,
    "percentOfIncome": 0,
    "verdict": "healthy/concerning/critical",
    "subscriptions": [
        {{
            "name": "...",
            "currentCost": 0,
            "recommendation": "keep/cancel/downgrade",
            "reason": "Why this recommendation",
            "alternative": "Cheaper alternative or null",
            "potentialSaving": 0
        }}
    ],
    "totalPotentialSavings": 0,
    "yearlyImpact": 0,
    "tips": ["Money saving tips"],
    "studentDiscounts": ["Available student discounts"]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "audit": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to audit subscriptions"}
            
    except Exception as e:
        print(f"Subscription audit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/grant-writer")
async def grant_writer(request: GrantWriterRequest):
    """AI-powered grant writing assistant"""
    try:
        model = get_gemini_model()
        
        prompt = f"""You are an expert grant writing consultant helping a student write a grant application.

PROJECT DETAILS:
- Title: {request.projectTitle}
- Description: {request.projectDescription}
- Grant Type: {request.grantType}
- Requested Amount: ₹{request.requestedAmount}

Generate a complete grant application framework with:
1. Executive Summary
2. Problem Statement
3. Project Objectives
4. Methodology
5. Budget Justification
6. Expected Outcomes
7. Evaluation Plan

Return ONLY valid JSON:
{{
    "title": "{request.projectTitle}",
    "executiveSummary": "150-word compelling summary",
    "problemStatement": "Clear problem definition",
    "objectives": ["Objective 1", "Objective 2"],
    "methodology": "Step-by-step approach",
    "timeline": [
        {{"phase": "Phase 1", "duration": "X months", "activities": "..."}}
    ],
    "budgetBreakdown": [
        {{"category": "Equipment", "amount": 0, "justification": "..."}}
    ],
    "expectedOutcomes": ["Outcome 1"],
    "evaluationPlan": "How success will be measured",
    "sustainability": "Long-term impact and sustainability",
    "tips": ["Grant writing tips"]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "grant": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to generate grant"}
            
    except Exception as e:
        print(f"Grant writer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-plan")
async def create_study_plan(request: StudyPlanRequest):
    """Create a personalized study plan with Pomodoro sessions"""
    try:
        model = get_gemini_model()
        
        prompt = f"""Create a structured study plan for a student.

STUDY SESSION DETAILS:
- Topic: {request.topic}
- Duration: {request.duration}
- Goal: {request.goal}

Create a Pomodoro-style study plan that includes:
1. Pre-study preparation (5 min)
2. Study sessions (25 min each)
3. Short breaks (5 min)
4. Long break every 4 sessions (15-20 min)
5. Post-study review

Return ONLY valid JSON:
{{
    "topic": "{request.topic}",
    "totalDuration": "{request.duration}",
    "sessions": [
        {{
            "sessionNumber": 1,
            "type": "study",
            "duration": 25,
            "focus": "Subtopic or activity",
            "objectives": ["What to achieve"],
            "techniques": ["Active recall", "etc"]
        }},
        {{
            "sessionNumber": 2,
            "type": "break",
            "duration": 5,
            "activity": "Short stretch"
        }}
    ],
    "materials": ["Recommended resources"],
    "preStudyChecklist": ["Gather notes", "etc"],
    "reviewTasks": ["What to review after"],
    "groupStudyTips": ["If studying with peers"],
    "motivationalTip": "Encouraging message"
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "plan": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to generate study plan"}
            
    except Exception as e:
        print(f"Study plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/digital-detox")
async def digital_detox(request: DigitalDetoxRequest):
    """Generate a personalized digital detox plan"""
    try:
        model = get_gemini_model()
        
        total_screen = sum(request.screenTime.values())
        
        prompt = f"""Create a personalized digital detox plan for a student.

CURRENT SCREEN TIME (daily):
- Social Media: {request.screenTime.get('social', 0)} hours
- Entertainment: {request.screenTime.get('entertainment', 0)} hours
- Productive Work: {request.screenTime.get('productive', 0)} hours
- Total: {total_screen} hours

Detox Goal: {request.goal} (gentle = 10-20% reduction, moderate = 30-40%, aggressive = 50%+)
Current Mood Score: {request.currentMood or 'Unknown'}/10

Create a realistic, achievable detox plan that:
1. Gradually reduces non-productive screen time
2. Preserves productive use
3. Suggests healthy alternatives
4. Includes specific time blocks

Return ONLY valid JSON:
{{
    "targetReduction": "Xh reduction",
    "dailySchedule": [
        {{"time": "7:00 AM", "activity": "No phone for first 30 min", "emoji": "🌅"}},
        {{"time": "12:00 PM", "activity": "Phone-free lunch", "emoji": "🍽️"}}
    ],
    "alternatives": ["Activity to replace screen time"],
    "tips": ["Success tips"],
    "weeklyMilestones": ["Week 1: ...", "Week 2: ..."],
    "expectedBenefits": ["Better sleep", "Improved focus"]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "plan": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to generate detox plan"}
            
    except Exception as e:
        print(f"Digital detox error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/wellness-insights")
async def wellness_insights(request: WellnessInsightsRequest):
    """Analyze wellness data and provide personalized insights"""
    try:
        model = get_gemini_model()
        
        wellness = request.wellness
        
        prompt = f"""Analyze this student's wellness data and provide personalized mental health insights.

WELLNESS DATA:
- Sleep: {wellness.get('sleepHours', 0)} hours
- Water intake: {wellness.get('waterGlasses', 0)} glasses
- Exercise: {wellness.get('exerciseMinutes', 0)} minutes
- Caffeine: {wellness.get('caffeine', 0)} cups
- Stress Level: {wellness.get('stressLevel', 5)}/10
- Average Mood Score: {request.averageMood or 'Unknown'}/10

Recent Mood History: {request.moodHistory}

Provide a comprehensive wellness analysis with:
1. Overall wellness score (0-100)
2. Personalized analysis
3. Specific recommendations
4. Mood-wellness correlations

Return ONLY valid JSON:
{{
    "overallScore": 75,
    "analysis": "Based on your data, your wellness shows...",
    "recommendations": [
        {{"title": "Improve Sleep", "description": "Aim for 7-8 hours", "emoji": "😴", "priority": "high"}},
        {{"title": "Stay Hydrated", "description": "Increase to 8 glasses", "emoji": "💧", "priority": "medium"}}
    ],
    "moodCorrelation": "Your mood tends to be higher when you sleep more and exercise regularly.",
    "strengths": ["Good exercise routine", "Moderate caffeine"],
    "areasToImprove": ["Sleep consistency", "Stress management"],
    "dailyGoals": ["Get to bed by 11 PM", "Drink water before meals"]
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        try:
            data = json.loads(response_text)
            return {"success": True, "insights": data}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to generate wellness insights"}
            
    except Exception as e:
        print(f"Wellness insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
