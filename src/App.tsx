import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from 'react';
import { isAuthenticated, authenticate, logout } from './auth';
import * as gmail from './gmail';
import { StorageManager, Message } from './chrome-storage-utils'

import './App.css';
import { table } from 'console';

function App() {

	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string | undefined>("def");
	const [tableData, setTableData] = useState<Message[] | undefined>(undefined);
	const [dateNewestMsg, setDateNewestMsg] = useState<number>(1693607827000);

	useEffect(() => {
		console.log("starting....");
		(async () => {
			const [isAuthed, tokenObj] = await isAuthenticated();
			console.log("Init. auth status returned: ", isAuthed);
			setAuthenticated(isAuthed);
			setLoading(false);
			if (isAuthed) {
				console.log("Init. Already authed");
				setAuthToken(tokenObj.token);
			}

			// await StorageManager.clearTableData();
			// await StorageManager.resetLatestDate();

			setDateNewestMsg(await StorageManager.getLatestDate());
			setTableData(await StorageManager.getTableData() as Message[]);
		})();

	}, []);

	useEffect(() => {
		if (authToken && tableData && dateNewestMsg) {
			// console.log("Auth token changed: ", authToken);
			console.log("useEffect");
			refresh();
		}
	}, [authToken,tableData,dateNewestMsg]);

	useEffect(() => {
		console.log("tableData changed: ", tableData);
	}, [tableData]);

	async function handleLoginClick() {
		if (loading) return;

		if (authenticated) {
			await logout();
		} else {
			const token: string | undefined = await authenticate();
			console.log("authenticate returned token: ", token);
			setAuthToken(token);
		}
		setAuthenticated(!authenticated);
	};

	const refresh = async () => {
		console.log("Refreshing...");
		console.log("authToken", authToken);

		const { validMessages, newestMsgDate } = await gmail.getMessages(authToken, dateNewestMsg);

		console.log("Messages: ", validMessages);

		// append to existing messages
		if (validMessages !== undefined && validMessages.length > 0) {
			if (Array.isArray(validMessages) && Array.isArray(tableData)) {
				setTableData(validMessages.concat(tableData));
			} else {
				setTableData(validMessages);
			}
			// persist new mail
			await StorageManager.saveTableData(validMessages as Message[]);
		}

		// save latest refresh click
		if (newestMsgDate !== undefined) {
			const offSet: number = 1000;
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
				{authenticated && (<button onClick={refresh} id="refresh_btn"> Refresh </button>)}
			</div>
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
