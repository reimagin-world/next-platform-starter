import React from 'react';
import { getRiskLabel, getRiskColor } from '../../utils/formatters';

interface RiskMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  size = 'md',
  showDetails = true
}) => {
  const radius = size === 'sm' ? 60 : size === 'md' ? 80 : 100;
  const strokeWidth = size === 'sm' ? 10 : size === 'md' ? 12 : 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  };

  const textSizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const riskColor = getRiskColor(score);
  const riskLabel = getRiskLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none transition-all duration-500 ease-out"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            stroke={riskColor}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${textSizeClasses[size]}`}>
            {score.toFixed(1)}
          </span>
          <span className={`${labelSizeClasses[size]} text-gray-600`}>
            /100
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 text-center">
          <div className={`font-semibold ${labelSizeClasses[size]}`} style={{ color: riskColor }}>
            {riskLabel}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {score <= 15 && 'Excellent position with high demand skills'}
            {score > 15 && score <= 30 && 'Good position with minor skill gaps'}
            {score > 30 && score <= 45 && 'Moderate risk - consider skill development'}
            {score > 45 && score <= 60 && 'High risk - immediate action recommended'}
            {score > 60 && score <= 75 && 'Very high risk - urgent attention needed'}
            {score > 75 && 'Critical risk - immediate career intervention required'}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMeter;