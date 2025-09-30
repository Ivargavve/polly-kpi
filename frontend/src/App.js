import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import LiveMessageDisplay from './components/LiveMessageDisplay';
import StatsPanel from './components/StatsPanel';
import ConnectionStatus from './components/ConnectionStatus';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  overflow: hidden;
`;

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
`;

const VideoOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
`;

const MainContent = styled.div`
  position: relative;
  flex: 1;
  height: calc(100vh - 80px);
  overflow: hidden;
`;

const LiveMessageSection = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  margin: 0 auto;
`;

const StatsSection = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 220px;
  height: 300px;
  z-index: 100;
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
  const [isTyping, setIsTyping] = useState(false);

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
          setLiveMessages(prev => [data, ...prev]);

          // Simulate typing indicator
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2000);
          break;

        case 'live_messages_update':
          // Replace all live messages with current active ones
          setLiveMessages(data.data || []);
          break;

        case 'stats_update':
          setStats(prev => ({ ...prev, ...data.data }));
          break;

        case 'typing_indicator':
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), data.duration || 3000);
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
        } else {
          console.warn('Backend not available - messages endpoint returned:', messagesResponse.status);
        }

        // Fetch initial stats
        const statsResponse = await fetch('/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.warn('Backend not available - stats endpoint returned:', statsResponse.status);
        }
      } catch (error) {
        console.warn('Backend not available:', error.message);
        // Set default stats when backend is unavailable
        setStats({
          total_conversations: 0,
          messages_per_minute: 0,
          average_response_time: 0,
          last_activity: null,
          active_websockets: 0
        });
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
      <BackgroundVideo
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/videos/tech-background2.mp4" type="video/mp4" />
        {/* Fallback gradient if video fails to load */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }} />
      </BackgroundVideo>
      <VideoOverlay />
      <ConnectionStatus
        status={connectionStatus}
        isConnected={readyState === ReadyState.OPEN}
      />
      <MainContent>
        <LiveMessageSection>
          <LiveMessageDisplay
            liveMessages={liveMessages}
            isTyping={isTyping}
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