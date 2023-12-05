CREATE TABLE IF NOT EXISTS UserAccount 
(
    Id              SERIAL          PRIMARY KEY,
    UserEmail       VARCHAR (255)   NOT NULL,
    FullName        VARCHAR (255),
    AccessToken     VARCHAR (255),  
    RefreshToken    VARCHAR (255)
);

CREATE TABLE IF NOT EXISTS InvalidSender
(
    UserId          INT             NOT NULL    REFERENCES UserAccount (Id)     ON DELETE CASCADE,
    EmailAddress    VARCHAR(255)    NOT NULL,
    PRIMARY KEY (UserId, EmailAddress)
);

CREATE TABLE IF NOT EXISTS Company 
(
    Id              SERIAL          PRIMARY KEY,
    CompanyName     VARCHAR(255)    NOT NULL
);

CREATE TABLE IF NOT EXISTS Position
(
    Id              SERIAL          PRIMARY KEY,
    PositionName    VARCHAR(255)    NOT NULL
);

CREATE TABLE IF NOT EXISTS Job
(
    Id              SERIAL          PRIMARY KEY,
    PositionId      INT             NOT NULL    REFERENCES Position (Id),
    CompanyId       INT             NOT NULL    REFERENCES Company (Id)
);

CREATE TABLE IF NOT EXISTS StatusType
(
    Id              SERIAL          PRIMARY KEY,
    StatusName      VARCHAR(255)    NOT NULL
);

CREATE TABLE IF NOT EXISTS AppStatus
(
    UserId          INT             NOT NULL    REFERENCES UserAccount (Id)     ON DELETE CASCADE,
    JobId           INT             NOT NULL    REFERENCES Job (Id),
    StatusId        INT             NOT NULL    REFERENCES StatusType (Id),
    Date            TIMESTAMP       NOT NULL,
    Sender          VARCHAR (255)   NOT NULL,
    GmailMsgId      VARCHAR (255)   NOT NULL,
    PRIMARY KEY (UserId, JobId, StatusId)
);


-- CREATE TABLE IF NOT EXISTS user_stats
-- (
--     UserId INT,
--     Datestamp DATE,
--     AppliedCount INT,
--     AppliedCountCumulative INT,
--     RejectedCount INT,
--     RejectedCountCumulative INT,
--     INTerviewCount INT,
--     OfferCount INT,
--     OtherCount INT,
--     FOREIGN KEY (UserId) REFERENCES user_account (Id),
--     PRIMARY KEY (UserId, Datestamp)
-- );