import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from 'react';
import AuthManager from './utils/auth';
import GptManager from './utils/gptmodule';
import StorageManager, {Message} from './utils/chrome-storage-utils';

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

	const [invalidEmails, setInvalidEmails] = useState<Set<string>>(new Set<string>());

	const [tableData, setTableData] = useState<Message[] | undefined>(undefined);
    const [dateNewestMsg, setDateNewestMsg] = useState<number>(1693607827000);

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

			setInvalidEmails(await StorageManager.getInvalidEmails());

			// await StorageManager.clearTableData();
			// await StorageManager.resetLatestDate();

			const savedGptKey = await StorageManager.getGptKey();
			setGptKeyValid(await GptManager.healthCheck(savedGptKey));
			if (savedGptKey !== undefined) {
				setGptKey(savedGptKey);
			}
		})();

	}, []);

	useEffect(() => { 
		console.log(invalidEmails);
	},[invalidEmails]);

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
						<Settings {...{ setAuthenticated, 
										setShowSettings, 
										setShowMotivQuote, 
										showMotivQuote, 
										invalidEmails, 
										setInvalidEmails,
										setTableData,
										setDateNewestMsg
									}} />
					) : (
						<MainPage {...{ authToken, 
										setAuthToken, 
										gptKey, 
										setGptKey, 
										gptKeyValid, 
										setGptKeyValid, 
										showMotivQuote, 
										invalidEmails,
										setInvalidEmails,
										tableData,
										setTableData,
										dateNewestMsg, 
										setDateNewestMsg
									}} />
					)}
				</div>
			) : (
				<button id="login_btn" onClick={handleLoginClick}>Log in</button>
			)}

		</div>
	);
}

export default App;
