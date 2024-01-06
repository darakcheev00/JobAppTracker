import React from 'react';

import { useState, useEffect } from 'react';
import AuthManager from './utils/auth';
import GptManager from './utils/gptmodule';
import StorageManager, { Message } from './utils/chrome-storage-utils';

import axios from 'axios';

import Settings from './components/Settings/Settings';
import MainPage from './components/MainPage/MainPage';
import ServerManager from './utils/server_manager';

import './App.css';

function App() {

	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string | undefined>("def");
	const [jwt, setJwt] = useState<string | undefined>("def");

	// const [gptKey, setGptKey] = useState<string | undefined>('***');
	const [gptKeyValid, setGptKeyValid] = useState<Boolean>(true);

	const [showSettings, setShowSettings] = useState<boolean | undefined>(false);
	const [showChart, setShowChart] = useState<boolean>(true);
	const [tableData, setTableData] = useState<Message[] | undefined>(undefined);
	const [serverUp, setServerUp] = useState<Boolean>(true);


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
				setJwt(await StorageManager.getJwt());
				setGptKeyValid(await ServerManager.gptKeyValidation(await StorageManager.getJwt()));
			}

			if (!await ServerManager.healthCheck()) {
				setServerUp(false);
				return;
			}


			// setInvalidEmails(await StorageManager.getInvalidEmails());

			// const savedGptKey = await StorageManager.getGptKey();
			// setGptKeyValid(await GptManager.healthCheck(savedGptKey));
			// if (savedGptKey !== undefined) {
			// 	setGptKey(savedGptKey);
			// }
		})();

	}, []);

	const reconnect = async () => {
		setServerUp(await ServerManager.healthCheck() == true);
	}

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
			const data = await response.json();
			console.log(`SERVER: ${JSON.stringify(data)}`);

			// response can be 200 updated token, 201 created user, 401 unauthed, 500 error
			if (response.status === 200 || response.status === 201) {
				setAuthToken(token);
				setAuthenticated(true);

				setJwt(data.token);
				StorageManager.setJwt(data.token);
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

					{!serverUp && (
						<div>
							<h3>❌ SERVER DOWN ❌</h3>
							<button id="refresh_btn" onClick={() => reconnect()}>Reconnect 🔄</button>
						</div>
					)}

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
							showChart,
							jwt,
							setJwt,
							serverUp,
							setServerUp
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
