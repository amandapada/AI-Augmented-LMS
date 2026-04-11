import os
from groq import Groq
import base64
from PyPDF2 import PdfReader
from PIL import Image
import io

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PyPDF2 first, then VLM for scanned pages"""
    
    # Try text extraction first (faster for typed PDFs)
    reader = PdfReader(pdf_path)
    full_text = ""
    low_confidence_pages = []
    
    for page_num, page in enumerate(reader.pages):
        text = page.extract_text()
        
        if len(text.strip()) < 50:  # Likely scanned/image
            low_confidence_pages.append(page_num)
        else:
            full_text += f"\n\n=== Page {page_num + 1} ===\n{text}"
    
    return {
        "text": full_text,
        "confidence": 0.9 if len(low_confidence_pages) == 0 else 0.6,
        "low_confidence_pages": low_confidence_pages
    }

def extract_text_from_image(image_path):
    """Extract text from image using Groq Vision"""
    
    # Convert image to base64
    with open(image_path, "rb") as image_file:
        image_data = base64.b64encode(image_file.read()).decode('utf-8')
    
    # Call Groq Vision API
    try:
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all text from this image. Return the text exactly as it appears, maintaining structure and formatting."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        return {
            "text": response.choices[0].message.content,
            "confidence": 0.8
        }
    except Exception as e:
        return {
            "text": "",
            "confidence": 0.0,
            "error": str(e)
        }