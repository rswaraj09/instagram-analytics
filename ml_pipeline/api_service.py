"""
FastAPI Microservice for Instagram AI ML Pipeline.
Serves endpoints for AI Analyzer, AI Content Studio, Performance Predictor, and Competitor Insights.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

from models import (
    HashtagRecommenderModel,
    CaptionGeneratorModel,
    PerformancePredictionModel,
    AccountAnalyzerEngine
)

app = FastAPI(
    title="Instagram AI ML Intelligence Microservice",
    version="1.0.0",
    description="Dedicated ML Service for Instagram Analytics & AI Content Generation"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate models
hashtag_model = HashtagRecommenderModel()
caption_model = CaptionGeneratorModel()
prediction_model = PerformancePredictionModel()
account_engine = AccountAnalyzerEngine()

class AccountAnalysisRequest(BaseModel):
    account_id: str
    followers: int = 10000
    total_posts: int = 45
    total_reels: int = 30
    total_stories: int = 12
    avg_engagement_rate: float = 2.8

class ContentGenerationRequest(BaseModel):
    topic: str
    category: str = "General"
    target_audience: str = "General Audience"
    language: str = "en"
    content_type: str = "POST"
    image_or_video_ref: Optional[str] = None

class PerformancePredictionRequest(BaseModel):
    content_type: str = "POST"
    caption: str
    hashtags: List[str] = []

@app.get("/")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Instagram AI ML Pipeline",
        "version": "1.0.0",
        "models_loaded": ["HashtagRecommender", "CaptionGenerator", "PerformancePredictor", "AccountAnalyzerEngine"]
    }

@app.post("/ai/analyze-account")
def analyze_account(req: AccountAnalysisRequest):
    try:
        metrics = req.model_dump()
        result = account_engine.analyze_account(metrics)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/generate-content")
def generate_content(req: ContentGenerationRequest):
    try:
        captions = caption_model.generate_captions(req.topic, req.category, req.target_audience, req.language)
        hashtags = hashtag_model.predict_hashtags(req.category, req.topic)
        prediction = prediction_model.predict_performance(req.content_type, captions["engaging_caption"], hashtags["recommended_combinations"])
        
        return {
            "status": "success",
            "data": {
                "titles": captions["titles"],
                "captions": {
                    "short": captions["short_caption"],
                    "professional": captions["professional_caption"],
                    "engaging": captions["engaging_caption"],
                    "storytelling": captions["storytelling_caption"]
                },
                "hashtags": hashtags,
                "predicted_score": prediction
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/predict-performance")
def predict_performance(req: PerformancePredictionRequest):
    try:
        result = prediction_model.predict_performance(req.content_type, req.caption, req.hashtags)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
