import React from 'react';

import { useState, useEffect } from 'react';
import AuthManager from './utils/auth';
import GptManager from './utils/gptmodule';
import StorageManager, { Message } from './utils/chrome-storage-utils';

import axios from 'axios';

import Settings from './components/Settings/Settings';
import MainPage from './components/MainPage/MainPage';
import ServerManager from './utils/server_manager';
import GoogleApiManager from './utils/gmailApiService';

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

			// Load auth token
			var token = await AuthManager.getAuthTokenFromStorage();
			var tokenChanged = false;

			var tokenExists = token !== undefined && token !== null;

			// Check if token dne or token is expired
			if (!tokenExists || (tokenExists && !await GoogleApiManager.authTokenCheck(token))) {
				console.log(`Token dne or is expired.`);
				token = await AuthManager.authenticate();
				tokenChanged = true;
			}

			// Set auth token state
			setAuthToken(token);
			setAuthenticated(true);
			setLoading(false);
			setShowChart(await StorageManager.getShowChart());

			const serverRunning = await ServerManager.healthCheck();
			setServerUp(serverRunning);
			if (!await serverRunning) {
				console.log(`=== INIT DONE ===`);
				return;
			}

			const jwt_token = await AuthManager.getJWTValue(token, true);
			setJwt(jwt_token);

			setGptKeyValid(await ServerManager.gptKeyValidation(jwt_token));

			await loadDataFromServer(jwt_token);

			// setInvalidEmails(await StorageManager.getInvalidEmails());
			console.log(`=== INIT DONE =============================`);

		})();

	}, []);

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
		// Check if server is up
		const serverRunning = await ServerManager.healthCheck();
		if (!serverRunning) {
			setServerUp(false);
			return;
		}

		// Get jwt from storage
		var jwt_token = await StorageManager.getJwt();

		// Check if auth token has expired
		if (!await GoogleApiManager.authTokenCheck(authToken)) {
			// Get new Token
			const new_auth_token = await AuthManager.authenticate();
			// Get new jwt from server
			jwt_token = await AuthManager.getJWTValue(new_auth_token, true);
		}
		setJwt(jwt_token);

		setServerUp(true);

		setGptKeyValid(await ServerManager.gptKeyValidation(jwt_token));
	}

	async function handleLoginClick() {
		if (loading) return;

		console.log("Logging in...");

		const token: string | undefined = await AuthManager.authenticate();
		// console.log("authenticate returned token: ", token);

		try {
			const response = await fetch("http://localhost:8000/auth/login", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token })
			});
			const data = await response.json();

			// response can be 200 updated token, 201 created user, 401 unauthed, 500 error
			if (response.status === 200 || response.status === 201) {
				if (response.status === 201) {
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
			<div>
				{!serverUp && (
					<div id="server_status_banner">
						<h3>Server is not running :/</h3>
						<button id="reconnect_button" onClick={() => reconnect()}>Reconnect</button>
					</div>
				)}
			</div>

			<h1 className="title">Trackify</h1>

			{authenticated ? (
				<div>
					{!showSettings && tableData && <button id="chart-button" onClick={async () => {
						setShowChart(!showChart);
						await StorageManager.setShowChart(!showChart);
					}}>
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
