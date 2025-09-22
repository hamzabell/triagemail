'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

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
  const router = useRouter();
  const [emails, setEmails] = useState<EmailClassification[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

        const [statsData, emailsData] = await Promise.all([statsRes.json(), emailsRes.json()]);

        setStats(statsData);
        setEmails(emailsData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleProcessEmails = async () => {
    setIsProcessing(true);
    try {
      // Simulate email processing - in real implementation, this would trigger actual email sync
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Refresh data after processing
      const [statsRes, emailsRes] = await Promise.all([fetch('/api/dashboard/stats'), fetch('/api/dashboard/recent')]);

      if (statsRes.ok && emailsRes.ok) {
        const [statsData, emailsData] = await Promise.all([statsRes.json(), emailsRes.json()]);
        setStats(statsData);
        setEmails(emailsData);
      }
    } catch (error) {
      console.error('Failed to process emails:', error);
    } finally {
      setIsProcessing(false);
    }
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
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emailsProcessed.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Total emails processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.responsesGenerated.toLocaleString() || 0}</div>
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
                      <Badge className="border-[#FFD166] text-[#1D3557] bg-[#FFD166]/10">
                        Priority {email.priority}/10
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
                    <p className="text-sm text-muted-foreground">{email.preview}</p>
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
              {emails.slice(0, 5).map((email, index) => {
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
    </div>
  );
}
