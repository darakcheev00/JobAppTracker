import { decode } from './base64';

/**
 * Decodes a url safe Base64 string to its original representation.
 * @param  {string} string
 * @return {string}
 */
function urlB64Decode(str: string) {
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
function indexHeaders(headers: any) {
	if (!headers) {
		return {};
	} else {
		return headers.reduce(function (result: any, header: any) {
			result[header.name.toLowerCase()] = header.value;
			return result;
		}, {});
	}
}

function extractContent(s: string, space: boolean) {
	var span = document.createElement('span');
	span.innerHTML = s;

	if (space) {
		var children = span.querySelectorAll('*');
		for (var i = 0; i < children.length; i++) {
			if (children[i].textContent 
				&& children[i].textContent?.indexOf('@import') === -1
				&& children[i].textContent?.indexOf('@media') === -1) {
				children[i].textContent += ' ';
			}else{
				children[i].textContent = '';
			}
		}
	}

	return [span.textContent || span.innerText].toString().replace(/ +/g, ' ').replace(/^\s*[\r\n]/gm, '');
};

const invalid_senders = ['linkedin.com', '@remotemore.com', '@eg.vrbo.com', '@send.grammarly.com', '@mailtrack.io',
	'@weworkremotely.com', 'getpocket_com,', 'spotangels', 'silkandsnow.com', '@github.com',
	'order.eventbrite.com', 'invitetoapply@indeed.com', '@vailresortsmail.com', '@bowldigest.com'];

/**
 * Takes a response from the Gmail API's GET message method and extracts all
 * the relevant data.
 * @param  {object} response
 * @return {object}
 */
export const parseMessage = (response: any) => {
	var result = {
		id: response.id,
		snippet: response.snippet,
		sender: "Error: Invalid Sender",
		subject: "",
		internalDate: 0,
		textHtml: "",
		textPlain: "",
		body: "",
		full_text: ""
	};

	// TODO: combine text into one string

	if (response.internalDate) {
		result.internalDate = parseInt(response.internalDate);
	}

	var payload = response.payload;
	if (!payload) {
		return result;
	}

	var headers = indexHeaders(payload.headers);

	if (headers.from) {
		result.sender = headers.from;
		// return invalid reduced_message if sender is invalid
		for (const invalid of invalid_senders) {
			if (result.sender.indexOf(invalid) !== -1) {
				result.sender = "Error: Invalid Sender";
				return result;
			}
		}
	}

	if (headers.subject) {
		result.subject = headers.subject;
	}


	var parts = [payload];
	var firstPartProcessed = false;

	while (parts.length !== 0) {
		var part = parts.shift();
		if (part.parts) {
			parts = parts.concat(part.parts);
		}
		if (firstPartProcessed) {
			headers = indexHeaders(part.headers);
		}

		if (!part.body) {
			continue;
		}

		var isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
		var isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
		var isAttachment = Boolean(part.body.attachmentId || (headers['content-disposition'] && headers['content-disposition'].toLowerCase().indexOf('attachment') !== -1));

		if (isHtml && !isAttachment) {
			result.textHtml = urlB64Decode(part.body.data);
		} else if (isPlain && !isAttachment) {
			result.textPlain = urlB64Decode(part.body.data);
		}
		firstPartProcessed = true;
	}

	if (payload.body.size > 0) {
		result.body = urlB64Decode(payload.body.data);
	}

	if (result.textPlain === ""){
		const converted_html_to_plain = extractContent(result.textHtml, true);
		result.full_text = converted_html_to_plain;
		// console.log(result.id, converted_html_to_plain);
	}else{
		result.full_text = result.textPlain;
	}

	result.full_text = result.full_text.replace(/\d/g, '*').replace('\n', '');

	return result;
};
