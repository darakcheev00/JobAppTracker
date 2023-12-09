import { receiveMessageOnPort } from "worker_threads";
import EmailParser from "./emailParser";

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

    static processInbox = async (token: string | undefined, newestMsgDate: number, gptKey: string | undefined, invalidSenders: Set<string>) => {
        // const gmailQuery = `in:inbox category:primary after:${newestMsgDate / 1000}`;
        const gmailQuery = `in:inbox category:primary`;
        console.log(`query: ${gmailQuery}`);

        try {
            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${gmailQuery}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
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

            // to be saved in the db:
            const updatedNewestMsgDate = parseInt(data.messages[0].internalDate);

            // get details and parse emails
            const messagePromises = data.messages.map(async (msg: any) => {
                const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const full_message = res.json();
                return await EmailParser.parseMessage(full_message, gptKey, invalidSenders);
            });
            
            const reduced_messages = await Promise.all(messagePromises);
            console.log(`async promises completed. reduced messages: ${reduced_messages}`);

            // check the non related to application messages and record their addresses into the invalid sender table.
            let newInvalidSenders: Set<string> = new Set<string>;
            for (const msg of reduced_messages){                
                if (msg.gptRes && msg.valid && msg.gptRes.status === 1){
                    const address = msg.sender.slice(msg.sender.indexOf("<")+1, msg.sender.indexOf(">"));
                    if(!invalidSenders.has(address)) {
                        newInvalidSenders.add(address);
                    }
                }
            }

            // status = 1 = not_related_to_job_application
            const valid_messages = reduced_messages.filter(msg => 
                msg.valid &&
                msg.gptRes !== null &&
                msg.gptRes !== undefined &&
                !msg.gptRes.unrelated &&
                msg.gptRes.company !== "unspecified"
            );
            
            console.log("messages filtered.");
            return {
                validMessages: valid_messages,
                newestMsgDate: updatedNewestMsgDate,
                newInvalidSendersList: newInvalidSenders
            };


        } catch (err) {
            console.log(`Gmail API: Error fetching messages: ${err}`);
            return {};
        }
    }
}