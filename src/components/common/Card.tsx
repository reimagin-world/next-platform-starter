import React from 'react';
import { cn } from '../../utils/helpers';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn("rounded-lg bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
};

export default Card;
