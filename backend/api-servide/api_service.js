import handleResponse from "./response_handler";


const baseUrl = 'http://127.0.0.1:8000';
const apiKey = 'mysecretkey';


// -- Headers -- 

const Headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-API-Key': apiKey,
};


export const ApiService={
    async getDomain(){
        const response = await fetch(
            `${baseUrl}/collections/list`,
            {
                method: 'GET',
                headers: Headers
            });

        const data= await handleResponse(response,'Failed to load collections');
        return data.map(item => new Collections(item))

    }
}




// -- object structure for response models --

class Collections{
    constructor(json){
        Object.assign(this,json)
    }
}