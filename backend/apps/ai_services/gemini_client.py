"""
Gemini AI client for code review and conversation.
Updated to use the newer google-genai package.
"""
from google import genai
from google.genai import types
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class GeminiClient:
    """
    Client for interacting with Google Gemini API using google-genai package.
    """
    
    def __init__(self):
        """Initialize Gemini client with API key."""
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "your_gemini_api_key_here":
            logger.error("!!! GEMINI_API_KEY is missing or invalid in settings !!!")
            
        self.client = genai.Client(api_key=api_key)
        # Use specifically requested model
        self.model_id = 'gemini-2.5-flash'
        logger.info(f"Gemini initialized using model ID: {self.model_id}")
    
    def generate_content(self, prompt: str, temperature: float = 0.7) -> str:
        """
        Generate content using Gemini.
        
        Args:
            prompt: Input prompt
            temperature: Sampling temperature (0-1)
            
        Returns:
            Generated text response
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise
    
    def generate_json_content(self, prompt: str) -> str:
        """
        Generate JSON-formatted content using Gemini.
        
        Args:
            prompt: Input prompt requesting JSON output
            
        Returns:
            Generated JSON string
        """
        return self.generate_content(prompt, temperature=0.3)
