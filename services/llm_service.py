import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def suggest_topics(text):
    """Extract 3-5 topic tags from handout text"""
    
    prompt = f"""Extract 3-5 key topics/concepts from this educational handout.
Return ONLY a JSON array of topic names, nothing else.

Example: ["Fourier Transform", "Signal Processing", "Frequency Domain"]

Handout text:
{text[:3000]}  # First 3000 chars

JSON array of topics:"""

    response = client.chat.completions.create(
        model="mixtral-8x7b-32768",
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
        model="mixtral-8x7b-32768",
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
    
    prompt = f"""Generate a quiz from this handout.
Create 5 multiple choice questions and 2 short answer questions.

Return ONLY a JSON object with this exact format:
{{
  "mcq": [
    {{
      "question": "What is X?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct": "A",
      "explanation": "The answer is A because..."
    }}
  ],
  "short_answer": [
    {{
      "question": "Explain the concept of Y",
      "sample_answer": "Y is...",
      "key_points": ["Point 1", "Point 2"]
    }}
  ]
}}

Handout text:
{text[:4000]}

JSON quiz:"""

    response = client.chat.completions.create(
        model="mixtral-8x7b-32768",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=3000
    )
    
    try:
        quiz = json.loads(response.choices[0].message.content)
        return quiz
    except Exception as e:
        print(f"Error parsing quiz: {e}")
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
        model="mixtral-8x7b-32768",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500
    )
    
    return {
        "answer": response.choices[0].message.content,
        "sources": context_chunks  # Return source chunks for citation
    }