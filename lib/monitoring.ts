// Performance monitoring utilities
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

const performanceMetrics: PerformanceMetric[] = [];

export function trackPerformance<T>(name: string, fn: () => T): T {
  const start = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - start;
    
    performanceMetrics.push({
      name,
      duration,
      timestamp: start
    });
    
    // Keep only last 100 metrics
    if (performanceMetrics.length > 100) {
      performanceMetrics.shift();
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Performance tracking failed for ${name} (${duration}ms):`, error);
    throw error;
  }
}

export function getPerformanceMetrics(): PerformanceMetric[] {
  return [...performanceMetrics];
}

export function startPerformanceMonitoring(): void {
  setInterval(() => {
    const slowQueries = performanceMetrics.filter(q => q.duration > 1000);
    if (slowQueries.length > 0) {
      console.warn(`🐌 Slow operations detected:`, slowQueries.map(q => `${q.name}: ${q.duration}ms`));
    }
  }, 30000); // Check every 30 seconds
}
