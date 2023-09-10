import { UUID } from 'crypto';
import { MessageParser } from './gmail-parse-message';

/**
 * Get messages from gmail api
 * @return {array} the array of messages
 */

export class GmailApiManager {
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

    static getMessages = async (token: string | undefined, newestMsgDate: number, gptKey: string | undefined) => {
        console.log(`query: in:inbox category:primary after:${new Date(newestMsgDate)}`)
        const query = `in:inbox category:primary after:${newestMsgDate / 1000}`;
        // const query = `in:inbox category:primary after:${1694063429}`;
        try {
            console.log(query);
            const data = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!data.ok) {
                throw new Error(`HTTP error! Status: ${data.status}`);
            }
            const info = await data.json();

            if (info.messages === undefined) {
                console.log("GMAIL API: no new messages");
                return {};
            }

            console.log(`GMAIL API: ${info.messages.length} new messages`);

            // get date of newest message
            const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${info.messages[0].id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const newestMessage = await res.json();
            const updatedNewestMsgDate = parseInt(newestMessage.internalDate);

            // call gpt on selected messages async
            const messagePromises = info.messages.map(async (msg: any) => {
                const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const full_message = await res.json();
                // console.log(full_message);

                const reduced_message = await MessageParser.parseMessage(full_message, gptKey);

                return reduced_message;
            });

            const reduced_messages = await Promise.all(messagePromises);

            // Filter out invalid messages
            const valid_messages = reduced_messages.filter(message => message.sender !== "Error: Invalid Sender" && message.gptRes !== null && message.gptRes.status !== "not related to job application" && message.gptRes.company !== "unspecified");
            // if (typeof valid_messages !== 'Object')

            return {
                validMessages: valid_messages,
                newestMsgDate: updatedNewestMsgDate,
            };

        } catch (error) {
            // Handle errors related to the main fetch request
            console.error("Gmail API: Error fetching messages:", error);
            return {};
        }
    }
}


