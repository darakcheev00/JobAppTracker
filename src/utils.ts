
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

export const epochToMMDDYY = (epochTime: number) => {
    const date = new Date(epochTime);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
}

export const getTableData = async() => {
    const data = await chrome.storage.local.get('tableData');
    const tableData = data.tableData;
    console.log("Retrieved apps from chrome storage. Count: ",tableData.length);
    return tableData;
}

export const saveTableData = async (newData: Message[]) => {
    if (newData){
        const currData = await getTableData() as Message[];
        let totalData = newData;

        if (currData){
            totalData = currData.concat(newData);
        }

        await chrome.storage.local.set({tableData: totalData}, () => {
            console.log("Added new apps to chrome storage. Count: ",newData.length);
        });

    }
};

export const getLatestDate = async () => {
    const data = await chrome.storage.local.get('latestDate');
    const date = data.latestDate;
    console.log(`Retrieved latest date from chrome storage. Date: ${epochToMMDDYY(parseInt(date))}, ${date}`);
    return date;    
}

export const saveLatestDate = async (latestDate: number) => {
    await chrome.storage.local.set({latestDate: latestDate}, () => {
        console.log(`Set date in chrome storage: ${epochToMMDDYY(latestDate)}`);
    });
}