const baseUrl = 'http://127.0.0.1:8000';
const apiKey = 'mysecretkey';

const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-API-Key': apiKey,
};

async function handleResponse(response, defaultMessage = 'API error') {
    if (response.ok) return await response.json().catch(() => null); // JSON or null
    let errorMessage = defaultMessage;
    try {
        const errorData = await response.json();
        if (errorData.detail) errorMessage += `: ${errorData.detail}`;
    } catch (e) {
        const raw = await response.text();
        errorMessage += `: ${raw}: ${e}`;
    }
    throw new Error(errorMessage);
}

export const ApiService = {
    async getCollections() {
        const response = await fetch(`${baseUrl}/collections`, { headers });
        const data = await handleResponse(response, 'Failed to load collections');
        return data.map(item => new Collection(item));
    },

    async deleteCollection(name) {
        const response = await fetch(`${baseUrl}/collections/delete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name }),
        });
        await handleResponse(response, 'Failed to delete collection');
    },

    async listNodes(collection) {
        const response = await fetch(
            `${baseUrl}/nodes?collection=${encodeURIComponent(collection)}`,
            { headers }
        );
        const data = await handleResponse(response, 'Failed to list nodes');
        return data.map(item => new Node(item));
    },

    async addNode(collection, id, content, user_links = [], links = []) {
        const response = await fetch(`${baseUrl}/nodes/add`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                collection,
                id,
                content,
                user_links,
                links,
            }),
        });
        await handleResponse(response, 'Failed to add node');
    },

    async updateNodeLinks(collection, id, user_links = [], links = []) {
        const response = await fetch(`${baseUrl}/nodes/update-links`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                collection,
                id,
                user_links,
                links,
            }),
        });
        await handleResponse(response, 'Failed to update node links');
    },

    async deleteNode(collection, id) {
        const response = await fetch(`${baseUrl}/nodes/delete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ collection, id }),
        });
        await handleResponse(response, 'Failed to delete node');
    },

    async searchNodes(collection, query) {
        const response = await fetch(`${baseUrl}/search`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ collection, query }),
        });
        const data = await handleResponse(response, 'Search failed');
        return data.map(item => new Node(item));
    }
};

// Collection model
class Collection {
    constructor(json) {
        Object.assign(this, json);
    }
}

// Node model
class Node {
    constructor(json) {
        this.id = json.id;
        this.content = json.content;
        this.user_links = json.user_links || [];
        this.links = json.links || [];
    }
}
