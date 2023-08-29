export async function isAuthenticated() {
    const data = await chrome.storage.local.get('authToken');
    const authToken = data.authToken;
    console.log("Token retrieved: ",authToken);
    const authenticated = authToken !== undefined && authToken !== null;
    console.log("isAuthenticated: ", authenticated);
    return authenticated;
};

export async function setAuthToken(token: {}) {
    await chrome.storage.local.set({authToken: token}, () => {
        console.log("Token stored: ", token);
    });
};


export async function authenticate() {
    console.log("Authenticating...");
    const authToken = await chrome.identity.getAuthToken({interactive: true});
    
    setAuthToken(authToken);
    console.log("Authenticated! Token: ",authToken);

    const res = await isAuthenticated();
    console.log("Logged in. Auth:",res);
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
    const res = await isAuthenticated();
    console.log("User logged out. Auth:",res);
}