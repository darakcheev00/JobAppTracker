import React, { useState, useEffect } from 'react';
import ServerManager from '../../utils/server_manager';

interface InvalidEmail {
    id: number;
    email: string;
}

type InvalidEmailAreaProps = {
    jwt: string | undefined;
}

const InvalidEmailArea: React.FC<InvalidEmailAreaProps> = (props) => {
    const { jwt } = props;

    const [invalidEmails, setInvalidEmails] = useState<InvalidEmail[]>([]);
    const [newEmail, setNewEmail] = useState<string>('');

    useEffect(() => {
        // Load from database
        (async () => {
            try {
                const response = await fetch('http://localhost:8000/invalid-senders/', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${jwt}`
                    }
                });

                if (!response.ok) {
                    throw new Error('response != ok');
                }

                const data = await response.json();
                setInvalidEmails(data);
                
                console.log(`retrieved and set invalid emails: ${data}`);

            } catch (err: any) {
                console.error(`Failed to fetch invalid senders from db: ${err}`)
            }
        })();
    }, []);

    const handleDelete = async (id: number) => {
        // Check server
        if (!await ServerManager.healthCheck()) { return }

        // Send id to server
        try {
            const response = await fetch(`http://localhost:8000/invalid-senders/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            });

            if (!response.ok) {
                throw new Error(`response not ok when deleting ${id}`);
            }
            console.log(`Server successfully added '${newEmail}'`);
            const updatedEmails = invalidEmails.filter((email) => email.id !== id);
            setInvalidEmails(updatedEmails);
        } catch (err: any) {
            console.error(`failed to delete email at server: ${err}`);
        }

    }

    const handleAdd = async () => {
        // if already exists return
        for(const e of invalidEmails){
            if (e.email === newEmail){ 
                console.log(`Invalid send ${newEmail} already exists in list.`);
                return;
            }
        }

        // Check server
        if (!await ServerManager.healthCheck()) { return }

        // Send data to server
        console.log(`Sending to server: '${newEmail}'`);

        try {
            const response = await fetch('http://localhost:8000/invalid-senders/', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newEmail })
            });

            if (!response.ok) {
                throw new Error('response not ok');
            }
            const new_email_id = await response.json();

            console.log(`Server successfully added '${newEmail}' data:`, new_email_id);
            const updatedEmails = invalidEmails.concat({
                id: new_email_id, 
                email: newEmail
            });

            setInvalidEmails(updatedEmails);
            setNewEmail("");

        } catch (err: any) {
            console.error(`failed to send new email to server: ${err}`);
        }
    }

    return (
        <div>
            <h2>Invalid Senders</h2>

            {invalidEmails.map(({ id, email }) => (
                <div key={id}>
                    <span>{email}</span>
                    <button onClick={() => handleDelete(id)}>✖️</button>
                </div>
            ))}

            <div>
                <input
                    type="text"
                    placeholder='Enter email address'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                />
                <button onClick={handleAdd}>Submit</button>
            </div>

        </div>
    );
}

export default InvalidEmailArea;
