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
            } else {
                console.error(`Gmail API: Response not ok Status:${response.status}`);
            }
            return response.ok;

        } catch (error) {
            console.error("Gmail API healthcheck: Error fetching messages:", error);
            return false;
        }
    }
}