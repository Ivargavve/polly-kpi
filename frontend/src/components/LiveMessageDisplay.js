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
  overflow: visible;
  position: relative;
`;

const WaitingState = styled(motion.div)`
  text-align: center;
  opacity: 0.7;
`;

const WaitingText = styled.h2`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.2rem;
`;

const AnimatedDot = styled.span`
  opacity: 0.3;
  animation: ${keyframes`
    0%, 60%, 100% { opacity: 0.3; }
    30% { opacity: 1; }
  `} 1.4s infinite ease-in-out;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

const WaitingSubtext = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
`;

const MessagesContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  min-height: 600px;
  height: auto;
  overflow: visible;
  padding: 4rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto 0;
`;

const MessageCard = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['messageIndex', 'totalMessages'].includes(prop)
})`
  background: rgba(255, 255, 255, ${props => props.messageIndex === 0 ? 0.12 : Math.max(0.02, 0.12 * (1 - props.messageIndex * 0.18))});
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, ${props => props.messageIndex === 0 ? 0.25 : Math.max(0.05, 0.25 * (1 - props.messageIndex * 0.15))});
  padding: ${props => Math.max(0.5, 1.2 - props.messageIndex * 0.15)}rem;
  width: 100%;
  max-width: ${props => Math.max(300, 480 - props.messageIndex * 35)}px;
  min-height: 400px;
  height: 400px;
  box-shadow: 0 ${props => Math.max(2, 6 - props.messageIndex)}px ${props => Math.max(8, 24 - props.messageIndex * 3)}px rgba(0, 0, 0, ${props => props.messageIndex === 0 ? 0.2 : Math.max(0.05, 0.2 * (1 - props.messageIndex * 0.25))});
  opacity: ${props => props.messageIndex === 0 ? 1 : Math.max(0.1, 1 - props.messageIndex * 0.225)};
  position: absolute;
  top: ${props => {
    const messageHeight = 400; // Fixed height of each message
    const containerHeight = 600; // min-height of container

    // Always center the first message in the container
    const firstMessageCenter = (containerHeight - messageHeight) / 2; // 100px from top

    if (props.messageIndex === 0) {
      return firstMessageCenter;
    }

    // For subsequent messages, add gaps from the first message position
    let offset = firstMessageCenter;
    for (let i = 0; i < props.messageIndex; i++) {
      const gap = Math.max(15, 30 - (i * 5));
      offset += gap;
    }

    return offset;
  }}px;
  left: 50%;
  z-index: ${props => 1000 - props.messageIndex};
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MessageTimestamp = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
`;

const MessageMetadata = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
`;

const MetadataItem = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MessageRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const MessageLabel = styled.div`
  font-size: 0.8rem;
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
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  line-height: 1.4;
  font-size: 0.85rem;
  border-left: 3px solid ${props => props.isUser ? '#4ade80' : '#60a5fa'};
  max-height: 120px;
  overflow-y: auto;
`;

const ExpirationIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  position: absolute;
  bottom: 0.75rem;
  left: 1rem;
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
      y: -150,
      scale: 1,
      x: "-50%"
    },
    visible: (index) => ({
      opacity: index === 0 ? 1 : Math.max(0.1, 1 - index * 0.225),
      y: 0,
      scale: Math.max(0.75, 1 - index * 0.06),
      x: "-50%",
      transition: {
        type: "tween",
        duration: 0.4,
        ease: "easeOut",
        delay: 0
      }
    }),
    exit: {
      opacity: 0,
      y: 200,
      scale: 0.6,
      x: "-50%",
      transition: {
        duration: 0.5,
        ease: "easeInOut"
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
          <WaitingText>
            Polly is waiting
            <AnimatedDot>.</AnimatedDot>
            <AnimatedDot>.</AnimatedDot>
            <AnimatedDot>.</AnimatedDot>
          </WaitingText>
        </WaitingState>
      </Container>
    );
  }

  // Sort messages by expiration time (latest expiring first) and limit to 5
  const displayMessages = [...liveMessages]
    .sort((a, b) => {
      const aExpires = a.expires_at ? new Date(a.expires_at).getTime() : Date.now() + 86400000; // Default to 24h if no expiry
      const bExpires = b.expires_at ? new Date(b.expires_at).getTime() : Date.now() + 86400000;
      return bExpires - aExpires; // Latest expiring first
    })
    .slice(0, 5);

  return (
    <Container>
      <MessagesContainer>
        <AnimatePresence>
          {displayMessages.map((message, index) => {
            const timeRemaining = calculateTimeRemaining(message.expires_at);
            const isExpiring = timeRemaining !== null && timeRemaining < 300;

            return (
              <MessageCard
                key={message.id}
                messageIndex={index}
                totalMessages={displayMessages.length}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                        ✉️ Customer
                      </MessageLabel>
                      <MessageText isUser={true}>
                        {message.user_message}
                      </MessageText>
                    </MessageRow>
                  )}

                  {message.polly_response && (
                    <MessageRow>
                      <MessageLabel>
                        <img src="/polly.png" alt="Polly" style={{width: '1em', height: '1em'}} /> Polly
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
                      ? `Disappears in ${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s`
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