export class GptManager {

    static context = "You are a job application email analyzer. The emails are sent from the employer that I have applied to. The emails i provide to you are in the format: gptInput = {'sender':msg['sender'],'subject':msg['subject'],'body':msg['body']}. Read this email and output these things: Company name and position name. (If not found then write 'unspecified') Also select which status option describes the email best. Status options: ['application received', 'rejected', 'interview requested', 'received offer','not related to job application','invited to apply']. Gpt output format is a json string containing these keys: 'company', 'position', 'status'. If you determine the position to be unspecified, check again. Rules: Use double quotes for strings in the json string! Remember the '{' and '}' in the json string!. ONLY RETURN THE json string! Do not add any other text! Email: "

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


    static askGPt = async (sender: string, subject: string, body: string, gptKey: string | undefined) => {

        // check token length and reduce to size
        if (body.length > 14000 - this.context.length) {
            body = body.slice(0, 14000 - this.context.length);
            console.log(`Text too long. Shortening. sender:${sender}`);
        }

        let input = `{'sender':${sender}, 'subject':${subject}, 'body':${body}};`
        let prompt = this.context + " " + input.trim();
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
                    console.log("GPT called");
                    const data = await response.json();
                    result = data.choices[0].message.content;
                } else {
                    // console.error(`GPT API: Error: Unable to process your request of length(${prompt.length})!`,prompt);
                    return null;
                }
            } catch (error) {
                console.error(error);
                console.error(prompt);
                return null;
            }
        }

        result = result.slice(result.lastIndexOf('{'), result.lastIndexOf('}') + 1)
            .replace("Levi's", 'Levis')
            .replace(/'/g, '"')
            .replace(/\\/g, '');


        return result;
    }


    static getMotivQuote = async (gptKey:string | undefined) => {
        // const prompt = "Give me a different humorous motivational quote";
        const prompt = "compliment my [insert a bad trait of a person] in an ironic way. only write your answer";
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
            const data = await response.json();
            return data.choices[0].message.content;
        } else {
            console.error("GPT error: could not get motivational quote");
            return "";
        }
    }
}