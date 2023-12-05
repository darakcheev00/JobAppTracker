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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const gmail_parse_message_1 = __importDefault(require("./gmail-parse-message"));
/**
 * Get messages from gmail api
 * @return {array} the array of messages
 */
class GmailApiManager {
}
_a = GmailApiManager;
GmailApiManager.healthCheck = (token) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Gmail API healthcheck...");
    try {
        const query = `after: ${Date.now()}`;
        const response = yield fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (response.ok) {
            console.log("Gmail auth token valid.");
            return true;
        }
        else {
            console.error(`Gmail API: Response not ok Status:${response.status}`);
            return false;
        }
    }
    catch (error) {
        console.error("Gmail API healthcheck: Error fetching messages:", error);
        return false;
    }
});
GmailApiManager.getMessages = (token, newestMsgDate, gptKey, invalid_senders) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`query: in:inbox category:primary after:${new Date(newestMsgDate)}`);
    const query = `in:inbox category:primary after:${newestMsgDate / 1000}`;
    // const query = `in:inbox category:primary after:${1694063429}`;
    try {
        console.log(query);
        const data = yield fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10000&q=${query}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!data.ok) {
            throw new Error(`HTTP error! Status: ${data.status}`);
        }
        const info = yield data.json();
        if (info.messages === undefined) {
            console.log("GMAIL API: no new messages");
            return {};
        }
        console.log(`GMAIL API: ${info.messages.length} new messages`);
        // get date of newest message
        const res = yield fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${info.messages[0].id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const newestMessage = yield res.json();
        const updatedNewestMsgDate = parseInt(newestMessage.internalDate);
        console.log(newestMessage);
        // call gpt on selected messages async
        const messagePromises = info.messages.map((msg) => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const full_message = yield res.json();
            // console.log(full_message);
            const reduced_message = yield gmail_parse_message_1.default.parseMessage(full_message, gptKey, invalid_senders);
            return reduced_message;
        }));
        const reduced_messages = yield Promise.all(messagePromises);
        console.log(`async promises completed. reduced messages: ${reduced_messages}`);
        let invalidSendersList = new Set();
        for (const item of reduced_messages) {
            if (item.gptRes && item.sender !== "Error: Invalid Sender" && item.gptRes.status.toLowerCase() === "not related to job application") {
                invalidSendersList.add(item.sender.slice(item.sender.indexOf("<") + 1, item.sender.indexOf(">")));
            }
        }
        // Filter out invalid messages
        const valid_messages = reduced_messages.filter(message => message.sender !== "Error: Invalid Sender" &&
            message.gptRes !== null &&
            message.gptRes !== undefined &&
            message.gptRes.status.toLowerCase() !== "not related to job application" &&
            message.gptRes.status.toLowerCase() !== "not_related_to_job_application" &&
            message.gptRes.company !== "unspecified");
        console.log("messages filtered.");
        return {
            validMessages: valid_messages,
            newestMsgDate: updatedNewestMsgDate,
            invalidSendersList: invalidSendersList
        };
    }
    catch (error) {
        // Handle errors related to the main fetch request
        console.error("Gmail API: Error fetching messages:", error);
        return {};
    }
});
exports.default = GmailApiManager;
