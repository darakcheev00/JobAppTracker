import { decode } from './base64';
import GptManager from './gptService';


export default class EmailParser {

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
					&& children[i].textContent?.includes('@import')
					&& children[i].textContent?.includes('@media')) {
					children[i].textContent += ' ';
				} else {
					children[i].textContent = '';
				}
			}
		}

		return [span.textContent || span.innerText].toString().replace(/ +/g, ' ').replace(/^\s*[\r\n]/gm, '');
	};

	// static invalid_senders = ['linkedin.com', '@remotemore.com', '@eg.vrbo.com', '@send.grammarly.com', '@mailtrack.io',
	// 	'@weworkremotely.com', 'getpocket_com,', 'spotangels', 'silkandsnow.com', '@github.com',
	// 	'order.eventbrite.com', 'invitetoapply@indeed.com', '@vailresortsmail.com', '@bowldigest.com', '@levels.fy'];

	/**
	 * Takes a full_message from the Gmail API's GET message method and extracts all
	 * the relevant data.
	 * @param  {object} full_message
	 * @return {object}
	 */
	static parseMessage = async (full_message: any, gptKey: string, invalid_senders: Set<string>) => {
		var sender = "";
		var subject = "";
		var textHtml = "";
		var textPlain = "";

		var payload = full_message.payload;
		if (!payload) {
			return {valid: false};
		}

		var headers = this.indexHeaders(payload.headers);

		if (headers.from) {
			sender = headers.from;

			// Return if sender is in invalid sender list (since invalid senders are any string snippets we forloop over all snippets);
			if (invalid_senders.size > 0) {
				const invalidSnippetsArray = Array.from(invalid_senders);
				if (invalidSnippetsArray.some(invalidSnippet => invalidSnippet !== "" && sender.includes(invalidSnippet))) {
					// console.log(`Dropped message from ${messageObj.sender} by snippet [${invalidSnippet}]`);
					return {valid: false};
				}
			}
		} else {
			return {valid: false}
		}

		subject = headers.subject;
		if (!subject) {
			return {valid: false}
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

			var isHtml = part.mimeType && part.mimeType.includes('text/html');
			var isPlain = part.mimeType && part.mimeType.includes('text/plain');
			var isAttachment = Boolean(part.body.attachmentId || (headers['content-disposition'] && headers['content-disposition'].toLowerCase().includes('attachment')));
			
			if (!isAttachment){
				if (isHtml) {
					textHtml = this.urlB64Decode(part.body.data);
				} else if (isPlain) {
					textPlain = this.urlB64Decode(part.body.data);
				}
			}
			
			firstPartProcessed = true;
		}

		let full_text = ""
		if (textPlain === "") {
			const converted_html_to_plain = this.extractContent(textHtml, true);
			full_text = converted_html_to_plain;
			// console.log(messageObj.id, converted_html_to_plain);
		} else {
			full_text = textPlain;
		}

		// Remove links from text
		full_text = full_text.replace(/\d/g, '*').replace('\n', '').replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
		// console.log(`!!full text has ${full_text.indexOf('http')} links`);

		// call chat gpt
		try{
			var gptRes = await GptManager.callGpt(sender, subject, full_text, gptKey);
			// if (gptRes.company === "unspecified" || gptRes.position === "unspecified"){
			// 	console.log("running gpt once more");
			// 	// TODO: modify prompt to say try again
			// 	gptRes = await this.callGpt(messageObj, full_text, gptKey);
			// }
		} catch (err: any) {
			console.error(`GptManager returned: ${err}`);
			return {valid: false};
		}

		// check if sender is invalid by checking if status == unrelated
		if (gptRes.status === -1){
			return {valid: false, sender: sender}
		}
		
        if (gptRes.company.includes("unspecified")){
			return {valid: false}
		}

		const result = {
			id: full_message.id,
			valid: true,
			sender: sender,
			snippet: full_message.snippet,
			internalDate: full_message.internalDate,
			gptRes: gptRes,
		}

		return result;
	};

	
}