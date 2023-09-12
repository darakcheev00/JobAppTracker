import React, { useState, useEffect } from 'react';
import AuthManager from '../utils/auth';


type Props = {
    setAuthenticated: (key: boolean) => void;
    setShowSettings: (key: boolean) => void;
};

export default function Settings({setAuthenticated, setShowSettings} : Props) {

    async function handleLogoutClick() {
		await AuthManager.logout();
		setAuthenticated(false);
        setShowSettings(false);
	};

    return (
        <div>
            <h2>Settings</h2>
            <button id="logout_btn" onClick={handleLogoutClick}>
                Log out
            </button>
        </div>
    )
}