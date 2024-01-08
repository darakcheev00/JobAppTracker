import { query } from 'express';
import pgPromise from 'pg-promise';
import SharedDataManager from './sharedDataManager';
const fs = require('fs');
const path = require('path');

const add_app_status_query = fs.readFileSync('/app/src/utils/insert_new_status.sql').toString();

const pgp = pgPromise();


const { Pool } = require('pg');

export default class DatabaseService {
    private pool: any;
    private pgp_pool: pgPromise.IDatabase<any>;

    private connection = {
        user: 'daniel_dev',
        password: 'changeme',
        host: 'postgres',
        database: 'daniel_dev',
        port: 5432
    };

    constructor() {
        this.pool = new Pool(this.connection);
        this.pgp_pool = pgp(this.connection);
    }

    // ===================== Cache =====================
    // private static invalidSenderCache: Record<string,any> = {};


    async connect() {
        try {
            await this.pool.connect();
            console.log("[server]: Connected to the database")
        } catch (err: any) {
            throw new Error();
        }
    }

    close() {
        try {
            this.pool.end();
            console.log("[server]: Database connection closed.");
            process.exit(0);

        } catch (err: any) {
            throw new Error();
        }
    }

    // ====================================================================================================
    // User
    // ====================================================================================================

    async getAllUsers() {
        try {
            const result = await this.pool.query("SELECT * FROM UserAccount");
            return result.rows;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    async getSingleUser(userId: any) {
        try {
            const result = await this.pool.query("SELECT * FROM UserAccount WHERE UserId = $1", [userId]);
            return result.rows.length === 0 ? null : result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    async getSingleUserByEmail(email: string) {
        try {
            const result = await this.pool.query("SELECT * FROM UserAccount WHERE useremail = $1", [email]);
            return result.rows.length === 0 ? null : result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    async addNewUser(attributes: Record<string, any>) {
        try {
            const result = await this.pool.query(
                'INSERT INTO UserAccount (UserEmail, AuthToken) VALUES ($1, $2) RETURNING *',
                [attributes.user_email, attributes.auth_token]
            );
            return result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async updateUserInfo(userId: any, updatedUserData: Record<string, any>) {
        try {
            const user_table_map: { [key: string]: string } = {
                "userEmail": "useremail",
                "authToken": "authtoken",
                "gptKey": "gptkey"
            }

            // Build dynamic set
            const setClause = Object.keys(updatedUserData)
                .map((key, index) => `${user_table_map[key]} = $${index + 2}`)
                .join(', ');

            // Construct dynamic sql query
            const queryString = `UPDATE UserAccount SET ${setClause} WHERE UserId = $1 RETURNING *`;

            // Execute query
            const result = await this.pool.query(queryString, [userId, ...Object.values(updatedUserData)]);
            return result.rows[0];
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async userExists(userId: any) {
        try {
            const result = await this.pool.query("SELECT * FROM UserAccount WHERE UserId = $1", [userId]);
            return result.rows.length !== 0;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async getGoogleAuthToken(userId: any) {
        try {
            const queryString = "SELECT authtoken FROM UserAccount WHERE userId = $1";
            const result = await this.pool.query(queryString, [userId]);
            return result.rows.length === 0 ? null : result.rows[0].authtoken;
        } catch (err: any) {
            console.error('[server]: Error setting authtoken. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    async setGoogleAuthToken(userId: any, token: string) {
        try {
            const queryString = "UPDATE UserAccount SET AuthToken = $2 WHERE UserId = $1";
            await this.pool.query(queryString, [userId, token]);
        } catch (err: any) {
            console.error('[server]: Error setting authtoken. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }

    async getGPTKey(userId: any) {
        try {
            const queryString = "SELECT gptkey FROM UserAccount WHERE UserId = $1";
            const result = await this.pool.query(queryString, [userId]);
            return result.rows.length === 0 ? null : result.rows[0].authtoken;
        } catch (err: any) {
            console.error(`[server]: Error getting gpt key. SQL query error: ${err}`);
            throw new Error('Interval server sql error');
        }
    }
    async setGPTKey(userId: any, token: string) {
        try {
            const queryString = "UPDATE UserAccount SET GptKey = #2 WHERE UserId = $1";
            await this.pool.query(queryString, [userId, token])
        } catch (err: any) {
            console.error(`[server]: Error setting gpt key. SQL query error: ${err}`);
            throw new Error('Internal server sql error');
        }
    }

    async get_GPTKey_Token_Date(userId: any) {
        try {
            const queryString = "SELECT gptkey, authtoken, EXTRACT(EPOCH FROM newestmsgdate) as unix_timestamp FROM UserAccount WHERE UserId = $1";
            const result = await this.pool.query(queryString, [userId]);
            if (result.rows.length === 0) throw new Error("No record for userId");
            return {
                gpt_key: result.rows[0].gptkey,
                auth_token: result.rows[0].authtoken,
                newest_msg_date: result.rows[0].unix_timestamp,
            };
        } catch (err: any) {
            console.error(`[server]: Error getting gpt key and auth token. SQL query error: ${err}`);
            throw new Error('Internal server sql error');
        }
    }

    async getNewestMsgDate(userId: string) {
        try {
            const queryString = "SELECT newestmsgdate FROM UserAccount WHERE UserId = $1";
            const result = await this.pool.query(queryString, [userId]);
            return result.rows.length === 0 ? null : result.rows[0].newestmsgdate;
        } catch (err: any) {
            console.error(`[server]: Error getting newest message data. SQL query error: ${err}`);
            throw new Error('Internal server sql error');
        }
    }

    async setNewestMsgDate(userId: string, date: number) {
        try {
            const queryString = "UPDATE UserAccount SET newestmsgdate = TO_TIMESTAMP($2) WHERE UserId = $1";
            await this.pool.query(queryString, [userId, date]);
        } catch (err: any) {
            console.error(`[server]: Error setting newest message data. SQL query error: ${err}`);
            throw new Error('Internal server sql error');
        }
    }

    // ====================================================================================================
    // Invalid Sender
    // ====================================================================================================

    async getInvalidSenders(userId: any): Promise<Set<string>> {
        try {
            const result = await this.pool.query("SELECT EmailAddress FROM InvalidSender WHERE UserId = $1", [userId]);
            const senders: Set<string> = new Set();
            for (const row of result.rows) {
                senders.add(row.EmailAddress);
            }
            return senders;
        } catch (err) {
            console.error('[server]: Error getting invalid senders. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async addNewInvalidEmails(userId: any, senderList: string[]) {
        // convert input to rows to insert
        const dataToInsert = senderList.map(email => {
            return {
                'userid': userId,
                'emailaddress': email
            }
        });

        try {
            const insertStatement = pgp.helpers.insert(dataToInsert, ['userid', 'emailaddress'], 'invalidsender');
            await this.pgp_pool.none(insertStatement);
        } catch (err) {
            console.error('[server]: Error adding new invalid senders. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async senderExists(userId: any, email_address: string) {
        try {
            const result = await this.pool.query("SELECT * FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, email_address]);
            return result.rows.length !== 0;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async addNewInvalidSender(userId: any, email_address: string) {
        try {
            const result = await this.pool.query("INSERT INTO InvalidSender (UserId, EmailAddress) VALUES ($1, $2) RETURNING *", [userId, email_address]);
            return result.rows.length !== 0;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async deleteInvalidSender(userId: any, email_address: string) {
        try {
            await this.pool.query("DELETE FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, email_address]);
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server sql error');
        }
    }


    // ====================================================================================================
    // AppStatus
    // ====================================================================================================
    private selectStatusesClause = `SELECT 
                                        selected.JobId,
                                        selected.date,
                                        selected.sender,
                                        selected.gmailmsgid,
                                        Position.PositionName,
                                        Job.CompanyId, 
                                        Company.CompanyName,
                                        StatusId,
                                        snippet
                                    FROM 
                                        (SELECT * FROM AppStatus WHERE UserId = $1) AS selected
                                    INNER JOIN
                                        Job USING (JobId)
                                    INNER JOIN 
                                        Position USING (PositionId)
                                    INNER JOIN 
                                        Company USING (CompanyId)`;

    private whereClause = `WHERE selected.date > (select date from appstatus where userid = $1 and gmailmsgid = $2)`;

    private orderDescClause = "ORDER BY date DESC";

    async getAllUserStatus(userId: any, msgid: string) {
        try {
            var result;
            if (msgid === 'undef') {
                // Get all
                const queryString = this.selectStatusesClause + ' ' + this.orderDescClause;
                result = await this.pool.query(queryString, [userId]);
            } else {
                const queryString = this.selectStatusesClause + ' ' + this.whereClause + ' ' + this.orderDescClause;
                result = await this.pool.query(queryString, [userId, msgid]);
            }
            return result.rows;
        } catch (err) {
            console.error('[server]: Error getting user statuses. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async getLatestStatusDate(userId: any) {
        try {
            const result = await this.pool.query("SELECT date FROM AppStatus WHERE UserId = $1 ORDER BY date LIMIT 1", [userId]);
            return result.rows;
        } catch (err) {
            console.error('[server]: Error getting user details. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async getStatusTypes() {
        try {
            const result = await this.pool.query("SELECT StatusId, StatusName, GptSearchName FROM StatusType");
            var gptStatusMapping: Record<string, number> = {};
            var displayNameMapping: Record<number, string> = {};
            for (const row of result.rows) {
                gptStatusMapping[row.gptsearchname] = row.statusid;
                displayNameMapping[row.statusid] = row.statusname;
            }
            console.log(gptStatusMapping)

            return { gptStatusMapping, displayNameMapping };
        } catch (err: any) {
            console.error('[server]: Error getting status types. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async deleteStatus(userId: any, msgId: string) {
        try {
            await this.pool.query("DELETE FROM AppStatus WHERE UserId = $1 AND gmailmsgid = $2", [userId, msgId]);
        } catch (err) {
            console.error('[server]: Error deleting status. SQL query error: ', err);
            throw new Error('Internal server error');
        }
    }

    async addNewStatuses(userId: any, messages: any) {
        // convert input to rows to insert
        const gptStatusMapping = SharedDataManager.getGptStatusMapping();

        for (const msg of messages) {

            try {

                // get or create position id
                if (!msg.gptRes.hasOwnProperty('position')) {
                    throw new Error(`no position field`);
                }

                // get or create company id
                if (!msg.gptRes.hasOwnProperty('company')) {
                    throw new Error(`no company field`);
                }

                const result = await this.pool.query("CALL insert_app_status($1, $2, $3, $4, $5, $6, $7, $8)",
                    [
                        msg.gptRes.position,
                        msg.gptRes.company,
                        userId,
                        msg.gptRes.status,
                        msg.internalDate / 1000,
                        msg.sender,
                        msg.id,
                        msg.snippet
                    ]
                );


            } catch (err: any) {
                console.error(`DB: Skipping saving message due to: ${err} on msg_id: ${msg.id}`);
                continue;
            }
        }
    }
}

