-- clear tables
TRUNCATE TABLE
  analytics,
  chatbot,
  feedback,
  notification,
  invitation,
  app_user,
  org_role_permission,
  org_permission,
  org_role,
  personality,
  organisation,
  subscription_features,
  feature,
  subscription,
  system_role
RESTART IDENTITY CASCADE;


INSERT INTO system_role (system_role_id, name, description) VALUES
(0, 'SYS_ADMIN', 'System administrator with full platform access'),
(1, 'APP_USER', 'Application user belonging to an organisation');


INSERT INTO subscription (name, price, status, description) VALUES
('Standard', 10.00, 0, '300 conversations/month. Best for small teams or startups. Covers essential chatbot features.'),
('Pro', 25.00, 0, '1500 conversations/month. Ideal for growing businesses. Includes enhanced analytics.'),
('Deluxe', 50.00, 0, '5000 conversations/month. Designed for large organizations. Full access to premium & enterprise features.');


INSERT INTO feature (name, description) VALUES
('Analyze', 'Gain deep insights into customer conversations with real-time analytics.'),
('Train', 'Continuously improve your bot with smart, adaptive learning workflows.'),
('Customize', 'Easily tailor every aspect of your chatbot to match your brand.');


INSERT INTO subscription_features (subscription_id, feature_id, display_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3),
(2, 1, 1), (2, 2, 2), (2, 3, 3),
(3, 1, 1), (3, 2, 2), (3, 3, 3);


INSERT INTO organisation (name, industry, subscription_id) VALUES
('Prata Rasa', 'F&B', 3),
('Retailers', 'Retail', 2),
('Edu', 'Education', 1);


INSERT INTO org_role (organisation_id, name, description) VALUES
(1, 'ORG_ADMIN', 'Organisation administrator'),
(1, 'STAFF', 'Standard staff user'),
(2, 'ORG_ADMIN', 'Organisation administrator'),
(2, 'STAFF', 'Standard staff user'),
(3, 'ORG_ADMIN', 'Organisation administrator'),
(3, 'STAFF', 'Standard staff user');


INSERT INTO org_permission (code, description) VALUES
('MANAGE_USERS', 'Invite and manage organisation users'),
('MANAGE_FAQ', 'Create, update, and delete FAQs'),
('VIEW_ANALYTICS', 'View chatbot analytics'),
('MANAGE_CHATBOT', 'Create and configure chatbots');


INSERT INTO org_role_permission (org_role_id, org_permission_id)
SELECT r.org_role_id, p.org_permission_id
FROM org_role r, org_permission p
WHERE r.name = 'ORG_ADMIN';

-- Staff, sample permission: VIEW_ANALYTICS
INSERT INTO org_role_permission (org_role_id, org_permission_id)
SELECT r.org_role_id, p.org_permission_id
FROM org_role r
JOIN org_permission p ON p.code IN ('VIEW_ANALYTICS')
WHERE r.name = 'STAFF';


INSERT INTO personality (name, description, type) VALUES
('Friendly & Casual', 'Light-hearted and approachable', 'Casual'),
('Professional & Formal', 'Polite and business-like', 'Formal');

-- system admin (no organisation id)
INSERT INTO app_user (
  username, password, email, status,
  system_role_id, org_role_id, organisation_id
) VALUES
('Admin', 'pw123', 'admin@test.com', TRUE, 0, NULL, NULL);

-- app users, org users.
INSERT INTO app_user (username, password, email, status, system_role_id, org_role_id, organisation_id)
SELECT 'bob','pw123','bob@test.com', FALSE, NULL, r.org_role_id, r.organisation_id
FROM org_role r
WHERE r.organisation_id=1 AND r.name='ORG_ADMIN';

INSERT INTO app_user (username, password, email, status, system_role_id, org_role_id, organisation_id)
SELECT 'carol','pw123','carol@test.com', TRUE, NULL, r.org_role_id, r.organisation_id
FROM org_role r
WHERE r.organisation_id=2 AND r.name='STAFF';


INSERT INTO faq (question, answer, status, display_order, user_id) VALUES
('How does the conversation limit work?', 'Each subscription plan has a monthly conversation limit...', 0, 1, 1),
('Do I need technical knowledge to build a chatbot?', 'No technical knowledge is required...', 0, 2, 1),
('Can I customize the chatbot to fit my company branding?', 'Yes, you can customize...', 0, 3, 1),
('What integrations are supported?', 'The chatbot supports integrations...', 0, 4, 1),
('Is my data secure?', 'We prioritize data security...', 0, 5, 1);

INSERT INTO notification (title, content, is_read, user_id) VALUES
('Welcome!', 'Welcome to the platform, Admin.', FALSE, 1),
('Reminder', 'Complete your profile, Bob.', FALSE, 2);

INSERT INTO feedback (sender_id, category, rating, content) VALUES
(1, 'Outstanding Experience', 5, 'The chatbot delivered an excellent experience with accurate responses and great usability.'),
(3, 'Reliable and Professional', 4, 'Consistent professionalism and quality output.');

INSERT INTO chatbot (name, description, organisation_id, personality_id) VALUES
('SupportBot', 'Helps with customer support', 1, 1),
('EduBot', 'Helps with learning', 3, 3);


INSERT INTO analytics (bot_id, date, total_messages, avg_response_time, user_satisfaction, peak_hour, top_intents) VALUES
(1, '2026-01-06', 150, 2.5, 4.8, 15, '["greeting","faq"]'),
(2, '2026-01-06', 80, 3.2, 4.2, 10, '["lesson_query","quiz"]');
