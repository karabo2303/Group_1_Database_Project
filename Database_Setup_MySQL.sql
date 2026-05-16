-- ============================================================
-- ONLINE VOTING SYSTEM - MYSQL VERSION
-- Converted from Oracle syntax to MySQL
-- ============================================================

-- ============================================================
-- CREATE DATABASE
-- ============================================================
DROP DATABASE IF EXISTS voting_system;
CREATE DATABASE voting_system;
USE voting_system;

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

CREATE TABLE System_User (
    UserID          INT PRIMARY KEY,
    FullName        VARCHAR(100) NOT NULL,
    HashedPassword  VARCHAR(255) NOT NULL,
    EmailAddress    VARCHAR(100) NOT NULL UNIQUE,
    Role            VARCHAR(50) NOT NULL,
    Eligibility     VARCHAR(20) DEFAULT 'Pending',
    VotedFlag       CHAR(1) DEFAULT 'N',
    ProfileInfo     VARCHAR(200),
    CreatedDate     DATETIME DEFAULT NOW(),
    LastLoginTimestamp DATETIME,
    CONSTRAINT chk_user_role CHECK (Role IN ('Voter', 'Candidate', 'Administrator', 'ElectionOfficial', 'OversightOfficer')),
    CONSTRAINT chk_user_eligibility CHECK (Eligibility IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT chk_user_votedflag CHECK (VotedFlag IN ('Y', 'N'))
);

CREATE TABLE Election (
    ElectionID      INT PRIMARY KEY,
    ElectionName    VARCHAR(100) NOT NULL,
    StartDateTime   DATETIME NOT NULL,
    EndDateTime     DATETIME NOT NULL,
    Status          VARCHAR(50) DEFAULT 'Upcoming',
    Rules           VARCHAR(1000),
    CONSTRAINT chk_election_status CHECK (Status IN ('Upcoming', 'Active', 'Closed', 'Archived')),
    CONSTRAINT chk_election_dates CHECK (StartDateTime < EndDateTime)
);

CREATE TABLE Positions (
    PositionID      INT PRIMARY KEY,
    ElectionID      INT NOT NULL,
    PositionName    VARCHAR(100) NOT NULL,
    Description     VARCHAR(500),
    OrderOnBallot   INT DEFAULT 0,
    CONSTRAINT fk_positions_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID) ON DELETE CASCADE
);

CREATE TABLE BallotStructure (
    BallotID        INT PRIMARY KEY,
    ElectionID      INT NOT NULL,
    BallotName      VARCHAR(100) NOT NULL,
    IsActive        CHAR(1) DEFAULT 'Y',
    CONSTRAINT fk_ballotstructure_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID) ON DELETE CASCADE,
    CONSTRAINT chk_ballotstructure_active CHECK (IsActive IN ('Y', 'N'))
);

CREATE TABLE BallotItem (
    BallotItemID    INT PRIMARY KEY,
    BallotID        INT NOT NULL,
    PositionID      INT NOT NULL,
    DisplayOrder    INT DEFAULT 0,
    CONSTRAINT fk_ballotitem_ballot FOREIGN KEY (BallotID) REFERENCES BallotStructure(BallotID) ON DELETE CASCADE,
    CONSTRAINT fk_ballotitem_position FOREIGN KEY (PositionID) REFERENCES Positions(PositionID)
);

CREATE TABLE CandidateNomination (
    NominationID    INT PRIMARY KEY,
    ElectionID      INT NOT NULL,
    CandidateUserID INT NOT NULL,
    PositionID      INT NOT NULL,
    ApprovalStatus  VARCHAR(20) DEFAULT 'Pending',
    ApprovedBy      VARCHAR(100),
    NominationDate  DATE DEFAULT (CURDATE()),
    CONSTRAINT fk_nomination_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_nomination_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_nomination_position FOREIGN KEY (PositionID) REFERENCES Positions(PositionID),
    CONSTRAINT uc_nomination_candidate_position UNIQUE (CandidateUserID, PositionID, ElectionID),
    CONSTRAINT chk_nomination_status CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'))
);

CREATE TABLE CastVote (
    VoteID              INT PRIMARY KEY,
    ElectionID          INT NOT NULL,
    BallotItemID        INT NOT NULL,
    CandidateUserID     INT NOT NULL,
    EncryptedVoteData   VARCHAR(500),
    TimestampCasted     DATETIME DEFAULT NOW(),
    CONSTRAINT fk_castvote_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_castvote_ballotitem FOREIGN KEY (BallotItemID) REFERENCES BallotItem(BallotItemID),
    CONSTRAINT fk_castvote_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT uc_vote_per_election UNIQUE (ElectionID, BallotItemID, CandidateUserID, VoteID)
);

CREATE TABLE Results (
    ResultID        INT PRIMARY KEY,
    ElectionID      INT NOT NULL,
    BallotItemID    INT NOT NULL,
    CandidateUserID INT NOT NULL,
    TotalVotes      INT DEFAULT 0,
    PercentageWon   DECIMAL(5,2) DEFAULT 0,
    MarginOfVictory INT DEFAULT 0,
    IsWinner        CHAR(1) DEFAULT 'N',
    CONSTRAINT fk_results_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_results_ballotitem FOREIGN KEY (BallotItemID) REFERENCES BallotItem(BallotItemID),
    CONSTRAINT fk_results_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT uc_results_per_candidate UNIQUE (ElectionID, BallotItemID, CandidateUserID),
    CONSTRAINT chk_results_winner CHECK (IsWinner IN ('Y', 'N')),
    CONSTRAINT chk_results_percentage CHECK (PercentageWon BETWEEN 0 AND 100),
    CONSTRAINT chk_results_votes CHECK (TotalVotes >= 0)
);

CREATE TABLE OversightReview (
    ReviewID            INT PRIMARY KEY,
    OfficerUserID       INT NOT NULL,
    NominationID        INT,
    ReviewStartTime     DATETIME DEFAULT NOW(),
    ReviewEndTime       DATETIME,
    AuditIDStart        INT,
    AuditIDEnd          INT,
    Findings            VARCHAR(2000),
    CertificationStatus VARCHAR(20) DEFAULT 'Pending',
    CONSTRAINT fk_review_officer FOREIGN KEY (OfficerUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_review_nomination FOREIGN KEY (NominationID) REFERENCES CandidateNomination(NominationID),
    CONSTRAINT chk_review_status CHECK (CertificationStatus IN ('Pending', 'Certified', 'Rejected', 'NeedsRevision'))
);

CREATE TABLE AccessLog (
    LogID           INT PRIMARY KEY,
    UserID          INT NOT NULL,
    LoginTimestamp  DATETIME DEFAULT NOW(),
    IPAddress       VARCHAR(45) NOT NULL,
    SuccessFlag     CHAR(1) DEFAULT 'N',
    FailureReason   VARCHAR(255),
    CONSTRAINT fk_accesslog_user FOREIGN KEY (UserID) REFERENCES System_User(UserID),
    CONSTRAINT chk_accesslog_success CHECK (SuccessFlag IN ('Y', 'N'))
);

CREATE TABLE SystemAuditLog (
    AuditID         INT PRIMARY KEY,
    UserID          INT NOT NULL,
    ActionType      VARCHAR(100) NOT NULL,
    TargetEntity    VARCHAR(100) NOT NULL,
    TargetID        VARCHAR(50),
    `Timestamp`     DATETIME DEFAULT NOW(),
    IPAddress       VARCHAR(45),
    Description     VARCHAR(500),
    CONSTRAINT fk_audit_user FOREIGN KEY (UserID) REFERENCES System_User(UserID)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_user_role ON System_User(Role);
CREATE INDEX idx_user_eligibility ON System_User(Eligibility);
CREATE INDEX idx_user_votedflag ON System_User(VotedFlag);
CREATE INDEX idx_election_status ON Election(Status);
CREATE INDEX idx_election_dates ON Election(StartDateTime, EndDateTime);
CREATE INDEX idx_positions_election ON Positions(ElectionID);
CREATE INDEX idx_positions_order ON Positions(OrderOnBallot);
CREATE INDEX idx_ballotstructure_election ON BallotStructure(ElectionID);
CREATE INDEX idx_ballotstructure_active ON BallotStructure(IsActive);
CREATE INDEX idx_ballotitem_ballot ON BallotItem(BallotID);
CREATE INDEX idx_ballotitem_position ON BallotItem(PositionID);
CREATE INDEX idx_nomination_election ON CandidateNomination(ElectionID);
CREATE INDEX idx_nomination_candidate ON CandidateNomination(CandidateUserID);
CREATE INDEX idx_nomination_position ON CandidateNomination(PositionID);
CREATE INDEX idx_nomination_status ON CandidateNomination(ApprovalStatus);
CREATE INDEX idx_nomination_date ON CandidateNomination(NominationDate);
CREATE INDEX idx_castvote_election ON CastVote(ElectionID);
CREATE INDEX idx_castvote_ballotitem ON CastVote(BallotItemID);
CREATE INDEX idx_castvote_candidate ON CastVote(CandidateUserID);
CREATE INDEX idx_castvote_timestamp ON CastVote(TimestampCasted);
CREATE INDEX idx_results_election ON Results(ElectionID);
CREATE INDEX idx_results_candidate ON Results(CandidateUserID);
CREATE INDEX idx_results_winner ON Results(IsWinner);
CREATE INDEX idx_results_election_winner ON Results(ElectionID, IsWinner);
CREATE INDEX idx_oversight_officer ON OversightReview(OfficerUserID);
CREATE INDEX idx_oversight_nomination ON OversightReview(NominationID);
CREATE INDEX idx_oversight_status ON OversightReview(CertificationStatus);
CREATE INDEX idx_oversight_times ON OversightReview(ReviewStartTime, ReviewEndTime);
CREATE INDEX idx_accesslog_user ON AccessLog(UserID);
CREATE INDEX idx_accesslog_timestamp ON AccessLog(LoginTimestamp);
CREATE INDEX idx_accesslog_success ON AccessLog(SuccessFlag);
CREATE INDEX idx_accesslog_ip ON AccessLog(IPAddress);
CREATE INDEX idx_auditlog_user ON SystemAuditLog(UserID);
CREATE INDEX idx_auditlog_timestamp ON SystemAuditLog(`Timestamp`);
CREATE INDEX idx_auditlog_action ON SystemAuditLog(ActionType);
CREATE INDEX idx_auditlog_target ON SystemAuditLog(TargetEntity, TargetID);

-- ============================================================
-- 3. INSERT SAMPLE DATA
-- ============================================================

INSERT INTO System_User (UserID, FullName, HashedPassword, EmailAddress, Role, Eligibility, ProfileInfo, CreatedDate)
VALUES
(1, 'Lebo Maseko', 'Admin@128Pass', 'admin.smith@gmail.com', 'Administrator', 'Approved', 'System administrator', NOW()),
(2, 'Karabo Nkosi', 'KaraboN@124Pass', 'karabo.nkosi@gmail.com', 'Voter', 'Approved', 'Registered voter - District 4', NOW()),
(3, 'Brian Mkhatshwa', 'BrianM@124Pass', 'brian.mkhatshwa@gmail.com', 'Voter', 'Approved', 'Registered voter - District 2', NOW()),
(4, 'Kagiso Sukazi', 'KagisoS@124Pass', 'kagiso.sukazi@gmail.com', 'Voter', 'Approved', 'Registered voter - District 1', NOW()),
(5, 'Dikeledi Mafifi', 'DikelediM@124Pass', 'dikeledi.mafifi@gmail.com', 'Candidate', 'Approved', 'Running for Student President', NOW()),
(6, 'Okuhle Mpethu', 'OkuhleM@124Pass', 'okuhle.mpethu@gmail.com', 'Candidate', 'Approved', 'Running for Student President', NOW()),
(7, 'Kagiso Motsepe', 'KagisoM@124Pass', 'kagiso.motsepe@gmail.com', 'Candidate', 'Approved', 'Running for Treasurer', NOW()),
(8, 'Zanele Khumalo', 'ZaneleK@124Pass', 'zanele.khumalo@gmail.com', 'ElectionOfficial', 'Approved', 'Senior election coordinator', NOW()),
(9, 'Bongani Zulu', 'BonganiZ@124Pass', 'bongani.zulu@gmail.com', 'OversightOfficer', 'Approved', 'Independent oversight member', NOW());

INSERT INTO Election (ElectionID, ElectionName, StartDateTime, EndDateTime, Status, Rules)
VALUES
(1, 'Student Council Election 2026', '2026-04-10 08:00:00', '2026-04-10 17:00:00', 'Closed', 'One vote per registered student. Results are final after 24 hours.'),
(2, 'Community Board Election 2026', '2026-05-13 07:00:00', '2026-05-13 20:00:00', 'Active', 'Eligible residents only. Valid photo ID required at time of voting.'),
(3, 'Staff Representative Election', '2026-07-15 09:00:00', '2026-07-15 16:00:00', 'Upcoming', 'All permanent staff members are eligible. Voting is anonymous.');

INSERT INTO Positions (PositionID, ElectionID, PositionName, Description, OrderOnBallot)
VALUES
(1, 1, 'Student President', 'Leads the student council and represents all students', 1),
(2, 1, 'Treasurer', 'Manages student council finances and annual budget', 2),
(3, 2, 'Board Chairperson', 'Chairs all community board meetings and sets agenda', 1),
(4, 3, 'Staff Representative', 'Represents staff interests in senior management', 1);

INSERT INTO BallotStructure (BallotID, ElectionID, BallotName, IsActive)
VALUES
(1, 1, 'Student Council Ballot 2026', 'N'),
(2, 2, 'Community Board Ballot 2026', 'Y'),
(3, 3, 'Staff Rep Ballot 2026', 'N');

INSERT INTO BallotItem (BallotItemID, BallotID, PositionID, DisplayOrder)
VALUES
(1, 1, 1, 1),
(2, 1, 2, 2),
(3, 2, 3, 1),
(4, 3, 4, 1);

INSERT INTO CandidateNomination (NominationID, ElectionID, CandidateUserID, PositionID, ApprovalStatus, ApprovedBy, NominationDate)
VALUES
(1, 1, 5, 1, 'Approved', 'Lebo Maseko', '2026-03-20'),
(2, 1, 6, 1, 'Approved', 'Lebo Maseko', '2026-03-21'),
(3, 1, 7, 2, 'Approved', 'Lebo Maseko', '2026-03-22'),
(4, 2, 5, 3, 'Pending', NULL, '2026-04-25'),
(5, 3, 6, 4, 'Rejected', 'Lebo Maseko', '2026-04-30');

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES
(1, 1, 1, 5, 'ENC_VOTE_DATA_001', '2026-04-10 09:15:00'),
(2, 1, 1, 6, 'ENC_VOTE_DATA_002', '2026-04-10 10:30:00'),
(3, 1, 1, 5, 'ENC_VOTE_DATA_003', '2026-04-10 11:00:00'),
(4, 1, 2, 7, 'ENC_VOTE_DATA_004', '2026-04-10 11:45:00'),
(5, 1, 2, 7, 'ENC_VOTE_DATA_005', '2026-04-10 13:20:00');

INSERT INTO Results (ResultID, ElectionID, BallotItemID, CandidateUserID, TotalVotes, PercentageWon, MarginOfVictory, IsWinner)
VALUES
(1, 1, 1, 5, 2, 66.67, 1, 'Y'),
(2, 1, 1, 6, 1, 33.33, 1, 'N'),
(3, 1, 2, 7, 2, 100.00, 2, 'Y');

INSERT INTO SystemAuditLog (AuditID, UserID, ActionType, TargetEntity, TargetID, `Timestamp`, IPAddress, Description)
VALUES
(1, 1, 'CREATE', 'Election', '1', '2026-03-15 10:00:00', '192.168.1.10', 'Created Student Council Election 2026'),
(2, 1, 'APPROVE', 'CandidateNomination', '1', '2026-03-20 09:00:00', '192.168.1.10', 'Approved nomination for Dikeledi Mafifi'),
(3, 1, 'APPROVE', 'CandidateNomination', '2', '2026-03-21 09:30:00', '192.168.1.10', 'Approved nomination for Okuhle Mpethu'),
(4, 8, 'UPDATE', 'Election', '1', '2026-04-10 07:55:00', '192.168.1.10', 'Updated election status to Active'),
(5, 8, 'UPDATE', 'Election', '1', '2026-04-10 17:05:00', '192.168.1.10', 'Updated election status to Closed');

INSERT INTO OversightReview (ReviewID, OfficerUserID, NominationID, ReviewStartTime, ReviewEndTime, AuditIDStart, AuditIDEnd, Findings, CertificationStatus)
VALUES
(1, 9, 1, '2026-04-11 08:00:00', '2026-04-11 11:00:00', 1, 5, 'No irregularities found. Election conducted fairly and transparently.', 'Certified'),
(2, 9, 4, '2026-05-13 08:30:00', NULL, NULL, NULL, 'Active review in progress for Community Board Election.', 'Pending');

INSERT INTO AccessLog (LogID, UserID, LoginTimestamp, IPAddress, SuccessFlag, FailureReason)
VALUES
(1, 1, '2026-04-10 07:45:00', '192.168.1.10', 'Y', NULL),
(2, 2, '2026-04-10 09:05:00', '192.168.1.21', 'Y', NULL),
(3, 3, '2026-04-10 10:20:00', '192.168.1.33', 'Y', NULL),
(4, 4, '2026-05-13 07:55:00', '192.168.1.44', 'N', 'Incorrect password'),
(5, 4, '2026-05-13 07:57:00', '192.168.1.44', 'Y', NULL);

-- ============================================================
-- 4. VIEWS
-- ============================================================

CREATE VIEW vw_ActiveElections AS
SELECT ElectionID, ElectionName, StartDateTime, EndDateTime, Status, Rules
FROM Election
WHERE Status = 'Active';

CREATE VIEW vw_ApprovedCandidates AS
SELECT cn.NominationID, cn.ElectionID, e.ElectionName, u.UserID AS CandidateUserID,
       u.FullName AS CandidateName, u.EmailAddress, p.PositionName, cn.NominationDate, cn.ApprovedBy
FROM CandidateNomination cn
INNER JOIN System_User u ON cn.CandidateUserID = u.UserID
INNER JOIN Election e ON cn.ElectionID = e.ElectionID
INNER JOIN Positions p ON cn.PositionID = p.PositionID
WHERE cn.ApprovalStatus = 'Approved';

-- ============================================================
-- 5. TIE-BREAKING DEMONSTRATION
-- ============================================================

INSERT INTO Election (ElectionID, ElectionName, StartDateTime, EndDateTime, Status, Rules)
VALUES (10, 'Tie-Breaker Test Election', '2026-05-01 08:00:00', '2026-05-01 17:00:00', 'Closed', 'Tie-breaking: Extended voting period for tied positions');

INSERT INTO Positions (PositionID, ElectionID, PositionName, Description, OrderOnBallot)
VALUES (10, 10, 'Class Representative', 'Representative for first-year class', 1);

INSERT INTO BallotStructure (BallotID, ElectionID, BallotName, IsActive)
VALUES (10, 10, 'Tie-Breaker Test Ballot', 'N');

INSERT INTO BallotItem (BallotItemID, BallotID, PositionID, DisplayOrder)
VALUES (10, 10, 10, 1);

INSERT INTO System_User (UserID, FullName, HashedPassword, EmailAddress, Role, Eligibility, ProfileInfo, CreatedDate)
VALUES (50, 'Alice Candidate', 'hash_alice', 'alice@test.com', 'Candidate', 'Approved', 'Running for Class Rep', NOW());

INSERT INTO System_User (UserID, FullName, HashedPassword, EmailAddress, Role, Eligibility, ProfileInfo, CreatedDate)
VALUES (51, 'Bob Candidate', 'hash_bob', 'bob@test.com', 'Candidate', 'Approved', 'Running for Class Rep', NOW());

INSERT INTO CandidateNomination (NominationID, ElectionID, CandidateUserID, PositionID, ApprovalStatus, ApprovedBy, NominationDate)
VALUES (50, 10, 50, 10, 'Approved', 'Lebo Maseko', '2026-04-25');

INSERT INTO CandidateNomination (NominationID, ElectionID, CandidateUserID, PositionID, ApprovalStatus, ApprovedBy, NominationDate)
VALUES (51, 10, 51, 10, 'Approved', 'Lebo Maseko', '2026-04-25');

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES (100, 10, 10, 50, 'ENC_VOTE_ALICE_1', '2026-05-01 09:00:00');

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES (101, 10, 10, 50, 'ENC_VOTE_ALICE_2', '2026-05-01 10:00:00');

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES (102, 10, 10, 51, 'ENC_VOTE_BOB_1', '2026-05-01 11:00:00');

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES (103, 10, 10, 51, 'ENC_VOTE_BOB_2', '2026-05-01 14:00:00');

INSERT INTO Results (ResultID, ElectionID, BallotItemID, CandidateUserID, TotalVotes, PercentageWon, MarginOfVictory, IsWinner)
VALUES (50, 10, 10, 50, 2, 50.00, 0, 'N');

INSERT INTO Results (ResultID, ElectionID, BallotItemID, CandidateUserID, TotalVotes, PercentageWon, MarginOfVictory, IsWinner)
VALUES (51, 10, 10, 51, 2, 50.00, 0, 'N');

-- Extend voting period
INSERT INTO BallotStructure (BallotID, ElectionID, BallotName, IsActive)
VALUES (11, 10, 'Tie-Breaker Ballot - Class Representative', 'Y');

INSERT INTO BallotItem (BallotItemID, BallotID, PositionID, DisplayOrder)
VALUES (11, 11, 10, 1);

UPDATE Election SET EndDateTime = '2026-05-08 20:00:00', Status = 'Active' WHERE ElectionID = 10;

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES (104, 10, 11, 50, 'ENC_VOTE_ALICE_3', '2026-05-02 09:00:00');

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES (105, 10, 11, 50, 'ENC_VOTE_ALICE_4', '2026-05-02 14:00:00');

INSERT INTO CastVote (VoteID, ElectionID, BallotItemID, CandidateUserID, EncryptedVoteData, TimestampCasted)
VALUES (106, 10, 11, 51, 'ENC_VOTE_BOB_3', '2026-05-02 11:00:00');

UPDATE Results SET TotalVotes = 4, PercentageWon = 57.14, IsWinner = 'Y' WHERE ElectionID = 10 AND BallotItemID = 10 AND CandidateUserID = 50;
UPDATE Results SET TotalVotes = 3, PercentageWon = 42.86, IsWinner = 'N' WHERE ElectionID = 10 AND BallotItemID = 10 AND CandidateUserID = 51;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT 'All tables created successfully!' AS Status;
SELECT COUNT(*) AS UserCount FROM System_User;
SELECT COUNT(*) AS ElectionCount FROM Election;
SELECT COUNT(*) AS PositionCount FROM Positions;
SELECT COUNT(*) AS VoteCount FROM CastVote;

-- Show final results for tie-breaker election
SELECT u.FullName AS Candidate, r.TotalVotes, r.PercentageWon, r.IsWinner
FROM Results r
JOIN System_User u ON r.CandidateUserID = u.UserID
WHERE r.ElectionID = 10
ORDER BY r.TotalVotes DESC;