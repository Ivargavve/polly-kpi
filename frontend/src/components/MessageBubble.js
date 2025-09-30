import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const ConversationContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MessagePair = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const UserMessage = styled(motion.div)`
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 20px 20px 20px 5px;
  max-width: 70%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 1.1rem;
  line-height: 1.4;
  backdrop-filter: blur(5px);
`;

const AIMessage = styled(motion.div)`
  align-self: flex-end;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 20px 20px 5px 20px;
  max-width: 70%;
  font-size: 1.1rem;
  line-height: 1.4;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
  position: relative;

  &::before {
    content: '🤖';
    position: absolute;
    top: -10px;
    right: -10px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
  }
`;

const MessageTimestamp = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 0.5rem 0;
`;

const MetadataContainer = styled(motion.div)`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MetadataRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MetadataLabel = styled.span`
  opacity: 0.7;
`;

const MetadataValue = styled.span`
  font-weight: 500;
`;

const StatusBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'status'
})`
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${props => props.status === 'success' ? '#4ade80' : '#f87171'};
  color: white;
`;

function MessageBubble({ conversation, isNew }) {
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatTokens = (tokens) => {
    if (typeof tokens === 'object' && tokens !== null) {
      const total = (tokens.prompt_tokens || 0) + (tokens.completion_tokens || 0);
      return total > 0 ? total.toString() : 'N/A';
    }
    return 'N/A';
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.15
      }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <ConversationContainer
      variants={containerVariants}
      initial={isNew ? "hidden" : "visible"}
      animate="visible"
      layout
    >
      <MessageTimestamp>
        {formatTimestamp(conversation.timestamp)}
      </MessageTimestamp>

      <MessagePair>
        <UserMessage
          variants={messageVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {conversation.user_message}
        </UserMessage>

        <AIMessage
          variants={messageVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {conversation.ai_response}
        </AIMessage>
      </MessagePair>

      {conversation.metadata && (
        <MetadataContainer
          variants={messageVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <MetadataRow>
            <MetadataLabel>Prompt:</MetadataLabel>
            <MetadataValue>{conversation.metadata.prompt_name}</MetadataValue>
          </MetadataRow>
          <MetadataRow>
            <MetadataLabel>Model:</MetadataLabel>
            <MetadataValue>{conversation.metadata.model}</MetadataValue>
          </MetadataRow>
          <MetadataRow>
            <MetadataLabel>Tokens:</MetadataLabel>
            <MetadataValue>{formatTokens(conversation.metadata.tokens_used)}</MetadataValue>
          </MetadataRow>
          <MetadataRow>
            <MetadataLabel>Response Time:</MetadataLabel>
            <MetadataValue>{conversation.metadata.latency_ms}ms</MetadataValue>
          </MetadataRow>
          <MetadataRow>
            <MetadataLabel>Status:</MetadataLabel>
            <StatusBadge status={conversation.metadata.status}>
              {conversation.metadata.status}
            </StatusBadge>
          </MetadataRow>
        </MetadataContainer>
      )}
    </ConversationContainer>
  );
}

export default MessageBubble;