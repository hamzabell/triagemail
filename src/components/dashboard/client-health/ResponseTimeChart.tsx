'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientHealthScore } from '@/types/priority';

interface ResponseTimeChartProps {
  healthScores: ClientHealthScore[];
}

export function ResponseTimeChart({ healthScores }: ResponseTimeChartProps) {
  const getResponseTimeDistribution = () => {
    const ranges = {
      excellent: 0, // 0-2 hours
      good: 0, // 2-6 hours
      average: 0, // 6-24 hours
      slow: 0, // 24-48 hours
      verySlow: 0, // 48+ hours
    };

    healthScores.forEach((score) => {
      if (score.response_time_avg <= 2) ranges.excellent++;
      else if (score.response_time_avg <= 6) ranges.good++;
      else if (score.response_time_avg <= 24) ranges.average++;
      else if (score.response_time_avg <= 48) ranges.slow++;
      else ranges.verySlow++;
    });

    return [
      { range: 'excellent', count: ranges.excellent, color: 'bg-green-500', label: 'Excellent (≤2h)' },
      { range: 'good', count: ranges.good, color: 'bg-blue-500', label: 'Good (2-6h)' },
      { range: 'average', count: ranges.average, color: 'bg-yellow-500', label: 'Average (6-24h)' },
      { range: 'slow', count: ranges.slow, color: 'bg-orange-500', label: 'Slow (24-48h)' },
      { range: 'verySlow', count: ranges.verySlow, color: 'bg-red-500', label: 'Very Slow (>48h)' },
    ];
  };

  const getAverageResponseTime = () => {
    if (healthScores.length === 0) return 0;
    const total = healthScores.reduce((sum, score) => sum + score.response_time_avg, 0);
    return total / healthScores.length;
  };

  const getTopContacts = () => {
    return healthScores
      .sort((a, b) => a.response_time_avg - b.response_time_avg)
      .slice(0, 5)
      .map((score) => ({
        name: score.contact_name || score.contact_email,
        responseTime: score.response_time_avg,
        healthScore: score.health_score,
      }));
  };

  const getSlowestContacts = () => {
    return healthScores
      .sort((a, b) => b.response_time_avg - a.response_time_avg)
      .slice(0, 5)
      .map((score) => ({
        name: score.contact_name || score.contact_email,
        responseTime: score.response_time_avg,
        healthScore: score.health_score,
      }));
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const responseTimeData = getResponseTimeDistribution();
  const averageResponseTime = getAverageResponseTime();
  const topContacts = getTopContacts();
  const slowestContacts = getSlowestContacts();
  const totalContacts = healthScores.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Analysis</CardTitle>
        <CardDescription>Your email response patterns and performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Average Response Time */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Average Response Time</h4>
                <p className="text-blue-700 text-sm">Across all contacts</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">{formatResponseTime(averageResponseTime)}</div>
            </div>
          </div>

          {/* Response Time Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium">Response Time Distribution</h4>
            <div className="space-y-2">
              {responseTimeData.map((item) => (
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

          {/* Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">Fastest Responses</h4>
              <div className="space-y-2">
                {topContacts.slice(0, 3).map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">Health: {Math.round(contact.healthScore)}</p>
                    </div>
                    <div className="text-green-600 font-medium">{formatResponseTime(contact.responseTime)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-red-600">Needs Improvement</h4>
              <div className="space-y-2">
                {slowestContacts.slice(0, 3).map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">Health: {Math.round(contact.healthScore)}</p>
                    </div>
                    <div className="text-red-600 font-medium">{formatResponseTime(contact.responseTime)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="space-y-2">
            <h4 className="font-medium">Performance Insights</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center space-x-2">
                <span>⚡</span>
                <span>
                  {responseTimeData.find((r) => r.range === 'excellent')?.count || 0} contacts get excellent response
                  times
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⏰</span>
                <span>
                  {responseTimeData.find((r) => r.range === 'verySlow')?.count || 0} contacts need faster responses
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📊</span>
                <span>
                  {averageResponseTime <= 6 ? 'Great!' : averageResponseTime <= 24 ? 'Good' : 'Room for improvement'}{' '}
                  average response time
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
