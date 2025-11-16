// Export the Productivity Dashboard as the default component
export { default } from "./ProductivityDashboard";

// Export individual components for reuse
export { KPICard, ThroughputCard } from "./KPICard";
export {
  TrendAnalysis,
  DistributionAnalysis,
  CorrelationAnalysis,
  SegmentAnalysis,
} from "./AnalysisTabs";

// Export types
export type * from "./types";

// Export utilities
export * from "./utils";
