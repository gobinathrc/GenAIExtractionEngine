from pydantic import BaseModel, Field
from typing import List, Optional

# This was the missing class!
class ExtractionRequest(BaseModel):
    text: str
    context: Optional[str] = None

class ExtractedEntity(BaseModel):
    name: str
    value: str
    confidence: float

class ExtractionResult(BaseModel):
    summary: str
    entities: List[ExtractedEntity]
    requires_human_review: bool
    follow_up_questions: List[str] = Field(
        description="A list of questions to ask the user if subjective or missing data is detected."
    )