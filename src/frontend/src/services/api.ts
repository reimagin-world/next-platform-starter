export const apiClient = {
  get: async (url: string) => {
    console.log(`GET ${url}`);
    return { data: { riskScore: 75, generatedAt: new Date().toISOString() } };
  },
  post: async (url: string, data: any, config?: any) => {
    console.log(`POST ${url}`, data);
    return {
      data: new ArrayBuffer(100), // Mock PDF buffer
      headers: {
        'x-report-id': 'mock-report-id',
        'x-generated-at': new Date().toISOString(),
        'x-enhanced-report': 'true'
      }
    };
  }
};
