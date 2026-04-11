import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

def suggest_topics(text):
    """Extract 3-5 topic tags from handout text"""
    
    prompt = f"""Extract 3-5 key topics/concepts from this educational handout.
Return ONLY a JSON array of topic names, nothing else.

Example: ["Fourier Transform", "Signal Processing", "Frequency Domain"]

Handout text:
{text[:3000]}

JSON array of topics:"""

    response = client.chat.completions.create(
        model=MODEL,  
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=200
    )
    
    try:
        topics = json.loads(response.choices[0].message.content)
        return topics[:5]  # Max 5
    except:
        # Fallback: extract from response
        content = response.choices[0].message.content
        return [t.strip().strip('"\'') for t in content.split(',')[:5]]

def generate_flashcards(text):
    """Generate 10 flashcards from handout"""
    
    prompt = f"""Generate 10 flashcards from this handout for students to study.

Return ONLY a JSON array with this exact format:
[
  {{"question": "What is X?", "answer": "X is..."}},
  {{"question": "Define Y", "answer": "Y is defined as..."}}
]

Make questions clear and answers concise (1-3 sentences).
Cover key concepts, definitions, and important details.

Handout text:
{text[:4000]}

JSON array of flashcards:"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=2000
    )
    
    try:
        flashcards = json.loads(response.choices[0].message.content)
        return flashcards[:10]
    except Exception as e:
        print(f"Error parsing flashcards: {e}")
        return []

def generate_quiz(text):
    """Generate 5 MCQ + 2 short answer questions"""
    
    if not text or len(text.strip()) < 100:
        print("⚠ Not enough text to generate quiz")
        return {"mcq": [], "short_answer": []}
    
    # Split into two separate calls for better results
    
    # 1. Generate MCQ
    mcq_prompt = f"""Create exactly 5 multiple choice questions from this educational content.

Rules:
- Each question must have 4 options (A, B, C, D)
- Only one correct answer
- Include a brief explanation

Return ONLY valid JSON array (no markdown, no ```):

[
  {{
    "question": "What is X?",
    "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
    "correct": "A",
    "explanation": "The answer is A because..."
  }}
]

Content:
{text[:3000]}

JSON array:"""

    # 2. Generate short answer
    sa_prompt = f"""Create exactly 2 short answer questions from this educational content.

Return ONLY valid JSON array (no markdown, no ```):

[
  {{
    "question": "Explain the concept of X",
    "sample_answer": "X is defined as...",
    "key_points": ["Point 1", "Point 2", "Point 3"]
  }}
]

Content:
{text[:3000]}

JSON array:"""

    try:
        # Get MCQ
        mcq_response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": mcq_prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        
        mcq_raw = mcq_response.choices[0].message.content.strip()
        
        # Clean markdown
        if "```" in mcq_raw:
            mcq_raw = mcq_raw.split("```")[1] if len(mcq_raw.split("```")) > 1 else mcq_raw
            if mcq_raw.startswith("json"):
                mcq_raw = mcq_raw[4:]
        mcq_raw = mcq_raw.strip()
        
        mcq_list = json.loads(mcq_raw)
        
        # Get short answer
        sa_response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": sa_prompt}],
            temperature=0.7,
            max_tokens=1500
        )
        
        sa_raw = sa_response.choices[0].message.content.strip()
        
        # Clean markdown
        if "```" in sa_raw:
            sa_raw = sa_raw.split("```")[1] if len(sa_raw.split("```")) > 1 else sa_raw
            if sa_raw.startswith("json"):
                sa_raw = sa_raw[4:]
        sa_raw = sa_raw.strip()
        
        sa_list = json.loads(sa_raw)
        
        print(f"✓ Generated {len(mcq_list)} MCQ and {len(sa_list)} short answer")
        
        return {
            "mcq": mcq_list[:5],  # Ensure max 5
            "short_answer": sa_list[:2]  # Ensure max 2
        }
        
    except Exception as e:
        print(f"✗ Quiz generation error: {e}")
        print(f"MCQ raw: {mcq_raw if 'mcq_raw' in locals() else 'N/A'}")
        print(f"SA raw: {sa_raw if 'sa_raw' in locals() else 'N/A'}")
        return {"mcq": [], "short_answer": []}
    
def answer_question_with_context(question, context_chunks):
    """RAG: Answer question using handout context"""
    
    context = "\n\n".join([chunk["text"] for chunk in context_chunks])
    
    prompt = f"""Answer the student's question using ONLY the provided handout context.

Rules:
- If the answer is not in the context, say "I don't have that information in this handout."
- Cite which part of the handout you used (e.g., "According to the section on...")
- Be concise and clear

Context from handout:
{context}

Student question: {question}

Answer:"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500
    )
    
    return {
        "answer": response.choices[0].message.content,
        "sources": context_chunks  # Return source chunks for citation
    }