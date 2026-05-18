DELIMITER //

-- PROCEDURE 1: REGISTER USER
DROP PROCEDURE IF EXISTS sp_RegisterUser;
CREATE PROCEDURE sp_RegisterUser(
    IN p_fullname VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_role VARCHAR(50),
    OUT p_user_id INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_salt VARCHAR(255);
    DECLARE v_password_hash VARCHAR(255);
    DECLARE v_email_exists INT;
    
    SELECT COUNT(*) INTO v_email_exists
    FROM System_User
    WHERE EmailAddress = p_email;
    
    IF v_email_exists > 0 THEN
        SET p_message = 'Email already registered';
        SET p_user_id = -1;
    ELSE
        SET v_salt = SHA2(RAND(), 256);
        SET v_password_hash = SHA2(CONCAT(p_password, v_salt), 512);
        
        INSERT INTO System_User (FullName, EmailAddress, PasswordHash, Salt, Role, Eligibility, CreatedDate)
        VALUES (p_fullname, p_email, v_password_hash, v_salt, p_role, 'Pending', CURDATE());
        
        SET p_user_id = LAST_INSERT_ID();
        SET p_message = 'Registration successful. Awaiting approval.';
        
        INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, Status)
        VALUES (p_user_id, 'REGISTRATION', CONCAT('New user registered with role: ', p_role), 'Success');
    END IF;
END //

-- PROCEDURE 2: USER LOGIN
DROP PROCEDURE IF EXISTS sp_Login;
CREATE PROCEDURE sp_Login(
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent VARCHAR(255),
    OUT p_user_id INT,
    OUT p_role VARCHAR(50),
    OUT p_account_status VARCHAR(50),
    OUT p_access_token VARCHAR(500),
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_password_hash VARCHAR(255);
    DECLARE v_salt VARCHAR(255);
    DECLARE v_computed_hash VARCHAR(255);
    DECLARE v_account_locked CHAR(1);
    DECLARE v_failed_attempts INT;
    DECLARE v_eligibility VARCHAR(20);
    
    SELECT UserID, PasswordHash, Salt, AccountLocked, FailedLoginAttempts, Role, Eligibility
    INTO v_user_id, v_password_hash, v_salt, v_account_locked, v_failed_attempts, p_role, v_eligibility
    FROM System_User
    WHERE EmailAddress = p_email;
    
    IF v_user_id IS NULL THEN
        SET p_message = 'User not found';
        SET p_user_id = -1;
        
        INSERT INTO SecurityAuditLog (EventType, EventDetail, IPAddress, UserAgent, Status)
        VALUES ('LOGIN_FAILED', CONCAT('Email not found: ', p_email), p_ip_address, p_user_agent, 'Failed');
        
    ELSEIF v_account_locked = 'Y' THEN
        SET p_message = 'Account is locked. Contact administrator.';
        SET p_user_id = -1;
        
        INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, IPAddress, UserAgent, Status)
        VALUES (v_user_id, 'LOGIN_FAILED', 'Account locked', p_ip_address, p_user_agent, 'Failed');
        
    ELSE
        SET v_computed_hash = SHA2(CONCAT(p_password, v_salt), 512);
        
        IF v_computed_hash = v_password_hash THEN
            SET p_user_id = v_user_id;
            
            UPDATE System_User 
            SET FailedLoginAttempts = 0, 
                LastLoginIP = p_ip_address, 
                LastLoginTimestamp = NOW()
            WHERE UserID = v_user_id;
            
            SET p_access_token = SHA2(CONCAT(v_user_id, NOW(), RAND()), 256);
            
            IF v_eligibility = 'Approved' THEN
                SET p_account_status = 'Active';
                SET p_message = 'Login successful';
            ELSEIF v_eligibility = 'Pending' THEN
                SET p_account_status = 'Pending Approval';
                SET p_message = 'Login successful but account pending approval';
            ELSE
                SET p_account_status = 'Rejected';
                SET p_message = 'Login successful but account was rejected';
            END IF;
            
            INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, IPAddress, UserAgent, Status)
            VALUES (v_user_id, 'LOGIN_SUCCESS', CONCAT('Role: ', p_role), p_ip_address, p_user_agent, 'Success');
            
            INSERT INTO AccessLog (UserID, LoginTimestamp, IPAddress, SuccessFlag)
            VALUES (v_user_id, NOW(), p_ip_address, 'Y');
            
        ELSE
            UPDATE System_User 
            SET FailedLoginAttempts = FailedLoginAttempts + 1
            WHERE UserID = v_user_id;
            
            UPDATE System_User 
            SET AccountLocked = 'Y'
            WHERE UserID = v_user_id AND FailedLoginAttempts >= 5;
            
            SET p_user_id = -1;
            SET p_message = 'Invalid password';
            
            INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, IPAddress, UserAgent, Status)
            VALUES (v_user_id, 'LOGIN_FAILED', 'Invalid password', p_ip_address, p_user_agent, 'Failed');
            
            INSERT INTO AccessLog (UserID, LoginTimestamp, IPAddress, SuccessFlag, FailureReason)
            VALUES (v_user_id, NOW(), p_ip_address, 'N', 'Invalid password');
        END IF;
    END IF;
END //

-- PROCEDURE 3: CHECK PERMISSION
DROP PROCEDURE IF EXISTS sp_CheckPermission;
CREATE PROCEDURE sp_CheckPermission(
    IN p_user_id INT,
    IN p_required_role VARCHAR(50),
    OUT p_has_permission BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_user_role VARCHAR(50);
    DECLARE v_eligibility VARCHAR(20);
    
    SELECT Role, Eligibility INTO v_user_role, v_eligibility
    FROM System_User
    WHERE UserID = p_user_id;
    
    SET p_has_permission = FALSE;
    
    CASE p_required_role
        WHEN 'Administrator' THEN
            IF v_user_role = 'Administrator' THEN
                SET p_has_permission = TRUE;
                SET p_message = 'Permission granted';
            ELSE
                SET p_message = 'Admin privileges required';
            END IF;
            
        WHEN 'ElectionOfficial' THEN
            IF v_user_role IN ('Administrator', 'ElectionOfficial') THEN
                SET p_has_permission = TRUE;
                SET p_message = 'Permission granted';
            ELSE
                SET p_message = 'Election Official privileges required';
            END IF;
            
        WHEN 'OversightOfficer' THEN
            IF v_user_role IN ('Administrator', 'OversightOfficer') THEN
                SET p_has_permission = TRUE;
                SET p_message = 'Permission granted';
            ELSE
                SET p_message = 'Oversight Officer privileges required';
            END IF;
            
        WHEN 'Candidate' THEN
            IF v_user_role IN ('Administrator', 'Candidate') AND v_eligibility = 'Approved' THEN
                SET p_has_permission = TRUE;
                SET p_message = 'Permission granted';
            ELSE
                SET p_message = 'Candidate privileges required or account not approved';
            END IF;
            
        WHEN 'Voter' THEN
            IF v_user_role IN ('Administrator', 'Voter') AND v_eligibility = 'Approved' THEN
                SET p_has_permission = TRUE;
                SET p_message = 'Permission granted';
            ELSE
                SET p_message = 'Voter privileges required or account not approved';
            END IF;
            
        ELSE
            SET p_message = 'Invalid role specified';
    END CASE;
    
    INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, Status)
    VALUES (p_user_id, 'PERMISSION_CHECK', 
            CONCAT('Required: ', p_required_role, ' - Result: ', IF(p_has_permission, 'Granted', 'Denied')),
            IF(p_has_permission, 'Success', 'Failed'));
END //

-- PROCEDURE 4: CHANGE PASSWORD
DROP PROCEDURE IF EXISTS sp_ChangePassword;
CREATE PROCEDURE sp_ChangePassword(
    IN p_user_id INT,
    IN p_old_password VARCHAR(255),
    IN p_new_password VARCHAR(255),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_salt VARCHAR(255);
    DECLARE v_stored_hash VARCHAR(255);
    DECLARE v_computed_hash VARCHAR(255);
    DECLARE v_new_salt VARCHAR(255);
    DECLARE v_new_hash VARCHAR(255);
    
    SELECT Salt, PasswordHash INTO v_salt, v_stored_hash
    FROM System_User
    WHERE UserID = p_user_id;
    
    SET v_computed_hash = SHA2(CONCAT(p_old_password, v_salt), 512);
    
    IF v_computed_hash != v_stored_hash THEN
        SET p_success = FALSE;
        SET p_message = 'Current password is incorrect';
        
        INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, Status)
        VALUES (p_user_id, 'PASSWORD_CHANGE_FAILED', 'Incorrect current password', 'Failed');
    ELSE
        SET v_new_salt = SHA2(RAND(), 256);
        SET v_new_hash = SHA2(CONCAT(p_new_password, v_new_salt), 512);
        
        UPDATE System_User 
        SET PasswordHash = v_new_hash, Salt = v_new_salt, LastPasswordChange = CURDATE()
        WHERE UserID = p_user_id;
        
        SET p_success = TRUE;
        SET p_message = 'Password changed successfully';
        
        INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, Status)
        VALUES (p_user_id, 'PASSWORD_CHANGED', 'Password successfully updated', 'Success');
        
        UPDATE UserSession SET IsActive = 'N' WHERE UserID = p_user_id;
    END IF;
END //

-- PROCEDURE 5: CAST VOTE
DROP PROCEDURE IF EXISTS sp_CastVote //
CREATE PROCEDURE sp_CastVote(
    IN p_voter_user_id INT,
    IN p_election_id INT,
    IN p_ballot_item_id INT,
    IN p_candidate_user_id INT,
    IN p_encrypted_vote_data VARCHAR(500),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
sp_CastVote: BEGIN
    DECLARE v_token VARCHAR(255);
    DECLARE v_vote_exists INT;
    DECLARE v_election_status VARCHAR(50);
    DECLARE v_current_time DATETIME;
    DECLARE v_start_time DATETIME;
    DECLARE v_end_time DATETIME;
    DECLARE v_voter_role VARCHAR(50);
    DECLARE v_voter_eligibility VARCHAR(20);
    
    SET v_current_time = NOW();
    SET p_success = FALSE;
    
    SELECT Role, Eligibility INTO v_voter_role, v_voter_eligibility
    FROM System_User WHERE UserID = p_voter_user_id;
    
    IF v_voter_role != 'Voter' THEN
        SET p_message = 'Only registered voters can cast votes';
        LEAVE sp_CastVote;
    END IF;
    
    IF v_voter_eligibility != 'Approved' THEN
        SET p_message = 'Voter account is not approved';
        LEAVE sp_CastVote;
    END IF;
    
    SELECT Status, StartDateTime, EndDateTime 
    INTO v_election_status, v_start_time, v_end_time
    FROM Election WHERE ElectionID = p_election_id;
    
    IF v_election_status != 'Active' THEN
        SET p_message = 'Election is not active';
        LEAVE sp_CastVote;
    END IF;
    
    IF v_current_time NOT BETWEEN v_start_time AND v_end_time THEN
        SET p_message = 'Voting is only allowed within the election time frame';
        LEAVE sp_CastVote;
    END IF;
    
    SELECT COUNT(*) INTO v_vote_exists
    FROM VoterTokenRegistry vtr
    INNER JOIN CastVote cv ON vtr.VoterToken = cv.VoterToken
    WHERE vtr.VoterUserID = p_voter_user_id AND vtr.ElectionID = p_election_id;
    
    IF v_vote_exists > 0 THEN
        SET p_message = 'You have already voted in this election';
        LEAVE sp_CastVote;
    END IF;
    
    SET v_token = SHA2(CONCAT(p_voter_user_id, p_election_id, 'VOTING_SALT_2026', RAND()), 512);
    
    INSERT INTO VoterTokenRegistry (VoterUserID, ElectionID, VoterToken)
    VALUES (p_voter_user_id, p_election_id, v_token);
    
    INSERT INTO CastVote (ElectionID, BallotItemID, CandidateUserID, VoterToken, EncryptedVoteData, VoteHash)
    VALUES (p_election_id, p_ballot_item_id, p_candidate_user_id, v_token, p_encrypted_vote_data,
            SHA2(CONCAT(p_election_id, p_ballot_item_id, v_token, v_current_time), 512));
    
    UPDATE System_User SET VotedFlag = 'Y' WHERE UserID = p_voter_user_id;
    
    SET p_success = TRUE;
    SET p_message = 'Vote cast successfully and anonymously';
    
    INSERT INTO SecurityAuditLog (UserID, EventType, EventDetail, Status)
    VALUES (p_voter_user_id, 'CAST_VOTE', 'Vote cast successfully', 'Success');
END sp_CastVote //

DELIMITER ;
