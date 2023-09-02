
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
    return await chrome.storage.local.get('tableData');
}

export const saveTableData = async (newData: Message[]) => {
    if (newData){
        const currData = await getTableData();
        let totalData = newData;

        if (currData){
            totalData = currData.concat(newData);
        }

        await chrome.storage.local.set({tableData: totalData}, () => {
            console.log("Added new data to existing data.");
        });
    }    
};