import handleResponse from "./response_handler";
import { apiKey, baseUrl } from "./api_constants";





var max_links, distance_threshold;
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
        return await handleResponse(response, "failed to create domain");
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

    async renameDomain(d_old, d_new) {
        const response = await fetch(
            `${baseUrl}/collections/rename`,
            {
                method: 'POST',
                headers: Headers,
                body: JSON.stringify({ d_old, d_new }),
            }
        );

        return await handleResponse(response, "Failed to rename domain");
    },

    /**
 * Insert a new node into a collection
 * @param {string} collection - Name of the collection
 * @param {string} name - Node name
 * @param {string} content - Node content
 * @param {string[]} user_links - Array of user-provided links
 * @param {number} max_links - Maximum number of similar links to retrieve
 * @param {number} distance_threshold - Threshold for similarity
 * @returns {Promise<any>} - Response from the server
 */
    async insertNode(collection, name, content, user_links,max_links,distance_threshold) {
        // console.log(` Here ${JSON.stringify(
        //     {
        //         collection,
        //         name,
        //         content,
        //         user_links,
        //         max_links,
        //         distance_threshold
        //     }
        // )}`)
      
        const response = await fetch(
            `${baseUrl}/nodes/insert`, {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify(
                {
                    collection,
                    name,
                    content,
                    user_links,
                    max_links,
                    distance_threshold
                }
            )
        }
        );

        return await handleResponse(response, "Failed to create node")
    },

    /**
* Update a node in the collection
* @param {string} collection - Name of the collection
* @param {string} node_id - Id of the node to be updated
* @param {string} name - Node name
* @param {string} content - Node content
* @param {string[]} user_links - Array of user-provided links
* @param {number} max_links - Maximum number of similar links to retrieve
* @param {number} distance_threshold - Threshold for similarity
* @returns {Promise<any>} - Response from the server
*/
    async updateNode(collection, node_id, name, content, user_links, max_links,distance_threshold) {
        // console.log(` Here ${JSON.stringify(
        //     {
        //         collection,
        //         node_id,
        //         name,
        //         content,
        //         user_links,
        //         max_links,
        //         distance_threshold
        //     }
        // )}`)
        
        const response = await fetch(
            `${baseUrl}/nodes/update`, {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify(
                {
                    collection,
                    node_id,
                    name,
                    content,
                    user_links,
                    max_links,
                    distance_threshold
                }
            )
        }
        );

        return await handleResponse(response, "Failed to update node")
    },


    async refactorNode(collection, max_links, distance_threshold) {
        // console.log(` Here ${JSON.stringify(
        //     {
        //         collection,
        //         name,
        //         content,
        //         user_links,
        //         max_links,
        //         distance_threshold
        //     }
        // )}`)
        const response = await fetch(
            `${baseUrl}/nodes/refactor`, {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify(
                {
                    collection,
                    max_links,
                    distance_threshold
                }
            )
        }
        );
        return await handleResponse(response, "Failed to create node")
    },



    /**
     * 
     * @param {String} name - Name of the collection
     * @returns {Promise<any>} - A lsit of nodes (each node in class Node {
    constructor(json) {
        this.node_id = json.node_id;
        this.name = json.name;
        this.content = json.content;
        this.user_links = json.user_links || [];
        this.s_links = json.s_links || [];
    }
}
    Format )
     */

    async listNode(name) {
        const response = await fetch(
            `${baseUrl}/nodes/list`, {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({ name }),
        }
        );
        const data = await handleResponse(response, "Failed to list nodes");
        return data.map(item => new Node(item));
    },


    async deleteNode(collection, node_id) {
        const response = await fetch(
            `${baseUrl}/nodes/delete`, {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                collection,
                node_id
            }),
        }
        );
        return await handleResponse(response, "Failed to list nodes");

    },

    /**
     * Stream an agent response token-by-token
     * @param {string} collection - The collection name
     * @param {string} query - User query
     * @param {string} conversation_id - Conversation ID
     * @param {number} max_results - Max results to retrieve
     * @param {number} distance_threshold - Similarity threshold
     * @param {boolean} include_semantic_links - Include semantic links
     * @param {boolean} brainstorm_mode - Brainstorm mode flag
     * @param {(chunk: string) => void} onChunk - Callback for each chunk
     * @returns {Promise<void>}
     */
    async llm_response(
        collection,
        query,
        conversation_id,
        max_results = 5,
        distance_threshold = 1.0,
        include_semantic_links = true,
        brainstorm_mode = false,
        onChunk
    ) {
        const response = await fetch(`${baseUrl}/query/stream`, {
            method: "POST",
            headers: Headers,
            body: JSON.stringify({
                collection,
                query,
                conversation_id,
                max_results,
                distance_threshold,
                include_semantic_links,
                brainstorm_mode
            }),
        });

        // ✅ handle error responses before streaming
        if (!response.ok) {
            await handleResponse(response, "Streaming query failed");
            return; // handleResponse will throw
        }

        if (!response.body) {
            throw new Error("No response body from server");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // console.log("Received chunk:", chunk); 
            if (chunk && onChunk) onChunk(chunk);
        }   
    }
};











// -- object structure for response models --

class Collections {
    constructor(json) {
        Object.assign(this, json)
    }
}
// -- node model --
class Node {
    constructor(json) {
        this.node_id = json.node_id;
        this.name = json.name;
        this.content = json.content;
        this.user_links = json.user_links || [];
        this.s_links = json.s_links || [];
    }
}