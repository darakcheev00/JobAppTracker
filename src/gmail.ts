import { parseMessage } from './gmail-parse-message';

/**
 * Get messages from gmail api
 * @return {array} the array of messages
 */
export const getMessages = async (token: string | undefined, query: string) => {
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

        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${info.messages[0].id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        const firstMessage = await res.json();
        const firstMsgDate = firstMessage.internalDate;

        const messagePromises = info.messages.map(async (msg: any) => {
            const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const full_message = await res.json();
            const reduced_message = await parseMessage(full_message);
            
            return reduced_message;
        });

        const reduced_messages = await Promise.all(messagePromises);

        // Filter out invalid messages
        const valid_messages = reduced_messages.filter(message => message.sender !== "Error: Invalid Sender" && message.gptRes !== null && message.gptRes.status !== "not related to job application");
        // if (typeof valid_messages !== 'Object')

        return [valid_messages, firstMsgDate];

    } catch (error) {
        // Handle errors related to the main fetch request
        console.error("Gmail API: Error fetching messages:", error);
        return {};
    }
}



