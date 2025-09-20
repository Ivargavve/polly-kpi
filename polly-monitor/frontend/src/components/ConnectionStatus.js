import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const StatusContainer = styled(motion.div)`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatusDot = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => prop !== 'isConnected'
})`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.isConnected ? '#4ade80' : '#f87171'};
`;

const StatusText = styled.span`
  font-size: 0.8rem;
  color: white;
  font-weight: 500;
`;

function ConnectionStatus({ status, isConnected }) {
  return (
    <StatusContainer
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <StatusDot
        isConnected={isConnected}
        animate={isConnected ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        } : {}}
        transition={isConnected ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      />
      <StatusText>{status}</StatusText>
    </StatusContainer>
  );
}

export default ConnectionStatus;