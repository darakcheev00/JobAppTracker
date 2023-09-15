import React, { useState, useEffect } from 'react';
import GptForm from '../GptForm';
import GptManager from '../../utils/gptmodule';
import StorageManager, { Message } from '../../utils/chrome-storage-utils';
import GmailApiManager from '../../utils/gmail';
import AuthManager from '../../utils/auth';


import './MainPage.scss';
import { serialize } from 'v8';

type MainPageProps = {
    authToken: string | undefined;
    setAuthToken: (key: string | undefined) => void;
    gptKey: string | undefined;
    setGptKey: (key: string) => void;
    gptKeyValid: boolean | undefined;
    setGptKeyValid: (key: boolean) => void;
    showMotivQuote: boolean;
    invalidEmails: Set<string>;
    setInvalidEmails: (key: Set<string>) => void;
    tableData: Message[] | undefined;
    setTableData: (key: Message[] | undefined) => void;
    dateNewestMsg: number;
    setDateNewestMsg: (key: number) => void;
};

interface TableCounts {
    appsReceived: number;
    rejected: number;
    interviews: number;
    offers: number;
    todayAppliedCount: number;
}

const statusDict: { [key: string]: string } = {
    "application received": "appsent",
    "rejected": "rejected",
    "interview requested": "interview",
    "received offer": "offer",
    "unspecified": "unspec",
    "action required for job application": "actionReq",
    "invited to apply": "actionReq"
}

const statusDisplayNames: { [key: string]: string } = {
    "application received": "Applied",
    "rejected": "Rejected",
    "interview requested": "Interview",
    "received offer": "Offer",
    "unspecified": "Unspecified",
    "action required for job application": "Action required",
    "invited to apply": "Invited to apply"
}

export default function MainPage({ authToken,
    setAuthToken,
    gptKey,
    setGptKey,
    gptKeyValid,
    setGptKeyValid,
    showMotivQuote,
    invalidEmails,
    setInvalidEmails,
    tableData,
    setTableData,
    dateNewestMsg,
    setDateNewestMsg }: MainPageProps) {

    const [refreshMsg, setRefreshMsg] = useState<string | undefined>("");
    const [motivQuote, setMotivQuote] = useState<string | undefined>("");
    const [displayedTableData, setDisplayedTableData] = useState<Message[] | undefined>(undefined);
    const [tableCounts, setTableCounts] = useState<TableCounts>();
    const [searchTerm, setSearchTerm] = useState<string | undefined>("");

    useEffect(() => {
        (async () => {
            // const {newTableData, newLatestDate} = await StorageManager.rollBackToMidnight();
            setDateNewestMsg(await StorageManager.getLatestDate());
            // setDateNewestMsg(newLatestDate);
            const data = await StorageManager.getTableData() as Message[];
            console.log(data);
            setTableData(data);
            setDisplayedTableData(data);
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
                    const now = new Date();
                    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                    return (start < new Date(item.internalDate) && item.gptRes.status === "application received");
                }).length,
            });
        }
        setDisplayedTableData(tableData);
    }, [tableData]);

    useEffect(() => {
        if (showMotivQuote) {
            (async () => { setMotivQuote(await GptManager.getMotivQuote(gptKey)) })();
        }
    }, [gptKey]);

    const refresh = async () => {
        console.log("Refreshing...");
        console.log("authToken", authToken);
        let gmailToken: string | undefined = authToken;

        if (!await GptManager.healthCheck(gptKey)) {
            return;
        }

        if (showMotivQuote) {
            setMotivQuote(await GptManager.getMotivQuote(gptKey));
        }

        if (!await GmailApiManager.healthCheck(authToken)) {
            gmailToken = await AuthManager.authenticate();
            setAuthToken(gmailToken);
        }

        const { validMessages, newestMsgDate, invalidSendersList } = await GmailApiManager.getMessages(gmailToken, dateNewestMsg, gptKey, invalidEmails);

        console.log("Messages: ", validMessages);

        if (invalidSendersList) {
            let newSet = invalidEmails;
            for (const item of invalidSendersList) {
                newSet.add(item);
            }
            // console.log(`invalidSendersSet: ${invalidSendersList}`)
            setInvalidEmails(newSet);
            StorageManager.setInvalidEmails(newSet);
        }

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

    const handleSearch = (val: any) => {
        setSearchTerm(val.target.value);
    }

    useEffect(() => {
        console.log(searchTerm);
        if (searchTerm !== undefined && searchTerm !== "") {
            setDisplayedTableData(tableData?.filter(item => item.gptRes.company.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1));
        } else {
            setDisplayedTableData(tableData);
        }
    }, [searchTerm]);

    const filterAll = () => { setDisplayedTableData(tableData) };
    const filterApplied = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === "application received")) }
    const filterRejected = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === "rejected")) }
    const filterInterviews = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === "interview requested")) }
    const filterOffers = () => { setDisplayedTableData(tableData?.filter(item => item.gptRes.status === "received offer")) }
    const filterOther = () => {
        setDisplayedTableData(tableData?.filter(item => {
            return item.gptRes.status !== "application received" &&
                item.gptRes.status !== "rejected" &&
                item.gptRes.status !== "interview requested" &&
                item.gptRes.status !== "received offer"
        }))
    }

    const handleDelete = async(rowId: number) => {
        // Filter out the row to be deleted based on its unique identifier
        const updatedTableData = displayedTableData?.filter(item => item.id !== rowId);
        setDisplayedTableData(updatedTableData);
        setTableData(updatedTableData);
        
        if (updatedTableData){
            await StorageManager.overrideTableData(updatedTableData);
        }else{
            await StorageManager.overrideTableData([]);
        }
    };

    return (
        <div>
            {showMotivQuote && <h3>{motivQuote}</h3>}

            {!gptKeyValid && <GptForm setGptKey={setGptKey} setGptKeyValid={setGptKeyValid} setRefreshMsg={setRefreshMsg} />}

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
                                        <a href={`https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox/${item.id}`} target="_blank" rel="noopener noreferrer">
                                            {item.gptRes.company}
                                        </a>
                                    </td>
                                    <td className='position-col'>{item.gptRes.position}</td>
                                    <td className='status-col'>
                                        <p className={`status status-${statusDict[item.gptRes.status]}`}>{statusDisplayNames[item.gptRes.status]}</p>
                                    </td>
                                    <td className='date-col'>{StorageManager.epochToMMDDYY(item.internalDate)}</td>
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