export default class AuthManager {

    static getAuthTokenFromStorage = async () => {
        const data = await chrome.storage.local.get('authToken');
        console.log(`Token retrieved: ${!data.authToken ? data.authToken : data.authToken.substring(0, 25)}...`);
        return data.authToken;
    };

    static setAuthTokenAsync = async (token: string) => {
        await chrome.storage.local.set({ authToken: token }, () => {
            console.log("Token stored: ", token);
        });
    };

    static authenticate = async () => {
        console.log("Getting google auth token (interactive)...");
        const data = await chrome.identity.getAuthToken({ interactive: true });

        await this.setAuthTokenAsync(data.token ? data.token : 'invalid');
        return data.token;
    }

    static logout = async () => {
        console.log("Logging out...");
        await chrome.storage.local.remove('authToken');

        // Check if user is logged out
        const authToken = await this.getAuthTokenFromStorage();
        console.log("User logged out. Auth token value saved:", authToken);
    }
}