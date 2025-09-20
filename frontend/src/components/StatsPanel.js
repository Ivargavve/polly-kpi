import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

const StatsContainer = styled.div`
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 0.75rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const StatsHeader = styled.div`
  border-bottom: 1px solid #333;
  padding-bottom: 0.5rem;
  flex-shrink: 0;
`;

const StatsTitle = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  color: #e0e0e0;
  font-weight: 500;
`;

const StatsSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.7rem;
  color: #999;
`;

const StatsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #333;

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: #bbb;
  font-weight: 400;
`;

const StatValue = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: #e0e0e0;
`;

const ConnectionInfo = styled.div`
  background: #202020;
  border-radius: 6px;
  padding: 0.5rem;
  border: 1px solid #444;
  flex-shrink: 0;
`;

const ConnectionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ConnectionLabel = styled.span`
  font-size: 0.65rem;
  color: #999;
`;

const ConnectionValue = styled.span`
  font-size: 0.65rem;
  color: #e0e0e0;
  font-weight: 400;
`;

const ConnectionDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  margin-right: 0.5rem;
`;

function StatsPanel({ stats, connectionStatus, isConnected }) {
  const formatLastActivity = () => {
    if (!stats.last_activity) return 'No activity yet';
    try {
      const lastTime = new Date(stats.last_activity);
      return formatDistanceToNow(lastTime, { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatCurrentTime = () => {
    return format(new Date(), 'HH:mm:ss');
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const numberVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <StatsContainer>
      <StatsHeader>
        <StatsTitle>Live Statistics</StatsTitle>
        <StatsSubtitle>Real-time monitoring data</StatsSubtitle>
      </StatsHeader>

      <StatsGrid>
        <StatRow>
          <StatLabel>Total Conversations</StatLabel>
          <StatValue>{stats.total_conversations || 0}</StatValue>
        </StatRow>

        <StatRow>
          <StatLabel>Messages/Minute</StatLabel>
          <StatValue>{stats.messages_per_minute || 0}</StatValue>
        </StatRow>

        <StatRow>
          <StatLabel>Avg Response Time</StatLabel>
          <StatValue>{stats.average_response_time || 0}ms</StatValue>
        </StatRow>

        <StatRow>
          <StatLabel>Active Connections</StatLabel>
          <StatValue>{stats.active_websockets || 0}</StatValue>
        </StatRow>
      </StatsGrid>

      <ConnectionInfo>
        <ConnectionRow>
          <ConnectionLabel style={{ display: 'flex', alignItems: 'center' }}>
            <ConnectionDot />
            Status
          </ConnectionLabel>
          <ConnectionValue>{connectionStatus}</ConnectionValue>
        </ConnectionRow>
        <ConnectionRow>
          <ConnectionLabel>Last Activity</ConnectionLabel>
          <ConnectionValue>{formatLastActivity()}</ConnectionValue>
        </ConnectionRow>
        <ConnectionRow>
          <ConnectionLabel>Current Time</ConnectionLabel>
          <ConnectionValue>{formatCurrentTime()}</ConnectionValue>
        </ConnectionRow>
        <ConnectionRow>
          <ConnectionLabel>Monitoring</ConnectionLabel>
          <ConnectionValue>PromptLayer API</ConnectionValue>
        </ConnectionRow>
      </ConnectionInfo>
    </StatsContainer>
  );
}

export default StatsPanel;