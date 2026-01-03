// src/backend/src/services/pdf/PDFWorkerService.ts
import { Worker } from 'worker_threads';
import path from 'path';
import { logger, structuredLogger } from '../../utils/logger';
import { EventEmitter } from 'events';

interface WorkerTask {
  userId: string;
  sessionId: string;
  resumeData: any;
  assessmentData: any;
  config: any;
  resolve: (value: Buffer) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

export class PDFWorkerService extends EventEmitter {
  private workerPool: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private isShuttingDown = false;
  private readonly MAX_WORKERS: number;
  private readonly TASK_TIMEOUT_MS = 300000; // 5 minutes
  private readonly WORKER_RESTART_DELAY = 1000;

  constructor(maxWorkers = 2) {
    super();
    this.MAX_WORKERS = Math.min(maxWorkers, require('os').cpus().length - 1 || 1);
    this.initializeWorkerPool();
  }

  private initializeWorkerPool(): void {
    for (let i = 0; i < this.MAX_WORKERS; i++) {
      this.createWorker();
    }

    structuredLogger.info('PDFWorkerService', 'Worker pool initialized', {
      workerCount: this.MAX_WORKERS
    });
  }

  private createWorker(): void {
    const worker = new Worker(path.join(__dirname, 'PDFWorker.ts'), {
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
      structuredLogger.debug('PDFWorkerService', 'Worker came online', {
        workerId: worker.threadId
      });
    });

    this.workerPool.push(worker);
  }

  private handleWorkerMessage(worker: Worker, result: any): void {
    const taskId = `${worker.threadId}-${Date.now()}`;
    // This part is tricky because the worker message doesn't contain the task ID generated here.
    // However, the worker is processing one task at a time.
    // But `taskId` generated here is new, so it won't match `activeTasks` key.
    // The previous implementation of `executeTask` sets the key in `activeTasks`.
    // We need to retrieve the task associated with this worker.

    // In `executeTask`, the key is `${worker.threadId}-${timestamp}`.
    // But inside `handleWorkerMessage`, we don't know the timestamp.
    // We need to find the task for this worker.

    let foundTaskId: string | undefined;
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
      structuredLogger.warn('PDFWorkerService', 'Received message for unknown task', {
        workerId: worker.threadId
      });
      return;
    }

    clearTimeout(task.timeout);
    this.activeTasks.delete(foundTaskId);

    if (result.success) {
      structuredLogger.logUserJourney({
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
    } else {
      structuredLogger.error('PDFWorkerService', 'Worker task failed', {
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

  private handleWorkerError(worker: Worker, error: Error): void {
    structuredLogger.error('PDFWorkerService', 'Worker error', {
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

  private handleWorkerExit(worker: Worker, code: number): void {
    structuredLogger.info('PDFWorkerService', 'Worker exited', {
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
      structuredLogger.info('PDFWorkerService', 'Restarting worker', {
        workerId: worker.threadId
      });
      setTimeout(() => this.createWorker(), this.WORKER_RESTART_DELAY);
    }
  }

  private restartWorker(worker: Worker): void {
    const index = this.workerPool.indexOf(worker);
    if (index > -1) {
      this.workerPool.splice(index, 1);
    }
    worker.terminate().catch(() => {});
    this.createWorker();
  }

  private processQueue(): void {
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

  private findAvailableWorker(): Worker | null {
    const activeWorkerIds = new Set(
      Array.from(this.activeTasks.keys()).map(id => parseInt(id.split('-')[0]))
    );

    for (const worker of this.workerPool) {
      if (!activeWorkerIds.has(worker.threadId)) {
        return worker;
      }
    }

    return null;
  }

  private executeTask(worker: Worker, task: WorkerTask): void {
    const taskId = `${worker.threadId}-${Date.now()}`;

    task.timeout = setTimeout(() => {
      structuredLogger.error('PDFWorkerService', 'Task timeout', {
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

    structuredLogger.logUserJourney({
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

  public async generatePDF(
    userId: string,
    sessionId: string,
    resumeData: any,
    assessmentData: any,
    config: any
  ): Promise<Buffer> {
    if (this.isShuttingDown) {
      throw new Error('PDF Worker Service is shutting down');
    }

    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        userId,
        sessionId,
        resumeData,
        assessmentData,
        config,
        resolve,
        reject,
        timeout: setTimeout(() => {}) // Placeholder
      };

      this.taskQueue.push(task);
      structuredLogger.logUserJourney({
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

  public async getQueueStatus(): Promise<{
    queueSize: number;
    activeTasks: number;
    workerCount: number;
    isShuttingDown: boolean;
  }> {
    return {
      queueSize: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      workerCount: this.workerPool.length,
      isShuttingDown: this.isShuttingDown
    };
  }

  public async shutdown(): Promise<void> {
    structuredLogger.info('PDFWorkerService', 'Initiating shutdown');
    this.isShuttingDown = true;

    // Reject all queued tasks
    for (const task of this.taskQueue) {
      clearTimeout(task.timeout);
      task.reject(new Error('PDF Worker Service is shutting down'));
    }
    this.taskQueue = [];

    // Wait for active tasks to complete with timeout
    const activeTaskPromises = Array.from(this.activeTasks.values()).map(task =>
      Promise.race([
        new Promise(resolve => task.resolve(resolve)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Shutdown timeout')), 10000)
        )
      ]).catch(() => {})
    );

    await Promise.allSettled(activeTaskPromises);

    // Terminate all workers
    const terminationPromises = this.workerPool.map(worker =>
      worker.terminate().catch(() => {})
    );

    await Promise.allSettled(terminationPromises);
    this.workerPool = [];
    this.activeTasks.clear();

    structuredLogger.info('PDFWorkerService', 'Shutdown complete');
  }
}

// Singleton instance
let workerService: PDFWorkerService | null = null;

export function getPDFWorkerService(): PDFWorkerService {
  if (!workerService) {
    const maxWorkers = parseInt(process.env.PDF_WORKER_POOL_SIZE || '2');
    workerService = new PDFWorkerService(maxWorkers);
  }
  return workerService;
}

export async function shutdownPDFWorkerService(): Promise<void> {
  if (workerService) {
    await workerService.shutdown();
    workerService = null;
  }
}
