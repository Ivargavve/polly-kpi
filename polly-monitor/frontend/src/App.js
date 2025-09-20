import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import LiveMessageDisplay from './components/LiveMessageDisplay';
import StatsPanel from './components/StatsPanel';
import ConnectionStatus from './components/ConnectionStatus';
import Header from './components/Header';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 0.5rem;
  height: calc(100vh - 140px);
  overflow: hidden;
`;

const LiveMessageSection = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 100%;
`;

const StatsSection = styled.div`
  flex: 1;
  min-width: 300px;
  max-width: 350px;
  overflow: hidden;
  height: 100%;
`;

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

function App() {
  const [liveMessages, setLiveMessages] = useState([]);
  const [stats, setStats] = useState({
    total_conversations: 0,
    messages_per_minute: 0,
    average_response_time: 0,
    last_activity: null,
    active_websockets: 0
  });
  const [isPollyTyping, setIsPollyTyping] = useState(false);

  const {
    lastMessage,
    readyState
  } = useWebSocket(WS_URL, {
    onOpen: () => {
      // WebSocket connection established
    },
    onClose: () => {
      // WebSocket connection closed
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  const handleMessage = useCallback((message) => {
    try {
      const data = JSON.parse(message.data);

      switch (data.type) {
        case 'new_message':
          // Add new message with temporary display
          setLiveMessages(prev => [...prev, data]);

          // Simulate typing indicator
          setIsPollyTyping(true);
          setTimeout(() => setIsPollyTyping(false), 2000);
          break;

        case 'live_messages_update':
          // Replace all live messages with current active ones
          setLiveMessages(data.data || []);
          break;

        case 'stats_update':
          setStats(prev => ({ ...prev, ...data.data }));
          break;

        case 'typing_indicator':
          setIsPollyTyping(true);
          setTimeout(() => setIsPollyTyping(false), data.duration || 3000);
          break;

        case 'heartbeat':
          // Update connection timestamp
          setStats(prev => ({ ...prev, last_heartbeat: data.timestamp }));
          break;

        default:
          // Unknown message type - ignore silently
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  useEffect(() => {
    if (lastMessage !== null) {
      handleMessage(lastMessage);
    }
  }, [lastMessage, handleMessage]);

  // Fetch initial data when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch current live messages
        const messagesResponse = await fetch('/messages/live');
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setLiveMessages(messagesData.messages || []);
        }

        // Fetch initial stats
        const statsResponse = await fetch('/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'Disconnecting',
    [ReadyState.CLOSED]: 'Disconnected',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return (
    <AppContainer>
      <Header />
      <ConnectionStatus
        status={connectionStatus}
        isConnected={readyState === ReadyState.OPEN}
      />
      <MainContent>
        <LiveMessageSection>
          <LiveMessageDisplay
            liveMessages={liveMessages}
            isPollyTyping={isPollyTyping}
          />
        </LiveMessageSection>
        <StatsSection>
          <StatsPanel
            stats={stats}
            connectionStatus={connectionStatus}
            isConnected={readyState === ReadyState.OPEN}
          />
        </StatsSection>
      </MainContent>
    </AppContainer>
  );
}

export default App;