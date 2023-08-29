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

    const raw_messages = await Promise.all(messagePromises);

    // TODO: decode messages selectively if their sender is not in invalid list
 
    // TODO: check message size
     
    // TODO: mask personal information: v1: replace numbers
 
    // TODO: chat gpt api
 
    // TODO: format output for easy display

    return raw_messages;
}



