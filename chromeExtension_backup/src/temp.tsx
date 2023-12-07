import React, { useEffect } from 'react';

const App: React.FC = () => {
  useEffect(() => {
    const clientId = 'YOUR_CLIENT_ID'; // Replace with your actual client ID
    const redirectUri = chrome.identity.getRedirectURL(); // Returns the redirect URL for the extension
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=https://www.googleapis.com/auth/userinfo.email`;

    const launchAuthFlow = () => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        (redirectUrl) => {
          if (redirectUrl && redirectUrl.includes(redirectUri)) {
            const accessToken = redirectUrl.split('access_token=')[1].split('&')[0];
            // Use the access token to make authenticated requests
            console.log('Access Token:', accessToken);
          }
        }
      );
    };

    launchAuthFlow();
  }, []);

  return <div>OAuth Example</div>;
};

export default App;
