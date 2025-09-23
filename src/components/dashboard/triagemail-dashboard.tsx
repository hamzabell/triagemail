'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/button';
import QuickActionsButton from './QuickActionsButton';
import { ClientHealthDashboard } from './client-health/ClientHealthDashboard';
import EmailSyncSettings from './EmailSyncSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EmailClassification {
  id: string;
  subject: string;
  from: string;
  category: string;
  priority: number;
  preview: string;
  timeSaved: number;
  deadline?: string;
  processedAt: string;
  // Enhanced fields for quick actions
  quickActions: Array<{
    type: 'accept' | 'decline' | 'schedule' | 'delegate' | 'follow_up' | 'archive';
    label: string;
    description: string;
    autoResponse?: string;
  }>;
  suggestedResponse?: string | null;
  responseStatus: 'pending' | 'completed' | 'overdue';
  businessPriority: number;
  actionItems: Array<{
    task: string;
    assignee: 'user' | 'sender' | 'other';
    urgency: 'high' | 'medium' | 'low';
    deadline?: string | null;
  }>;
  deadlines: Array<{
    date: string;
    description: string;
    confidence: number;
  }>;
  businessContext: {
    communicationType: 'internal' | 'external' | 'customer' | 'partner';
    businessImpact: 'high' | 'medium' | 'low';
    sentiment?: number;
    sentimentIndicators?: string[];
  };
  followUpRequired: boolean;
  responseComplexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: number;
  priorityLevel: 'client' | 'vip' | 'urgent' | 'standard' | 'low';
  responseDeadline?: string | null;
}

interface DashboardStats {
  emailsProcessed: number;
  responsesGenerated: number;
  timeSaved: number;
  accuracy: number;
  monthlyStats: {
    emailsProcessed: number;
    responsesGenerated: number;
    timeSaved: number;
    accuracy: number;
  };
  todayStats: {
    emailsProcessed: number;
    responsesUsed: number;
    timeSaved: number;
    accuracy: number;
  };
}

export default function TriageMailDashboard() {
  const [emails, setEmails] = useState<EmailClassification[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const [statsRes, emailsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent'),
        ]);

        if (!statsRes.ok || !emailsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [statsResponse, emailsResponse] = await Promise.all([statsRes.json(), emailsRes.json()]);

        const statsData = statsResponse.data || statsResponse;
        // Map API response fields to expected interface
        setStats({
          emailsProcessed: statsData.totalEmails || 0,
          responsesGenerated: statsData.responsesGenerated || 0,
          timeSaved: statsData.timeSaved || 0,
          accuracy: statsData.accuracy || 0,
          monthlyStats: statsData.monthlyStats || {
            emailsProcessed: 0,
            responsesGenerated: 0,
            timeSaved: 0,
            accuracy: 0,
          },
          todayStats: statsData.todayStats || {
            emailsProcessed: 0,
            responsesUsed: 0,
            timeSaved: 0,
            accuracy: 0,
          },
        });
        setEmails(emailsResponse);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    // Get user info for client health features
    const getUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setUserId(userData.user?.id || null);
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
      }
    };

    loadUserData();
    getUserInfo();
  }, []);

  const handleProcessEmails = async () => {
    setIsProcessing(true);
    try {
      // Start background email processing
      const response = await fetch('/api/email/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            maxEmailsPerSync: 25,
            syncInterval: 15,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Email processing started:', result.job);

        // Start polling for status updates
        pollProcessingStatus();
      } else {
        throw new Error('Failed to start email processing');
      }
    } catch (error) {
      console.error('Failed to process emails:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const pollProcessingStatus = async () => {
    const maxAttempts = 30; // 30 seconds of polling
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch('/api/email/process');
        if (response.ok) {
          const data = await response.json();

          if (data.status && data.status.status === 'completed') {
            // Processing completed, refresh data
            refreshDashboardData();
            return;
          } else if (data.status && data.status.status === 'failed') {
            console.error('Email processing failed:', data.status.error);
            return;
          }

          // Still processing, continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
          }
        }
      } catch (error) {
        console.error('Error polling processing status:', error);
      }
    };

    poll();
  };

  const refreshDashboardData = async () => {
    try {
      const [statsRes, emailsRes] = await Promise.all([fetch('/api/dashboard/stats'), fetch('/api/dashboard/recent')]);

      if (statsRes.ok && emailsRes.ok) {
        const [statsResponse, emailsResponse] = await Promise.all([statsRes.json(), emailsRes.json()]);
        const statsData = statsResponse.data || statsResponse;
        setStats({
          emailsProcessed: statsData.totalEmails || 0,
          responsesGenerated: statsData.responsesGenerated || 0,
          timeSaved: statsData.timeSaved || 0,
          accuracy: statsData.accuracy || 0,
          monthlyStats: statsData.monthlyStats || {
            emailsProcessed: 0,
            responsesGenerated: 0,
            timeSaved: 0,
            accuracy: 0,
          },
          todayStats: statsData.todayStats || {
            emailsProcessed: 0,
            responsesUsed: 0,
            timeSaved: 0,
            accuracy: 0,
          },
        });
        setEmails(emailsResponse);
      }
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  };

  const handleActionComplete = (actionType: string, result: { message: string; timestamp: string }) => {
    // Refresh data after action completion
    const refreshData = async () => {
      const [statsRes, emailsRes] = await Promise.all([fetch('/api/dashboard/stats'), fetch('/api/dashboard/recent')]);
      if (statsRes.ok && emailsRes.ok) {
        const [statsResponse, emailsResponse] = await Promise.all([statsRes.json(), emailsRes.json()]);
        const statsData = statsResponse.data || statsResponse;
        // Map API response fields to expected interface
        setStats({
          emailsProcessed: statsData.totalEmails || 0,
          responsesGenerated: statsData.responsesGenerated || 0,
          timeSaved: statsData.timeSaved || 0,
          accuracy: statsData.accuracy || 0,
          monthlyStats: statsData.monthlyStats || {
            emailsProcessed: 0,
            responsesGenerated: 0,
            timeSaved: 0,
            accuracy: 0,
          },
          todayStats: statsData.todayStats || {
            emailsProcessed: 0,
            responsesUsed: 0,
            timeSaved: 0,
            accuracy: 0,
          },
        });
        setEmails(emailsResponse);
      }
    };
    refreshData();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Urgent':
        return 'bg-primary text-white';
      case 'Request':
        return 'bg-blue-500 text-white';
      case 'Question':
        return 'bg-[#FFD166] text-white';
      case 'Update':
        return 'bg-[#06D6A0] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityLevelColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'client':
        return 'bg-green-500 text-white';
      case 'vip':
        return 'bg-purple-500 text-white';
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'standard':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getResponseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return <ClockIcon className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return diffInSeconds <= 1 ? 'just now' : `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-[#FF3366] hover:bg-[#E63946] text-white">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <div className="bg-background rounded-xl p-1 shadow-sm border border-border/50">
        <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0 gap-1">
          <TabsTrigger
            value="overview"
            className="h-10 px-4 py-2 text-sm font-medium rounded-lg bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted data-[state=active]:bg-[#FF3366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Overview
          </TabsTrigger>
          <TabsTrigger
            value="client-health"
            className="h-10 px-4 py-2 text-sm font-medium rounded-lg bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted data-[state=active]:bg-[#FF3366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Target className="h-4 w-4 mr-2" />
            Client Health
          </TabsTrigger>
          <TabsTrigger
            value="sync-settings"
            className="h-10 px-4 py-2 text-sm font-medium rounded-lg bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted data-[state=active]:bg-[#FF3366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Clock className="h-4 w-4 mr-2" />
            Sync Settings
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="h-10 px-4 py-2 text-sm font-medium rounded-lg bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted data-[state=active]:bg-[#FF3366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.emailsProcessed || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total emails processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responses Generated</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.responsesGenerated || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month: {stats?.monthlyStats.responsesGenerated || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.timeSaved || 0}h</div>
              <p className="text-xs text-muted-foreground">Monthly: {stats?.monthlyStats.timeSaved || 0}h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.accuracy || 0}%</div>
              <p className="text-xs text-muted-foreground">AI classification accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Email Classifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Email Classifications</CardTitle>
            <CardDescription>AI-powered categorization of your emails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emails.map((email) => (
                <div key={email.id} className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(email.category)}>{email.category}</Badge>
                        <Badge className={getPriorityLevelColor(email.priorityLevel)}>
                          {email.priorityLevel.charAt(0).toUpperCase() + email.priorityLevel.slice(1)}
                        </Badge>
                        <Badge className="border-[#FFD166] text-[#1D3557] bg-[#FFD166]/10">
                          Priority {email.priority}/10
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getResponseStatusIcon(email.responseStatus)}
                          {email.responseStatus}
                        </Badge>
                        {email.deadline && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Deadline
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{email.subject}</h4>
                      <p className="text-sm text-muted-foreground mb-2">From: {email.from}</p>
                      <p className="text-sm text-muted-foreground mb-3">{email.preview}</p>

                      {/* Enhanced Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">Business Priority:</span>
                          <Badge variant="outline" className="text-xs">
                            {email.businessPriority}/10
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">Est. Time:</span>
                          <Badge variant="outline" className="text-xs">
                            {email.estimatedTime} min
                          </Badge>
                        </div>
                        {email.actionItems && email.actionItems.length > 0 && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-purple-500" />
                            <span className="text-muted-foreground">Actions:</span>
                            <Badge variant="outline" className="text-xs">
                              {email.actionItems.length} items
                            </Badge>
                          </div>
                        )}
                        {email.followUpRequired && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3 text-orange-500" />
                            <span className="text-muted-foreground">Follow-up required</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      {email.quickActions && email.quickActions.length > 0 && (
                        <QuickActionsButton
                          classificationId={email.id}
                          quickActions={email.quickActions}
                          suggestedResponse={email.suggestedResponse || undefined}
                          onActionComplete={handleActionComplete}
                        />
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          Processed: {new Date(email.processedAt).toLocaleString()}
                        </p>
                        {email.timeSaved > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {email.timeSaved} min saved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {emails.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No emails processed yet. Connect your email account to get started.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Features */}
        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-[#FF3366] hover:bg-[#E63946] text-white"
                onClick={handleProcessEmails}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Process New Emails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Recent Activity</CardTitle>
              <CardDescription className="text-muted-foreground">Your latest email processing actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emails.slice(0, 5).map((email) => {
                  const timeAgo = getTimeAgo(new Date(email.processedAt));
                  const getActivityColor = (category: string) => {
                    switch (category) {
                      case 'Urgent':
                        return 'bg-primary';
                      case 'Request':
                        return 'bg-blue-500';
                      case 'Question':
                        return 'bg-[#FFD166]';
                      case 'Update':
                        return 'bg-[#06D6A0]';
                      default:
                        return 'bg-gray-500';
                    }
                  };

                  return (
                    <div key={email.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 ${getActivityColor(email.category)} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Processed {email.category.toLowerCase()} email
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                      {email.priority >= 8 && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    </div>
                  );
                })}
                {emails.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No activity yet. Start processing emails to see your activity here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Performance</CardTitle>
              <CardDescription className="text-muted-foreground">This week&apos;s metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Processing Speed</span>
                    <span className="text-[#06D6A0] font-medium">{emails.length > 0 ? 'Excellent' : 'N/A'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#06D6A0] h-2 rounded-full"
                      style={{ width: emails.length > 10 ? '90%' : emails.length > 0 ? '70%' : '0%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Accuracy Rate</span>
                    <span className="text-[#06D6A0] font-medium">{stats?.accuracy || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#06D6A0] h-2 rounded-full" style={{ width: `${stats?.accuracy || 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Efficiency</span>
                    <span className="text-[#06D6A0] font-medium">
                      {stats?.timeSaved && stats?.timeSaved > 0 ? 'Good' : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#06D6A0] h-2 rounded-full"
                      style={{
                        width:
                          stats?.timeSaved && stats.timeSaved > 5
                            ? '85%'
                            : stats?.timeSaved && stats.timeSaved > 0
                              ? '60%'
                              : '0%',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Time Saved</span>
                    <span className="font-medium text-foreground">{stats?.timeSaved || 0} hours</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="client-health" className="space-y-6">
        {userId && <ClientHealthDashboard userId={userId} />}
        {!userId && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Loading client health data...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="sync-settings" className="space-y-6">
        {userId && <EmailSyncSettings userId={userId} />}
        {!userId && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Loading sync settings...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gmail Add-on Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Add-on Integration
            </CardTitle>
            <CardDescription>Connect your Gmail add-on to process emails directly from your inbox</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">How to Set Up:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Copy the integration code from the documentation</li>
                <li>Paste it into your Gmail add-on project</li>
                <li>Update the API base URL to your deployment URL</li>
                <li>Install the add-on in your Gmail account</li>
              </ol>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Integration Status</p>
                <p className="text-sm text-muted-foreground">
                  Configure your Gmail add-on to enable real-time email processing
                </p>
              </div>
              <Badge variant="secondary">Not Connected</Badge>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Features Available in Add-on:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Process individual emails</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>View client health insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Get relationship status</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Receive recommendations</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText('https://github.com/your-repo/gmail-addon-code');
                  alert('Integration code copied to clipboard!');
                }}
              >
                Copy Integration Code
              </Button>
              <Button className="bg-[#FF3366] hover:bg-[#E63946] text-white">View Documentation</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Detailed performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Email Processing Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats?.emailsProcessed || 0} total emails processed with {stats?.accuracy || 0}% AI accuracy
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response Efficiency</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats?.responsesGenerated || 0} responses generated, saving {stats?.timeSaved || 0} hours
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Monthly Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    This month: {stats?.monthlyStats?.emailsProcessed || 0} emails,{' '}
                    {stats?.monthlyStats?.responsesGenerated || 0} responses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions Insights</CardTitle>
              <CardDescription>Efficiency metrics from automated actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Auto-accept Rate</span>
                  <span className="text-sm font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Auto-schedule Success</span>
                  <span className="text-sm font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Time Saved</span>
                  <span className="text-sm font-medium">{stats?.timeSaved || 0} hours</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    More detailed analytics will be available as you process more emails
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
