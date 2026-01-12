-- SQL Schema for PostgreSQL

DROP TABLE IF EXISTS featured_video CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS chatbot CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS faq CASCADE;
DROP TABLE IF EXISTS invitation CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS personality CASCADE;
DROP TABLE IF EXISTS organisation CASCADE;
DROP TABLE IF EXISTS subscription_features CASCADE;
DROP TABLE IF EXISTS feature CASCADE;
DROP TABLE IF EXISTS subscription CASCADE;
DROP TABLE IF EXISTS role CASCADE;

CREATE TABLE role (
    role_id INT PRIMARY KEY, -- 0: SYS_ADMIN, 1: ORG_ADMIN, 2: OPERATOR
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE subscription (
    subscription_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0, --  0: active, 1: inactive
    description VARCHAR(255)
);

CREATE TABLE feature (
    feature_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE subscription_features (
    subscription_id INT NOT NULL,
    feature_id INT NOT NULL,
    display_order SMALLINT, -- 1, 2, 3 = shown on landing page
    PRIMARY KEY (subscription_id, feature_id),
    FOREIGN KEY (subscription_id) REFERENCES subscription(subscription_id),
    FOREIGN KEY (feature_id) REFERENCES feature(feature_id),
    CHECK (display_order IS NULL OR display_order BETWEEN 1 AND 3)
);

CREATE TABLE organisation (
    organisation_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    industry VARCHAR(50),
    size VARCHAR(20),
    subscription_id INT,
    FOREIGN KEY (subscription_id) REFERENCES subscription(subscription_id)
);

CREATE TABLE personality (
    personality_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    type VARCHAR(50)
);

CREATE TABLE app_user (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT FALSE,
    role_id INT NOT NULL,
    organisation_id INT,
    FOREIGN KEY (role_id) REFERENCES role(role_id),
    FOREIGN KEY (organisation_id) REFERENCES organisation(organisation_id)
);

CREATE TABLE invitation (
    invitation_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    organisation_id INT NOT NULL,
    invited_by_user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status SMALLINT NOT NULL DEFAULT 0, -- 0: pending, 1: accepted, 2: declined
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organisation_id) REFERENCES organisation(organisation_id),
    FOREIGN KEY (invited_by_user_id) REFERENCES app_user(user_id)
);

CREATE TABLE faq (
    faq_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0, -- 0: active, 1: inactive
    display_order INT NOT NULL DEFAULT 0,
    user_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_user(user_id)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_faq_updated_at
BEFORE UPDATE ON faq
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE notification (
    message_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES app_user(user_id)
);

CREATE TABLE feedback (
    feedback_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id INT NOT NULL,
    title VARCHAR(100),
    rating INT,
    content TEXT,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_testimonial BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES app_user(user_id)
);

CREATE TABLE chatbot (
    bot_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organisation_id INT NOT NULL,
    personality_id INT,
    FOREIGN KEY (organisation_id) REFERENCES organisation(organisation_id),
    FOREIGN KEY (personality_id) REFERENCES personality(personality_id)
);

CREATE TABLE analytics (
    analytic_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bot_id INT NOT NULL,
    date DATE NOT NULL,
    total_messages INT DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    user_satisfaction REAL DEFAULT 0,
    peak_hour INT,
    top_intents TEXT,
    FOREIGN KEY (bot_id) REFERENCES chatbot(bot_id),
    UNIQUE (bot_id, date)
);

CREATE TABLE featured_video (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    url VARCHAR(255),
    title VARCHAR(100),
    description VARCHAR(255),
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
