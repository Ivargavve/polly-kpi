import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

const StatsContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
`;

const StatsHeader = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.75rem;
  flex-shrink: 0;
`;

const StatsTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  color: white;
  font-weight: 600;
`;

const StatsSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const StatsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  overflow-y: auto;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled(motion.div)`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const StatSubtext = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
`;

const ConnectionInfo = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const ConnectionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ConnectionLabel = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const ConnectionValue = styled.span`
  font-size: 0.8rem;
  color: white;
  font-weight: 500;
`;

const ConnectionDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isConnected'
})`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.isConnected ? '#4ade80' : '#f87171'};
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
        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02 }}
        >
          <StatIcon>💬</StatIcon>
          <StatValue
            variants={numberVariants}
            key={stats.total_conversations}
          >
            {stats.total_conversations || 0}
          </StatValue>
          <StatLabel>Total Conversations</StatLabel>
          <StatSubtext>Since monitoring started</StatSubtext>
        </StatCard>

        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02 }}
        >
          <StatIcon>⚡</StatIcon>
          <StatValue
            variants={numberVariants}
            key={stats.messages_per_minute}
          >
            {stats.messages_per_minute || 0}
          </StatValue>
          <StatLabel>Messages/Minute</StatLabel>
          <StatSubtext>Current activity rate</StatSubtext>
        </StatCard>

        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02 }}
        >
          <StatIcon>⏱️</StatIcon>
          <StatValue
            variants={numberVariants}
            key={stats.average_response_time}
          >
            {stats.average_response_time || 0}
            <span style={{ fontSize: '1rem', opacity: 0.7 }}>ms</span>
          </StatValue>
          <StatLabel>Avg Response Time</StatLabel>
          <StatSubtext>Recent conversations</StatSubtext>
        </StatCard>

        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02 }}
        >
          <StatIcon>🔄</StatIcon>
          <StatValue
            variants={numberVariants}
            key={stats.active_websockets}
            style={{ fontSize: '1.5rem' }}
          >
            {stats.active_websockets || 0}
          </StatValue>
          <StatLabel>Active Connections</StatLabel>
          <StatSubtext>WebSocket clients</StatSubtext>
        </StatCard>
      </StatsGrid>

      <ConnectionInfo>
        <ConnectionRow>
          <ConnectionLabel style={{ display: 'flex', alignItems: 'center' }}>
            <ConnectionDot isConnected={isConnected} />
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