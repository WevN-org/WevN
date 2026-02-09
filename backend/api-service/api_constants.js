

// -- key -- 
export const apiKey = 'mysecretkey';
export const token = 'api-token'

const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:8000`;
    }
    return 'http://localhost:8000';
};

const getWsUrl = () => {
    if (typeof window !== 'undefined') {
        return `ws://${window.location.hostname}:8000/ws`;
    }
    return 'ws://localhost:8000/ws';
};

export const baseUrl = getBaseUrl();
export const wsUrl = getWsUrl();
export var max_links = 20
export var distance_threshold=1.4