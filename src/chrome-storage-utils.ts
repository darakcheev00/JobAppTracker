import { table } from "console";

export interface Message {
    id: number;
    sender: string;
    snippet: string;
    internalDate: number;
    gptRes: {
        company: string;
        position: string;
        status: string;
    };
}

export class StorageManager {
    static epochToMMDDYY = (epochTime: number) => {
        const date = new Date(epochTime);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${month}/${day}/${year}`;
    }

    static clearTableData = async () => {
        await chrome.storage.local.set({ tableData: [] }, () => {
            console.log("Cleared table data.");
        });
    }

    static getTableData = async () => {
        const data = await chrome.storage.local.get('tableData');
        const tableData = data.tableData;
        console.log("   Retrieved apps from chrome storage. Count: ", tableData !== undefined ? tableData.length : 0);
        console.log(tableData);
        return tableData;
    }

    static saveTableData = async (newData: Message[]) => {
        if (newData !== undefined && newData.length > 0) {
            console.log("Saving data to storage...");
            let currData: Message[] = await this.getTableData() as Message[];
            let totalData = newData;

            if (!Array.isArray(currData)) {
                currData = [];
            }

            totalData = newData.concat(currData);

            await chrome.storage.local.set({ tableData: totalData }, () => {
                console.log(`   Added new apps to chrome storage. new:${newData.length}, total:${totalData.length}`);
                console.log(totalData);
            });
        } else {
            console.log("No new messages to be saved.");
        }
    };

    static getLatestDate = async () => {
        const data = await chrome.storage.local.get('latestDate');
        const date = data.latestDate;
        console.log(`Retrieved latest date from chrome storage. Date: ${date}, = ${new Date(date)}`);
        return date;
    }

    static saveNewestMsgDate = async (latestDate: number) => {
        await chrome.storage.local.set({ latestDate: latestDate }, () => {
            console.log(`Set date in chrome storage: ${latestDate}, = ${new Date(latestDate)}`);
        });
    }

    static resetLatestDate = async () => {
        const resetDate = 1693607827000;
        await chrome.storage.local.set({ latestDate: resetDate }, () => {
            console.log("Reset latest date to ", new Date(resetDate));
        });
    }

    static setGptKey = async (key: string) => {
        await chrome.storage.local.set({ gptKey: key }, () => {
            console.log(`Gpt key stored`);
        });
    };

    static getGptKey = async () => {
        const data = await chrome.storage.local.get('gptKey');
        console.log(`Retrieved gpt key from chrome storage.`);
        return data.gptKey;
    };

}