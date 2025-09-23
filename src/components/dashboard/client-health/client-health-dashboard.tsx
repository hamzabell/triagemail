'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Chart components temporarily removed - install recharts to enable charts
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Clock,
  Target,
  Brain,
  BarChart3,
  Star,
} from 'lucide-react';

interface ClientHealthScore {
  id: string;
  contact_email: string;
  contact_name?: string;
  company?: string;
  health_score: number;
  response_time_avg: number;
  sentiment_score: number;
  email_frequency: number;
  relationship_trend: 'improving' | 'stable' | 'declining' | 'critical';
  last_interaction: string;
}

interface HealthAnalytics {
  totalContacts: number;
  averageHealthScore: number;
  criticalRelationships: number;
  improvingRelationships: number;
  decliningRelationships: number;
}

interface PredictiveInsight {
  optimal_response_time: number;
  confidence_score: number;
  best_times_to_respond: string[];
  risk_assessment: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface ContactInsight {
  type: 'strength' | 'warning' | 'opportunity' | 'risk';
  message: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
}

interface ClientHealthDashboardProps {
  userId: string;
}

export function ClientHealthDashboard({ userId }: ClientHealthDashboardProps) {
  const [healthScores, setHealthScores] = useState<ClientHealthScore[]>([]);
  const [analytics, setAnalytics] = useState<HealthAnalytics | null>(null);
  const [insights, setInsights] = useState<PredictiveInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactInsights, setContactInsights] = useState<ContactInsight[]>([]);

  useEffect(() => {
    loadHealthData();
  }, [userId]);

  const loadHealthData = async () => {
    try {
      const response = await fetch(`/api/client-health?include_analytics=true`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setHealthScores(data.data.scores);
        setAnalytics(data.data.analytics);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContactInsights = async (contactEmail: string) => {
    try {
      const response = await fetch(`/api/client-health?contact_email=${contactEmail}&insights=true`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.data.insights);
        setContactInsights(data.data.insights?.recommendations || []);
        setSelectedContact(contactEmail);
      }
    } catch (error) {
      console.error('Error loading contact insights:', error);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <Star className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'opportunity':
        return <Target className="h-4 w-4 text-blue-600" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  // Chart data
  const healthDistribution = [
    { name: 'Excellent', value: healthScores.filter((s) => s.health_score >= 80).length, color: '#10b981' },
    {
      name: 'Good',
      value: healthScores.filter((s) => s.health_score >= 60 && s.health_score < 80).length,
      color: '#3b82f6',
    },
    {
      name: 'Fair',
      value: healthScores.filter((s) => s.health_score >= 40 && s.health_score < 60).length,
      color: '#f59e0b',
    },
    { name: 'Poor', value: healthScores.filter((s) => s.health_score < 40).length, color: '#ef4444' },
  ];

  const responseTimeData = healthScores.slice(0, 10).map((score) => ({
    name: score.contact_name || score.contact_email.split('@')[0],
    responseTime: Math.round(score.response_time_avg),
    healthScore: score.health_score,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">Active relationships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(analytics?.averageHealthScore || 0)}`}>
              {Math.round(analytics?.averageHealthScore || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Overall relationship health</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.criticalRelationships || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improving</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.improvingRelationships || 0}</div>
            <p className="text-xs text-muted-foreground">Positive trends</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contact Health</TabsTrigger>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Health Distribution</CardTitle>
                <CardDescription>Breakdown of contact relationship health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-muted-foreground">Chart requires recharts library</p>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time vs Health Score</CardTitle>
                <CardDescription>Correlation between response times and relationship health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-muted-foreground">Chart requires recharts library</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* At Risk Contacts */}
          {healthScores.filter((s) => s.health_score < 50).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Contacts Needing Attention
                </CardTitle>
                <CardDescription>Relationships that may require immediate action</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthScores
                    .filter((s) => s.health_score < 50)
                    .slice(0, 5)
                    .map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTrendIcon(contact.relationship_trend)}
                          <div>
                            <p className="font-medium">{contact.contact_name || contact.contact_email}</p>
                            <p className="text-sm text-muted-foreground">Score: {contact.health_score}/100</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadContactInsights(contact.contact_email)}>
                          View Insights
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="grid gap-4">
            {healthScores.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{contact.contact_name || contact.contact_email}</h3>
                        {getTrendIcon(contact.relationship_trend)}
                        <Badge variant="outline" className={getRiskColor(contact.relationship_trend)}>
                          {contact.relationship_trend}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(contact.response_time_avg)}h avg response
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {contact.email_frequency.toFixed(1)}/month emails
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className={`text-2xl font-bold ${getHealthColor(contact.health_score)}`}>
                        {contact.health_score}
                      </div>
                      <Progress value={contact.health_score} className="w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {selectedContact && insights ? (
            <Card>
              <CardHeader>
                <CardTitle>Insights for {selectedContact}</CardTitle>
                <CardDescription>AI-powered recommendations and predictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Optimal Response Time</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(insights.optimal_response_time)} hours
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {Math.round(insights.confidence_score * 100)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Risk Assessment</h4>
                    <Badge className={getRiskColor(insights.risk_assessment)}>
                      {insights.risk_assessment.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Best Times to Respond</h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.best_times_to_respond.map((time, index) => (
                      <Badge key={index} variant="outline">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  <ul className="space-y-1">
                    {insights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {contactInsights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Detailed Analysis</h4>
                    <div className="space-y-2">
                      {contactInsights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          {getInsightIcon(insight.type)}
                          <div>
                            <p className="text-sm">{insight.message}</p>
                            {insight.recommendation && (
                              <p className="text-xs text-muted-foreground mt-1">💡 {insight.recommendation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Select a contact to view detailed insights</p>
                  <Button onClick={() => (window.location.href = '/dashboard/analytics')}>View All Analytics</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Key metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-muted-foreground">Chart requires recharts library</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Patterns</CardTitle>
                <CardDescription>Your communication effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Response Time</span>
                    <span className="font-medium">
                      {Math.round(
                        responseTimeData.reduce((sum, d) => sum + d.responseTime, 0) / responseTimeData.length || 0,
                      )}
                      h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Performing Contact</span>
                    <span className="font-medium text-green-600">
                      {responseTimeData.length > 0
                        ? responseTimeData.reduce((best, current) =>
                            current.healthScore > best.healthScore ? current : best,
                          ).name
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Improvement Opportunities</span>
                    <span className="font-medium text-orange-600">
                      {healthScores.filter((s) => s.health_score < 70).length} contacts
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
