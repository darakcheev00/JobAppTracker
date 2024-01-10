import StorageManager, { Message } from './chrome-storage-utils';

export default class AuthManager {

    static getAuthTokenFromStorage = async () => {
        const data = await chrome.storage.local.get('authToken');
        console.log(`Token retrieved: ${!data.authToken ? data.authToken : data.authToken.substring(0, 25)}...`);
        return data.authToken;
    };

    static setAuthTokenAsync = async (token: string) => {
        await chrome.storage.local.set({ authToken: token }, () => {
            console.log(`Token stored: ${token.substring(0, 25)}...`);
        });
    };

    static authenticate = async () => {
        console.log("Getting google auth token (interactive)...");
        const data = await chrome.identity.getAuthToken({ interactive: true });
        const res = data.token ? data.token : 'invalid';
        await this.setAuthTokenAsync(res);
        return res;
    }

    static logout = async () => {
        console.log("Logging out...");
        await chrome.storage.local.remove('authToken');

        // Check if user is logged out
        const authToken = await this.getAuthTokenFromStorage();
        console.log("User logged out. Auth token value saved:", authToken);
    }

    static getJWTValue = async (auth_token: string, tokenChanged: boolean) => {
		if (tokenChanged) {
			// Get new JWT from server
			try {
				return await AuthManager.getJwtFromServer(auth_token);
			} catch (err: any) {
				return '';
			}
		} else {
			// Get JWT from chrome storage
			const jwt_token = await StorageManager.getJwt();
			return jwt_token;
		}

	}

	static getJwtFromServer = async (google_auth_token: string): Promise<string> => {
		console.log("Sending login request to server.");
		try {
			const response = await fetch("http://localhost:8000/auth/login", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token: google_auth_token })
			});
			const data = await response.json();
			// console.log(`SERVER: ${JSON.stringify(data)}`);

			if (response.ok) {
				StorageManager.setJwt(data.token);
				console.log("getJwtFromServer: new jwt received.");
				return data.token;
			} else {
				throw new Error("failed getting jwt token");
			}
		} catch (err: any) {
			console.error("Error :", err.message);
			return '';
		}

	}




}