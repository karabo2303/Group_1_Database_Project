-- TABLE 1: System_User
CREATE TABLE System_User (
    UserID              INT             PRIMARY KEY AUTO_INCREMENT,
    FullName            VARCHAR(100)    NOT NULL,
    PasswordHash        VARCHAR(255)    NOT NULL,
    EmailAddress        VARCHAR(100)    NOT NULL UNIQUE,
    Role                VARCHAR(50)     NOT NULL,
    Eligibility         VARCHAR(20)     DEFAULT 'Pending',
    VotedFlag           CHAR(1)         DEFAULT 'N',
    ProfileInfo         VARCHAR(200),
    CreatedDate         DATE            DEFAULT CURDATE(),
    LastLoginTimestamp  DATETIME,
    
    CONSTRAINT chk_user_role CHECK (Role IN ('Voter', 'Candidate', 'Administrator', 'ElectionOfficial', 'OversightOfficer')),
    CONSTRAINT chk_user_eligibility CHECK (Eligibility IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT chk_user_votedflag CHECK (VotedFlag IN ('Y', 'N'))
);

-- TABLE 2: Election
CREATE TABLE Election (
    ElectionID          INT             PRIMARY KEY AUTO_INCREMENT,
    ElectionName        VARCHAR(100)    NOT NULL,
    StartDateTime       DATETIME        NOT NULL,
    EndDateTime         DATETIME        NOT NULL,
    Status              VARCHAR(50)     DEFAULT 'Upcoming',
    Rules               TEXT,
    
    CONSTRAINT chk_election_status CHECK (Status IN ('Upcoming', 'Active', 'Closed', 'Archived')),
    CONSTRAINT chk_election_dates CHECK (StartDateTime < EndDateTime)
);

-- TABLE 3: Positions
CREATE TABLE Positions (
    PositionID          INT             PRIMARY KEY AUTO_INCREMENT,
    ElectionID          INT             NOT NULL,
    PositionName        VARCHAR(100)    NOT NULL,
    Description         VARCHAR(500),
    OrderOnBallot       INT             DEFAULT 0,
    
    CONSTRAINT fk_positions_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID) ON DELETE CASCADE
);

-- TABLE 4: BallotStructure
CREATE TABLE BallotStructure (
    BallotID            INT             PRIMARY KEY AUTO_INCREMENT,
    ElectionID          INT             NOT NULL,
    BallotName          VARCHAR(100)    NOT NULL,
    IsActive            CHAR(1)         DEFAULT 'Y',
    
    CONSTRAINT fk_ballotstructure_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID) ON DELETE CASCADE,
    CONSTRAINT chk_ballotstructure_active CHECK (IsActive IN ('Y', 'N'))
);

-- TABLE 5: BallotItem
CREATE TABLE BallotItem (
    BallotItemID        INT             PRIMARY KEY AUTO_INCREMENT,
    BallotID            INT             NOT NULL,
    PositionID          INT             NOT NULL,
    DisplayOrder        INT             DEFAULT 0,
    
    CONSTRAINT fk_ballotitem_ballot FOREIGN KEY (BallotID) REFERENCES BallotStructure(BallotID) ON DELETE CASCADE,
    CONSTRAINT fk_ballotitem_position FOREIGN KEY (PositionID) REFERENCES Positions(PositionID)
);

-- TABLE 6: CandidateNomination
CREATE TABLE CandidateNomination (
    NominationID        INT             PRIMARY KEY AUTO_INCREMENT,
    ElectionID          INT             NOT NULL,
    CandidateUserID     INT             NOT NULL,
    PositionID          INT             NOT NULL,
    ApprovalStatus      VARCHAR(20)     DEFAULT 'Pending',
    ApprovedBy          VARCHAR(100),
    NominationDate      DATE            DEFAULT CURDATE(),
    
    CONSTRAINT fk_nomination_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_nomination_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_nomination_position FOREIGN KEY (PositionID) REFERENCES Positions(PositionID),
    CONSTRAINT uc_nomination_candidate_position UNIQUE (CandidateUserID, PositionID, ElectionID),
    CONSTRAINT chk_nomination_status CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'))
);

-- ANONYMOUS VOTING TABLES (Changes made here in respect to Zamokuhle's concerns)

-- TABLE 7: VoterTokenRegistry - Links voter to anonymous token
CREATE TABLE VoterTokenRegistry (
    TokenRegistryID     INT             PRIMARY KEY AUTO_INCREMENT,
    VoterUserID         INT             NOT NULL,
    ElectionID          INT             NOT NULL,
    VoterToken          VARCHAR(255)    NOT NULL UNIQUE,
    TokenGeneratedAt    DATETIME        DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_token_voter FOREIGN KEY (VoterUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_token_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT uc_voter_election_token UNIQUE (VoterUserID, ElectionID),
    INDEX idx_voter_token (VoterToken)
);

-- TABLE 8: CastVote - Anonymous votes (NO direct VoterUserID)
CREATE TABLE CastVote (
    VoteID              INT             PRIMARY KEY AUTO_INCREMENT,
    ElectionID          INT             NOT NULL,
    BallotItemID        INT             NOT NULL,
    CandidateUserID     INT             NOT NULL,
    VoterToken          VARCHAR(255)    NOT NULL,
    EncryptedVoteData   VARCHAR(500),
    TimestampCasted     DATETIME        DEFAULT CURRENT_TIMESTAMP,
    VoteHash            VARCHAR(255)    NOT NULL UNIQUE,
    
    CONSTRAINT fk_castvote_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_castvote_ballotitem FOREIGN KEY (BallotItemID) REFERENCES BallotItem(BallotItemID),
    CONSTRAINT fk_castvote_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_castvote_token FOREIGN KEY (VoterToken) REFERENCES VoterTokenRegistry(VoterToken),
    
    INDEX idx_castvote_election (ElectionID),
    INDEX idx_castvote_candidate (CandidateUserID),
    INDEX idx_castvote_token (VoterToken),
    INDEX idx_castvote_timestamp (TimestampCasted)
);

-- TABLE 9: Results
CREATE TABLE Results (
    ResultID            INT             PRIMARY KEY AUTO_INCREMENT,
    ElectionID          INT             NOT NULL,
    BallotItemID        INT             NOT NULL,
    CandidateUserID     INT             NOT NULL,
    TotalVotes          INT             DEFAULT 0,
    PercentageWon       DECIMAL(5,2)    DEFAULT 0,
    MarginOfVictory     INT             DEFAULT 0,
    IsWinner            CHAR(1)         DEFAULT 'N',
    
    CONSTRAINT fk_results_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_results_ballotitem FOREIGN KEY (BallotItemID) REFERENCES BallotItem(BallotItemID),
    CONSTRAINT fk_results_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT uc_results_per_candidate UNIQUE (ElectionID, BallotItemID, CandidateUserID),
    CONSTRAINT chk_results_winner CHECK (IsWinner IN ('Y', 'N')),
    CONSTRAINT chk_results_percentage CHECK (PercentageWon BETWEEN 0 AND 100),
    CONSTRAINT chk_results_votes CHECK (TotalVotes >= 0)
);

-- TABLE 10: OversightReview
CREATE TABLE OversightReview (
    ReviewID            INT             PRIMARY KEY AUTO_INCREMENT,
    OfficerUserID       INT             NOT NULL,
    NominationID        INT,
    ReviewStartTime     DATETIME        DEFAULT CURRENT_TIMESTAMP,
    ReviewEndTime       DATETIME,
    AuditIDStart        INT,
    AuditIDEnd          INT,
    Findings            TEXT,
    CertificationStatus VARCHAR(20)     DEFAULT 'Pending',
    
    CONSTRAINT fk_review_officer FOREIGN KEY (OfficerUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_review_nomination FOREIGN KEY (NominationID) REFERENCES CandidateNomination(NominationID),
    CONSTRAINT chk_review_status CHECK (CertificationStatus IN ('Pending', 'Certified', 'Rejected', 'NeedsRevision'))
);

-- TABLE 11: AccessLog
CREATE TABLE AccessLog (
    LogID               INT             PRIMARY KEY AUTO_INCREMENT,
    UserID              INT             NOT NULL,
    LoginTimestamp      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    IPAddress           VARCHAR(45)     NOT NULL,
    SuccessFlag         CHAR(1)         DEFAULT 'N',
    FailureReason       VARCHAR(255),
    
    CONSTRAINT fk_accesslog_user FOREIGN KEY (UserID) REFERENCES System_User(UserID),
    CONSTRAINT chk_accesslog_success CHECK (SuccessFlag IN ('Y', 'N'))
);

-- TABLE 12: SystemAuditLog
CREATE TABLE SystemAuditLog (
    AuditID             INT             PRIMARY KEY AUTO_INCREMENT,
    UserID              INT             NOT NULL,
    ActionType          VARCHAR(100)    NOT NULL,
    TargetEntity        VARCHAR(100)    NOT NULL,
    TargetID            VARCHAR(50),
    Timestamp           DATETIME        DEFAULT CURRENT_TIMESTAMP,
    IPAddress           VARCHAR(45),
    Description         TEXT,
    
    CONSTRAINT fk_audit_user FOREIGN KEY (UserID) REFERENCES System_User(UserID)
);
