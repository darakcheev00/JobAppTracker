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
class GptManager {
}
_a = GptManager;
GptManager.context = "You are a job application email analyzer. The emails are sent from the employer that I have applied to. The emails i provide to you are in the format: gptInput = {'sender':msg['sender'],'subject':msg['subject'],'body':msg['body']}. Read this email and output these things: Company name and position name. (If not found then write 'unspecified') Also select which status option describes the email best. Status options: ['application received', 'rejected', 'interview requested', 'received offer','not related to job application','invited to apply','action required for job application']. Gpt output format is a json string containing these keys: 'company', 'position', 'status'. If you determine the position to be unspecified, check again. Rules: Use double quotes for strings in the json string! Remember the '{' and '}' in the json string!. ONLY RETURN THE json string! Do not add any other text! Email: ";
GptManager.healthCheck = (key) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GPT API healthcheck...");
    const response = yield fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: "say the word 'alive'" }]
        }),
    });
    if (response.ok) {
        console.log("GPT api key valid.");
        return true;
    }
    else {
        console.error(`GPT api key NOT valid. Status:${response.status}`);
        return false;
    }
});
GptManager.askGPt = (sender, subject, body, gptKey) => __awaiter(void 0, void 0, void 0, function* () {
    // check token length and reduce to size
    if (body.length > 14000 - _a.context.length) {
        body = body.slice(0, 14000 - _a.context.length);
        console.log(`Text too long. Shortening. sender:${sender}`);
    }
    let input = `{'sender':${sender}, 'subject':${subject}, 'body':${body}};`;
    let prompt = _a.context + " " + input.trim();
    // console.log("Prompt: ",prompt);
    let result = "";
    if (prompt) {
        try {
            const response = yield fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${gptKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }]
                }),
            });
            if (response.ok) {
                console.log("GPT called");
                const data = yield response.json();
                result = data.choices[0].message.content;
            }
            else {
                // console.error(`GPT API: Error: Unable to process your request of length(${prompt.length})!`,prompt);
                return null;
            }
        }
        catch (error) {
            console.error(error);
            console.error(prompt);
            return null;
        }
    }
    result = result.slice(result.lastIndexOf('{'), result.lastIndexOf('}') + 1)
        .replace("Levi's", 'Levis')
        .replace("Hudson's", 'Hudsons')
        .replace(/'/g, '"')
        .replace(/\\/g, '');
    return result;
});
GptManager.getMotivQuote = (gptKey) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = "Give me a random humorous and seasoned motivational quote, not by a president or steve jobs";
    // const prompt = "compliment my [insert a bad trait of a person] in an ironic way. only write your answer. give a different response every time";
    const response = yield fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gptKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
        }),
    });
    if (response.ok) {
        const data = yield response.json();
        return data.choices[Math.floor(Math.random() * data.choices.length)].message.content;
    }
    else {
        console.error("GPT error: could not get motivational quote");
        return "";
    }
});
exports.default = GptManager;
