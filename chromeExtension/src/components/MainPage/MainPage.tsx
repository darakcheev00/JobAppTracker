import React, { useState, useEffect } from 'react';
import GptForm from './GptForm';
import AppsChart from './AppsChart';
import GptManager from '../../utils/gptmodule';
import StorageManager, { Message } from '../../utils/chrome-storage-utils';
import AuthManager from '../../utils/auth';
import GoogleApiManager from '../../utils/gmailApiService';
import ServerManager from '../../utils/server_manager';


import './MainPage.scss';
import { serialize } from 'v8';
import { isVariableDeclaration, updateArrayBindingPattern } from 'typescript';
import { Server } from 'http';

type MainPageProps = {
    authToken: string | undefined;
    setAuthToken: (key: string | undefined) => void;
    gptKeyValid: Boolean;
    setGptKeyValid: (key: Boolean) => void;
    tableData: Message[] | undefined;
    setTableData: (key: Message[] | undefined) => void;
    showChart: boolean;
    jwt: string | undefined;
    setJwt: (key: string | undefined) => void;
    serverUp: Boolean;
    setServerUp: (key: Boolean) => void;
};

interface TableCounts {
    appsReceived: number;
    rejected: number;
    interviews: number;
    offers: number;
    todayAppliedCount: number;
}

export enum Status {
    AppRecieved = 1,
    Rejected,
    Interview,
    Offer,
    Ghosted,
    InvitedToApply,
    ActionReq
}

const statusNames: { [key: number]: string[] } = {
    1: ["Applied", "appsent"],
    2: ["Rejected", "rejected"],
    3: ["Interview", "interview"],
    4: ["Offer", "offer"],
    5: ["Ghosted", "ghosted"],
    6: ["Invited to apply", "actionReq"],
    7: ["Action required", "actionReq"]
}

export default function MainPage({
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
    setServerUp }: MainPageProps) {

    const [refreshMsg, setRefreshMsg] = useState<string | undefined>("");
    const [displayedTableData, setDisplayedTableData] = useState<Message[] | undefined>(undefined);
    const [tableCounts, setTableCounts] = useState<TableCounts>();
    const [searchTerm, setSearchTerm] = useState<string | undefined>("");
    const [dataFilter, setDataFilter] = useState<number>(0);

    useEffect(() => {
        (async () => {
            console.log("running initial table data load");
            const data = await StorageManager.getTableData() as Message[];
            setTableData(data);
            setDisplayedTableData(data);
        })();
    }, []);

    useEffect(() => {
        console.log("tableData changed. size: ", tableData?.length);
        setDisplayedTableData(tableData);
        if (tableData !== undefined) {
            // console.log("tableData changed: ", tableData);
            setTableCounts({
                appsReceived: tableData?.filter(item => item.gptRes.status === Status.AppRecieved).length,
                rejected: tableData?.filter(item => item.gptRes.status === Status.Rejected).length,
                interviews: tableData?.filter(item => item.gptRes.status === Status.Interview).length,
                offers: tableData?.filter(item => item.gptRes.status === Status.Offer).length,
                todayAppliedCount: tableData?.filter(item => {
                    const now = new Date();
                    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                    return (start < new Date(item.internalDate) && item.gptRes.status === Status.AppRecieved);
                }).length,
            });
        }
    }, [tableData]);

    // useEffect(()=>{
    //     console.log("displayedTableData changed. size: ", displayedTableData?.length);
    // },[displayedTableData]);

    const refresh = async () => {
        console.log("Refreshing...");

        // Check if server is up
        if (!await ServerManager.healthCheck()) {
            setServerUp(false);
            return;
        }
        setServerUp(true);

        // Get jwt from storage
		var jwt_token = jwt;
		// var jwt_token = await StorageManager.getJwt();
        
		// Check if auth token has expired
		if (!await GoogleApiManager.authTokenCheck(authToken)){
            // Get new Token
			const new_auth_token = await AuthManager.authenticate();
            setAuthToken(new_auth_token);
			// Get new jwt from server
			jwt_token = await AuthManager.getJWTValue(new_auth_token, true);
            setJwt(jwt_token);
		}

        setGptKeyValid(await ServerManager.gptKeyValidation(jwt_token));

        console.log('calling GET status/new');
        try {
            const response = await fetch("http://localhost:8000/status/new", {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${jwt_token}`
                }
            });
            var data = await response.json();
            console.log(`received new app status's ${data}`);

            if (!response.ok) {
                throw new Error(`response status: ${data}`);
            }
        } catch (err: any) {
            console.error("Error getting new application status's:", err.message);
            return;
        }

        const validMessages: Message[] = data;

        if (validMessages.length > 0){
            await StorageManager.setLastMsgId(validMessages[0].id);
        }

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
        // if (newestMsgDate !== undefined) {
        //     const offSet: number = 10000;
        //     setDateNewestMsg(newestMsgDate + offSet);
        //     StorageManager.saveNewestMsgDate(newestMsgDate + offSet);
        // }
    }

    const handleSearch = (val: any) => {
        setSearchTerm(val.target.value);
    }

    useEffect(() => {
        // console.log(searchTerm);
        if (searchTerm !== undefined && searchTerm !== "") {
            setDisplayedTableData(tableData?.filter(item => item.gptRes.company.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1));
        } else {
            setDisplayedTableData(tableData);
        }
    }, [searchTerm]);

    const filterAll = () => { setDisplayedTableData(tableData); setDataFilter(0); };
    const filterApplied = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === Status.AppRecieved)); setDataFilter(Status.AppRecieved); }
    const filterRejected = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === Status.Rejected)); setDataFilter(Status.Rejected); }
    const filterInterviews = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === Status.Interview)) }
    const filterOffers = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === Status.Offer)) }
    const filterOther = () => {
        setDisplayedTableData(tableData?.filter(item => {
            return item.gptRes.status !== Status.AppRecieved &&
                item.gptRes.status !== Status.Rejected &&
                item.gptRes.status !== Status.Interview &&
                item.gptRes.status !== Status.Offer
        }))
    }

    const handleDelete = async (rowId: string) => {
        // Filter out the row to be deleted based on its unique identifier
        if (!await ServerManager.healthCheck()){ 
            return;
        }
        
        const updatedTableData = tableData?.filter(item => item.id !== rowId);

        setTableData(updatedTableData);
        setDisplayedTableData(updatedTableData);

        if (updatedTableData) {
            await StorageManager.overrideTableData(updatedTableData);
        } else {
            await StorageManager.overrideTableData([]);
        }

        try {
            const response = await fetch(`http://localhost:8000/status/${rowId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`
                },
            });
            if (response.ok) {
                console.log(`Deleted email with id: ${rowId}.`);
            } else {
                throw new Error("Failed delete");
            }
        } catch (err: any) {
            console.error(`error deleting in db: ${err}`);
        }
        console.log('----------------------------');

    };

    return (
        <div>
            {!gptKeyValid && serverUp && <GptForm {...{ setGptKeyValid, setRefreshMsg, jwt }} />}

            {showChart && tableData && <AppsChart {...{ tableData, dataFilter }} />}

            <div className="table-counts">
                <button onClick={filterAll}>All</button>
                <button onClick={filterApplied} id="applied-btn">Applied: {tableCounts?.appsReceived}</button>
                <button onClick={filterRejected} id="rejected-btn">Rejected: {tableCounts?.rejected}</button>
                <button onClick={filterInterviews} id="interviews-btn">Interviews: {tableCounts?.interviews}</button>
                <button onClick={filterOffers} id="offers-btn">Offers: {tableCounts?.offers}</button>
                <button onClick={filterOther} id="other-btn">Other: {
                    tableData && tableCounts ?
                        tableData?.length - tableCounts?.appsReceived - tableCounts?.rejected - tableCounts?.interviews - tableCounts?.offers
                        : 0
                }</button>
            </div>

            <div className='group2'>
                <input
                    id='searchbox'
                    type="text"
                    placeholder="Search company..."
                    value={searchTerm}
                    onChange={handleSearch}
                />

                <h3>Applied today: {tableCounts?.todayAppliedCount}</h3>

                {gptKeyValid && <button onClick={refresh} className="refresh_btn"> Refresh </button>}
                <h3 id='refresh-msg'>{refreshMsg}</h3>
            </div>


            <div className='tableCard'>
                <table className="maintable">
                    <thead>
                        <tr>
                            <th className='company-col-head'>Company</th>
                            <th className='position-col-head'>Position</th>
                            <th className='status-col'>Status</th>
                            <th className='date-col'>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTableData !== undefined &&
                            displayedTableData.length > 0 &&
                            (displayedTableData.map((item: Message) => (
                                <tr key={item.id}>
                                    <td className='company-col'>
                                        <a href={`https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox/${item.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={`Email snippet:\n\n${item.snippet}`}>
                                            {item.gptRes.company}
                                        </a>
                                    </td>
                                    <td className='position-col'>{item.gptRes.position}</td>
                                    <td className='status-col'>
                                        <p className={`status status-${statusNames[item.gptRes.status][1]}`}>{statusNames[item.gptRes.status][0]}</p>
                                    </td>
                                    <td className='date-col'
                                        title={StorageManager.timeConverter(item.internalDate)}>
                                        {StorageManager.epochToMMDDYY(item.internalDate)}
                                    </td>
                                    <td className='delete-col'>
                                        <button id='delete-button' onClick={() => handleDelete(item.id)}>✖️</button>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}