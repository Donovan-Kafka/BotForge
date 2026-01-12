-- Mock data to test SQL constraints (PostgreSQL)

-- Clear tables (CASCADE handles foreign keys)
TRUNCATE TABLE
  analytics,
  chatbot,
  feedback,
  notification,
  invitation,
  app_user,
  personality,
  organisation,
  subscription_features,
  feature,
  subscription,
  role
RESTART IDENTITY CASCADE;

-- Insert roles
INSERT INTO role (role_id, name, description) VALUES
(0, 'SYS_ADMIN', 'System administrator with full platform access'),
(1, 'ORG_ADMIN', 'Organisation administrator'),
(2, 'OPERATOR', 'Organisation operator');

-- Insert subscriptions
INSERT INTO subscription (name, price, status, description) VALUES
('Standard', 10.00, 0, '300 conversations/month. Best for small teams or startups. Covers essential chatbot features.'),
('Pro', 25.00, 0, '1500 conversations/month. Ideal for growing businesses. Includes enhanced analytics.'),
('Deluxe', 50.00, 0, '5000 conversations/month. Designed for large organizations. Full access to premium & enterprise features.');

-- Insert features (matches landing page cards)
INSERT INTO feature (name, description) VALUES
('Analyze', 'Gain deep insights into customer conversations with real-time analytics.'),
('Train', 'Continuously improve your bot with smart, adaptive learning workflows.'),
('Customize', 'Easily tailor every aspect of your chatbot to match your brand.');

-- Link subscriptions to features
-- display_order defines landing page order (1 = left, 3 = right)
-- Standard
INSERT INTO subscription_features (subscription_id, feature_id, display_order) VALUES
(1, 1, 1), -- Analyze
(1, 2, 2), -- Train
(1, 3, 3); -- Customize

-- Pro
INSERT INTO subscription_features (subscription_id, feature_id, display_order) VALUES
(2, 1, 1),
(2, 2, 2),
(2, 3, 3);

-- Deluxe
INSERT INTO subscription_features (subscription_id, feature_id, display_order) VALUES
(3, 1, 1),
(3, 2, 2),
(3, 3, 3);

-- Insert organisations
INSERT INTO organisation (name, industry, size, subscription_id) VALUES
('Fish & Burgs', 'F&B', 'Small', 3),
('Retailers', 'Retail', 'Medium', 2),
('Edu', 'Education', 'Small', 1);

-- Insert personalities
INSERT INTO personality (name, description, type) VALUES
('Friendly', 'Approachable', 'Supportive'),
('Professional', 'Formal', 'Corporate'),
('Humorous', 'Adds jokes', 'Casual');

-- Insert users
INSERT INTO app_user (
  username, password, email, status, role_id, organisation_id
) VALUES
('Admin', 'pw123', 'admin@test.com', TRUE, 0, NULL),
('bob', 'pw123', 'bob@test.com', FALSE, 1, 2),
('carol', 'pw123', 'carol@test.com', TRUE, 2, 3);

-- Insert FAQs (Top 5, direct replica from wireframe)
INSERT INTO faq (question, answer, status, display_order, user_id) VALUES
('How does the conversation limit work?', 'Each subscription plan has a monthly conversation limit...', 0, 1, 1),
('Do I need technical knowledge to build a chatbot?', 'No technical knowledge is required...', 0, 2, 1),
('Can I customize the chatbot to fit my company branding?', 'Yes, you can customize...', 0, 3, 1),
('What integrations are supported?', 'The chatbot supports integrations...', 0, 4, 1),
('Is my data secure?', 'We prioritize data security...', 0, 5, 1);

-- Insert notifications
INSERT INTO notification (title, content, creation_date, is_read, user_id) VALUES
('Welcome!', 'Welcome to the platform, Alice.', CURRENT_TIMESTAMP, FALSE, 1),
('Reminder', 'Complete your profile, Bob.', CURRENT_TIMESTAMP, FALSE, 2);

-- Insert feedback
INSERT INTO feedback (sender_id, title, rating, content) VALUES
(1, 'Outstanding Experience', 5, 'The chatbot delivered an excellent experience with accurate responses and great usability. Highly recommended.'),
(3, 'Reliable and Professional', 4, 'Alice consistently demonstrates professionalism and delivers quality work that adds real value to the team.');

-- Insert chatbots
INSERT INTO chatbot (name, description, creation_date, organisation_id, personality_id) VALUES
('SupportBot', 'Helps with customer support', CURRENT_TIMESTAMP, 1, 1),
('EduBot', 'Helps with learning', CURRENT_TIMESTAMP, 3, 3);

-- Insert analytics
INSERT INTO analytics (bot_id, date, total_messages, avg_response_time, user_satisfaction, peak_hour, top_intents) VALUES
(1, '2026-01-06', 150, 2.5, 4.8, 15, '["greeting","faq"]'),
(2, '2026-01-06', 80, 3.2, 4.2, 10, '["lesson_query","quiz"]');
