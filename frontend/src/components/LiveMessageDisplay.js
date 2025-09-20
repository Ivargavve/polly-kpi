import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow: hidden;
`;

const WaitingState = styled(motion.div)`
  text-align: center;
  opacity: 0.7;
`;

const WaitingIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: ${keyframes`
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 1; }
  `} 2s ease-in-out infinite;
`;

const WaitingText = styled.h2`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0;
`;

const WaitingSubtext = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 700px;
  align-items: center;
  overflow-y: auto;
  max-height: 100%;
`;

const MessageCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MessageTimestamp = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const MessageMetadata = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

const MetadataItem = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MessageLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MessageText = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isUser'
})`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  line-height: 1.5;
  font-size: 0.95rem;
  border-left: 3px solid ${props => props.isUser ? '#4ade80' : '#60a5fa'};
`;

const ExpirationIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  margin-top: 1rem;
`;

const ExpirationDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isExpiring'
})`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.isExpiring ? '#f87171' : '#4ade80'};
  animation: ${props => props.isExpiring ? keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  ` : 'none'} 1s ease-in-out infinite;
`;

function LiveMessageDisplay({ liveMessages, isPollyTyping }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for expiration calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const expiration = new Date(expiresAt);
    const remaining = expiration - currentTime;
    return Math.max(0, Math.floor(remaining / 1000));
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.9,
      transition: {
        duration: 0.3
      }
    }
  };

  const waitingVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  if (liveMessages.length === 0) {
    return (
      <Container>
        <WaitingState
          variants={waitingVariants}
          initial="hidden"
          animate="visible"
        >
          <WaitingIcon>👂</WaitingIcon>
          <WaitingText>Waiting for new messages...</WaitingText>
          <WaitingSubtext>Monitoring PromptLayer for live activity</WaitingSubtext>
        </WaitingState>
      </Container>
    );
  }

  return (
    <Container>
      <MessagesContainer>
        <AnimatePresence mode="popLayout">
          {liveMessages.map((message) => {
            const timeRemaining = calculateTimeRemaining(message.expires_at);
            const isExpiring = timeRemaining !== null && timeRemaining < 30;

            return (
              <MessageCard
                key={message.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <MessageHeader>
                  <MessageTimestamp>
                    {format(new Date(message.timestamp), 'HH:mm:ss')}
                  </MessageTimestamp>
                  <MessageMetadata>
                    <MetadataItem>{message.metadata?.model || 'unknown'}</MetadataItem>
                    <MetadataItem>{message.metadata?.latency_ms || 0}ms</MetadataItem>
                  </MessageMetadata>
                </MessageHeader>

                <MessageContent>
                  {message.user_message && (
                    <MessageRow>
                      <MessageLabel>
                        👤 User Message
                      </MessageLabel>
                      <MessageText isUser={true}>
                        {message.user_message}
                      </MessageText>
                    </MessageRow>
                  )}

                  {message.polly_response && (
                    <MessageRow>
                      <MessageLabel>
                        🤖 Polly Response
                      </MessageLabel>
                      <MessageText isUser={false}>
                        {message.polly_response}
                      </MessageText>
                    </MessageRow>
                  )}
                </MessageContent>

                {timeRemaining !== null && (
                  <ExpirationIndicator>
                    <ExpirationDot isExpiring={isExpiring} />
                    {timeRemaining > 0
                      ? `Disappears in ${timeRemaining}s`
                      : 'Expiring...'
                    }
                  </ExpirationIndicator>
                )}
              </MessageCard>
            );
          })}
        </AnimatePresence>
      </MessagesContainer>
    </Container>
  );
}

export default LiveMessageDisplay;