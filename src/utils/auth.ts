export default class AuthManager {

    static isAuthenticated = async () => {
        const data = await chrome.storage.local.get('authToken');
        const authToken = data.authToken;
        console.log("Token retrieved: ", authToken);
        const authenticated = authToken !== undefined && authToken !== null;

        // DEBUG
        console.log("isAuthenticated: ", authenticated);

        return [authenticated, authToken];
    };

    static setAuthTokenAsync = async (token: {}) => {
        await chrome.storage.local.set({ authToken: token }, () => {
            console.log("Token stored: ", token);
        });
    };


    static authenticate = async () => {
        console.log("Authenticating...");
        const authToken = await chrome.identity.getAuthToken({ interactive: true });

        await this.setAuthTokenAsync(authToken);
        console.log("Authenticated! Token: ", authToken);

        // DEBUG
        const [_, resToken] = await this.isAuthenticated();
        console.log("Logged in. Auth:", resToken);

        return authToken.token;
    }

    static getUserEmail = async () => {
        await chrome.identity.getProfileUserInfo((info) => {
            console.log(info.email);
        });
    }

    static logout = async () => {
        console.log("Logging out...");
        await chrome.storage.local.remove('authToken');

        // DEBUG
        const [_, authToken] = await this.isAuthenticated();
        console.log("User logged out. Auth:", authToken);
    }

}