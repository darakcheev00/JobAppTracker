import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from 'react';
import AuthManager from './auth';
import { GmailApiManager } from './gmail';
import { StorageManager, Message } from './chrome-storage-utils'
import { GptManager } from './gptmodule';
import GptForm from './GptForm';
import Settings from './Settings';

import './App.css';
import { table } from 'console';
import { auth } from 'googleapis/build/src/apis/abusiveexperiencereport';

interface TableCounts {
	appsReceived: number;
	rejected: number;
	interviews: number;
	offers: number;
	todayAppliedCount: number;
}

function App() {

	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string | undefined>("def");
	const [tableData, setTableData] = useState<Message[] | undefined>(undefined);
	const [dateNewestMsg, setDateNewestMsg] = useState<number>(1693607827000);
	const [gptKey, setGptKey] = useState<string | undefined>('***');
	const [gptKeyValid, setGptKeyValid] = useState<boolean | undefined>(true);
	const [refreshMsg, setRefreshMsg] = useState<string | undefined>("");
	const [showSettings, setShowSettings] = useState<boolean | undefined>(false);
	const [tableCounts, setTableCounts] = useState<TableCounts>();
	const [motivQuote, setMotivQuote] = useState<string | undefined>("");
	
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

			setDateNewestMsg(await StorageManager.getLatestDate());
			setTableData(await StorageManager.getTableData() as Message[]);

		})();

	}, []);

	useEffect(() => {
		if (tableData !== undefined) {
			console.log("tableData changed: ", tableData);
			setTableCounts({
				appsReceived: tableData?.filter(item => item.gptRes.status === "application received").length,
				rejected: tableData?.filter(item => item.gptRes.status === "rejected").length,
				interviews: tableData?.filter(item => item.gptRes.status === "interview requested").length,
				offers: tableData?.filter(item => item.gptRes.status === "received offer").length,
				todayAppliedCount: tableData?.filter(item => {
					const temp = new Date();
					let start = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate(), 0,0,0,0);
					return (start < new Date(item.internalDate));
				}).length,
			});
		}
	}, [tableData]);

	useEffect(()=>{
		(async () => {setMotivQuote(await GptManager.getMotivQuote(gptKey))})();
	},[gptKey]);



	async function handleLoginClick() {
		if (loading) return;

		const token: string | undefined = await AuthManager.authenticate();
		console.log("authenticate returned token: ", token);
		setAuthToken(token);
		setAuthenticated(true);
	};

	
	const refresh = async () => {
		console.log("Refreshing...");
		console.log("authToken", authToken);
		let gmailToken: string | undefined = authToken;
		
		if (!await GptManager.healthCheck(gptKey)) {
			return;
		}
		setMotivQuote(await GptManager.getMotivQuote(gptKey));
		
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
		}, 5000);

		// save latest refresh click
		if (newestMsgDate !== undefined) {
			const offSet: number = 10000;
			setDateNewestMsg(newestMsgDate + offSet);
			StorageManager.saveNewestMsgDate(newestMsgDate + offSet);
		}

	}

	return (
		<div className="App">

			
			<h1 className="title">Job App Tracker</h1>

			{authenticated && showSettings && <Settings setAuthenticated={setAuthenticated} setShowSettings={setShowSettings} />}

			{authenticated && <h3>{motivQuote}</h3>}

			{authenticated &&
				<button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
					{!showSettings ? 'Settings' : 'Back'}
				</button>
			}

			{!authenticated && <button id="login_btn" onClick={handleLoginClick}>
				Log in
			</button>}


			{!showSettings &&
				<div className="card">
					{authenticated && gptKeyValid && (<button onClick={refresh} id="refresh_btn"> Refresh </button>)}
				</div>
			}

			{authenticated && gptKeyValid && !showSettings && (
				<h4>{refreshMsg}</h4>
			)}


			{!gptKeyValid && authenticated && !showSettings && <GptForm setGptKey={setGptKey} setGptKeyValid={setGptKeyValid} setRefreshMsg={setRefreshMsg} />}

			{authenticated && !showSettings &&
				<div>
					<h3>Applied today: {tableCounts?.todayAppliedCount}</h3>
					<div className="table-counts">
						<h3>Applied: {tableCounts?.appsReceived}</h3>
						<h3>Rejected: {tableCounts?.rejected}</h3>
						<h3>Interviews: {tableCounts?.interviews}</h3>
						<h3>Offers: {tableCounts?.offers}</h3>
					</div>
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
					</table>
				</div>}
		</div>
	);
}

export default App;
