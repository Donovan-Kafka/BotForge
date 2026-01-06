-- updated according to new erd

CREATE TABLE Role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE Subscription (
    subscriptionId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE Feature (
    featureId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE SubscriptionFeatures (
    subscriptionId INT NOT NULL,
    featureId INT NOT NULL,
    PRIMARY KEY (subscriptionId, featureId),
    FOREIGN KEY (subscriptionId) REFERENCES Subscription(subscriptionId),
    FOREIGN KEY (featureId) REFERENCES Feature(featureId)
);

CREATE TABLE Organisation (
    organisationId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    industry VARCHAR(50),
    size VARCHAR(20),
    subscriptionId INT,
    FOREIGN KEY (subscriptionId) REFERENCES Subscription(subscriptionId)
);

CREATE TABLE Personality (
    personalityId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    type VARCHAR(50)
);

CREATE TABLE User (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    status TINYINT DEFAULT 0,
    roleId INT NOT NULL,
    organisationId INT,
    FOREIGN KEY (roleId) REFERENCES Role(roleId),
    FOREIGN KEY (organisationId) REFERENCES Organisation(organisationId)
);

CREATE TABLE Notification (
    messageId INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    creationDate DATETIME NOT NULL,
    isRead TINYINT DEFAULT 0,
    userId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(userId)
);

CREATE TABLE Feedback (
    feedbackId INT AUTO_INCREMENT PRIMARY KEY,
    senderId INT NOT NULL,
    receiverId INT NOT NULL,
    title VARCHAR(100),
    rating INT,
    content TEXT,
    creationDate DATETIME NOT NULL,
    FOREIGN KEY (senderId) REFERENCES User(userId),
    FOREIGN KEY (receiverId) REFERENCES User(userId)
);

CREATE TABLE Chatbot (
    botId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    creationDate DATETIME NOT NULL,
    organisationId INT NOT NULL,
    personalityId INT,
    FOREIGN KEY (organisationId) REFERENCES Organisation(organisationId),
    FOREIGN KEY (personalityId) REFERENCES Personality(personalityId)
);

CREATE TABLE Analytics (
    analyticId INT AUTO_INCREMENT PRIMARY KEY,
    botId INT NOT NULL,
    date DATE NOT NULL,
    totalMessages INT DEFAULT 0,
    avgResponseTime FLOAT DEFAULT 0,
    userSatisfaction FLOAT DEFAULT 0,
    peakHour INT,
    topIntents TEXT,
    FOREIGN KEY (botId) REFERENCES Chatbot(botId)
);