import { table } from "console";


export interface Message {
    id: string;
    sender: string;
    snippet: string;
    internalDate: number;
    gptRes: {
        company: string;
        position: string;
        status: number;
    };
}

export default class StorageManager {
    static epochToMMDDYY = (epochTime: number) => {
        const date = new Date(epochTime);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        const res = `${month}/${day}/${year}`;
        // console.log(res);
        return res;
    }

    static timeConverter(UNIX_timestamp: number) {
        var a = new Date(UNIX_timestamp);
        // var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        // var year = a.getFullYear();
        // var month = months[a.getMonth()];
        // var date = a.getDate();
        // var hour = a.getHours();
        // var min = a.getMinutes();
        // var sec = a.getSeconds();
        // var time = month + ' ' + date + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
        return a.toLocaleString("en-US", { timeZone: "America/New_York" });
    }

    static clearTableData = async () => {
        await chrome.storage.local.set({ tableData: [] }, () => {
            console.log("Cleared table data.");
        });
    }

    static getTableData = async () => {
        const data = await chrome.storage.local.get('tableData');
        const tableData = data.tableData;
        console.log("Retrieved rows from chrome storage. Count: ", tableData !== undefined ? tableData.length : 0);
        console.log("tableData loaded: ", tableData);
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
                // console.log(totalData);
            });
        } else {
            console.log("No new messages to be saved.");
        }
    };

    static overrideTableData = async (newData: Message[]) => {
        await chrome.storage.local.set({ tableData: newData }, () => {
            console.log(`Override table data complete. new: ${newData.length}`);
        });
    }

    static rollBackToMidnight = async () => {
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        let tableData = await this.getTableData();
        if (tableData){
            tableData = tableData.filter((item:Message) => new Date(item.internalDate) < dayStart)
            await this.overrideTableData(tableData);
        }else{
            tableData = [];
        }
        await this.saveNewestMsgDate(dayStart.valueOf());
        return {
            newTableData: tableData,
            newLatestDate: dayStart.valueOf()
        }
    }


    static getLatestDate = async () => {
        const data = await chrome.storage.local.get('latestDate');
        let date = data.latestDate;
        if (date === undefined){
            date = 1693607827000;
            console.log(`no date found in storage. setting to ${date}`);
        }else{
            console.log(`Retrieved latest date from chrome storage. Date: ${date}, = ${new Date(date)}`);
        }
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

    static setJwt = async (token: string) => {
        await chrome.storage.local.set({ jwt: token }, () => {
            console.log(`JWT stored`);
        });
    };

    static getJwt = async () => {
        const data = await chrome.storage.local.get('jwt');
        console.log(`Retrieved jwt from chrome storage.`);
        return data.jwt;
    };

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

    static clearGptKey = async () => {
        await chrome.storage.local.set({ gptKey: "" }, () => {
            console.log(`Gpt key cleared`);
        });
    };

    static getInvalidEmails = async () => {
        const data = await chrome.storage.local.get('invalidEmails');
        if (data.invalidEmails === undefined || data.invalidEmails.length === 0 || !Array.isArray(data.invalidEmails)){
            console.log("No invalid emails in chrome storage.");
            return new Set<string>();
        }
        console.log(`Retrieved invalid emails from chrome storage: [${data.invalidEmails}]`);
        return new Set<string>(data.invalidEmails);
    }

    static setInvalidEmails = async (newSet: Set<string>) => {
        await chrome.storage.local.set({ invalidEmails: Array.from(newSet)}, () => {
            console.log(`Invalid emails set.`);
        });
    }

    static clearInvalidEmails = async () => {
        await chrome.storage.local.set({ invalidEmails: []}, () => {
            console.log(`Invalid emails cleared.`);
        });
    }

    static setLastMsgId = async (id: string) => {
        await chrome.storage.local.set({ lastMsgId: id }, () => {
            console.log(`lastMsgId set in chrome storage value ${id}`);
        });
    };

    static getLastMsgId = async () => {
        const data = await chrome.storage.local.get('lastMsgId');
        console.log(`Retrieved lastMsgID from chrome storage: ${data.lastMsgId}`);
        return data.lastMsgId;
    };

    static setShowChart = async (newBool: Boolean) => {
        await chrome.storage.local.set({ showChart: newBool }, () => {
            console.log(`Set showChart to ${newBool}`);
        });
    };

    static getShowChart = async () => {
        const data = await chrome.storage.local.get('showChart');
        console.log(`Retrieved showChart from chrome storage.`);
        return data.showChart;
    };



}

/*
(async () => {
    await chrome.storage.local.set({ tableData: [] }, () => {
        console.log("Cleared table data.");
    });
    const id = 'undef';
    await chrome.storage.local.set({ lastMsgId: id }, () => {
        console.log(`lastMsgId set in chrome storage value ${id}`);
    });
})();
*/
