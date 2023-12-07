import { UUID } from 'crypto';
import MessageParser from './emailParser';

/**
 * Get messages from gmail api
 * @return {array} the array of messages
 */

export default class GmailApiManager {
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

    static getMessages = async (token: string | undefined, newestMsgDate: number, gptKey: string | undefined, invalid_senders:Set<string>) => {
        console.log(`query: in:inbox category:primary after:${new Date(newestMsgDate)}`)
        const query = `in:inbox category:primary after:${newestMsgDate / 1000}`;
        // const query = `in:inbox category:primary after:${1694063429}`;
        try {
            console.log(query);
            const data = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10000&q=${query}`, {
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
            console.log(newestMessage);

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

                const reduced_message = await MessageParser.parseMessage(full_message, gptKey, invalid_senders);
                return reduced_message;
            });

            const reduced_messages = await Promise.all(messagePromises);
            console.log(`async promises completed. reduced messages: ${reduced_messages}`);



            let invalidSendersList: Set<string> = new Set<string>();
            for (const item of reduced_messages){
                if (item.gptRes && item.sender !== "Error: Invalid Sender" && item.gptRes.status.toLowerCase() === "not related to job application"){
                    invalidSendersList.add(item.sender.slice(item.sender.indexOf("<")+1,item.sender.indexOf(">")));
                }
            }

            // Filter out invalid messages
            const valid_messages = reduced_messages.filter(message => message.sender !== "Error: Invalid Sender" && 
                                                            message.gptRes !== null && 
                                                            message.gptRes !== undefined && 
                                                            message.gptRes.status.toLowerCase() !== "not related to job application" && 
                                                            message.gptRes.status.toLowerCase() !== "not_related_to_job_application" && 
                                                            message.gptRes.company !== "unspecified");
            
            console.log("messages filtered.");
            return {
                validMessages: valid_messages,
                newestMsgDate: updatedNewestMsgDate,
                invalidSendersList: invalidSendersList
            };

        } catch (error) {
            // Handle errors related to the main fetch request
            console.error("Gmail API: Error fetching messages:", error);
            return {};
        }
    }
}


