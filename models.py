from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class ProcessingStatus(enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    APPROVED = "approved"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # "student" or "lecturer"
    created_at = Column(DateTime, default=datetime.utcnow)

class Handout(Base):
    __tablename__ = "handouts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    file_url = Column(String)
    status = Column(SQLEnum(ProcessingStatus), default=ProcessingStatus.UPLOADED)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    topics = relationship("Topic", back_populates="handout")
    chunks = relationship("ContentChunk", back_populates="handout")

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    handout_id = Column(Integer, ForeignKey("handouts.id"))
    name = Column(String)
    
    handout = relationship("Handout", back_populates="topics")

class ContentChunk(Base):
    __tablename__ = "content_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    handout_id = Column(Integer, ForeignKey("handouts.id"))
    text = Column(Text)
    embedding = Column(Text)  # Store as JSON string for now
    confidence = Column(Float, default=1.0)
    page_number = Column(Integer, nullable=True)
    
    handout = relationship("Handout", back_populates="chunks")

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True, index=True)
    handout_id = Column(Integer, ForeignKey("handouts.id"))
    question = Column(Text)
    answer = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    handout_id = Column(Integer, ForeignKey("handouts.id"))
    questions_json = Column(Text)  # Store as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)