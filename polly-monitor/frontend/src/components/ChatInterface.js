import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { formatDistanceToNow } from 'date-fns';

const ChatContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
`;

const ChatTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  color: white;
  font-weight: 600;
`;

const ChatSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const EmptyState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
`;

const EmptyIcon = styled(motion.div)`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  font-size: 1.1rem;
  margin: 0;
`;

const EmptySubtext = styled.p`
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.7;
`;

function ChatInterface({ conversations, isPollyTyping }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isPollyTyping]);

  const getLastActivityText = () => {
    if (!conversations.length) return "No activity yet";

    const lastConversation = conversations[conversations.length - 1];
    try {
      const lastTime = new Date(lastConversation.timestamp);
      return `Last activity ${formatDistanceToNow(lastTime, { addSuffix: true })}`;
    } catch (error) {
      return "Recent activity";
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>Live Conversation Feed</ChatTitle>
        <ChatSubtitle>{getLastActivityText()}</ChatSubtitle>
      </ChatHeader>

      <MessagesContainer>
        <AnimatePresence>
          {conversations.length === 0 ? (
            <EmptyState
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyIcon
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                💬
              </EmptyIcon>
              <EmptyText>Waiting for Polly to start conversations...</EmptyText>
              <EmptySubtext>
                Real-time chat interactions will appear here
              </EmptySubtext>
            </EmptyState>
          ) : (
            conversations.map((conversation, index) => (
              <MessageBubble
                key={`${conversation.id || 'conv'}_${index}_${conversation.timestamp}`}
                conversation={conversation}
                isNew={index === conversations.length - 1}
              />
            ))
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPollyTyping && <TypingIndicator />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </MessagesContainer>
    </ChatContainer>
  );
}

export default ChatInterface;