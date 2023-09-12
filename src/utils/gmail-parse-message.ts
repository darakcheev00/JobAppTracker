import { decode } from './base64';
import GptManager from './gptmodule';

export default class MessageParser {



	/**
	 * Decodes a url safe Base64 string to its original representation.
	 * @param  {string} string
	 * @return {string}
	 */
	static urlB64Decode = (str: string) => {
		return str
			? decode(str.replace(/\-/g, '+').replace(/\_/g, '/'))
			: '';
	}

	/**
	 * Takes the header array filled with objects and transforms it into a more
	 * pleasant key-value object.
	 * @param  {array} headers
	 * @return {object}
	 */
	static indexHeaders = (headers: any) => {
		if (!headers) {
			return {};
		} else {
			return headers.reduce(function (messageObj: any, header: any) {
				messageObj[header.name.toLowerCase()] = header.value;
				return messageObj;
			}, {});
		}
	}

	static extractContent = (s: string, space: boolean) => {
		var span = document.createElement('span');
		span.innerHTML = s;

		if (space) {
			var children = span.querySelectorAll('*');
			for (var i = 0; i < children.length; i++) {
				if (children[i].textContent
					&& children[i].textContent?.indexOf('@import') === -1
					&& children[i].textContent?.indexOf('@media') === -1) {
					children[i].textContent += ' ';
				} else {
					children[i].textContent = '';
				}
			}
		}

		return [span.textContent || span.innerText].toString().replace(/ +/g, ' ').replace(/^\s*[\r\n]/gm, '');
	};

	static invalid_senders = ['linkedin.com', '@remotemore.com', '@eg.vrbo.com', '@send.grammarly.com', '@mailtrack.io',
		'@weworkremotely.com', 'getpocket_com,', 'spotangels', 'silkandsnow.com', '@github.com',
		'order.eventbrite.com', 'invitetoapply@indeed.com', '@vailresortsmail.com', '@bowldigest.com'];

	/**
	 * Takes a response from the Gmail API's GET message method and extracts all
	 * the relevant data.
	 * @param  {object} response
	 * @return {object}
	 */
	static parseMessage = async (response: any, gptKey: string | undefined) => {
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

		var headers = this.indexHeaders(payload.headers);

		if (headers.from) {
			messageObj.sender = headers.from;
			// return invalid reduced_message if sender is invalid
			for (const invalid of this.invalid_senders) {
				if (messageObj.sender.indexOf(invalid) !== -1) {
					messageObj.sender = "Error: Invalid Sender";
					return messageObj;
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
				headers = this.indexHeaders(part.headers);
			}

			if (!part.body) {
				continue;
			}

			var isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
			var isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
			var isAttachment = Boolean(part.body.attachmentId || (headers['content-disposition'] && headers['content-disposition'].toLowerCase().indexOf('attachment') !== -1));

			if (isHtml && !isAttachment) {
				messageObj.textHtml = this.urlB64Decode(part.body.data);
			} else if (isPlain && !isAttachment) {
				messageObj.textPlain = this.urlB64Decode(part.body.data);
			}
			firstPartProcessed = true;
		}

		if (payload.body.size > 0) {
			messageObj.body = this.urlB64Decode(payload.body.data);
		}

		let full_text = ""
		if (messageObj.textPlain === "") {
			const converted_html_to_plain = this.extractContent(messageObj.textHtml, true);
			full_text = converted_html_to_plain;
			// console.log(messageObj.id, converted_html_to_plain);
		} else {
			full_text = messageObj.textPlain;
		}

		full_text = full_text.replace(/\d/g, '*').replace('\n', '').replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
		console.log(`!!full text has ${full_text.indexOf('http')} links`);

		// call chat gpt
		if (messageObj.sender !== "Error: Invalid Sender") {
			let gptRes = await this.callGpt(messageObj, full_text, gptKey);
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
		}

		return result;
	};

	static callGpt = async(messageObj:any, full_text:string, gptKey:string|undefined) => {

		const gptRes = await GptManager.askGPt(messageObj.sender, messageObj.subject, full_text, gptKey);

		// console.log("Gpt result: ",gptRes);

		if (gptRes) {
			const tempLower = gptRes.toLowerCase();
			if (tempLower.indexOf("not related to job application") === -1) {
				try {
					let jsonRes = JSON.parse(gptRes);
					jsonRes.status.toLowerCase()
					return jsonRes;
				} catch (e) {
					console.error(e, gptRes);
					return {};
				}
			}
		}
	}
}