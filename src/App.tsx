import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from 'react';
import AuthManager from './utils/auth';
import GptManager from './utils/gptmodule';
import StorageManager from './utils/chrome-storage-utils';

import Settings from './components/Settings/Settings';
import MainPage from './components/MainPage/MainPage';

import './App.css';

function App() {

	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string | undefined>("def");

	const [gptKey, setGptKey] = useState<string | undefined>('***');
	const [gptKeyValid, setGptKeyValid] = useState<boolean | undefined>(true);

	const [showSettings, setShowSettings] = useState<boolean | undefined>(false);
	const [showMotivQuote, setShowMotivQuote] = useState<boolean>(false);

	useEffect(() => {
		console.log("starting....");
		(async () => {
			const [isAuthed, tokenObj] = await AuthManager.isAuthenticated();
			console.log("Init. auth status returned: ", isAuthed);
			setAuthenticated(isAuthed);
			setLoading(false);
			if (isAuthed) {
				console.log("Init. Already authed");
				setAuthToken(tokenObj.token);
			}

			// await StorageManager.clearTableData();
			// await StorageManager.resetLatestDate();

			const savedGptKey = await StorageManager.getGptKey();
			console.log(`saved gpt key: ${savedGptKey}`)
			setGptKeyValid(await GptManager.healthCheck(savedGptKey));
			if (savedGptKey !== undefined) {
				setGptKey(savedGptKey);
			}
		})();

	}, []);


	async function handleLoginClick() {
		if (loading) return;

		const token: string | undefined = await AuthManager.authenticate();
		console.log("authenticate returned token: ", token);
		setAuthToken(token);
		setAuthenticated(true);
	};


	return (
		<div className="App">
			<h1 className="title">Trackify</h1>
			{authenticated ? (
				<div>
					<button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
						{!showSettings ? 'Settings' : 'Back'}
					</button>

					{showSettings ? (
						<Settings {...{ setAuthenticated, setShowSettings, setShowMotivQuote, showMotivQuote}} />
					) : (
						<MainPage {...{ authToken, setAuthToken, gptKey, setGptKey, gptKeyValid, setGptKeyValid, showMotivQuote}} />
					)}
				</div>
			) : (
				<button id="login_btn" onClick={handleLoginClick}>Log in</button>
			)}

		</div>
	);
}

export default App;
