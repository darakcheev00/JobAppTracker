import { receiveMessageOnPort } from "worker_threads";
import EmailParser from "./emailParser";
import DatabaseService from "./databaseService";

import { db } from '../index';

export default class GmailService {
    static healthCheck = async (token: string | undefined) => {
        console.log("Gmail API healthcheck...");
        try {
            const query = `after: ${Date.now()}`;
            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                console.log("Gmail auth token valid.");
                return true;
            } else {
                console.error(`Gmail API: Response not ok Status:${response.status}`);
                return false;
            }

        } catch (error) {
            console.error("Gmail API healthcheck: Error fetching messages:", error);
            return false;
        }
    }

    private static saveLatestMsgDate = async (auth_token: string, msg_id:number, userId: string) => {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg_id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth_token}`
            }
        });
        const full_message = await res.json();
        
        // returns unix timestamp in milliseconds
        const newestMsgDate = full_message.internalDate / 1000;
        console.log(`Received newest date in seconds: ${newestMsgDate}`);

        await db.setNewestMsgDate(userId, newestMsgDate);
    };

    static processInbox = async (userId: string) => {
        
        // Get data from db
        const invalidSenderSet: Set<string> = await db.getInvalidSenders(userId);
        // TODO check if invalidSenderList type is valid make sure its a set
        var {gpt_key, auth_token, newest_msg_date} = await db.get_GPTKey_Token_Date(userId);
        
        // TODO: if newestMsgDate is not set then get past 25
        if (newest_msg_date === undefined){
            newest_msg_date = 1703094681;
        }
        newest_msg_date = 1703094681; // TEMP, REMOVE
        
        // date in seconds
        const gmailQuery = `in:inbox category:primary after:${newest_msg_date}`;
        // const gmailQuery = `in:inbox category:primary`;
        console.log(`query: ${gmailQuery}`);

        try {
            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${gmailQuery}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${auth_token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            if (data.messages === undefined) {
                console.log("GMAIL API: no new messages");
                return {};
            }

            console.log(`GMAIL API: ${data.messages.length} new messages`);
            // Note: each message is just a {id, threadId} object to be further extracted

            await GmailService.saveLatestMsgDate(auth_token, data.messages[0].id, userId);

            // get details and parse emails
            const messagePromises = data.messages.map(async (msg: any) => {
                const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${auth_token}`
                    }
                });
                const full_message = await res.json();
                return await EmailParser.parseMessage(full_message, gpt_key, invalidSenderSet); 
            });
            
            const reduced_messages = await Promise.all(messagePromises);
            console.log(`async promises completed. reduced messages: ${reduced_messages}`);

            const valid_messages = [];
            const unrelated_messages = [];
            console.log("messages filtered.");

            for (const msg of reduced_messages){
                if (msg.valid){
                    valid_messages.push(msg);
                } else {
                    if (msg.sender) {
                        unrelated_messages.push(msg);
                    }
                }
            }
            console.log(`${valid_messages.length} valid, ${unrelated_messages} unrelated found.`);
            
            // check the non related to application messages and record their addresses into the invalid sender table.
            let newInvalidSendersList = [];
            for (const msg of unrelated_messages){
                const address = msg.sender.slice(msg.sender.indexOf("<")+1, msg.sender.indexOf(">"));
                if (invalidSenderSet.has(address)){
                    newInvalidSendersList.push(address);
                }
            }
            // update invalid sender list in db
            console.log("Status's saved in database");
            await db.addNewInvalidEmails(userId, newInvalidSendersList);

            // TODO save status's in database
            console.log("Status's saved in database");
            await db.addNewStatuses(userId, valid_messages);

            return valid_messages;

        } catch (err) {
            console.log(`Gmail API: Error fetching messages: ${err}`);
            return {};
        }
    }
}