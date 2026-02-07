-- Keep default plan descriptions aligned with seat-based plans.
-- Do not mention conversation quotas in descriptions.

UPDATE subscription
SET description = CASE
    WHEN subscription_id = 1 THEN 'Best for small teams or startups. Covers essential chatbot features.'
    WHEN subscription_id = 2 THEN 'Ideal for growing businesses. Includes enhanced analytics.'
    WHEN subscription_id = 3 THEN 'Designed for large organizations. Full access to premium and enterprise features.'
    ELSE description
END
WHERE subscription_id IN (1, 2, 3);
