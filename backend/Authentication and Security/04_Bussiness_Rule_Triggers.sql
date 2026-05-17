DELIMITER //

-- TRIGGER 1: Only administrators can create elections
CREATE TRIGGER trg_check_election_creator
BEFORE INSERT ON Election
FOR EACH ROW
BEGIN
    DECLARE v_user_role VARCHAR(50);
    SELECT Role INTO v_user_role FROM System_User WHERE UserID = @current_user_id;
    
    IF v_user_role != 'Administrator' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Only administrators can create elections';
    END IF;
END //

-- TRIGGER 2: Only admins can approve nominations
CREATE TRIGGER trg_check_nomination_approval
BEFORE UPDATE ON CandidateNomination
FOR EACH ROW
BEGIN
    DECLARE v_user_role VARCHAR(50);
    
    IF NEW.ApprovalStatus = 'Approved' AND OLD.ApprovalStatus != 'Approved' THEN
        SELECT Role INTO v_user_role FROM System_User WHERE UserID = @current_user_id;
        
        IF v_user_role != 'Administrator' THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only administrators can approve nominations';
        END IF;
    END IF;
END //

-- TRIGGER 3: Prevent vote modification (immutability)
CREATE TRIGGER trg_prevent_vote_update
BEFORE UPDATE ON CastVote
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Votes cannot be modified once submitted';
END //

-- TRIGGER 4: Prevent vote deletion (immutability)
CREATE TRIGGER trg_prevent_vote_delete
BEFORE DELETE ON CastVote
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Votes cannot be deleted once submitted';
END //

-- TRIGGER 5: Candidates cannot modify profile after approval
CREATE TRIGGER trg_prevent_candidate_update
BEFORE UPDATE ON System_User
FOR EACH ROW
BEGIN
    DECLARE v_nomination_count INT;
    
    IF OLD.Role = 'Candidate' THEN
        SELECT COUNT(*) INTO v_nomination_count
        FROM CandidateNomination
        WHERE CandidateUserID = OLD.UserID AND ApprovalStatus = 'Approved';
        
        IF v_nomination_count > 0 THEN
            IF NEW.FullName != OLD.FullName OR NEW.EmailAddress != OLD.EmailAddress THEN
                SIGNAL SQLSTATE '45000' 
                SET MESSAGE_TEXT = 'Candidates cannot modify profile after nomination is approved';
            END IF;
        END IF;
    END IF;
END //

DELIMITER ;