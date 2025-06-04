Queries.length > 0) {
      console.warn(`🐌 Slow operations detected:`, slowQueries.map(q => `${q.name}: ${q.duration}ms`));
    }
  }, 30000); // Check every 30 seconds
}
