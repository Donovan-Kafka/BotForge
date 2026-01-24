-- SQL Schema for PostgreSQL

DROP TABLE IF EXISTS featured_video CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS chatbot CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS faq CASCADE;
DROP TABLE IF EXISTS invitation CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS org_role_permission CASCADE;
DROP TABLE IF EXISTS org_permission CASCADE;
DROP TABLE IF EXISTS org_role CASCADE;
DROP TABLE IF EXISTS personality CASCADE;
DROP TABLE IF EXISTS organisation CASCADE;
DROP TABLE IF EXISTS subscription_features CASCADE;
DROP TABLE IF EXISTS feature CASCADE;
DROP TABLE IF EXISTS subscription CASCADE;
DROP TABLE IF EXISTS system_role CASCADE;

-- system role (platform level)
CREATE TABLE system_role (
    system_role_id INT PRIMARY KEY, -- 0: sys_admin, 1: app_user
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE subscription (
    subscription_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0, -- 0: active, 1: inactive
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
    display_order SMALLINT,
    PRIMARY KEY (subscription_id, feature_id),
    FOREIGN KEY (subscription_id) REFERENCES subscription(subscription_id),
    FOREIGN KEY (feature_id) REFERENCES feature(feature_id),
    CHECK (display_order IS NULL OR display_order BETWEEN 1 AND 3)
);


CREATE TABLE organisation (
    organisation_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    industry VARCHAR(50),
    subscription_id INT,
    description TEXT,
    location VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website_url VARCHAR(255),
    business_hours VARCHAR(255),
    cuisine_type VARCHAR(255),
    restaurant_style VARCHAR(100),
    dining_options VARCHAR(255),
    supports_reservations BOOLEAN DEFAULT FALSE,
    reservation_link VARCHAR(255),
    price_range VARCHAR(10),
    seating_capacity INT,
    specialties TEXT,
    institution_type VARCHAR(100),
    target_audience VARCHAR(255),
    course_types VARCHAR(255),
    delivery_mode VARCHAR(255),
    intake_periods VARCHAR(255),
    application_link VARCHAR(255),
    response_time VARCHAR(100),
    key_programs TEXT,
    retail_type VARCHAR(100),
    product_categories VARCHAR(255),
    has_physical_store BOOLEAN DEFAULT TRUE,
    has_online_store BOOLEAN DEFAULT FALSE,
    online_store_url VARCHAR(255),
    delivery_options VARCHAR(255),
    return_policy TEXT,
    warranty_info TEXT,
    payment_methods VARCHAR(255),
    promotions_note TEXT,
    FOREIGN KEY (subscription_id) REFERENCES subscription(subscription_id)
);

CREATE TABLE org_role (
    org_role_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organisation_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),

    FOREIGN KEY (organisation_id) REFERENCES organisation(organisation_id),
    UNIQUE (organisation_id, name)
);

CREATE TABLE org_permission (
    org_permission_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE org_role_permission (
    org_role_id INT NOT NULL,
    org_permission_id INT NOT NULL,
    PRIMARY KEY (org_role_id, org_permission_id),
    FOREIGN KEY (org_role_id) REFERENCES org_role(org_role_id) ON DELETE CASCADE,
    FOREIGN KEY (org_permission_id) REFERENCES org_permission(org_permission_id) ON DELETE CASCADE
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

    system_role_id INT,
    org_role_id INT,
    organisation_id INT,

    FOREIGN KEY (system_role_id) REFERENCES system_role(system_role_id),
    FOREIGN KEY (org_role_id) REFERENCES org_role(org_role_id),
    FOREIGN KEY (organisation_id) REFERENCES organisation(organisation_id),

    CHECK (
        (system_role_id IS NOT NULL AND org_role_id IS NULL AND organisation_id IS NULL)
     OR (system_role_id IS NULL AND org_role_id IS NOT NULL AND organisation_id IS NOT NULL)
    )
);

CREATE TABLE invitation (
    invitation_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    organisation_id INT NOT NULL,
    invited_by_user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status SMALLINT NOT NULL DEFAULT 0,
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
$$ LANGUAGE plpgsql;

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
    rating INT CHECK (rating BETWEEN 1 AND 5),
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
    welcome_message TEXT NOT NULL DEFAULT 'Hi! How can I help you today?',
    primary_language VARCHAR(10) NOT NULL DEFAULT 'English',
    tone VARCHAR(20) NOT NULL DEFAULT 'Friendly',
    allow_emojis BOOLEAN NOT NULL DEFAULT TRUE,
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
