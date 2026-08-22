"""
Text Preprocessing & Feature Extraction for Instagram AI Pipeline
"""

import re
from typing import List

class TextPreprocessor:
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'[^\w\s#]', '', text)
        return text.strip()

    @staticmethod
    def extract_hashtags(text: str) -> List[str]:
        if not text:
            return []
        return [tag.lower() for tag in re.findall(r'#\w+', text)]

    @staticmethod
    def normalize_hashtag(tag: str) -> str:
        tag = tag.strip()
        if not tag.startswith("#"):
            tag = "#" + tag
        return tag.lower()
