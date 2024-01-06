import React, {useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GptManager from '../../utils/gptmodule';
import StorageManager from '../../utils/chrome-storage-utils';

type GptSubmitForm = {
    gptkeyInput: string;
};
type GptFormProps = {
    setGptKeyValid: (key: Boolean) => void;
    setRefreshMsg: (key: string) => void;
    jwt: string | undefined;
};

export default function GptForm({ setGptKeyValid, setRefreshMsg, jwt}: GptFormProps) {
    const { register, handleSubmit, reset } = useForm<GptSubmitForm>();

    const sendGPTKey = async(gptKey:string) => {
        console.log(`sending gpt key to backend using jwt:${jwt}`);
        try {
            const response = await fetch(`http://localhost:8000/user/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`
                },
                body: JSON.stringify({gptKey})
            });
            if (response.ok) {
                console.log(`Updated user's gpt key`);
            } else {
                throw new Error("Failed to update key");
            }
        } catch (err: any) {
            console.error(`backend error: ${err}`);
        }
    }

    const handleGptKeySubmit  = async(data: GptSubmitForm) => {
        console.log(`Submitted key: ${data.gptkeyInput}`);
        let displayMsg = "Invalid key! Try again.";

        // do local gpt test
        if (await GptManager.healthCheck(data.gptkeyInput)) {
            // TODO: call backend endpoint to set (data.gptkeyInput);
            await sendGPTKey(data.gptkeyInput);
            setGptKeyValid(true);
            displayMsg = "Valid key!";
            console.log(await StorageManager.getGptKey());
        }

        setRefreshMsg(displayMsg);
		setTimeout(() => {
			setRefreshMsg("")
		}, 5000);

        reset({
            gptkeyInput: '',
        })

	}

    return (
        <div>
            <form onSubmit={handleSubmit(handleGptKeySubmit)}>
                <h3>⚠️Open AI key required!⚠️</h3>
				<input
					type="text"
					placeholder='Enter OpenAI key...'
                    {...register('gptkeyInput')}
				/>
				<button type="submit">Submit</button>
			</form>
        </div>
    )

}
