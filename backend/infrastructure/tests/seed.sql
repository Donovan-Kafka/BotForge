-- Mock data to test SQL constraints

-- To prevent duplicates when testing multiple times by clearing tables.
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Analytics;
TRUNCATE TABLE Chatbot;
TRUNCATE TABLE Feedback;
TRUNCATE TABLE Notification;
TRUNCATE TABLE User;
TRUNCATE TABLE Personality;
TRUNCATE TABLE Organisation;
TRUNCATE TABLE SubscriptionFeatures;
TRUNCATE TABLE Feature;
TRUNCATE TABLE Subscription;
TRUNCATE TABLE Role;

SET FOREIGN_KEY_CHECKS = 1;

-- Insert roles
INSERT INTO Role (name, description) VALUES
('Admin', 'Administrator'),
('User', 'Regular staff'),
('Manager', 'Manages team');

SELECT * FROM Role;

-- Insert subscriptions
INSERT INTO Subscription (name, price, description) VALUES
('Basic', 10.00, 'Basic subscription'),
('Pro', 25.50, 'Professional subscription'),
('Enterprise', 100.00, 'Enterprise level subscription');

SELECT * FROM Subscription;

-- Insert features
INSERT INTO Feature (name, description) VALUES
('Analytics', 'Access to analytics dashboard'),
('Chatbot Integration', 'Connect chatbot to website'),
('Notifications', 'Receive email notifications');

SELECT * FROM Feature;

-- Link subscriptions to features
INSERT INTO SubscriptionFeatures (subscriptionId, featureId) VALUES
(1, 1),
(1, 3),
(2, 1),
(2, 2),
(2, 3),
(3, 1),
(3, 2),
(3, 3);

SELECT * FROM SubscriptionFeatures;

-- Insert organisations
INSERT INTO Organisation (name, industry, size, subscriptionId) VALUES
('E-commercing', 'E-commerce', 'Large', 3),
('Retailers', 'Retail', 'Medium', 2),
('Edu', 'Education', 'Small', 1);

SELECT * FROM Organisation;

-- Insert personalities
INSERT INTO Personality (name, description, type) VALUES
('Friendly', 'Approachable', 'Supportive'),
('Professional', 'Formal', 'Corporate'),
('Humorous', 'Adds jokes', 'Casual');

SELECT * FROM Personality;

-- Insert users
INSERT INTO User (username, password, email, status, roleId, organisationId) VALUES
('alice', 'pw123', 'alice@test.com', 1, 1, 1), -- Admin at E-commercing
('bob', 'pw123', 'bob@test.com', 0, 2, 2),    -- Staff users at Retailers
('carol', 'pw123', 'carol@test.com', 1, 3, 3); -- Manager at Edu

SELECT * FROM User;

-- Insert notifications
INSERT INTO Notification (title, content, creationDate, isRead, userId) VALUES
('Welcome!', 'Welcome to the platform, Alice.', NOW(), 0, 1),
('Reminder', 'Complete your profile, Bob.', NOW(), 0, 2);

SELECT * FROM Notification;

-- Insert feedback
INSERT INTO Feedback (senderId, receiverId, title, rating, content, creationDate) VALUES
(1, 2, 'Good job', 5, 'Bob is doing great work.', NOW()),
(3, 1, 'Suggestion', 4, 'Alice could review reports faster.', NOW());

SELECT * FROM Feedback;

-- Insert chatbots
INSERT INTO Chatbot (name, description, creationDate, organisationId, personalityId) VALUES
('SupportBot', 'Helps with customer support', NOW(), 1, 1),
('EduBot', 'Helps with learning', NOW(), 3, 3);

SELECT * FROM Chatbot;

-- Insert analytics
INSERT INTO Analytics (botId, date, totalMessages, avgResponseTime, userSatisfaction, peakHour, topIntents) VALUES
(1, '2026-01-06', 150, 2.5, 4.8, 15, '["greeting","faq"]'),
(2, '2026-01-06', 80, 3.2, 4.2, 10, '["lesson_query","quiz"]');

SELECT * FROM Analytics;

