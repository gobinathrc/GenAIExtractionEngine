from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import ExtractionRequest, ExtractionResult
from .extractor import GenAIExtractor

app = FastAPI(title="GenAI Extraction Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SLIDING WINDOW MEMORY ---
# Empty list to store the last 5 conversations (10 messages total)
conversation_history = []

extractor = None
try:
    extractor = GenAIExtractor()
except Exception as e:
    print(f"Error initializing extractor: {e}")

@app.post("/api/v1/extract", response_model=ExtractionResult)
async def perform_extraction(request: ExtractionRequest):
    global conversation_history
    
    if not extractor:
        raise HTTPException(status_code=500, detail="Extractor not initialized. Check API keys.")
        
    try:
        # 1. Format the memory history into a readable string
        history_text = ""
        if conversation_history:
            history_text = "--- PREVIOUS CONVERSATION HISTORY ---\n"
            for msg in conversation_history:
                history_text += f"{msg['role'].capitalize()}: {msg['content']}\n"
            history_text += "-------------------------------------\n"

        # 2. Combine the memory with the user's current context
        combined_context = f"{history_text}\nAdditional Request Context: {request.context}"
        
        # 3. Run the extraction
        result = extractor.extract(request.text, context=combined_context)
        
        # 4. Save this new interaction to the memory list
        conversation_history.append({"role": "user", "content": request.text})
        conversation_history.append({"role": "assistant", "content": result.summary})
        
        # 5. Enforce the sliding window (Keep only the last 10 items / 5 pairs)
        conversation_history = conversation_history[-10:]
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}