# import os

# import anthropic
# from dotenv import load_dotenv


# load_dotenv()

# api_key = os.getenv("ANTHROPIC_API_KEY")

# if not api_key:
#     raise RuntimeError(
#         "ANTHROPIC_API_KEY is missing. Add it to backend/.env."
#     )

# client = anthropic.Anthropic(api_key=api_key)


# def ask_claude(user_message: str) -> str:
#     response = client.messages.create(
#         model="claude-opus-5",
#         max_tokens=1000,
#         system=(
#             "You are a helpful AI assistant. "
#             "Answer clearly and accurately."
#         ),
#         messages=[
#             {
#                 "role": "user",
#                 "content": user_message,
#             }
#         ],
#     )

#     text_blocks = [
#         block.text
#         for block in response.content
#         if block.type == "text"
#     ]

#     return "\n".join(text_blocks).strip()