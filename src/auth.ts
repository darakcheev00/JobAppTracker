export async function isAuthenticated() {
    const data = await chrome.storage.local.get('authToken');
    const authToken = data.authToken;
    console.log("Token retrieved: ",authToken);
    const authenticated = authToken !== undefined && authToken !== null;

    // DEBUG
    console.log("isAuthenticated: ", authenticated);
    
    return [authenticated, authToken];
};

export async function setAuthTokenAsync(token: {}) {
    await chrome.storage.local.set({authToken: token}, () => {
        console.log("Token stored: ", token);
    });
};


export async function authenticate() {
    console.log("Authenticating...");
    const authToken = await chrome.identity.getAuthToken({interactive: true});
    
    await setAuthTokenAsync(authToken);
    console.log("Authenticated! Token: ",authToken);

    // DEBUG
    const [_,resToken] = await isAuthenticated();
    console.log("Logged in. Auth:",resToken);

    return authToken.token;
}

export async function getUserEmail(){
    chrome.identity.getProfileUserInfo((info)=>{
        console.log(info.email);
    });
}

export async function logout() {
    console.log("Logging out...");
    await chrome.storage.local.remove('authToken');

    // DEBUG
    const [_,authToken] = await isAuthenticated();
    console.log("User logged out. Auth:",authToken);
}