import { storage } from "./storage";

export interface ApiMetricPayload {
    service: string;
    success: boolean;
    durationMs: number;
    error?: string | null;
}

export interface JobMetricPayload {
    jobName: string;
    success: boolean;
    durationMs: number;
}

class MetricsCollector {
    private apiBuffer: ApiMetricPayload[] = [];
    private jobBuffer: JobMetricPayload[] = [];
    private flushIntervalMs = 10000; // Flush every 10 seconds
    private intervalId: NodeJS.Timeout | null = null;

    constructor() {
        this.start();
    }

    start() {
        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.flush(), this.flushIntervalMs);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.flush(); // final flush
    }

    recordApiCall(metric: ApiMetricPayload) {
        this.apiBuffer.push(metric);
        if (this.apiBuffer.length >= 50) this.flush(); // preemptive flush if large
    }

    recordJobExecution(metric: JobMetricPayload) {
        this.jobBuffer.push(metric);
        if (this.jobBuffer.length >= 20) this.flush();
    }

    async flush() {
        const apiToFlush = [...this.apiBuffer];
        const jobToFlush = [...this.jobBuffer];

        this.apiBuffer = [];
        this.jobBuffer = [];

        if (apiToFlush.length > 0) {
            storage.saveApiMetrics(apiToFlush).catch(e => {
                console.error("Async metrics flush failed:", e);
            });
        }

        if (jobToFlush.length > 0) {
            storage.saveBackgroundJobMetrics(jobToFlush).catch(e => {
                console.error("Async job metrics flush failed:", e);
            });
        }
    }
}

export const metrics = new MetricsCollector();
