import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AuthManager from '../../utils/auth';
import StorageManager, { Message } from '../../utils/chrome-storage-utils';
import InvalidEmailArea from './InvalidSenderArea';

type InvalidEmailsSubmitForm = {
    invalidList: string;
};

type Props = {
    setAuthenticated: (key: boolean) => void;
    setShowSettings: (key: boolean) => void;
    setTableData: (key: Message[] | undefined) => void;
    jwt: string | undefined;
};

export default function Settings({
    setAuthenticated,
    setShowSettings,
    setTableData,
    jwt
}: Props) {

    const [userEmail, setUserEmail] = useState('');

    // useEffect(()=>{
    //     (async() => setUserEmail(await AuthManager.getUserEmail()))();
    // },[]);

    const handleLogoutClick = async () => {
        await AuthManager.logout();
        setAuthenticated(false);
        setShowSettings(false);
    };

    // const reloadToday = async () => {
    //     const { newTableData, newLatestDate } = await StorageManager.rollBackToMidnight();
    //     setTableData(newTableData);
    //     setDateNewestMsg(newLatestDate);
    // }

    return (
        <div className='settings-card'>
            <h3>{`Retrieving emails from: ${userEmail}`}</h3>

            <div className='settings-row'>
                <h3>Clear today's messages ⚠️: </h3>
                {/* <button onClick={reloadToday}>Clear</button> */}
            </div>

            <InvalidEmailArea {...{jwt}}/>

            <button id="logout_btn" onClick={handleLogoutClick}>
                Log out
            </button>
        </div>
    )
}