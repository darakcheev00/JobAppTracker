const token = "ya29.a0AfB_byDgFDbCQMt97Se9DYQn0UxEKO3vJj4mldv4s9RbxX8euB6sQMIPYFc1DpUIbOp2NfdvMrEifR_cQVwNeic-AjBQSjJ9vCJoutOQ5-L1MkzzuUD-OS0HplkpayNlFu8FDqPfcc_C000xRidF0Yt3jLzA3gw21nIaCgYKATwSARISFQHGX2MimmoEfiyzYL-f8NKmcR4rBg0171";


async function temp() {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,{
            method: 'GET'
        });
        const data = await response.json();
        console.log(data);

        if (data.error) throw new Error('Google auth token invalid');

    } catch (error) {
        console.error("Error occured during google auth token validation:", error);
        res.status(500).json(error);
    }
}

temp()