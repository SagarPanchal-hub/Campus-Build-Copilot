# import os

# import anthropic
# from dotenv import load_dotenv


# # Load variables from backend/.env
# load_dotenv()

# api_key = os.getenv("ANTHROPIC_API_KEY")

# if not api_key:
#     raise RuntimeError(
#         "ANTHROPIC_API_KEY was not found. "
#         "Check that backend/.env exists and contains your API key."
#     )

# client = anthropic.Anthropic(api_key=api_key)

# response = client.messages.create(
#     model="claude-haiku-4-5-20251001",
#     max_tokens=20,
#     messages=[
#         {
#             "role": "user",
#             "content": "Say hello in one short sentence.",
#         }
#     ],
# )

# for block in response.content:
#     if block.type == "text":
#         print("\nClaude response:")
#         print(block.text)