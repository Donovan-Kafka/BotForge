-- Add staff-user seat limits to subscription plans.
-- Run this for existing databases created before staff_user_limit existed.

ALTER TABLE subscription
ADD COLUMN IF NOT EXISTS staff_user_limit INT;

UPDATE subscription
SET staff_user_limit = CASE
    WHEN subscription_id = 1 THEN 3
    WHEN subscription_id = 2 THEN 10
    WHEN subscription_id = 3 THEN 25
    ELSE 3
END
WHERE staff_user_limit IS NULL OR staff_user_limit <= 0;

ALTER TABLE subscription
ALTER COLUMN staff_user_limit SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_subscription_staff_user_limit_positive'
    ) THEN
        ALTER TABLE subscription
        ADD CONSTRAINT ck_subscription_staff_user_limit_positive
        CHECK (staff_user_limit > 0);
    END IF;
END $$;
