'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, Target, TrendingUp, AlertTriangle, LogOut, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface EmailClassification {
  id: string;
  subject: string;
  from: string;
  category: string;
  priority: number;
  preview: string;
  suggestedResponse?: string;
  timeSaved: number;
  deadline?: string;
  processedAt: string;
}

interface DashboardStats {
  emailsProcessed: number;
  responsesGenerated: number;
  timeSaved: number;
  accuracy: number;
  todayStats: {
    emailsProcessed: number;
    responsesUsed: number;
    timeSaved: number;
    accuracy: number;
  };
}

export default function TriageMailDashboard() {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [emails, setEmails] = useState<EmailClassification[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);

      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      loadUserData();
    };

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

    checkAuth();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
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

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
    <div className="min-h-screen bg-[#F1FAEE] font-sans text-[#1D3557]">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm border-gray-100">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Mail className="h-6 w-6 text-primary" />
              <span className="hidden font-heading font-bold sm:inline-block text-[#1D3557]">TriageMail</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Link href="/" className="md:hidden flex items-center space-x-2">
                <Mail className="h-6 w-6 text-[#FF3366]" />
                <span className="font-heading font-bold text-[#1D3557]">TriageMail</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-[#1D3557] hover:text-[#FF3366] transition-colors">
                Home
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-[#1D3557]">Welcome, {user?.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[#1D3557] hover:text-[#FF3366] hover:bg-[#FF3366]/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-[#1D3557]">Dashboard</h1>
          <p className="text-[#1D3557]/70">Welcome back! Here&apos;s your email triage overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.emailsProcessed.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responses Generated</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.responsesGenerated.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.timeSaved || 0}h</div>
              <p className="text-xs text-muted-foreground">This month</p>
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Email Classifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Classifications</CardTitle>
              <CardDescription>AI-powered categorization and response suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emails.map((email, index) => (
                  <div
                    key={email.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      selectedEmail === index ? 'border-primary bg-muted/50' : ''
                    }`}
                    onClick={() => setSelectedEmail(index)}
                  >
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Response */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Response</CardTitle>
              <CardDescription>AI-generated response for selected email</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEmail !== null ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm">{emails[selectedEmail].suggestedResponse || 'No response generated'}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Estimated time: {emails[selectedEmail].timeSaved} minutes saved</span>
                    <Button size="sm" className="bg-[#FF3366] hover:bg-[#E63946] text-white">
                      Use Response
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Select an email to see suggested response</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-[#FF3366] hover:bg-[#E63946] text-white">
                <Mail className="h-4 w-4 mr-2" />
                Process New Emails
              </Button>
              <Button variant="outline" className="w-full border-[#FF3366] text-[#FF3366] hover:bg-[#FF3366]/10">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full border-[#1D3557] text-[#1D3557] hover:bg-[#1D3557]/10">
                <Target className="h-4 w-4 mr-2" />
                Settings
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
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#06D6A0] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Processed 15 emails</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#FFB700] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Generated 8 responses</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Flagged 3 urgent emails</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
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
                    <span className="text-foreground">Response Time</span>
                    <span className="text-[#06D6A0] font-medium">-15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#06D6A0] h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Accuracy Rate</span>
                    <span className="text-[#06D6A0] font-medium">+5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#06D6A0] h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Time Saved</span>
                    <span className="text-[#06D6A0] font-medium">+20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#06D6A0] h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
