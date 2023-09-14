import React, { useState, useEffect } from 'react';
import AuthManager from '../../utils/auth';
import StorageManager from '../../utils/chrome-storage-utils';


type Props = {
    setAuthenticated: (key: boolean) => void;
    setShowSettings: (key: boolean) => void;
    setShowMotivQuote: (key: boolean) => void;
    showMotivQuote: boolean;
};

export default function Settings({ setAuthenticated, setShowSettings, setShowMotivQuote, showMotivQuote }: Props) {

    const handleLogoutClick = async () => {
        await AuthManager.logout();
        setAuthenticated(false);
        setShowSettings(false);
    };

    const toggleQuoteGen = () => {
        setShowMotivQuote(!showMotivQuote);
    };

    const reloadToday = async () => {
        const { newTableData, newLatestDate } = await StorageManager.rollBackToMidnight();
    }

    return (
        <div className='settings-card'>
            <h2>Settings</h2>

            <div className='settings-row'>
                <h3>Motivational quote: </h3>
                <button onClick={toggleQuoteGen}>
                    {showMotivQuote ? "Turned on" : "Turned off"}
                </button>
            </div>

            <div className='settings-row'>
                <h3>Reload today's messages: </h3> 
                <button onClick={reloadToday}>Reload</button>
            </div>

            <button id="logout_btn" onClick={handleLogoutClick}>
                Log out
            </button>
        </div>
    )
}