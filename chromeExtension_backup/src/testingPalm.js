// https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/text-bison?project=applicationhelper


// const token = "AIzaSyAouNvAJnWVf5Wb996XKSPghP8z0cWTso0";
const token = "ya29.a0AfB_byC3vVo-XHiwfsGqR70FjKY9oqR-C-_20K-pUjC_zIbvvbbpG-nOPObp6nF8F-pMvGLaKc_o0EBeckGMFNzIubxoF0jEQCvI94JUpAuzMV5pyRaD1ge90ytXsjsenp3q6KgbO4ZMWV4-IW2_yhE0MlzIbR0SmqvjaCgYKAb4SARISFQHGX2MiUfS6W9-GyQUSku7afzcSog0171";
const project_id = "applicationhelper"
let url = `https://generativelanguage.gooogleapis.com/v1beta2/models/text-bison-001:generateMessage?key=${token}`;

const func = async()=>{
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: {
                content: "",
                examples: [],
                messages: [{
                    content: "Give me ten interview questions for the role of program manager."
                }
                ]
            },
            temperature: 0.25,
            top_k: 40,
            top_p: 0.95,
            candidate_count: 1
        })
    });

    console.log(resp.status);
}
func();



    // fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${project_id}/locations/us-central1/publishers/google/models/text-bison:predict`, {
    //     method: 'POST',
    //     headers: {
    //         Authorization: `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         "instances": [
    //             { "prompt": "Give me ten interview questions for the role of program manager." }
    //         ],
    //         "parameters": {
    //             "temperature": 0.2,
    //             "maxOutputTokens": 256,
    //             "topK": 40,
    //             "topP": 0.95
    //         }
    //     })
    // })

// curl \
// -X POST \
// -H "Authorization: Bearer $(gcloud auth print-access-token)" \
// -H "Content-Type: application/json" \
// https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/text-bison:predict -d \
// $'{
// "instances": [
//     { "prompt": "Give me ten interview questions for the role of program manager." }
// ],
//     "parameters": {
//     "temperature": 0.2,
//         "maxOutputTokens": 256,
//             "topK": 40,
//                 "topP": 0.95
// }
// }'