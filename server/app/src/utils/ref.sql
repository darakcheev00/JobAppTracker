CREATE TABLE IF NOT EXISTS UserAccount 
(
    UserId          SERIAL          PRIMARY KEY,
    UserEmail       VARCHAR (255)   NOT NULL,
    AuthToken       VARCHAR (255),  
    GptKey          VARCHAR (255),
    NewestMsgDate   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS InvalidSender
(
    UserId          INT             NOT NULL    REFERENCES UserAccount (UserId)     ON DELETE CASCADE,
    EmailAddress    VARCHAR(255)    NOT NULL,
    PRIMARY KEY (UserId, EmailAddress)
);

CREATE TABLE IF NOT EXISTS Company 
(
    CompanyId       SERIAL          PRIMARY KEY,
    CompanyName     VARCHAR(255)    NOT NULL
);

CREATE TABLE IF NOT EXISTS Position
(
    PositionId      SERIAL          PRIMARY KEY,
    PositionName    VARCHAR(255)    NOT NULL
);

CREATE TABLE IF NOT EXISTS Job
(
    JobId           SERIAL          PRIMARY KEY,
    PositionId      INT             NOT NULL    REFERENCES Position (PositionId),
    CompanyId       INT             NOT NULL    REFERENCES Company (CompanyId)
);

CREATE TABLE IF NOT EXISTS StatusType
(
    StatusId        SERIAL          PRIMARY KEY,
    StatusName      VARCHAR(255)    NOT NULL,
    GptSearchName   VARCHAR(255)    NOT NULL
);

CREATE TABLE IF NOT EXISTS AppStatus
(
    AppStatusId     SERIAL          PRIMARY KEY,
    UserId          INT             NOT NULL    REFERENCES UserAccount (UserId)     ON DELETE CASCADE,
    JobId           INT             NOT NULL    REFERENCES Job (JobId),
    StatusId        INT             NOT NULL    REFERENCES StatusType (StatusId),
    Date            TIMESTAMP       NOT NULL,
    Sender          VARCHAR (255)   NOT NULL,
    GmailMsgId      VARCHAR (255)   NOT NULL
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