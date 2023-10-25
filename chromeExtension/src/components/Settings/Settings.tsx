import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AuthManager from '../../utils/auth';
import StorageManager, { Message } from '../../utils/chrome-storage-utils';

type InvalidEmailsSubmitForm = {
    invalidList: string;
};

type Props = {
    setAuthenticated: (key: boolean) => void;
    setShowSettings: (key: boolean) => void;
    setShowMotivQuote: (key: boolean) => void;
    showMotivQuote: boolean;
    invalidEmails: Set<string>;
    setInvalidEmails: (key: Set<string>) => void;
    setTableData: (key: Message[] | undefined) => void;
    setDateNewestMsg: (key: number) => void;
};

export default function Settings({ setAuthenticated,
    setShowSettings,
    setShowMotivQuote,
    showMotivQuote,
    invalidEmails,
    setInvalidEmails,
    setTableData,
    setDateNewestMsg
}: Props) {

    const [textareaValue, setTextareaValue] = useState(Array.from(invalidEmails).join('\n')); // Initialize with existing emails

    const { register, handleSubmit, reset } = useForm<InvalidEmailsSubmitForm>();  
    const [userEmail, setUserEmail] = useState('');

    // useEffect(()=>{
    //     (async() => setUserEmail(await AuthManager.getUserEmail()))();
    // },[]);

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
        setTableData(newTableData);
        setDateNewestMsg(newLatestDate);
    }

    const handleSubmitInvalids = async () => {
        console.log(`Submitted string: ${textareaValue}`);
        const inputString = textareaValue.replace(/'/g, '').replace(/"/g, '');

        const stringList = inputString.split('\n').map(email => email.trim());
        const stringSet = new Set(stringList);

        setInvalidEmails(stringSet);
        setTextareaValue(Array.from(stringSet).join('\n'));

        await StorageManager.setInvalidEmails(stringSet);
    }

    const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextareaValue(event.target.value);
    };

    const handleClearEmails = async () => {
        await StorageManager.clearInvalidEmails();
        setInvalidEmails(new Set<string>());
        setTextareaValue("");
    }

    return (
        <div className='settings-card'>
            <h3>{`Retrieving emails from: ${userEmail}`}</h3>

            <div className='settings-row'>
                <h3>Motivational quote ⚠️💲: </h3>
                <button onClick={toggleQuoteGen}>
                    {showMotivQuote ? "Turned on ⚠️💲" : "Turned off"}
                </button>
            </div>

            <div className='settings-row'>
                <h3>Clear today's messages ⚠️: </h3>
                <button onClick={reloadToday}>Clear</button>
            </div>

            <form onSubmit={handleSubmit(handleSubmitInvalids)}>
                <h4>Enter the snippets of email addresses that are unrelated to job applications. Emails containing these snippets will be automatically skipped. This saves your OpenAI api cash!</h4>
                <textarea
                    id="invalidEmailsBox"
                    placeholder='Enter invalid snippets (one per line)'
                    rows={10}
                    cols={50}
                    value={textareaValue}
                    onChange={handleTextareaChange}
                />
                <div>
                    <button type="submit">Submit</button>
                    <button onClick={handleClearEmails}>Clear email list</button>
                </div>
            </form>

            <button id="logout_btn" onClick={handleLogoutClick}>
                Log out
            </button>
        </div>
    )
}