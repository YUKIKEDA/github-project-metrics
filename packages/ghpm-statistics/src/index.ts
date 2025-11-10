export type RepositoryStatistics = {
  readonly stars: number;
  readonly forks: number;
  readonly openIssues: number;
  readonly watchers: number;
};

export type CalculatedStatistics = {
  readonly score: number;
  readonly activityLevel: "low" | "medium" | "high";
};

export function calculateStatistics(stats: RepositoryStatistics): CalculatedStatistics {
  const normalizedStars = Math.min(stats.stars, 5000) / 5000;
  const normalizedForks = Math.min(stats.forks, 1000) / 1000;
  const normalizedIssues = Math.max(0, 1 - Math.min(stats.openIssues, 500) / 500);
  const normalizedWatchers = Math.min(stats.watchers, 5000) / 5000;

  const score =
    (normalizedStars * 0.4 +
      normalizedForks * 0.25 +
      normalizedWatchers * 0.2 +
      normalizedIssues * 0.15) *
    100;

  const activityLevel = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return {
    score: Number(score.toFixed(2)),
    activityLevel,
  };
}
