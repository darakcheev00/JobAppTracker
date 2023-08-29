import reactLogo from './assets/react.svg'
import { useState, useEffect } from 'react';
import { isAuthenticated, authenticate, logout } from './auth';
import * as gmail from './gmail';
import './App.css'

function App() {
	const [authenticated, setAuthenticated] = useState<boolean | undefined>();
	const [loading, setLoading] = useState(true);
	const [authToken, setAuthToken] = useState<string|undefined>("");

	useEffect(() => {
		console.log("starting....");
		(async () => {
			setAuthenticated(await isAuthenticated());
			setLoading(false);
		  })();
		
		// TODO: setup array of applications if doesnt exist in storage

	}, []);

	async function handleLoginClick(){
		if (loading) return;

		if (authenticated){
			await logout();
		}else{
			const token :string | undefined = await authenticate();
			setAuthToken(token);
			console.log("Handle click - log in, token: ",authToken);
		}
		setAuthenticated(!authenticated);
	};

	const refresh = async () => {
		console.log("Refreshing...");
		console.log("authToken", authToken);
		// TODO: make date dynamic and save to chrome storage
		const query = "in:inbox after:2023/08/29";
		const messages = await gmail.getMessages(authToken, query);
		console.log(messages);
		// TODO: add new apps to table and edit existing, save to chrome storage

		// TODO: make table, (not visible if not authed)
	}

	return (
		<>
			<div>
				<a href="https://react.dev" target="_blank">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Job App Tracker</h1>
			<div className="card">
				<button id="auth_btn" onClick={handleLoginClick}>
					{authenticated === undefined ? 'Loading...' : authenticated ? 'Log out' : 'Log in'}
				</button>
				{authenticated && (<button onClick={refresh} id="refresh_btn"> Refresh </button>)}
				<h3> {`logged in: ${authenticated}`} </h3>
			</div>
		</>
	)
}

export default App
