
import os
from google import genai
from django.conf import settings
import django
import sys

sys.path.append('d:/Projects/AI-Teacher/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

client = genai.Client(api_key=settings.GEMINI_API_KEY)

print("Listing models:")
for model in client.models.list():
    print(f"Name: {model.name}")
