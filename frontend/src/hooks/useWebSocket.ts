import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useWebSocket = (destination: string | null, onMessage: (message: any) => void) => {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  // Store the latest onMessage in a ref so the effect doesn't re-run
  // every time the caller passes a new inline function.
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!destination) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, WebSocket will not connect.');
      return;
    }

    // Connect to STOMP Broker over SockJS
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.info(`Connected to WebSocket, subscribing to: ${destination}`);
        setConnected(true);
        
        client.subscribe(destination, (message) => {
          if (message.body) {
            try {
              const data = JSON.parse(message.body);
              onMessageRef.current(data);
            } catch (err) {
              console.error('Error parsing WebSocket message body:', err);
            }
          }
        });
      },
      onDisconnect: () => {
        console.info('Disconnected from WebSocket');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        console.info(`Deactivating WebSocket subscription for: ${destination}`);
        clientRef.current.deactivate();
        clientRef.current = null;
        setConnected(false);
      }
    };
  }, [destination]); // removed onMessage — use ref instead

  return { connected };
};

