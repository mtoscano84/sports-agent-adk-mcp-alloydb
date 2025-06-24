from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, Response, RedirectResponse
from toolbox_core import ToolboxClient  # Change to async client
import logging
import traceback
import uuid
from finn_agent import process_message as finn_chat
from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools.toolbox_toolset import ToolboxToolset
from google.genai import types

# Configure logging to output to console with debug level
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# GCS bucket name
BUCKET_NAME = "sport-store-agent-ai-bck01"

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test")
async def test():
    return {"status": "ok", "message": "Backend is running"}

@app.post("/chat")
async def chat(request: Request):
    try:
        data = await request.json()
        message = data.get('message')
        if not message:
            raise HTTPException(status_code=400, detail="No message field in request")
        
        history = data.get('history', [])
        session_id = data.get('session_id') or str(uuid.uuid4())
        user_id = data.get('user_id') or "default-user"
        
        # Get ID token from Authorization header
        id_token = request.headers.get('Authorization')
        
        # DO NOT AWAIT HERE!
        event_stream = await finn_chat(message, history, session_id, user_id, id_token=id_token)
        # event_stream is an async generator function, so call it to get the generator
        return StreamingResponse(event_stream(), media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/images/{filename}")
async def serve_image(filename: str):
    # Construct the public URL for the image in the GCS bucket.
    # This assumes the bucket has public access enabled.
    public_url = f"https://storage.googleapis.com/{BUCKET_NAME}/images/{filename}"
    
    # Redirect the client directly to the public URL.
    # The browser will handle fetching the image from GCS.
    return RedirectResponse(url=public_url)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 