"""
Pydantic models for the GenAI Extraction Engine.
Defines the expected structured output from unstructured text.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class ExtractedEntity(BaseModel):
    """Represents a single extracted entity from the text."""
    name: str = Field(..., description="The name of the entity or variable.")
    value: str = Field(..., description="The extracted value.")
    confidence: float = Field(..., description="Confidence score of the extraction (0.0 to 1.0).")

class ExtractionResult(BaseModel):
    """The final structured output containing all extracted data."""
    summary: str = Field(..., description="A brief summary of the unstructured text.")
    entities: List[ExtractedEntity] = Field(default_factory=list, description="List of extracted entities.")
    requires_human_review: bool = Field(default=False, description="Flag indicating if extraction confidence is low.")

class ExtractionRequest(BaseModel):
    """Payload for the extraction API endpoint."""
    text: str = Field(..., description="The unstructured text to process.")
    context: Optional[str] = Field(None, description="Optional context or instructions for the LLM.")