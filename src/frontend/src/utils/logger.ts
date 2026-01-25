export const structuredLogger = {
  logUserJourney: (data: any) => console.log('JOURNEY:', data),
  error: (service: string, action: string, meta?: any) => console.error(`ERROR [${service}]: ${action}`, meta),
};
