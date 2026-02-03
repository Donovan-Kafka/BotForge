from flask import Blueprint, jsonify, request
from backend.data_access.Features.features import FeatureRepository
from backend.application.Features.featureServices import GetHighlightedFeatures

# BP for feature endpoints
features_bp = Blueprint("features", __name__)


@features_bp.get("/features/highlighted")
def highlighted_features():
    """
    GET /api/features/highlighted?subscription_id=1
    Returns highlighted features for the landing page.
    """

    subscription_id = request.args.get("subscription_id", type=int)

    # Default subscription (optional safety)
    if subscription_id is None:
        return jsonify({"error": "subscription_id is required"}), 400

    feature_repo = FeatureRepository()
    get_highlighted_features = GetHighlightedFeatures(feature_repo)

    result = get_highlighted_features.execute(subscription_id)

    return jsonify(result), 200
