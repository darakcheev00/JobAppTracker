import GptManager from "./gptmodule";
import { Message } from './chrome-storage-utils'

export default class ServerManager {
    static healthCheck = async (): Promise<Boolean> => {
        try {
            console.log("running server health check...");
            const response = await fetch("http://localhost:8000/healthcheck");
            if (response.status === 200) {
                console.log("SERVER IS UP");
                return true;
            } else {
                return false;
            }
        } catch (err: any) {
            console.error(`SERVER IS DOWN ❌❌❌. (error: ${err})`);
            return false;
        }
    }

    static gptKeyValidation = async (jwt: string | undefined): Promise<Boolean> => {
        try {
            console.log(`checking if saved gpt key is valid... using ${jwt}`);
            const response = await fetch("http://localhost:8000/user/single", {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return await GptManager.healthCheck(data.gptkey);
            } else {
                throw new Error('could not retrieve user gpt token');
            }
        } catch (err: any) {
            console.error(`gpt validation error: ${err}`);
            return false;
        }
    }

    static loadData = async (lastMsgId: string, jwt: string | undefined): Promise<Message[]> => {
        const msgid = lastMsgId === undefined ? 'undef' : lastMsgId;
        try {
            const response = await fetch(`http://localhost:8000/status/load/${msgid}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                throw new Error('failed to load statuses')
            }

        } catch (err: any) {
            throw new Error(`error while loading statuses: ${err}`);
        }
    }
}