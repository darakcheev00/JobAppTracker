import pool from '../db/db_config';



export default class DatabaseService {
    // ===================== Cache =====================
    // private static invalidSenderCache: Record<string,any> = {};

    // ====================================================================================================
    // User
    // ====================================================================================================

    static async getAllUsers() {
        try {
            const result = await pool.query("SELECT * FROM UserAccount");
            return result.rows;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    static async getSingleUser(userId: any) {
        try {
            const result = await pool.query("SELECT * FROM UserAccount WHERE UserId = $1", [userId]);
            return result.rows.length === 0 ? null : result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    static async getSingleUserByEmail(email: string) {
        try {
            const result = await pool.query("SELECT * FROM UserAccount WHERE useremail = $1", [email]);
            return result.rows.length === 0 ? null : result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    static async addNewUser(attributes: Record<string, any>) {
        try {
            const result = await pool.query(
                'INSERT INTO UserAccount (UserEmail, AuthToken) VALUES ($1, $2) RETURNING *',
                [attributes.user_email, attributes.auth_token]
            );
            return result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    static async updateUserInfo(userId: any, updatedUserData: Record<string, any>) {
        try {
            const user_table_map: { [key: string]: string } = {
                "useremail": "UserEmail",
                "authtoken": "AuthToken",
            }

            // Build dynamic set
            const setClause = Object.keys(updatedUserData)
                .map((key, index) => `${user_table_map[key]} = $${index + 2}`)
                .join(', ');

            // Construct dynamic sql query
            const queryString = `UPDATE UserAccount SET ${setClause} WHERE UserId = $1 RETURNING *`;

            // Execute query
            const result = await pool.query(queryString, [userId, ...Object.values(updatedUserData)]);
            return result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    static async userExists(userId: any) {
        try {
            const result = await pool.query("SELECT * FROM UserAccount WHERE UserId = $1", [userId]);
            return result.rows.length !== 0;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    static async getGoogleAuthToken(userId: any) {
        try {
            const queryString = "SELECT authtoken FROM UserAccount WHERE userId = $1";
            const result = await pool.query(queryString, [userId]);
            return result.rows.length === 0 ? null : result.rows[0].authtoken;
        } catch (err: any) {
            console.error('[server]: Error setting authtoken. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    static async setGoogleAuthToken(userId: any, token: string) {
        try {
            const queryString = "UPDATE UserAccount SET AuthToken = $2 WHERE UserId = $1";
            await pool.query(queryString, [userId, token]);
        } catch (err: any) {
            console.error('[server]: Error setting authtoken. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }
    
    static async getGPTKey(userId: any, token: string) {
        console.log("getGPTKey NOT IMPLEMEMENTED");
    }
    static async setGPTKey(userId: any, token: string) {
        console.log("setGPTKey NOT IMPLEMEMENTED");
    }

    // ====================================================================================================
    // Invalid Sender
    // ====================================================================================================

    static async getInvalidSenders(userId: any) {
        try {
            const result = await pool.query("SELECT EmailAddress FROM InvalidSender WHERE UserId = $1", [userId]);
            return result.rows;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    static async senderExists(userId: any, email_address: string) {
        try {
            const result = await pool.query("SELECT * FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, email_address]);
            return result.rows.length !== 0;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    static async addNewInvalidSender(userId: any, email_address: string) {
        try {
            const result = await pool.query("INSERT INTO InvalidSender (UserId, EmailAddress) VALUES ($1, $2) RETURNING *", [userId, email_address]);
            return result.rows.length !== 0;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    static async deleteInvalidSender(userId: any, email_address: string) {
        try {
            await pool.query("DELETE FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, email_address]);
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }


    // ====================================================================================================
    // AppStatus
    // ====================================================================================================

    static async getAllUserStatus(userId: any) {
        try {
            const result = await pool.query(`
                SELECT 
                    selected.JobId,
                    selected.date,
                    selected.sender,
                    selected.gmailmsgid,
                    Position.PositionName, 
                    Job.CompanyId, 
                    Company.CompanyName,
                    StatusType.StatusName
                FROM 
                    (SELECT * FROM AppStatus WHERE UserId = $1) AS selected
                INNER JOIN
                    Job USING (JobId)
                INNER JOIN 
                    Position USING (PositionId)
                INNER JOIN 
                    Company USING (CompanyId)
                INNER JOIN 
                    StatusType USING (StatusId)
                ORDER BY date`,
                [userId]);
            return result.rows;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    static async getLatestStatusDate(userId: any) {
        try {
            const result = await pool.query("SELECT date FROM AppStatus WHERE UserId = $1 ORDER BY date LIMIT 1", [userId]);
            return result.rows;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }






}

