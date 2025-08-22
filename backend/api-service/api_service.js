import handleResponse from "./response_handler";
import { apiKey, baseUrl } from "./api_constants";






// -- Headers -- 

const Headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-API-Key': apiKey,
};


export const ApiService = {

    async getHealth() {
        const res = await fetch(
            `${baseUrl}/health`,
            {
                method: 'GET',
                headers: Headers
            }
        );
        if (!res.ok) throw new Error("Server not ready");

    },

    async getDomain() {
        const data = await handleResponse(
            await fetch(
                `${baseUrl}/collections/list`,
                {
                    method: 'GET',
                    headers: Headers
                }),
            'Failed to load collections')

        // const data = await handleResponse(response, 'Failed to load collections');
        return data.map(item => new Collections(item))

    },

    async createDomain(name) {
        const response = await fetch(
            `${baseUrl}/collections/create`,
            {
                method: 'POST',
                headers: Headers,
                body: JSON.stringify({ name }),
            }
        );
        return await handleResponse(response,"failed to create domain");
    },

    async deleteDomain(name) {
        const response = await fetch(
            `${baseUrl}/collections/delete`,
            {
                method: 'POST',
                headers: Headers,
                body: JSON.stringify({ name }),
            }
        );

        return await handleResponse(response, "Failed to delete domain");
    },



}




// -- object structure for response models --

class Collections {
    constructor(json) {
        Object.assign(this, json)
    }
}