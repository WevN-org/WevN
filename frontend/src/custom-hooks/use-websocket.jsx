import { useEffect, useRef } from "react";
import { token, wsUrl } from "../../../backend/api-service/api_constants";
import { ApiService } from "../../../backend/api-service/api_service";
export function useWebSocket(onMessage) {
    const wsRef = useRef(null);
    const reconnectTimeout = useRef(null);

    useEffect(() => {

        const wsConnect = async () => {
            try {
                await ApiService.getHealth(); // try to check on the domain

                wsRef.current = new WebSocket(`${wsUrl}?token=${token}`);


                wsRef.current.onopen = () => {
                    console.log("✅ Connected to server");
                    if (onMessage) onMessage("reload")
                };
                wsRef.current.onmessage = (event) => {
                    const change = JSON.parse(event.data);
                    if (onMessage) onMessage(change.type);
                };


                wsRef.current.onerror = (err) => {
                    console.error("⚠️ WebSocket error:", err);
                    wsRef.current.close(); // will trigger onclose → reconnect
                };
                wsRef.current.onclose = () => {
                    console.log("❌ Disconnected, retrying in 2s...");
                    reconnectTimeout.current = setTimeout(wsConnect, 2000);
                };

            }
            catch (err) {
                console.log("Server not available, retrying in 2s...");
                setTimeout(wsConnect, 2000);
            }
        }
        wsConnect();

        return () => {
            console.log("🧹 Cleaning up WebSocket…");
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [token, wsUrl, onMessage]);
    return wsRef
}