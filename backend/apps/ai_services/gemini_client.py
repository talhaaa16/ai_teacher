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
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = self._find_available_model()
    
    def _find_available_model(self):
        """Find an available flash model."""
        preferred_models = [
            'gemini-2.5-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-flash-latest'
        ]
        
        try:
            available_models = [m.name for m in self.client.models.list()]
            for preferred in preferred_models:
                # Check for direct match or models/ prefix
                if preferred in available_models:
                    return preferred
                if f"models/{preferred}" in available_models:
                    return f"models/{preferred}"
            
            # Fallback to the first available flash model found in the list
            for m in available_models:
                if 'flash' in m.lower():
                    return m
                    
            return 'gemini-1.5-flash' # Absolute fallback
        except Exception as e:
            logger.error(f"Error listing models: {str(e)}")
            return 'gemini-1.5-flash'
    
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
