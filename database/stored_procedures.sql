/*
=============================================================================
EduPlay Database Stored Procedures
Database: games
=============================================================================
*/

USE `games`;

-- -------------------------------------------------------------
-- 1. USERS STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_users`;
DELIMITER //
CREATE PROCEDURE `sp_get_users`()
BEGIN
    SELECT 
        id, 
        name, 
        email, 
        role, 
        is_pro AS isPro, 
        avatar_url AS avatarUrl, 
        class_name AS className,
        created_at AS createdAt
    FROM `users`
    ORDER BY `created_at` ASC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_update_user`;
DELIMITER //
CREATE PROCEDURE `sp_update_user`(
    IN p_id VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_is_pro TINYINT(1),
    IN p_avatar_url TEXT,
    IN p_class_name VARCHAR(255)
)
BEGIN
    UPDATE `users`
    SET 
        `name` = COALESCE(p_name, `name`),
        `email` = COALESCE(p_email, `email`),
        `is_pro` = COALESCE(p_is_pro, `is_pro`),
        `avatar_url` = COALESCE(p_avatar_url, `avatar_url`),
        `class_name` = COALESCE(p_class_name, `class_name`)
    WHERE `id` = p_id;

    SELECT ROW_COUNT() AS affected_rows;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 2. GAMES CATALOG STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_games`;
DELIMITER //
CREATE PROCEDURE `sp_get_games`()
BEGIN
    SELECT 
        id, 
        name, 
        slug, 
        description, 
        mechanic, 
        badge, 
        category, 
        min_grade AS minGrade, 
        icon_name AS iconName, 
        gradient_bg AS gradientBg, 
        accent_color AS accentColor, 
        image_url AS imageUrl
    FROM `games`
    ORDER BY `id` ASC;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 3. QUESTION SETS & QUESTIONS STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_question_sets`;
DELIMITER //
CREATE PROCEDURE `sp_get_question_sets`()
BEGIN
    SELECT 
        id, 
        owner_id AS ownerId, 
        owner_name AS ownerName, 
        title, 
        description, 
        subject, 
        grade_level AS gradeLevel, 
        is_public AS isPublic, 
        tags, 
        created_at AS createdAt, 
        updated_at AS updatedAt
    FROM `question_sets`
    ORDER BY `updated_at` DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_get_question_set_by_id`;
DELIMITER //
CREATE PROCEDURE `sp_get_question_set_by_id`(
    IN p_id VARCHAR(255)
)
BEGIN
    SELECT 
        id, 
        owner_id AS ownerId, 
        owner_name AS ownerName, 
        title, 
        description, 
        subject, 
        grade_level AS gradeLevel, 
        is_public AS isPublic, 
        tags, 
        created_at AS createdAt, 
        updated_at AS updatedAt
    FROM `question_sets`
    WHERE `id` = p_id;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_get_questions_by_set_id`;
DELIMITER //
CREATE PROCEDURE `sp_get_questions_by_set_id`(
    IN p_set_id VARCHAR(255)
)
BEGIN
    SELECT 
        id, 
        set_id AS setId, 
        prompt_text AS promptText, 
        answer, 
        options, 
        type, 
        position, 
        hint
    FROM `questions`
    WHERE `set_id` = p_set_id
    ORDER BY `position` ASC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_upsert_question_set`;
DELIMITER //
CREATE PROCEDURE `sp_upsert_question_set`(
    IN p_id VARCHAR(255),
    IN p_owner_id VARCHAR(255),
    IN p_owner_name VARCHAR(255),
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_subject VARCHAR(255),
    IN p_grade_level VARCHAR(100),
    IN p_is_public TINYINT(1),
    IN p_tags TEXT,
    IN p_created_at DATETIME,
    IN p_updated_at DATETIME
)
BEGIN
    IF EXISTS (SELECT 1 FROM `question_sets` WHERE `id` = p_id) THEN
        UPDATE `question_sets`
        SET 
            `title` = p_title,
            `description` = p_description,
            `subject` = p_subject,
            `grade_level` = p_grade_level,
            `is_public` = p_is_public,
            `tags` = p_tags,
            `updated_at` = p_updated_at
        WHERE `id` = p_id;
    ELSE
        INSERT INTO `question_sets` (
            `id`, `owner_id`, `owner_name`, `title`, `description`, 
            `subject`, `grade_level`, `is_public`, `tags`, `created_at`, `updated_at`
        ) VALUES (
            p_id, p_owner_id, p_owner_name, p_title, p_description, 
            p_subject, p_grade_level, p_is_public, p_tags, p_created_at, p_updated_at
        );
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_delete_questions_by_set_id`;
DELIMITER //
CREATE PROCEDURE `sp_delete_questions_by_set_id`(
    IN p_set_id VARCHAR(255)
)
BEGIN
    DELETE FROM `questions` WHERE `set_id` = p_set_id;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_insert_question`;
DELIMITER //
CREATE PROCEDURE `sp_insert_question`(
    IN p_id VARCHAR(255),
    IN p_set_id VARCHAR(255),
    IN p_prompt_text TEXT,
    IN p_answer TEXT,
    IN p_options TEXT,
    IN p_type VARCHAR(50),
    IN p_position INT,
    IN p_hint TEXT
)
BEGIN
    INSERT INTO `questions` (
        `id`, `set_id`, `prompt_text`, `answer`, `options`, `type`, `position`, `hint`
    ) VALUES (
        p_id, p_set_id, p_prompt_text, p_answer, p_options, p_type, p_position, p_hint
    );
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_delete_question_set`;
DELIMITER //
CREATE PROCEDURE `sp_delete_question_set`(
    IN p_id VARCHAR(255)
)
BEGIN
    DELETE FROM `question_sets` WHERE `id` = p_id;
    SELECT ROW_COUNT() AS affected_rows;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 4. ASSIGNMENTS STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_assignments`;
DELIMITER //
CREATE PROCEDURE `sp_get_assignments`()
BEGIN
    SELECT 
        id, 
        teacher_id AS teacherId, 
        teacher_name AS teacherName, 
        class_id AS classId, 
        class_name AS className, 
        question_set_id AS questionSetId, 
        question_set_title AS questionSetTitle, 
        game_slug AS gameSlug, 
        game_name AS gameName, 
        join_code AS joinCode, 
        due_date AS dueDate, 
        rewards_enabled AS rewardsEnabled, 
        created_at AS createdAt
    FROM `assignments`
    ORDER BY `created_at` DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_create_assignment`;
DELIMITER //
CREATE PROCEDURE `sp_create_assignment`(
    IN p_id VARCHAR(255),
    IN p_teacher_id VARCHAR(255),
    IN p_teacher_name VARCHAR(255),
    IN p_class_id VARCHAR(255),
    IN p_class_name VARCHAR(255),
    IN p_question_set_id VARCHAR(255),
    IN p_question_set_title VARCHAR(255),
    IN p_game_slug VARCHAR(255),
    IN p_game_name VARCHAR(255),
    IN p_join_code VARCHAR(100),
    IN p_due_date VARCHAR(100),
    IN p_rewards_enabled TINYINT(1),
    IN p_created_at DATETIME
)
BEGIN
    INSERT INTO `assignments` (
        `id`, `teacher_id`, `teacher_name`, `class_id`, `class_name`, 
        `question_set_id`, `question_set_title`, `game_slug`, `game_name`, 
        `join_code`, `due_date`, `rewards_enabled`, `created_at`
    ) VALUES (
        p_id, p_teacher_id, p_teacher_name, p_class_id, p_class_name, 
        p_question_set_id, p_question_set_title, p_game_slug, p_game_name, 
        p_join_code, p_due_date, p_rewards_enabled, p_created_at
    );
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_delete_assignment`;
DELIMITER //
CREATE PROCEDURE `sp_delete_assignment`(
    IN p_id VARCHAR(255)
)
BEGIN
    DELETE FROM `assignments` WHERE `id` = p_id;
    SELECT ROW_COUNT() AS affected_rows;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 5. ATTEMPTS & ANSWERS STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_attempts`;
DELIMITER //
CREATE PROCEDURE `sp_get_attempts`()
BEGIN
    SELECT 
        id, 
        assignment_id AS assignmentId, 
        student_id AS studentId, 
        student_name AS studentName, 
        question_set_id AS questionSetId, 
        question_set_title AS questionSetTitle, 
        game_slug AS gameSlug, 
        score, 
        accuracy, 
        total_questions AS totalQuestions, 
        correct_count AS correctCount, 
        completed_at AS completedAt
    FROM `attempts`
    ORDER BY `completed_at` DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_get_attempt_answers`;
DELIMITER //
CREATE PROCEDURE `sp_get_attempt_answers`(
    IN p_attempt_id VARCHAR(255)
)
BEGIN
    SELECT 
        question_id AS questionId, 
        question_prompt AS questionPrompt, 
        student_answer AS studentAnswer, 
        correct_answer AS correctAnswer, 
        is_correct AS isCorrect
    FROM `attempt_answers`
    WHERE `attempt_id` = p_attempt_id
    ORDER BY `id` ASC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_record_attempt`;
DELIMITER //
CREATE PROCEDURE `sp_record_attempt`(
    IN p_id VARCHAR(255),
    IN p_assignment_id VARCHAR(255),
    IN p_student_id VARCHAR(255),
    IN p_student_name VARCHAR(255),
    IN p_question_set_id VARCHAR(255),
    IN p_question_set_title VARCHAR(255),
    IN p_game_slug VARCHAR(255),
    IN p_score INT,
    IN p_accuracy INT,
    IN p_total_questions INT,
    IN p_correct_count INT,
    IN p_completed_at DATETIME
)
BEGIN
    INSERT INTO `attempts` (
        `id`, `assignment_id`, `student_id`, `student_name`, 
        `question_set_id`, `question_set_title`, `game_slug`, 
        `score`, `accuracy`, `total_questions`, `correct_count`, `completed_at`
    ) VALUES (
        p_id, p_assignment_id, p_student_id, p_student_name, 
        p_question_set_id, p_question_set_title, p_game_slug, 
        p_score, p_accuracy, p_total_questions, p_correct_count, p_completed_at
    );
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_add_attempt_answer`;
DELIMITER //
CREATE PROCEDURE `sp_add_attempt_answer`(
    IN p_attempt_id VARCHAR(255),
    IN p_question_id VARCHAR(255),
    IN p_question_prompt TEXT,
    IN p_student_answer TEXT,
    IN p_correct_answer TEXT,
    IN p_is_correct TINYINT(1)
)
BEGIN
    INSERT INTO `attempt_answers` (
        `attempt_id`, `question_id`, `question_prompt`, 
        `student_answer`, `correct_answer`, `is_correct`
    ) VALUES (
        p_attempt_id, p_question_id, p_question_prompt, 
        p_student_answer, p_correct_answer, p_is_correct
    );
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 6. STICKERS CATALOG STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_stickers`;
DELIMITER //
CREATE PROCEDURE `sp_get_stickers`()
BEGIN
    SELECT 
        id, 
        name, 
        rarity, 
        category, 
        emoji, 
        description
    FROM `stickers`
    ORDER BY `id` ASC;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 7. ROSTER STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_roster`;
DELIMITER //
CREATE PROCEDURE `sp_get_roster`()
BEGIN
    SELECT 
        id, 
        name, 
        avatar, 
        stars, 
        points
    FROM `roster`
    ORDER BY `points` DESC, `stars` DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_add_student`;
DELIMITER //
CREATE PROCEDURE `sp_add_student`(
    IN p_id VARCHAR(191),
    IN p_name VARCHAR(255),
    IN p_avatar VARCHAR(255)
)
BEGIN
    INSERT INTO `roster` (`id`, `name`, `avatar`, `stars`, `points`)
    VALUES (p_id, p_name, COALESCE(p_avatar, '🧑'), 0, 0);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_update_student`;
DELIMITER //
CREATE PROCEDURE `sp_update_student`(
    IN p_id VARCHAR(191),
    IN p_name VARCHAR(255),
    IN p_avatar VARCHAR(255),
    IN p_stars INT,
    IN p_points INT
)
BEGIN
    UPDATE `roster`
    SET 
        `name` = COALESCE(p_name, `name`),
        `avatar` = COALESCE(p_avatar, `avatar`),
        `stars` = COALESCE(p_stars, `stars`),
        `points` = COALESCE(p_points, `points`)
    WHERE `id` = p_id;

    SELECT ROW_COUNT() AS affected_rows;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_delete_student`;
DELIMITER //
CREATE PROCEDURE `sp_delete_student`(
    IN p_id VARCHAR(191)
)
BEGIN
    DELETE FROM `roster` WHERE `id` = p_id;
    SELECT ROW_COUNT() AS affected_rows;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 8. REWARDS STORED PROCEDURES
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_rewards`;
DELIMITER //
CREATE PROCEDURE `sp_get_rewards`(
    IN p_student_id VARCHAR(191)
)
BEGIN
    SELECT 
        student_id AS studentId, 
        points, 
        tickets_earned AS ticketsEarned, 
        unlocked_sticker_ids AS unlockedStickerIds
    FROM `rewards`
    WHERE `student_id` = p_student_id;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_update_rewards`;
DELIMITER //
CREATE PROCEDURE `sp_update_rewards`(
    IN p_student_id VARCHAR(191),
    IN p_points INT,
    IN p_tickets_earned INT,
    IN p_unlocked_sticker_ids TEXT
)
BEGIN
    IF EXISTS (SELECT 1 FROM `rewards` WHERE `student_id` = p_student_id) THEN
        UPDATE `rewards`
        SET 
            `points` = COALESCE(p_points, `points`),
            `tickets_earned` = COALESCE(p_tickets_earned, `tickets_earned`),
            `unlocked_sticker_ids` = COALESCE(p_unlocked_sticker_ids, `unlocked_sticker_ids`)
        WHERE `student_id` = p_student_id;
    ELSE
        INSERT INTO `rewards` (`student_id`, `points`, `tickets_earned`, `unlocked_sticker_ids`)
        VALUES (p_student_id, COALESCE(p_points, 0), COALESCE(p_tickets_earned, 0), COALESCE(p_unlocked_sticker_ids, '["stk-1","stk-2"]'));
    END IF;
END //
DELIMITER ;
