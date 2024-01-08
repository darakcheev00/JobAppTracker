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
	const [newUser, setNewUser] = useState<Boolean>(false);


	useEffect(() => {
		console.log("starting....");
		(async () => {
			const [isAuthed, tokenObj] = await AuthManager.isAuthenticated();
			console.log("Init. auth status returned: ", isAuthed);
			setAuthenticated(isAuthed);
			setLoading(false);

			if (!await ServerManager.healthCheck()) {
				setServerUp(false);
			}

			if (isAuthed) {
				console.log("Init. Already authed");
				setAuthToken(tokenObj.token);
				const jwt_token = await StorageManager.getJwt();
				setJwt(jwt_token);

				if (serverUp) {
					console.log('server is up and i am authed');
					setGptKeyValid(await ServerManager.gptKeyValidation(jwt_token));
					await loadDataFromServer(jwt_token);
				}
			}

			// setInvalidEmails(await StorageManager.getInvalidEmails());

		})();

	}, []);

	// useEffect(() => {
	// 	(async () => {
	// 		if (authenticated) {
	// 			console.log("authenticated set to true!");
	// 			setGptKeyValid(await ServerManager.gptKeyValidation(await StorageManager.getJwt()));
	// 			await loadDataFromServer();
	// 		}
	// 	})();
	// }, [authenticated]);

	const loadDataFromServer = async (jwt_token: string) => {
		console.log("Loading data from server...");
		const lastMsgId = await StorageManager.getLastMsgId();
		try {
			var newData: Message[] = await ServerManager.loadData(lastMsgId, jwt_token);
		} catch (err: any) {
			console.error(err);
			return;
		}
		if (newData === undefined) return;

		console.log(`Loaded ${newData.length} statuses from server`);

		if (newData.length > 0) {
			// TODO check if this actually checks if there are rows in the table
			if (Array.isArray(newData) && Array.isArray(tableData)) {
				// chrome storage has rows already
				setTableData(newData.concat(tableData));
			} else {
				// no data saved in chrome storage
				setTableData(newData);
			}
			await StorageManager.saveTableData(newData as Message[]);
			console.log(`${newData.length} statuses added to tableData and saved to storage!`);

			// Find last message id
			// Assuming its sorted
			const newLastMsgId = newData[0].id;
			await StorageManager.setLastMsgId(newLastMsgId);
			console.log(`Updated lastMsgId to ${newLastMsgId}`);

		}
	}

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
				if (response.status === 201){
					setNewUser(true);
					// TODO make new user component
				}
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
