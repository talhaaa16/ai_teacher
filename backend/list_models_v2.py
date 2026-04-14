
import os
from google import genai
from django.conf import settings
import django
import sys

sys.path.append('d:/Projects/AI-Teacher/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

client = genai.Client(api_key=settings.GEMINI_API_KEY)

with open('model_list_full.txt', 'w') as f:
    f.write("Available Gemini Models:\n")
    for model in client.models.list():
        f.write(f"{model.name}\n")
print("Done writing to model_list_full.txt")
