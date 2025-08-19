// -- default respponse handler -- 

export default async function handleResponse(response, defaultMessage = 'API error') {
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