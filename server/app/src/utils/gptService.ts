import SharedDataManager from './sharedDataManager';

export default class GptManager {

    static context = `You are a job application email analyzer. The emails are sent from the employer that I have applied to.
    The emails i provide to you are in the format: gptInput = {'sender':msg['sender'],'subject':msg['subject'],'body':msg['body']}.
    Read this email and output these things: Company name and position name. (If not found then write 'unspecified')
    Also select which status option describes the email best.
    Status options: ['application received', 'rejected', 'interview requested', 'received offer','not related to job application','invited to apply','action required for job application'].
    Gpt output format is a json string containing these keys: 'company', 'position', 'status'.
    If you determine the position to be unspecified, check again.
    "Indeed Ireland Operations Ltd." and "LinkedIn" are job application sites so do not determine the company to be these.
    Rules: Use double quotes for strings in the json string!
    Remember the '{' and '}' in the json string!. ONLY RETURN THE json string! Do not add any other text! Email: `

    static healthCheck = async (key: string | undefined) => {
        console.log("GPT API healthcheck...");
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        } else {
            console.error(`GPT api key NOT valid. Status:${response.status}`);
            return false;
        }
    }

    static callGpt = async (sender: string, subject: string, body: string, gptKey: string) => {
        console.log("GPT called");

        // check token length and reduce to size
        if (body.length > 14000 - this.context.length) {
            body = body.slice(0, 14000 - this.context.length);
            console.log(`Text too long. Shortening. sender:${sender}`);
        }

        let input = `{'sender':${sender}, 'subject':${subject}, 'body':${body}};`
        let prompt = this.context + " " + input;
        // console.log("Prompt: ",prompt);

        let result = "";

        if (prompt) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    console.log("GPT response ok");
                    const data = await response.json();
                    result = data.choices[0].message.content;
                } else {
                    // console.error(`GPT API: Error: Unable to process your request of length(${prompt.length})!`,prompt);
                    throw new Error();
                }
            } catch (error) {
                // console.error(prompt);
                throw new Error("GPT FAILED");
            }
        }

        result = result.slice(result.lastIndexOf('{'), result.lastIndexOf('}') + 1)
            .replace("Levi's", 'Levis')
            .replace("Hudson's", 'Hudsons')
            .replace(/'/g, '"')
            .replace(/\\/g, '');


        try {
            var jsonRes = JSON.parse(result);
            jsonRes.status.toLowerCase()

            const mapping = SharedDataManager.getGptStatusMapping();

            if (mapping.hasOwnProperty(jsonRes.status)) {
                jsonRes.status = mapping[jsonRes.status];
            } else {
                if (jsonRes.status.includes("unrelated") || jsonRes.status.includes("not related")) {
                    jsonRes.status = -1;
                } else {
                    throw new Error(`status '${jsonRes.status}' is UNKNOWN`);
                }
            }
            
            return jsonRes;

        } catch (e) {
            throw new Error(`JSON-PARSING GPT RESULT FAILED: ${e}`);
        }

    }

    // static getMotivQuote = async (gptKey:string | undefined) => {
    //     const prompt = "Give me a random humorous and seasoned motivational quote, not by a president or steve jobs";
    //     // const prompt = "compliment my [insert a bad trait of a person] in an ironic way. only write your answer. give a different response every time";
    //     const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //         method: 'POST',
    //         mode: 'cors',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${gptKey}`,
    //         },
    //         body: JSON.stringify({
    //             model: 'gpt-3.5-turbo',
    //             messages: [{ role: 'user', content: prompt }]
    //         }),
    //     });

    //     if (response.ok) {
    //         const data = await response.json();
    //         return data.choices[Math.floor(Math.random() * data.choices.length)].message.content;
    //     } else {
    //         console.error("GPT error: could not get motivational quote");
    //         return "";
    //     }
    // }
}