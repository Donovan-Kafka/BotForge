-- Mock data to test SQL constraints (PostgreSQL)

-- Clear tables (CASCADE handles foreign keys)
TRUNCATE TABLE
  analytics,
  chatbot,
  feedback,
  notification,
  app_user,
  personality,
  organisation,
  subscriptionfeatures,
  feature,
  subscription,
  role
CASCADE;

-- Insert roles
INSERT INTO role (name, description) VALUES
('Admin', 'Administrator'),
('User', 'Regular staff'),
('Manager', 'Manages team');

-- Insert subscriptions
INSERT INTO subscription (name, price, description) VALUES
('Basic', 10.00, 'Basic subscription'),
('Pro', 25.50, 'Professional subscription'),
('Enterprise', 100.00, 'Enterprise level subscription');

-- Insert features
INSERT INTO feature (name, description) VALUES
('Analytics', 'Access to analytics dashboard'),
('Chatbot Integration', 'Connect chatbot to website'),
('Notifications', 'Receive email notifications');

-- Link subscriptions to features
INSERT INTO subscriptionfeatures (subscriptionid, featureid) VALUES
(1, 1),
(1, 3),
(2, 1),
(2, 2),
(2, 3),
(3, 1),
(3, 2),
(3, 3);

-- Insert organisations
INSERT INTO organisation (name, industry, size, subscriptionid) VALUES
('E-commercing', 'E-commerce', 'Large', 3),
('Retailers', 'Retail', 'Medium', 2),
('Edu', 'Education', 'Small', 1);

-- Insert personalities
INSERT INTO personality (name, description, type) VALUES
('Friendly', 'Approachable', 'Supportive'),
('Professional', 'Formal', 'Corporate'),
('Humorous', 'Adds jokes', 'Casual');

-- Insert users
INSERT INTO app_user (username, password, email, status, roleid, organisationid) VALUES
('alice', 'pw123', 'alice@test.com', TRUE, 1, 1),
('bob', 'pw123', 'bob@test.com', FALSE, 2, 2),
('carol', 'pw123', 'carol@test.com', TRUE, 3, 3);

-- Insert notifications
INSERT INTO notification (title, content, creationdate, isread, userid) VALUES
('Welcome!', 'Welcome to the platform, Alice.', CURRENT_TIMESTAMP, FALSE, 1),
('Reminder', 'Complete your profile, Bob.', CURRENT_TIMESTAMP, FALSE, 2);

-- Insert feedback
INSERT INTO feedback (senderid, receiverid, title, rating, content, creationdate) VALUES
(1, 2, 'Outstanding Experience', 5, 'The chatbot delivered an excellent experience with accurate responses and great usability. Highly recommended.', CURRENT_TIMESTAMP),
(3, 1, 'Reliable and Professional', 4, 'Alice consistently demonstrates professionalism and delivers quality work that adds real value to the team.', CURRENT_TIMESTAMP);

-- Insert chatbots
INSERT INTO chatbot (name, description, creationdate, organisationid, personalityid) VALUES
('SupportBot', 'Helps with customer support', CURRENT_TIMESTAMP, 1, 1),
('EduBot', 'Helps with learning', CURRENT_TIMESTAMP, 3, 3);

-- Insert analytics
INSERT INTO analytics (
  botid,
  date,
  totalmessages,
  avgresponsetime,
  usersatisfaction,
  peakhour,
  topintents
) VALUES
(1, '2026-01-06', 150, 2.5, 4.8, 15, '["greeting","faq"]'::jsonb),
(2, '2026-01-06', 80, 3.2, 4.2, 10, '["lesson_query","quiz"]'::jsonb);
