"""LLM prompt templates.

Kept as plain strings with ``str.format`` placeholders so they can be edited
without touching Python logic. No behaviour lives in this module.
"""

from __future__ import annotations


TOPIC_SUGGESTION = """Extract 3-5 key topics/concepts from this educational handout.
Return ONLY a JSON array of topic names, nothing else.

Example: ["Fourier Transform", "Signal Processing", "Frequency Domain"]

Handout text:
{text}

JSON array of topics:"""


FLASHCARD_GENERATION = """Generate 10 flashcards from this handout for students to study.

Return ONLY a JSON array with this exact format:
[
  {{"question": "What is X?", "answer": "X is..."}},
  {{"question": "Define Y", "answer": "Y is defined as..."}}
]

Make questions clear and answers concise (1-3 sentences).
Cover key concepts, definitions, and important details.

Handout text:
{text}

JSON array of flashcards:"""


MCQ_GENERATION = """Create exactly 5 multiple choice questions from this educational content.

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
{text}

JSON array:"""


SHORT_ANSWER_GENERATION = """Create exactly 2 short answer questions from this educational content.

Return ONLY valid JSON array (no markdown, no ```):

[
  {{
    "question": "Explain the concept of X",
    "sample_answer": "X is defined as...",
    "key_points": ["Point 1", "Point 2", "Point 3"]
  }}
]

Content:
{text}

JSON array:"""


RAG_ANSWER = """Answer the student's question using ONLY the provided handout context.

Rules:
- If the answer is not in the context, say "I don't have that information in this handout."
- Cite which part of the handout you used (e.g., "According to the section on...")
- Be concise and clear

Context from handout:
{context}

Student question: {question}

Answer:"""


VLM_IMAGE_OCR = (
    "Extract all text from this image. Return the text exactly as it appears, "
    "maintaining structure and formatting."
)
