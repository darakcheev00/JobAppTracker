export default class GoogleApiManager {
    static gmailHealthCheck = async (token: string | undefined) => {
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


    static authTokenCheck = async (token: string | undefined) => {
        console.log("Auth token healthcheck...");
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`, {
                method: 'GET'
            });
            const data = await response.json();

            if (data.error) throw new Error('Google auth token invalid');

            if (response.ok) {
                console.log("Google auth token valid.");
                return true;
            } else {
                throw new Error(response.statusText);
            }

        } catch (error) {
            console.log("Google auth token invalid:", error);
            return false;
        }
    }


}