'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClientHealthScore } from '@/types/priority';

interface ContactHealthCardProps {
  contact: ClientHealthScore;
  onClick?: () => void;
}

export function ContactHealthCard({ contact, onClick }: ContactHealthCardProps) {
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'stable':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'declining':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
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
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const formatLastInteraction = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
    return `${Math.floor(daysDiff / 30)} months ago`;
  };

  const getSentimentEmoji = (score: number) => {
    if (score > 0.3) return '😊';
    if (score > -0.3) return '😐';
    return '😞';
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{contact.contact_name || contact.contact_email}</CardTitle>
            {contact.contact_name && <p className="text-sm text-muted-foreground truncate">{contact.contact_email}</p>}
            {contact.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className={`text-2xl font-bold ${getHealthScoreColor(contact.health_score)}`}>
              {Math.round(contact.health_score)}
            </div>
            <Badge className={getTrendColor(contact.relationship_trend)}>
              {getTrendIcon(contact.relationship_trend)} {contact.relationship_trend}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Health Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Health Score</span>
            <span className={getHealthScoreColor(contact.health_score)}>
              {getHealthScoreLabel(contact.health_score)}
            </span>
          </div>
          <Progress value={contact.health_score} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-medium">{formatResponseTime(contact.response_time_avg)}</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
          <div>
            <p className="text-2xl font-medium">{getSentimentEmoji(contact.sentiment_score)}</p>
            <p className="text-xs text-muted-foreground">Sentiment</p>
          </div>
          <div>
            <p className="text-2xl font-medium">{Math.round(contact.email_frequency * 10) / 10}</p>
            <p className="text-xs text-muted-foreground">Emails/Week</p>
          </div>
        </div>

        {/* Risk Factors */}
        {contact.risk_factors && contact.risk_factors.factors && contact.risk_factors.factors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">Risk Factors:</p>
            <div className="space-y-1">
              {contact.risk_factors.factors
                .slice(0, 2)
                .map((factor: { description: string; severity: string }, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-xs text-muted-foreground">{factor.description}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Last Interaction */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Last interaction: {formatLastInteraction(contact.last_interaction)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
