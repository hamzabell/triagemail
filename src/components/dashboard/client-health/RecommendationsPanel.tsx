'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PredictiveRecommendation } from '@/types/priority';

interface RecommendationsPanelProps {
  recommendations: PredictiveRecommendation[];
  onAction: (recommendationId: string, action: 'acknowledge' | 'dismiss') => void;
}

export function RecommendationsPanel({ recommendations, onAction }: RecommendationsPanelProps) {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'optimal_response_time':
        return '⏰';
      case 'client_outreach':
        return '📞';
      case 'relationship_improvement':
        return '💝';
      case 'risk_mitigation':
        return '🛡️';
      default:
        return '💡';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'optimal_response_time':
        return 'bg-blue-100 text-blue-800';
      case 'client_outreach':
        return 'bg-green-100 text-green-800';
      case 'relationship_improvement':
        return 'bg-purple-100 text-purple-800';
      case 'risk_mitigation':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatConfidence = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const formatExpiresAt = (dateString?: string) => {
    if (!dateString) return 'No expiration';
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 0) return 'Expired';
    if (daysDiff === 1) return 'Expires tomorrow';
    if (daysDiff <= 7) return `Expires in ${daysDiff} days`;
    return `Expires in ${Math.ceil(daysDiff / 7)} weeks`;
  };

  const groupRecommendationsByType = () => {
    const grouped = recommendations.reduce(
      (acc, rec) => {
        if (!acc[rec.recommendation_type]) {
          acc[rec.recommendation_type] = [];
        }
        acc[rec.recommendation_type].push(rec);
        return acc;
      },
      {} as Record<string, PredictiveRecommendation[]>,
    );

    return grouped;
  };

  const groupedRecommendations = groupRecommendationsByType();

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>Personalized suggestions to improve your email management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold mb-2">Excellent Work!</h3>
              <p className="text-muted-foreground">
                No recommendations at this time. Your email management is on track!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>
            {recommendations.length} personalized suggestions to improve your relationships and productivity
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(groupedRecommendations).map(([type, typeRecs]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{getRecommendationIcon(type)}</span>
              <span className="capitalize">
                {type.replace(/_/g, ' ')} ({typeRecs.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {typeRecs
              .sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority_level] - priorityOrder[a.priority_level];
              })
              .map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          variant={
                            getPriorityColor(rec.priority_level) as 'default' | 'secondary' | 'destructive' | 'outline'
                          }
                        >
                          {rec.priority_level}
                        </Badge>
                        <Badge className={getTypeColor(rec.recommendation_type)}>
                          {getRecommendationIcon(rec.recommendation_type)} {rec.recommendation_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatConfidence(rec.confidence_score)} confidence
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold">{rec.title}</h4>
                      <p className="text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>

                  {/* Action Required */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="font-medium text-blue-900 mb-1">Action Required:</h5>
                    <p className="text-blue-800 text-sm">{rec.action_required}</p>
                  </div>

                  {/* Implementation Steps */}
                  {rec.implementation_steps && rec.implementation_steps.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Implementation Steps:</h5>
                      <ol className="space-y-1">
                        {rec.implementation_steps.map((step, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start">
                            <span className="mr-2 text-blue-500">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Expected Impact */}
                  {rec.expected_impact && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <h5 className="font-medium text-green-900 mb-1">Expected Impact:</h5>
                      <p className="text-green-800 text-sm">{rec.expected_impact}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{formatExpiresAt(rec.expires_at)}</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction(rec.id, 'acknowledge')}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        ✓ Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction(rec.id, 'dismiss')}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        ✕ Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
