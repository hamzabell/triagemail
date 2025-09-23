'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientHealthScore } from '@/types/priority';

interface HealthTrendChartProps {
  healthScores: ClientHealthScore[];
}

export function HealthTrendChart({ healthScores }: HealthTrendChartProps) {
  const getTrendData = () => {
    const trendCounts = {
      improving: 0,
      stable: 0,
      declining: 0,
      critical: 0,
    };

    healthScores.forEach((score) => {
      trendCounts[score.relationship_trend] = (trendCounts[score.relationship_trend] || 0) + 1;
    });

    return [
      { trend: 'improving', count: trendCounts.improving, color: 'bg-green-500', label: 'Improving' },
      { trend: 'stable', count: trendCounts.stable, color: 'bg-blue-500', label: 'Stable' },
      { trend: 'declining', count: trendCounts.declining, color: 'bg-yellow-500', label: 'Declining' },
      { trend: 'critical', count: trendCounts.critical, color: 'bg-red-500', label: 'Critical' },
    ];
  };

  const getHealthDistribution = () => {
    const ranges = {
      excellent: 0, // 80-100
      good: 0, // 60-79
      fair: 0, // 40-59
      poor: 0, // 0-39
    };

    healthScores.forEach((score) => {
      if (score.health_score >= 80) ranges.excellent++;
      else if (score.health_score >= 60) ranges.good++;
      else if (score.health_score >= 40) ranges.fair++;
      else ranges.poor++;
    });

    return [
      { range: 'excellent', count: ranges.excellent, color: 'bg-green-500', label: 'Excellent (80-100)' },
      { range: 'good', count: ranges.good, color: 'bg-blue-500', label: 'Good (60-79)' },
      { range: 'fair', count: ranges.fair, color: 'bg-yellow-500', label: 'Fair (40-59)' },
      { range: 'poor', count: ranges.poor, color: 'bg-red-500', label: 'Poor (0-39)' },
    ];
  };

  const trendData = getTrendData();
  const healthData = getHealthDistribution();
  const totalContacts = healthScores.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relationship Trends</CardTitle>
        <CardDescription>Distribution of client relationship health and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Health Score Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium">Health Score Distribution</h4>
            <div className="space-y-2">
              {healthData.map((item) => (
                <div key={item.range} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span>
                      {item.count} ({totalContacts > 0 ? Math.round((item.count / totalContacts) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                      style={{
                        width: totalContacts > 0 ? `${(item.count / totalContacts) * 100}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium">Relationship Trend Distribution</h4>
            <div className="space-y-2">
              {trendData.map((item) => (
                <div key={item.trend} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span>{getTrendIcon(item.trend)}</span>
                      <span>{item.label}</span>
                    </div>
                    <span>
                      {item.count} ({totalContacts > 0 ? Math.round((item.count / totalContacts) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                      style={{
                        width: totalContacts > 0 ? `${(item.count / totalContacts) * 100}%` : '0%',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-2">
            <h4 className="font-medium">Key Insights</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center space-x-2">
                <span>📈</span>
                <span>{trendData.find((t) => t.trend === 'improving')?.count || 0} relationships improving</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⚠️</span>
                <span>
                  {(trendData.find((t) => t.trend === 'declining')?.count || 0) +
                    (trendData.find((t) => t.trend === 'critical')?.count || 0)}{' '}
                  need attention
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💚</span>
                <span>{healthData.find((h) => h.range === 'excellent')?.count || 0} excellent health scores</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'improving':
      return '📈';
    case 'stable':
      return '➡️';
    case 'declining':
      return '📉';
    case 'critical':
      return '🚨';
    default:
      return '❓';
  }
}
