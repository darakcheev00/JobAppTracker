import React from 'react';

import { useState, useEffect } from 'react';
import AuthManager from './utils/auth';
import GptManager from './utils/gptmodule';
import StorageManager, { Message } from './utils/chrome-storage-utils';

import axios from 'axios';

import Settings from './components/Settings/Settings';
import MainPage from './components/MainPage/MainPage';

import './App.css';

function App() {

	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string | undefined>("def");

	// const [gptKey, setGptKey] = useState<string | undefined>('***');
	const [gptKeyValid, setGptKeyValid] = useState<boolean | undefined>(true);

	const [showSettings, setShowSettings] = useState<boolean | undefined>(false);
	const [showChart, setShowChart] = useState<boolean>(true);
	const [tableData, setTableData] = useState<Message[] | undefined>(undefined);

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

			// setInvalidEmails(await StorageManager.getInvalidEmails());

			// const savedGptKey = await StorageManager.getGptKey();
			// setGptKeyValid(await GptManager.healthCheck(savedGptKey));
			// if (savedGptKey !== undefined) {
			// 	setGptKey(savedGptKey);
			// }
		})();

	}, []);

	async function handleLoginClick() {
		if (loading) return;

		console.log("Logging in...");

		const token: string | undefined = await AuthManager.authenticate();
		console.log("authenticate returned token: ", token);

		try {
			const response = await fetch("http://localhost:8000/auth/login", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token })
			});
			
			console.log(`SERVER: ${await response.json()}`);

			if (response.ok){
				setAuthToken(token);
				setAuthenticated(true);
			}

		} catch (err) {
			console.error("Error logging in:", err);
		}
	};

	return (
		<div className="App">
			<h1 className="title">Trackify</h1>
			{authenticated ? (
				<div>
					{!showSettings && tableData && <button id="chart-button" onClick={() => setShowChart(!showChart)}>
						{!showChart ? 'Show Chart' : 'Hide Chart'}
					</button>}

					<button id="settings-button" onClick={() => setShowSettings(!showSettings)}>
						{!showSettings ? 'Settings' : 'Back'}
					</button>

					{showSettings ? (
						<Settings {...{
							setAuthenticated,
							setShowSettings,
							setTableData
						}} />
					) : (
						<MainPage {...{
							authToken,
							setAuthToken,
							gptKeyValid,
							setGptKeyValid,
							tableData,
							setTableData,
							showChart
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
