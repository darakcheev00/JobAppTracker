// import parseMessage from './gmail-parse-message';

const invalid_senders = ['linkedin.com','@remotemore.com','@eg.vrbo.com','@send.grammarly.com','@mailtrack.io',
'@weworkremotely.com','getpocket_com,','spotangels','silkandsnow.com','@github.com',
'order.eventbrite.com','invitetoapply@indeed.com','@vailresortsmail.com','@bowldigest.com'];

/**
 * Get messages from gmail api
 * @return {array} the array of messages
 */
export const getMessages = async (token: string | undefined, query: string) => {
    console.log(query);
    const data = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const info = await data.json();
    const messagePromises = info.messages.map(async (msg: any) => {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const full_message = await res.json();

        let reduced_message = {
            sender: "",
            subject: "",
            date: "",
            body: []
        };

        const headers = full_message.payload.headers;

        for (const {name, value} of headers){
            if (name === "From") {
                reduced_message.sender = value;

                // return invalid reduced_message if sender is invalid
                for (const invalid of invalid_senders){
                    if (value.indexOf(invalid) !== -1) {
                        reduced_message.sender = "Error: Invalid Sender";
                        return reduced_message;
                    }
                }

            } else if (name === "Subject") {
                reduced_message.subject = value;
            } else if (name === "Date") {
                reduced_message.date = value;
            }
        }

        // TODO: reduce to lowercase and compare!!!!
        
        reduced_message.body = full_message.payload.parts;

        return full_message;
    });

    const reduced_messages = await Promise.all(messagePromises);

    const valid_messages = reduced_messages.filter(message => message.sender !== "Error: Invalid Sender");

    // TODO check why some dates are not set and why some bodies are undefined

    // TODO: decode messages

    // TODO: check message size

    // TODO: mask personal information: v1: replace numbers

    // TODO: chat gpt api

    // TODO: format output for easy display

    return valid_messages;
}



