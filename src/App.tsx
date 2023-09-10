import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from 'react';
import { AuthManager } from './auth';
import { GmailApiManager } from './gmail';
import { StorageManager, Message } from './chrome-storage-utils'
import { GptManager } from './gptmodule';
import GptForm from './GptForm';


import './App.css';
import { table } from 'console';
import { auth } from 'googleapis/build/src/apis/abusiveexperiencereport';

function App() {

	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string | undefined>("def");
	const [tableData, setTableData] = useState<Message[] | undefined>(undefined);
	const [dateNewestMsg, setDateNewestMsg] = useState<number>(1693607827000);
	const [gptKey, setGptKey] = useState<string | undefined>('***');
	const [gptKeyValid, setGptKeyValid] = useState<boolean | undefined>(true);
	const [refreshMsg, setRefreshMsg] = useState<string | undefined>("");

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
			if (savedGptKey !== undefined){
				setGptKey(savedGptKey);
			}

			setDateNewestMsg(await StorageManager.getLatestDate());
			setTableData(await StorageManager.getTableData() as Message[]);
		})();

	}, []);

	useEffect(() => {
		console.log("tableData changed: ", tableData);
	}, [tableData]);

	async function handleLoginClick() {
		if (loading) return;

		if (authenticated) {
			await AuthManager.logout();
		} else {
			const token: string | undefined = await AuthManager.authenticate();
			console.log("authenticate returned token: ", token);
			setAuthToken(token);
		}
		setAuthenticated(!authenticated);
	};

	const refresh = async () => {
		console.log("Refreshing...");
		console.log("authToken", authToken);
		let gmailToken: string | undefined = authToken;

		if (!await GptManager.healthCheck(gptKey)) {
			return;
		}

		if (!await GmailApiManager.healthCheck(authToken)) {
			gmailToken = await AuthManager.authenticate();
			setAuthToken(gmailToken);
		}

		const { validMessages, newestMsgDate } = await GmailApiManager.getMessages(gmailToken, dateNewestMsg, gptKey);

		console.log("Messages: ", validMessages);

		// append to existing messages
		let displayMsg = "No new emails."
		if (validMessages !== undefined && validMessages.length > 0) {
			if (Array.isArray(validMessages) && Array.isArray(tableData)) {
				setTableData(validMessages.concat(tableData));
			} else {
				setTableData(validMessages);
			}
			// persist new mail
			await StorageManager.saveTableData(validMessages as Message[]);
			displayMsg = `${validMessages.length} new emails added!`;
		}
		
		setRefreshMsg(displayMsg);
		setTimeout(() => {
			setRefreshMsg("")
		},3000);

		// save latest refresh click
		if (newestMsgDate !== undefined) {
			const offSet: number = 10000;
			setDateNewestMsg(newestMsgDate + offSet);
			StorageManager.saveNewestMsgDate(newestMsgDate + offSet);
		}

	}
	
	return (
		<div className="App">
			<h1>Job App Tracker</h1>
			<div className="card">
				<button id="auth_btn" onClick={handleLoginClick}>
					{authenticated === undefined ? 'Loading...' : authenticated ? 'Log out' : 'Log in'}
				</button>
				{authenticated && gptKeyValid && (<button onClick={refresh} id="refresh_btn"> Refresh </button>)}
			</div>

			{authenticated && gptKeyValid && (
				<h4>
					{refreshMsg}
				</h4>
			)}


			{!gptKeyValid && authenticated && <GptForm setGptKey={setGptKey} setGptKeyValid={setGptKeyValid}/>}

			{authenticated && (
				<table className="maintable">
					<thead>
						<tr>
							<th>Company</th>
							<th>Position</th>
							<th>Status</th>
							<th>Date</th>
						</tr>
					</thead>
					<tbody>
						{tableData !== undefined &&
							tableData instanceof Array &&
							tableData.length > 0 &&
							(tableData.map((item: Message) => (
								<tr key={item.id}>
									<td>{item.gptRes.company}</td>
									<td>{item.gptRes.position}</td>
									<td>{item.gptRes.status}</td>
									<td>{StorageManager.epochToMMDDYY(item.internalDate)}</td>
								</tr>
							)))}
					</tbody>
				</table>)}
		</div>
	);
}

export default App;
