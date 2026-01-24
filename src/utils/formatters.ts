import config from '../config/appConfig';

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    // Format as Lakhs (e.g., 12.5 LPA)
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(1)} LPA`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getRiskLabel = (score: number): string => {
  const { thresholds, labels } = config.riskScore;

  if (score <= thresholds.veryLow) return labels.veryLow;
  if (score <= thresholds.low) return labels.low;
  if (score <= thresholds.moderate) return labels.moderate;
  if (score <= thresholds.high) return labels.high;
  if (score <= thresholds.veryHigh) return labels.veryHigh;
  return labels.critical;
};

export const getRiskColor = (score: number): string => {
  const { thresholds, colors } = config.riskScore;

  if (score <= thresholds.veryLow) return colors.veryLow;
  if (score <= thresholds.low) return colors.low;
  if (score <= thresholds.moderate) return colors.moderate;
  if (score <= thresholds.high) return colors.high;
  if (score <= thresholds.veryHigh) return colors.veryHigh;
  return colors.critical;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};