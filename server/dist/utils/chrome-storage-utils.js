"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
class StorageManager {
}
_a = StorageManager;
StorageManager.epochToMMDDYY = (epochTime) => {
    const date = new Date(epochTime);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
};
StorageManager.clearTableData = () => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ tableData: [] }, () => {
        console.log("Cleared table data.");
    });
});
StorageManager.getTableData = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield chrome.storage.local.get('tableData');
    const tableData = data.tableData;
    console.log("   Retrieved rows from chrome storage. Count: ", tableData !== undefined ? tableData.length : 0);
    // console.log(tableData);
    return tableData;
});
StorageManager.saveTableData = (newData) => __awaiter(void 0, void 0, void 0, function* () {
    if (newData !== undefined && newData.length > 0) {
        console.log("Saving data to storage...");
        let currData = yield _a.getTableData();
        let totalData = newData;
        if (!Array.isArray(currData)) {
            currData = [];
        }
        totalData = newData.concat(currData);
        yield chrome.storage.local.set({ tableData: totalData }, () => {
            console.log(`   Added new apps to chrome storage. new:${newData.length}, total:${totalData.length}`);
            console.log(totalData);
        });
    }
    else {
        console.log("No new messages to be saved.");
    }
});
StorageManager.overrideTableData = (newData) => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ tableData: newData }, () => {
        console.log(`Override table data complete. new:${newData.length}`);
    });
});
StorageManager.rollBackToMidnight = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let tableData = yield _a.getTableData();
    if (tableData) {
        tableData = tableData.filter((item) => new Date(item.internalDate) < dayStart);
        yield _a.overrideTableData(tableData);
    }
    else {
        tableData = [];
    }
    yield _a.saveNewestMsgDate(dayStart.valueOf());
    return {
        newTableData: tableData,
        newLatestDate: dayStart.valueOf()
    };
});
StorageManager.getLatestDate = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield chrome.storage.local.get('latestDate');
    let date = data.latestDate;
    if (date === undefined) {
        date = 1693607827000;
        console.log(`no date found in storage. setting to ${date}`);
    }
    else {
        console.log(`Retrieved latest date from chrome storage. Date: ${date}, = ${new Date(date)}`);
    }
    return date;
});
StorageManager.saveNewestMsgDate = (latestDate) => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ latestDate: latestDate }, () => {
        console.log(`Set date in chrome storage: ${latestDate}, = ${new Date(latestDate)}`);
    });
});
StorageManager.resetLatestDate = () => __awaiter(void 0, void 0, void 0, function* () {
    const resetDate = 1693607827000;
    yield chrome.storage.local.set({ latestDate: resetDate }, () => {
        console.log("Reset latest date to ", new Date(resetDate));
    });
});
StorageManager.setGptKey = (key) => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ gptKey: key }, () => {
        console.log(`Gpt key stored`);
    });
});
StorageManager.getGptKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield chrome.storage.local.get('gptKey');
    console.log(`Retrieved gpt key from chrome storage.`);
    return data.gptKey;
});
StorageManager.clearGptKey = () => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ gptKey: "" }, () => {
        console.log(`Gpt key cleared`);
    });
});
StorageManager.getInvalidEmails = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield chrome.storage.local.get('invalidEmails');
    if (data.invalidEmails === undefined || data.invalidEmails.length === 0 || !Array.isArray(data.invalidEmails)) {
        console.log("No invalid emails in chrome storage.");
        return new Set();
    }
    console.log(`Retrieved invalid emails from chrome storage: [${data.invalidEmails}]`);
    return new Set(data.invalidEmails);
});
StorageManager.setInvalidEmails = (newSet) => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ invalidEmails: Array.from(newSet) }, () => {
        console.log(`Invalid emails set.`);
    });
});
StorageManager.clearInvalidEmails = () => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ invalidEmails: [] }, () => {
        console.log(`Invalid emails cleared.`);
    });
});
exports.default = StorageManager;
