from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import anthropic

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    system_prompt: str
    user_message: str

api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found in environment variables")

@app.options("/chat")
async def options_chat():
    return {}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1500,
            system=request.system_prompt,
            messages=[
                {"role": "user", "content": request.user_message}
            ]
        )
        return {
            "status": "success",
            "response": message.content[0].text
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)