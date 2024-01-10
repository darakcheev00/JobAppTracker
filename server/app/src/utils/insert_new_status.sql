CREATE OR REPLACE PROCEDURE insert_app_status(
    IN pos_name VARCHAR,
    IN com_name VARCHAR,
    IN user_id INTEGER,
    IN status_id INTEGER,
    IN date_val INTEGER,
    IN sender_val VARCHAR,
    IN gmail_msg_id VARCHAR,
    IN snippet_val VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    pos_id INTEGER;
    comp_id INTEGER;
    job_id INTEGER;
BEGIN
    -- Your existing logic here
    INSERT INTO "position" (positionname) VALUES (pos_name) ON CONFLICT (positionname) DO NOTHING;
    INSERT INTO company (companyname) VALUES (com_name) ON CONFLICT (companyname) DO NOTHING;
	
    SELECT positionid INTO pos_id FROM "position" WHERE positionname = pos_name;
    SELECT companyid INTO comp_id FROM company WHERE companyname = com_name;
	
    INSERT INTO job (positionid, companyid) VALUES (pos_id, comp_id) ON CONFLICT (positionid, companyid) DO NOTHING;
	SELECT jobid into job_id from job WHERE positionid = pos_id and companyid = comp_id;

    INSERT INTO appstatus (userid, jobid, statusid, date, sender, gmailmsgid, snippet) VALUES (user_id, job_id, status_id, TO_TIMESTAMP(date_val), sender_val, gmail_msg_id, snippet_val);
END;
$$;


-- CALL insert_job_status('salesman', 'bmw', 5, 1, '2021-01-01 00:00:00', 'weewo2o', 4324987);