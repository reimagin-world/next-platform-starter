"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.structuredLogger = exports.logger = void 0;
// Mock logger
exports.logger = {
    info: (msg, meta) => console.log('INFO:', msg, meta),
    error: (msg, meta) => console.error('ERROR:', msg, meta),
    warn: (msg, meta) => console.warn('WARN:', msg, meta),
    debug: (msg, meta) => console.debug('DEBUG:', msg, meta),
};
exports.structuredLogger = {
    logUserJourney: (data) => console.log('JOURNEY:', data),
    info: (service, action, meta) => console.log(`INFO [${service}]: ${action}`, meta),
    error: (service, action, meta) => console.error(`ERROR [${service}]: ${action}`, meta),
    warn: (service, action, meta) => console.warn(`WARN [${service}]: ${action}`, meta),
    debug: (service, action, meta) => console.debug(`DEBUG [${service}]: ${action}`, meta),
};
