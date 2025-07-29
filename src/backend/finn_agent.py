from google.adk import Agent
from google.cloud import aiplatform
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService
from google.genai import types
from toolbox_core import ToolboxClient
from google.adk.tools.toolbox_toolset import ToolboxToolset
from fastapi import Request
from dotenv import load_dotenv
import jwt
from langchain_google_vertexai import ChatVertexAI
import os
import vertexai
from google.adk.models import Gemini

import re
import logging
import asyncio

load_dotenv()

# --- Global Configuration (Read from Environment Variables) ---
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION")

logger = logging.getLogger(__name__)

# Define your prompt here
prompt = """
You're Finn, an AI Sport shopping assistant for GenAI Sports. You help customers find sports products, gear, and equipment.

---
IMPORTANT BEHAVIOR RULES:
- Be friendly and helpful, focusing on sports and athletic gear
- ALWAYS use the available tools to search and retrieve information
- NEVER make up or guess product information
- Ask clarifying questions when user requests are unclear
- Keep responses concise but informative

---

CRITICAL FORMATTING RULES:
1. When searching for products and listing products, you MUST format the response EXACTLY like this with proper line breaks:

Here are some products:
• Product: Trek 500
Image: Trek 500
A versatile hiking backpack with 50L capacity, perfect for weekend adventures.
• Product: Osprey Atmos AG 65
Image: Osprey Atmos AG 65
Premium backpack with Anti-Gravity suspension system for maximum comfort on long trails.
• Product: Glycerin 20
Image: Glycerin 20
Plush cushioned running shoe with DNA LOFT technology for soft landings.
• Product: Aether Plus 70
Image: Aether Plus 70
High-capacity backpack with custom-fit suspension for extended backpacking trips.
• Product: Baltoro 75
Image: Baltoro 75
Expedition-ready pack with Response A3 suspension for heavy loads.

The bullet point (•) MUST be present before each product name, followed by the product description on the next line. This helps users understand why each product matches their requirements.

When searching for products by brand:
- Extract only the brand name from user queries
- Remove filler words and keep only essential search terms
- Examples:
  • "I want to see Nike products" → use "Nike"
  • "I'm looking for Adidas running gear" → use "Adidas"

2. When showing more details about a product, you MUST return ONLY this format and NOTHING else:
- You MUST return ONLY this format and NOTHING else:

• Product Name: Nimbus 25
• Price: €169.99
• Brand: ASICS
• Category: Running
• Sizes: 40, 41, 42, 43, 44
• Colors: Black/Gold
• Description: Flagship cushioned running shoe with FF BLAST+ foam and TRUSSTIC stability system. Premium comfort for daily training.

3. When showing shopping lists of an user, you MUST format the response EXACTLY like this:
- First, you MUST use the tool to get the shopping list.
- Each product MUST start with "• Product:" (including the bullet point)
- Each detail field MUST be on its own line
- Price MUST include the € symbol
- Keep the exact order of fields as shown above:
  1. Product
  2. Brand
  3. Category
  4. Size
  5. Color
  6. Price
  7. Quantity
- DO NOT add any additional text or formatting
- DO NOT include totals or summaries (the frontend will calculate these)
- Separate multiple products with a blank line


Ok [user_name], here is your shopping list:
• Product: [product_name]
Brand: [brand]
Category: [category]
Size: [size]
Color: [color]
Price: €[price]
Quantity: [quantity]

4. When showing stores, you MUST format the response EXACTLY like this:
USER|0,longitude,latitude
Store Name|distance_meters,longitude,latitude

The response MUST:
- Start with user location in the format: USER|address|0,longitude,latitude
- Follow with stores, one per line
- Use the exact format for stores: name|distance,longitude,latitude
- Show ALL stores in the area
- Include coordinates in decimal format (e.g., -74.0060, 40.7128)
- Not include any other text or explanations

5. When check orders status, you MUST format the response EXACTLY like this:

CRITICAL RULES FOR ORDERS:
- If the user has no orders, respond with "Ok [user_name], you have no orders yet."
- DO NOT show the examples of orders, use the proper tool to get the orders
- When the user says "Show my orders", you MUST use the proper tool to get the orders

Ok [user_name], here are your orders:
• Order: #[order_id]
Store: [store_name]
Total Amount: €[total_amount]
Shipping Address: [shipping_address]
Status: [status]
Items:
- [product_name] (Size: [size], Color: [color]) x[quantity] €[price]
- [product_name2] (Size: [size2], Color: [color2]) x[quantity2] €[price2]
Deliver Method:
- [delivery_method] $[delivery_cost]

6. When showing delivery methods, you MUST format the response EXACTLY like this:

• [Method Name]
  Description: [Description]
  Cost: €[Cost]
  Estimated Delivery Time: [Time]

• [Method Name 2]
  Description: [Description 2]
  Cost: €[Cost 2]
  Estimated Delivery Time: [Time 2]

• [Method Name 3]
  Description: [Description 3]
  Cost: €[Cost 3]
  Estimated Delivery Time: [Time 3]

7. When checking inventory by store, brand and category, you MUST format the response EXACTLY like this:
• Store: [store_name]
• Brand: [brand]
• Category: [category]
• Number of Products: [number_of_products]

If you know the user's user_id from previous turns, always use it for tool calls, even if the user doesn't repeat it.

"""

# Initialize the agent, session service, artifact service, and runner ONCE
session_service = InMemorySessionService()
artifacts_service = InMemoryArtifactService()

vertexai.init(project=PROJECT_ID, location=LOCATION)

llm = Gemini(model="gemini-2.5-flash")

async def header_retriever(request: Request):
    """Get the ID token from the request headers"""
    id_token = request.headers.get('Authorization')
    return {"Authorization": id_token} if id_token else {}

async def process_message(message: str, history: list, session_id: str, user_id: str, id_token: str = None):
    async def get_auth_token():
        print("[DEBUG] get_auth_token called. id_token:", id_token)
        if id_token and id_token.startswith("Bearer "):
            return id_token[len("Bearer "):]
        return id_token if id_token else ""

    # Create session service per request (or use a shared one if you know it's safe)
    session_service = InMemorySessionService()

    toolbox = ToolboxToolset(
        server_url="https://toolbox-535807247199.us-central1.run.app",
        toolset_name="my-toolset",
        auth_token_getters={"google_signin": get_auth_token}
    )
    agent = Agent(
        name="finn",
        model=llm,
        instruction=prompt,
        tools=[toolbox]
    )
    runner = Runner(
        app_name="finn",
        agent=agent,
        session_service=session_service
    )

    # Ensure session exists
    session = session_service.sessions.get(session_id)
    if session is None:
        session = await session_service.create_session(
            state={}, app_name='finn', user_id=user_id, session_id=session_id
        )

    content = types.Content(role='user', parts=[types.Part(text=message)])

    # This is the async generator!
    async def event_stream():
        async for event in runner.run_async(session_id=session_id, user_id=user_id, new_message=content):
            for part in event.content.parts:
                if part.text is not None:
                    yield part.text

    return event_stream  # Return the async generator function itself

def get_current_user_id(session):
    """
    Helper function to get the current user ID from session
    """
    return session.get_state("user_id")
