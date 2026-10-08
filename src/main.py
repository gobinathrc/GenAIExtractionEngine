from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import ExtractionRequest, ExtractionResult
from .extractor import GenAIExtractor

app = FastAPI(title="GenAI Extraction Engine", version="1.0.0")

# Change this block in src/main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # <--- CHANGE THIS TO FALSE
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the extractor
try:
    extractor = GenAIExtractor()
except RuntimeError as e:
    print(f"Startup Warning: {e}")
    extractor = None

# ... (Keep your existing @app.post and @app.get routes below this) ...

@app.post("/api/v1/extract", response_model=ExtractionResult)
async def perform_extraction(request: ExtractionRequest):
    """Endpoint to process unstructured text and return structured data."""
    if not extractor:
        raise HTTPException(status_code=500, detail="Extractor not initialized. Check API keys.")
        
    try:
        return extractor.extract(text=request.text, context=request.context)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "extractor_loaded": extractor is not None}
import httpx

@app.get("/api/v1/diagnose-network")
async def diagnose_network():
    """Diagnostic tool to test if Render's network is blocking OpenAI."""
    try:
        # Try to ping OpenAI directly bypassing the SDK
        with httpx.Client(timeout=10.0) as client:
            response = client.get("https://api.openai.com/v1/")
            return {
                "network_status": "Connected to OpenAI successfully!", 
                "http_status_code": response.status_code,
                "response_text": response.text
            }
    except Exception as e:
        return {
            "network_status": "FAILED - Network Blocked", 
            "error_message": str(e),
            "error_type": str(type(e))
        }