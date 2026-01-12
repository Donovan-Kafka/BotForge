class GetHighlightedFeatures:
    def __init__(self, feature_repository):
        self.feature_repository = feature_repository

    def execute(self, subscription_id: int):
        rows = self.feature_repository.get_highlighted_features(subscription_id)

        return {
            "features": [
                {
                    "id": feature_id,
                    "name": name,
                    "description": description
                }
                for feature_id, name, description, _ in rows
            ]
        }
