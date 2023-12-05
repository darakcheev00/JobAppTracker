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
const base64_1 = require("./base64");
const gptmodule_1 = __importDefault(require("./gptmodule"));
class MessageParser {
}
_a = MessageParser;
/**
 * Decodes a url safe Base64 string to its original representation.
 * @param  {string} string
 * @return {string}
 */
MessageParser.urlB64Decode = (str) => {
    return str
        ? (0, base64_1.decode)(str.replace(/\-/g, '+').replace(/\_/g, '/'))
        : '';
};
/**
 * Takes the header array filled with objects and transforms it into a more
 * pleasant key-value object.
 * @param  {array} headers
 * @return {object}
 */
MessageParser.indexHeaders = (headers) => {
    if (!headers) {
        return {};
    }
    else {
        return headers.reduce(function (messageObj, header) {
            messageObj[header.name.toLowerCase()] = header.value;
            return messageObj;
        }, {});
    }
};
MessageParser.extractContent = (s, space) => {
    var _b, _c;
    var span = document.createElement('span');
    span.innerHTML = s;
    if (space) {
        var children = span.querySelectorAll('*');
        for (var i = 0; i < children.length; i++) {
            if (children[i].textContent
                && ((_b = children[i].textContent) === null || _b === void 0 ? void 0 : _b.indexOf('@import')) === -1
                && ((_c = children[i].textContent) === null || _c === void 0 ? void 0 : _c.indexOf('@media')) === -1) {
                children[i].textContent += ' ';
            }
            else {
                children[i].textContent = '';
            }
        }
    }
    return [span.textContent || span.innerText].toString().replace(/ +/g, ' ').replace(/^\s*[\r\n]/gm, '');
};
MessageParser.invalid_senders = ['linkedin.com', '@remotemore.com', '@eg.vrbo.com', '@send.grammarly.com', '@mailtrack.io',
    '@weworkremotely.com', 'getpocket_com,', 'spotangels', 'silkandsnow.com', '@github.com',
    'order.eventbrite.com', 'invitetoapply@indeed.com', '@vailresortsmail.com', '@bowldigest.com', '@levels.fy'];
/**
 * Takes a response from the Gmail API's GET message method and extracts all
 * the relevant data.
 * @param  {object} response
 * @return {object}
 */
MessageParser.parseMessage = (response, gptKey, invalid_senders) => __awaiter(void 0, void 0, void 0, function* () {
    var messageObj = {
        id: response.id,
        snippet: response.snippet,
        sender: "Error: Invalid Sender",
        subject: "",
        internalDate: 0,
        textHtml: "",
        textPlain: "",
        body: "",
        gptRes: null
    };
    // TODO: combine text into one string
    if (response.internalDate) {
        messageObj.internalDate = parseInt(response.internalDate);
    }
    var payload = response.payload;
    if (!payload) {
        return messageObj;
    }
    var headers = _a.indexHeaders(payload.headers);
    if (headers.from) {
        messageObj.sender = headers.from;
        // console.log(`Invalid senders size: ${invalid_senders.size}`);
        // console.log(invalid_senders);
        if (invalid_senders.size > 0) {
            for (const invalidSnippet of invalid_senders.values()) {
                if (invalidSnippet !== "" && messageObj.sender.indexOf(invalidSnippet) !== -1) {
                    // console.log(`Dropped message from ${messageObj.sender} by snippet [${invalidSnippet}]`);
                    messageObj.sender = "Error: Invalid Sender";
                    return messageObj;
                }
            }
        }
    }
    if (headers.subject) {
        messageObj.subject = headers.subject;
    }
    var parts = [payload];
    var firstPartProcessed = false;
    while (parts.length !== 0) {
        var part = parts.shift();
        if (part.parts) {
            parts = parts.concat(part.parts);
        }
        if (firstPartProcessed) {
            headers = _a.indexHeaders(part.headers);
        }
        if (!part.body) {
            continue;
        }
        var isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
        var isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
        var isAttachment = Boolean(part.body.attachmentId || (headers['content-disposition'] && headers['content-disposition'].toLowerCase().indexOf('attachment') !== -1));
        if (isHtml && !isAttachment) {
            messageObj.textHtml = _a.urlB64Decode(part.body.data);
        }
        else if (isPlain && !isAttachment) {
            messageObj.textPlain = _a.urlB64Decode(part.body.data);
        }
        firstPartProcessed = true;
    }
    if (payload.body.size > 0) {
        messageObj.body = _a.urlB64Decode(payload.body.data);
    }
    let full_text = "";
    if (messageObj.textPlain === "") {
        const converted_html_to_plain = _a.extractContent(messageObj.textHtml, true);
        full_text = converted_html_to_plain;
        // console.log(messageObj.id, converted_html_to_plain);
    }
    else {
        full_text = messageObj.textPlain;
    }
    full_text = full_text.replace(/\d/g, '*').replace('\n', '').replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    // console.log(`!!full text has ${full_text.indexOf('http')} links`);
    // call chat gpt
    if (messageObj.sender !== "Error: Invalid Sender") {
        let gptRes = yield _a.callGpt(messageObj, full_text, gptKey);
        // if (gptRes.company === "unspecified" || gptRes.position === "unspecified"){
        // 	console.log("running gpt once more");
        // 	// TODO: modify prompt to say try again
        // 	gptRes = await this.callGpt(messageObj, full_text, gptKey);
        // }
        messageObj.gptRes = gptRes;
    }
    const result = {
        id: messageObj.id,
        sender: messageObj.sender,
        snippet: messageObj.snippet,
        internalDate: messageObj.internalDate,
        gptRes: messageObj.gptRes,
    };
    return result;
});
MessageParser.callGpt = (messageObj, full_text, gptKey) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GPT called");
    const gptRes = yield gptmodule_1.default.askGPt(messageObj.sender, messageObj.subject, full_text, gptKey);
    // console.log("Gpt result: ",gptRes);
    if (gptRes) {
        try {
            let jsonRes = JSON.parse(gptRes);
            jsonRes.status.toLowerCase();
            return jsonRes;
        }
        catch (e) {
            console.error(e, gptRes);
            return {};
        }
    }
});
exports.default = MessageParser;
