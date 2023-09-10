import React, {useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { GptManager } from './gptmodule';
import { StorageManager } from './chrome-storage-utils';

type GptSubmitForm = {
    gptkeyInput: string;
};
type GptFormProps = {
    setGptKey: (key: string) => void; // Define the type for setGptKey
    setGptKeyValid: (key: boolean) => void;
};

export default function GptForm({ setGptKey, setGptKeyValid }: GptFormProps) {
    const { register, handleSubmit, reset } = useForm<GptSubmitForm>();

    const handleGptKeySubmit  = async(data: GptSubmitForm) => {
        console.log(`Submitted key: ${data.gptkeyInput}`);

        if (await GptManager.healthCheck(data.gptkeyInput)) {
            setGptKey(data.gptkeyInput);
            await StorageManager.setGptKey(data.gptkeyInput);
            setGptKeyValid(true);
            console.log(await StorageManager.getGptKey());
        }

        reset({
            gptkeyInput: '',
        })

	}

    return (
        <div>
            <form onSubmit={handleSubmit(handleGptKeySubmit)}>
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