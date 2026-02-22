import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export let wss: WebSocketServer;

export function setupWebSockets(server: Server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected to WebSockets');

        ws.on('error', console.error);

        ws.on('close', () => {
            console.log('Client disconnected from WebSockets');
        });
    });
}

export function broadcastWeatherUpdate(data: any) {
    if (!wss) return;
    const payload = JSON.stringify({ type: 'weather_update', data });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

export function broadcastThermostatUpdate(data: any) {
    if (!wss) return;
    const payload = JSON.stringify({ type: 'thermostat_update', data });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
