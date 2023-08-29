const API_KEY = "AIzaSyBgz-2O-JJqMIzgCx12TfRsnDkcMyuEWAs";
let user_signed_in = false;

function setAuthToken(token){
    chrome.storage.local.set({authToken: token}, () => {
        console.log("Token stored: ", token);
    });
}

// function isAuthenticated(callback){
//     chrome.storage.local.get('authToken',(data) => {
//         const authToken = data.authToken;
//         console.log("Token retrieved: ",authToken);
//         const authenticated = authToken !== undefined && authToken !== null;
//         console.log("isAuthenticated: ", authenticated);
//         callback(authenticated);
//     });
// }

function authenticate(){
    console.log("Authenticating...");
    let token;
    chrome.identity.getAuthToken({interactive: true}, function(auth_token){
        setAuthToken(auth_token);
        console.log("Authenticated! Token: ",auth_token);
    });
    isAuthenticated((authed)=>{
        console.log("Log in done. Authed: ", authed);
    });
    // updateUI();
}

async function logout(){
    await chrome.storage.local.remove('authToken', () => {
        console.log('User logged out');
        // updateUI();
    })
    isAuthenticated((authed)=>{
        console.log("Log out done. Authed: ", authed);
    });
}

function init(){
    isAuthenticated((authenticated) => {
        // updateUI(authenticated);
        console.log("init. authed: ",authenticated);
    });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getAuthStatus"){
        isAuthenticated((authenticated) => {
            console.log("Sending response", authenticated);
            sendResponse({ authenticated });
        });
        // here
        console.log("after");
        
    } else if (message.action === "login"){
        authenticate();
        sendResponse({authenticated: true});
        
    } else if (message.action === "logout"){
        logout();
        sendResponse({authenticated: false});
    }
})

// init();
