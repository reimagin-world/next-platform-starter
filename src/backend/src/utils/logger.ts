// Mock logger
export const logger = {
  info: (msg: string, meta?: any) => console.log('INFO:', msg, meta),
  error: (msg: string, meta?: any) => console.error('ERROR:', msg, meta),
  warn: (msg: string, meta?: any) => console.warn('WARN:', msg, meta),
  debug: (msg: string, meta?: any) => console.debug('DEBUG:', msg, meta),
};

export const structuredLogger = {
  logUserJourney: (data: any) => console.log('JOURNEY:', data),
  info: (service: string, action: string, meta?: any) => console.log(`INFO [${service}]: ${action}`, meta),
  error: (service: string, action: string, meta?: any) => console.error(`ERROR [${service}]: ${action}`, meta),
  warn: (service: string, action: string, meta?: any) => console.warn(`WARN [${service}]: ${action}`, meta),
  debug: (service: string, action: string, meta?: any) => console.debug(`DEBUG [${service}]: ${action}`, meta),
};
