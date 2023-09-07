import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from 'react';
import { isAuthenticated, authenticate, logout } from './auth';
import * as gmail from './gmail';
import { epochToMMDDYY, saveTableData, getTableData, clearTableData, getLatestDate, saveLatestDate, Message } from './utils'

import './App.css';
import { table } from 'console';

function App() {

	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string | undefined>("def");
	const [tableData, setTableData] = useState<Message[] | undefined>(undefined);
	const [dateLatestRefresh, setDateLatestRefresh] = useState<number>(1693366654);

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

			setDateLatestRefresh(await getLatestDate());

			// await clearTableData();
			setTableData(await getTableData() as Message[]);
		})();

	}, []);

	useEffect(() => {
		if (authToken) {
			console.log("Auth token changed: ", authToken);
			// refresh();
		}
	}, [authToken]);

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
		console.log(`query: in:inbox category:primary after:${new Date(dateLatestRefresh)}`)
		// const query = `in:inbox after:${dateLatestRefresh}`;
		const query = `in:inbox category:primary after:${1694063429}`;
		// const query = `in:inbox after:2023/

		const new_messages: Message[] = await gmail.getMessages(authToken, query) as Message[];
		console.log("Messages: ", new_messages);

		// append to existing messages
		if (new_messages !== undefined && new_messages.length > 0) {
			if (Array.isArray(new_messages) && Array.isArray(tableData)) {
				setTableData(new_messages.concat(tableData));
			} else {
				setTableData(new_messages);
			}
		}
		await saveTableData(new_messages as Message[]);

		// save latest refresh click
		setDateLatestRefresh(Date.now());
		saveLatestDate(Date.now());
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
									<td>{epochToMMDDYY(item.internalDate)}</td>
								</tr>
							)))}
					</tbody>
				</table>)}
		</div>
	);
}

export default App;
