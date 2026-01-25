"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFWorkerService = void 0;
exports.getPDFWorkerService = getPDFWorkerService;
exports.shutdownPDFWorkerService = shutdownPDFWorkerService;
// src/backend/src/services/pdf/PDFWorkerService.ts
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../utils/logger");
const events_1 = require("events");
class PDFWorkerService extends events_1.EventEmitter {
    constructor(maxWorkers = 2) {
        super();
        this.workerPool = [];
        this.taskQueue = [];
        this.activeTasks = new Map();
        this.isShuttingDown = false;
        this.TASK_TIMEOUT_MS = 300000; // 5 minutes
        this.WORKER_RESTART_DELAY = 1000;
        this.MAX_WORKERS = Math.min(maxWorkers, require('os').cpus().length - 1 || 1);
        this.initializeWorkerPool();
    }
    initializeWorkerPool() {
        for (let i = 0; i < this.MAX_WORKERS; i++) {
            this.createWorker();
        }
        logger_1.structuredLogger.info('PDFWorkerService', 'Worker pool initialized', {
            workerCount: this.MAX_WORKERS
        });
    }
    createWorker() {
        const worker = new worker_threads_1.Worker(path_1.default.join(__dirname, 'PDFWorker.ts'), {
            workerData: { workerId: this.workerPool.length },
            resourceLimits: {
                maxOldGenerationSizeMb: 512,
                maxYoungGenerationSizeMb: 256,
                codeRangeSizeMb: 64
            }
        });
        worker.on('message', (result) => this.handleWorkerMessage(worker, result));
        worker.on('error', (error) => this.handleWorkerError(worker, error));
        worker.on('exit', (code) => this.handleWorkerExit(worker, code));
        worker.on('online', () => {
            logger_1.structuredLogger.debug('PDFWorkerService', 'Worker came online', {
                workerId: worker.threadId
            });
        });
        this.workerPool.push(worker);
    }
    handleWorkerMessage(worker, result) {
        const taskId = `${worker.threadId}-${Date.now()}`;
        // This part is tricky because the worker message doesn't contain the task ID generated here.
        // However, the worker is processing one task at a time.
        // But `taskId` generated here is new, so it won't match `activeTasks` key.
        // The previous implementation of `executeTask` sets the key in `activeTasks`.
        // We need to retrieve the task associated with this worker.
        // In `executeTask`, the key is `${worker.threadId}-${timestamp}`.
        // But inside `handleWorkerMessage`, we don't know the timestamp.
        // We need to find the task for this worker.
        let foundTaskId;
        for (const [tid, task] of this.activeTasks.entries()) {
            if (tid.startsWith(`${worker.threadId}-`)) {
                foundTaskId = tid;
                break;
            }
        }
        const task = foundTaskId ? this.activeTasks.get(foundTaskId) : undefined;
        if (!task || !foundTaskId) {
            // It might be a message that is not a result, or we lost track.
            // But based on PDFWorker.ts, it only sends result.
            logger_1.structuredLogger.warn('PDFWorkerService', 'Received message for unknown task', {
                workerId: worker.threadId
            });
            return;
        }
        clearTimeout(task.timeout);
        this.activeTasks.delete(foundTaskId);
        if (result.success) {
            logger_1.structuredLogger.logUserJourney({
                service: 'PDFWorkerService',
                action: 'workerTaskCompleted',
                userId: task.userId,
                sessionId: task.sessionId,
                metadata: {
                    success: true,
                    workerId: worker.threadId,
                    processingTime: Date.now() - parseInt(foundTaskId.split('-')[1])
                }
            });
            task.resolve(result.pdfBuffer);
        }
        else {
            logger_1.structuredLogger.error('PDFWorkerService', 'Worker task failed', {
                userId: task.userId,
                sessionId: task.sessionId,
                workerId: worker.threadId,
                error: result.error
            });
            task.reject(new Error(`PDF generation failed: ${result.error}`));
        }
        // Process next task in queue
        this.processQueue();
    }
    handleWorkerError(worker, error) {
        logger_1.structuredLogger.error('PDFWorkerService', 'Worker error', {
            workerId: worker.threadId,
            error: error.message,
            stack: error.stack
        });
        // Find and reject any active tasks for this worker
        for (const [taskId, task] of this.activeTasks.entries()) {
            if (taskId.startsWith(worker.threadId.toString())) {
                clearTimeout(task.timeout);
                task.reject(new Error(`Worker error: ${error.message}`));
                this.activeTasks.delete(taskId);
            }
        }
        // Restart worker if not shutting down
        if (!this.isShuttingDown) {
            setTimeout(() => this.restartWorker(worker), this.WORKER_RESTART_DELAY);
        }
    }
    handleWorkerExit(worker, code) {
        logger_1.structuredLogger.info('PDFWorkerService', 'Worker exited', {
            workerId: worker.threadId,
            exitCode: code
        });
        // Remove from pool
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
            this.workerPool.splice(index, 1);
        }
        // Restart if not shutting down
        if (!this.isShuttingDown && code !== 0) {
            logger_1.structuredLogger.info('PDFWorkerService', 'Restarting worker', {
                workerId: worker.threadId
            });
            setTimeout(() => this.createWorker(), this.WORKER_RESTART_DELAY);
        }
    }
    restartWorker(worker) {
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
            this.workerPool.splice(index, 1);
        }
        worker.terminate().catch(() => { });
        this.createWorker();
    }
    processQueue() {
        if (this.taskQueue.length === 0 || this.isShuttingDown) {
            return;
        }
        const availableWorker = this.findAvailableWorker();
        if (!availableWorker) {
            return;
        }
        const task = this.taskQueue.shift();
        if (!task) {
            return;
        }
        this.executeTask(availableWorker, task);
    }
    findAvailableWorker() {
        const activeWorkerIds = new Set(Array.from(this.activeTasks.keys()).map(id => parseInt(id.split('-')[0])));
        for (const worker of this.workerPool) {
            if (!activeWorkerIds.has(worker.threadId)) {
                return worker;
            }
        }
        return null;
    }
    executeTask(worker, task) {
        const taskId = `${worker.threadId}-${Date.now()}`;
        task.timeout = setTimeout(() => {
            logger_1.structuredLogger.error('PDFWorkerService', 'Task timeout', {
                taskId,
                userId: task.userId,
                sessionId: task.sessionId,
                timeoutMs: this.TASK_TIMEOUT_MS
            });
            this.activeTasks.delete(taskId);
            task.reject(new Error('PDF generation timeout'));
            this.processQueue();
        }, this.TASK_TIMEOUT_MS);
        this.activeTasks.set(taskId, task);
        logger_1.structuredLogger.logUserJourney({
            service: 'PDFWorkerService',
            action: 'startWorkerTask',
            userId: task.userId,
            sessionId: task.sessionId,
            metadata: {
                workerId: worker.threadId,
                taskId,
                queuePosition: this.taskQueue.length
            }
        });
        worker.postMessage({
            userId: task.userId,
            sessionId: task.sessionId,
            resumeData: task.resumeData,
            assessmentData: task.assessmentData,
            config: task.config
        });
    }
    async generatePDF(userId, sessionId, resumeData, assessmentData, config) {
        if (this.isShuttingDown) {
            throw new Error('PDF Worker Service is shutting down');
        }
        return new Promise((resolve, reject) => {
            const task = {
                userId,
                sessionId,
                resumeData,
                assessmentData,
                config,
                resolve,
                reject,
                timeout: setTimeout(() => { }) // Placeholder
            };
            this.taskQueue.push(task);
            logger_1.structuredLogger.logUserJourney({
                service: 'PDFWorkerService',
                action: 'queuePDFTask',
                userId,
                sessionId,
                metadata: {
                    queueSize: this.taskQueue.length,
                    activeTasks: this.activeTasks.size
                }
            });
            this.processQueue();
        });
    }
    async getQueueStatus() {
        return {
            queueSize: this.taskQueue.length,
            activeTasks: this.activeTasks.size,
            workerCount: this.workerPool.length,
            isShuttingDown: this.isShuttingDown
        };
    }
    async shutdown() {
        logger_1.structuredLogger.info('PDFWorkerService', 'Initiating shutdown');
        this.isShuttingDown = true;
        // Reject all queued tasks
        for (const task of this.taskQueue) {
            clearTimeout(task.timeout);
            task.reject(new Error('PDF Worker Service is shutting down'));
        }
        this.taskQueue = [];
        // Wait for active tasks to complete with timeout
        const activeTaskPromises = Array.from(this.activeTasks.values()).map(task => Promise.race([
            new Promise(resolve => task.resolve(resolve)),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), 10000))
        ]).catch(() => { }));
        await Promise.allSettled(activeTaskPromises);
        // Terminate all workers
        const terminationPromises = this.workerPool.map(worker => worker.terminate().catch(() => { }));
        await Promise.allSettled(terminationPromises);
        this.workerPool = [];
        this.activeTasks.clear();
        logger_1.structuredLogger.info('PDFWorkerService', 'Shutdown complete');
    }
}
exports.PDFWorkerService = PDFWorkerService;
// Singleton instance
let workerService = null;
function getPDFWorkerService() {
    if (!workerService) {
        const maxWorkers = parseInt(process.env.PDF_WORKER_POOL_SIZE || '2');
        workerService = new PDFWorkerService(maxWorkers);
    }
    return workerService;
}
async function shutdownPDFWorkerService() {
    if (workerService) {
        await workerService.shutdown();
        workerService = null;
    }
}
