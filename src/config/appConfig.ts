const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
    retries: 3,
  },
  app: {
    name: 'Career Risk Calculator',
    version: '1.0.0',
    defaultUserIdPrefix: 'user-',
  },
  features: {
    enableOfflineMode: true,
    enablePWA: true,
    enableAnalytics: false,
  },
  validation: {
    minTechnologies: 1,
    maxTechnologies: 10,
    maxExperienceYears: 50,
  },
  riskScore: {
    thresholds: {
      veryLow: 15,
      low: 30,
      moderate: 45,
      high: 60,
      veryHigh: 75,
      critical: 100,
    },
    colors: {
      veryLow: '#10B981',
      low: '#34D399',
      moderate: '#F59E0B',
      high: '#F97316',
      veryHigh: '#EF4444',
      critical: '#DC2626',
    },
    labels: {
      veryLow: 'Very Low Risk',
      low: 'Low Risk',
      moderate: 'Moderate Risk',
      high: 'High Risk',
      veryHigh: 'Very High Risk',
      critical: 'Critical Risk',
    },
  },
} as const;

export default config;