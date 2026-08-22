"""
Model evaluation script for AI Instagram Pipeline
"""

import os
import json
from models import HashtagRecommenderModel, CaptionGeneratorModel, PerformancePredictionModel, AccountAnalyzerEngine

def evaluate_pipeline():
    print("Evaluating Instagram AI & ML Pipeline Models...")
    
    # 1. Test Hashtag Recommender
    recommender = HashtagRecommenderModel()
    h_out = recommender.predict_hashtags("Tech", "AI Software")
    assert len(h_out["recommended_combinations"]) > 0, "Hashtag recommender failed"
    print("✓ Hashtag Recommender Evaluation: PASSED")

    # 2. Test Caption Generator
    generator = CaptionGeneratorModel()
    c_out = generator.generate_captions("Instagram Growth", "Business", "Content Creators", "en")
    assert len(c_out["titles"]) >= 3, "Caption Generator failed"
    print("✓ Caption Generator Evaluation: PASSED")

    # 3. Test Performance Predictor
    predictor = PerformancePredictionModel()
    p_out = predictor.predict_performance("REEL", "Amazing reel tips!", ["#viral", "#tech"])
    assert 0 <= p_out["predicted_performance_score"] <= 100, "Performance Predictor failed"
    print("✓ Performance Predictor Evaluation: PASSED")

    # 4. Test Account Analyzer Engine
    analyzer = AccountAnalyzerEngine()
    a_out = analyzer.analyze_account({"followers": 10000, "total_reels": 30, "total_posts": 20, "avg_engagement_rate": 3.2})
    assert 0 <= a_out["health_score"] <= 100, "Account Analyzer failed"
    print("✓ Account Analyzer Evaluation: PASSED")

    print("\nAll ML Pipeline models evaluated successfully. Version 1.0.0 Ready.")

if __name__ == "__main__":
    evaluate_pipeline()
