
const TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

// `decode` is designed to be fully compatible with `atob` as described in the
// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
// The optimized base64-decoding algorithm used is based on @atk’s excellent
// implementation. https://gist.github.com/atk/1020396

export const decode = (input:string) => {
    input = String(input)
        .replace(REGEX_SPACE_CHARACTERS, '');
    var length = input.length;
    if (length % 4 == 0) {
        input = input.replace(/==?$/, '');
        length = input.length;
    }
    if (
        length % 4 == 1 ||
        // http://whatwg.org/C#alphanumeric-ascii-characters
        /[^+a-zA-Z0-9/]/.test(input)
    ) {
        console.error(
            'Invalid character: the string to be decoded is not correctly encoded.'
        );
    }
    var bitCounter = 0;
    var bitStorage = 0;
    var buffer;
    var output = '';
    var position = -1;
    while (++position < length) {
        buffer = TABLE.indexOf(input.charAt(position));
        bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
        // Unless this is the first of a group of 4 characters…
        if (bitCounter++ % 4) {
            // …convert the first 8 bits to a single ASCII character.
            output += String.fromCharCode(
                0xFF & bitStorage >> (-2 * bitCounter & 6)
            );
        }
    }
    return output;
};

// `encode` is designed to be fully compatible with `btoa` as described in the
// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
export const encode = (input: string) => {
    input = String(input);
    if (/[^\0-\xFF]/.test(input)) {
        // Note: no need to special-case astral symbols here, as surrogates are
        // matched, and the input is supposed to only contain ASCII anyway.
        console.error(
            'The string to be encoded contains characters outside of the ' +
            'Latin1 range.'
        );
    }
    var padding = input.length % 3;
    var output = '';
    var position = -1;
    var a;
    var b;
    var c;
    var buffer;
    // Make sure any padding is handled outside of the loop.
    var length = input.length - padding;

    while (++position < length) {
        // Read three bytes, i.e. 24 bits.
        a = input.charCodeAt(position) << 16;
        b = input.charCodeAt(++position) << 8;
        c = input.charCodeAt(++position);
        buffer = a + b + c;
        // Turn the 24 bits into four chunks of 6 bits each, and append the
        // matching character for each of them to the output.
        output += (
            TABLE.charAt(buffer >> 18 & 0x3F) +
            TABLE.charAt(buffer >> 12 & 0x3F) +
            TABLE.charAt(buffer >> 6 & 0x3F) +
            TABLE.charAt(buffer & 0x3F)
        );
    }

    if (padding == 2) {
        a = input.charCodeAt(position) << 8;
        b = input.charCodeAt(++position);
        buffer = a + b;
        output += (
            TABLE.charAt(buffer >> 10) +
            TABLE.charAt((buffer >> 4) & 0x3F) +
            TABLE.charAt((buffer << 2) & 0x3F) +
            '='
        );
    } else if (padding == 1) {
        buffer = input.charCodeAt(position);
        output += (
            TABLE.charAt(buffer >> 2) +
            TABLE.charAt((buffer << 4) & 0x3F) +
            '=='
        );
    }

    return output;
};