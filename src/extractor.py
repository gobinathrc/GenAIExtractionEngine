"""
Core logic for integrating with OpenAI and RAG (Retrieval-Augmented Generation).
"""
import os
import httpx
from openai import OpenAI
from dotenv import load_dotenv
from .models import ExtractionResult

load_dotenv(".env.txt") 

KNOWLEDGE_BASE = {
    "paris": "Internal Database Alert: Only 2 pet-friendly hotels left in Paris. Standard parking is 25 EUR/day.",
    "miami": "Internal Database Alert: Beachfront hotels require a 2-night minimum. EV charging is free."
}

class GenAIExtractor:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is missing.")
            
        # RENDER NETWORK FIX: Force the connection to use IPv4 instead of IPv6
        custom_transport = httpx.HTTPTransport(local_address="0.0.0.0")
        custom_client = httpx.Client(transport=custom_transport)
        
        # Pass the custom client into OpenAI
        self.client = OpenAI(api_key=api_key, http_client=custom_client)
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        
    def retrieve_knowledge(self, user_text: str) -> str:
        """RAG Step 1: Retrieve context from the internal database."""
        retrieved = []
        text_lower = user_text.lower()
        for keyword, data in KNOWLEDGE_BASE.items():
            if keyword in text_lower:
                retrieved.append(data)
        return " | ".join(retrieved) if retrieved else "No internal data found for this location."

    def extract(self, text: str, context: str = None) -> ExtractionResult:
        if not text.strip():
            raise ValueError("Input text cannot be empty.")
            
        internal_context = self.retrieve_knowledge(text)
            
        system_prompt = (
            "You are an expert data extraction agent. Extract structured entities from the "
            "unstructured text according to the JSON schema.\n\n"
            f"--- INTERNAL DATABASE CONTEXT ---\n{internal_context}\n---------------------------------\n"
            "Use the internal context to inform your summary and extractions if relevant."
        )
        
        if context:
            system_prompt += f"\nAdditional Context: {context}"

        try:
            completion = self.client.beta.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                response_format=ExtractionResult,
                temperature=0.1
            )
            
            result = completion.choices[0].message.parsed
            
            if result is None:
                raise ValueError("Model refused to provide structured output.")
                
            if not result.entities:
                result.requires_human_review = True
                
            result.summary += f" [RAG Applied: {internal_context}]"
                
            return result
            
        except Exception as e:
            raise RuntimeError(f"LLM Extraction failed: {str(e)}")