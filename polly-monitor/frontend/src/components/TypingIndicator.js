import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const TypingContainer = styled(motion.div)`
  align-self: flex-end;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 20px 20px 5px 20px;
  max-width: 200px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const TypingText = styled.span`
  font-size: 1rem;
  margin-right: 0.5rem;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 0.2rem;
`;

const Dot = styled(motion.div)`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
`;

const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
};

const dotVariants = {
  animate: {
    y: [0, -10, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

function TypingIndicator() {
  return (
    <TypingContainer
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <TypingText>Polly is thinking</TypingText>
      <DotsContainer>
        <Dot
          variants={dotVariants}
          animate="animate"
          transition={{ delay: 0 }}
        />
        <Dot
          variants={dotVariants}
          animate="animate"
          transition={{ delay: 0.2 }}
        />
        <Dot
          variants={dotVariants}
          animate="animate"
          transition={{ delay: 0.4 }}
        />
      </DotsContainer>
    </TypingContainer>
  );
}

export default TypingIndicator;