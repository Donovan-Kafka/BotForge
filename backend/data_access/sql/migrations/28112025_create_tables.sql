-- before prof meeting and erd changes

CREATE TABLE Personality (
    personalityId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    type TINYINT NOT NULL -- category
);

CREATE TABLE Chatbot (
    botId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    creationDate DATETIME NOT NULL,
    personalityId INT, 
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
    subscriptionId INT,
    botId INT,
    FOREIGN KEY (subscriptionId) REFERENCES Subscription(subscriptionId),
    FOREIGN KEY (botId) REFERENCES Chatbot(botId)
);

CREATE TABLE Role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE User (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(20) NOT NULL,
    email VARCHAR(50),
    status TINYINT DEFAULT 0, -- 0=active, 1=inactive/suspended/deleted
    roleId INT,
    organisationId INT,
    FOREIGN KEY (roleId) REFERENCES Role(roleId),
    FOREIGN KEY (organisationId) REFERENCES Organisation(organisationId)
);

CREATE TABLE Notification (
    messageId INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    creationDate DATETIME NOT NULL,
    isRead TINYINT DEFAULT 0, -- 0 = unread, 1 = read, 2 = deleted
    userId INT,
    FOREIGN KEY (userId) REFERENCES User(userId)
);

CREATE TABLE Inquiry (
    inquiryId INT AUTO_INCREMENT PRIMARY KEY,
    senderName VARCHAR(50) NOT NULL,
    senderEmail VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    creationDate DATETIME NOT NULL,
    title VARCHAR(100) NOT NULL,
    userId INT,
    FOREIGN KEY (userId) REFERENCES User(userId)
);
