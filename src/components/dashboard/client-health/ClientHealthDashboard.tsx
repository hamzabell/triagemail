'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthTrendChart } from './HealthTrendChart';
import { ResponseTimeChart } from './ResponseTimeChart';
import { ContactHealthCard } from './ContactHealthCard';
import { RecommendationsPanel } from './RecommendationsPanel';
import { ClientHealthScore } from '@/types/priority';

interface PredictiveRecommendation {
  id: string;
  recommendation_type: 'optimal_response_time' | 'client_outreach' | 'relationship_improvement' | 'risk_mitigation';
  title: string;
  description: string;
  confidence_score: number;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  action_required: string;
  expected_impact?: string;
  implementation_steps?: string[];
  status: 'pending' | 'acknowledged' | 'implemented' | 'dismissed';
  created_at: string;
  expires_at?: string;
}

interface HealthAnalytics {
  totalContacts: number;
  averageHealthScore: number;
  criticalRelationships: number;
  improvingRelationships: number;
  decliningRelationships: number;
}

interface ClientHealthDashboardProps {
  userId: string;
}

export function ClientHealthDashboard({ userId }: ClientHealthDashboardProps) {
  const [healthScores, setHealthScores] = useState<ClientHealthScore[]>([]);
  const [recommendations, setRecommendations] = useState<PredictiveRecommendation[]>([]);
  const [analytics, setAnalytics] = useState<HealthAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, [userId]);

  const loadHealthData = async () => {
    try {
      const response = await fetch(`/api/client-health?include_analytics=true`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load health data');
      }

      const result = await response.json();
      if (result.success) {
        setHealthScores(result.data.scores);
        setAnalytics(result.data.analytics);
      }

      // Load recommendations
      const recResponse = await fetch(`/api/predictive-intelligence?type=recommendations`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (recResponse.ok) {
        const recResult = await recResponse.json();
        if (recResult.success) {
          setRecommendations(recResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRecommendationAction = async (recommendationId: string, action: 'acknowledge' | 'dismiss') => {
    try {
      const response = await fetch('/api/predictive-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: `${action}_recommendation`,
          recommendation_id: recommendationId,
        }),
      });

      if (response.ok) {
        // Refresh recommendations
        const recResponse = await fetch(`/api/predictive-intelligence?type=recommendations`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (recResponse.ok) {
          const recResult = await recResponse.json();
          if (recResult.success) {
            setRecommendations(recResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Error handling recommendation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Health Intelligence</h2>
          <p className="text-muted-foreground">
            Monitor and improve your client relationships with AI-powered insights
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">👥</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalContacts}</div>
              <p className="text-xs text-muted-foreground">Active relationships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">💚</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthScoreColor(analytics.averageHealthScore)}`}>
                {Math.round(analytics.averageHealthScore)}
              </div>
              <p className="text-xs text-muted-foreground">{getHealthScoreLabel(analytics.averageHealthScore)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">🚨</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.criticalRelationships}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Improving</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📈</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.improvingRelationships}</div>
              <p className="text-xs text-muted-foreground">Getting better</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Health Score Distribution</CardTitle>
                <CardDescription>Overview of your client relationship health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Excellent (80-100)</span>
                      <span>{healthScores.filter((s) => s.health_score >= 80).length}</span>
                    </div>
                    <Progress
                      value={(healthScores.filter((s) => s.health_score >= 80).length / healthScores.length) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Good (60-79)</span>
                      <span>{healthScores.filter((s) => s.health_score >= 60 && s.health_score < 80).length}</span>
                    </div>
                    <Progress
                      value={
                        (healthScores.filter((s) => s.health_score >= 60 && s.health_score < 80).length /
                          healthScores.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fair (40-59)</span>
                      <span>{healthScores.filter((s) => s.health_score >= 40 && s.health_score < 60).length}</span>
                    </div>
                    <Progress
                      value={
                        (healthScores.filter((s) => s.health_score >= 40 && s.health_score < 60).length /
                          healthScores.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Poor (0-39)</span>
                      <span>{healthScores.filter((s) => s.health_score < 40).length}</span>
                    </div>
                    <Progress
                      value={(healthScores.filter((s) => s.health_score < 40).length / healthScores.length) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Personalized suggestions to improve your relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              getPriorityColor(rec.priority_level) as
                                | 'default'
                                | 'secondary'
                                | 'destructive'
                                | 'outline'
                            }
                          >
                            {rec.priority_level}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(rec.confidence_score * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.description}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecommendationAction(rec.id, 'acknowledge')}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecommendationAction(rec.id, 'dismiss')}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                  {recommendations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recommendations at this time. Great job!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HealthTrendChart healthScores={healthScores} />
            <ResponseTimeChart healthScores={healthScores} />
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthScores.map((contact) => (
              <ContactHealthCard key={contact.id} contact={contact} />
            ))}
          </div>
          {healthScores.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No client health data available yet.</p>
                  <Button onClick={() => (window.location.href = '/dashboard')}>Process Some Emails</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <RecommendationsPanel recommendations={recommendations} onAction={handleRecommendationAction} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
                <CardDescription>Your average response times by contact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthScores
                    .sort((a, b) => b.response_time_avg - a.response_time_avg)
                    .slice(0, 5)
                    .map((contact) => (
                      <div key={contact.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{contact.contact_name || contact.contact_email}</p>
                          <p className="text-sm text-muted-foreground">{contact.company || ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{Math.round(contact.response_time_avg)}h</p>
                          <p className="text-sm text-muted-foreground">avg response</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>Relationship sentiment trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthScores
                    .sort((a, b) => b.sentiment_score - a.sentiment_score)
                    .slice(0, 5)
                    .map((contact) => (
                      <div key={contact.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{contact.contact_name || contact.contact_email}</p>
                          <p className="text-sm text-muted-foreground">{contact.company || ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {contact.sentiment_score > 0 ? '+' : ''}
                            {Math.round(contact.sentiment_score * 100)}%
                          </p>
                          <p className="text-sm text-muted-foreground">sentiment</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
