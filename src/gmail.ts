// import parseMessage from './gmail-parse-message';

/**
 * Get messages from gmail api
 * @return {array} the array of messages
 */
export const getMessages = async (token: string|undefined, query: string) => {
    console.log(query);
    const data = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`,{
        method: 'GET',    
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const info = await data.json();
    const messagePromises = info.messages.map(async (msg:any)=>{
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,{
            method: 'GET',  
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const message = await res.json();
        return message;
    });

    return await Promise.all(messagePromises);
}

// /**
//  * Get specific message data for a given message id
//  * @param  {string} messageId The message id to retrieve for
//  * @return {object} the object message
//  */
// export const getMessage = async (token: string|undefined, {messageId}: { messageId: string } ) => {
//     const response = await gmail.users.messages.get({id: messageId, userId: 'me'});
//     const message = response.data;
//     return message;
// }
