'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Star, AlertTriangle, Plus, Calendar, CheckCircle, Mail } from 'lucide-react';
import { PriorityContact, PriorityDomain, FollowUpTask } from '@/types/priority';

interface PriorityStats {
  clientEmails: number;
  urgentEmails: number;
  overdueEmails: number;
  todayDeadlines: number;
  avgResponseTime: number;
  complianceRate: number;
}

export function PriorityDashboard() {
  const [stats, setStats] = useState<PriorityStats>({
    clientEmails: 0,
    urgentEmails: 0,
    overdueEmails: 0,
    todayDeadlines: 0,
    avgResponseTime: 0,
    complianceRate: 0,
  });
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);
  const [contacts, setContacts] = useState<PriorityContact[]>([]);
  const [domains, setDomains] = useState<PriorityDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriorityData();
  }, []);

  const fetchPriorityData = async () => {
    try {
      const [followUpsRes, contactsRes, domainsRes] = await Promise.all([
        fetch('/api/followups?overdueOnly=true&limit=10'),
        fetch('/api/contacts?limit=20'),
        fetch('/api/domains?limit=20'),
      ]);

      const [followUpsData, contactsData, domainsData] = await Promise.all([
        followUpsRes.json(),
        contactsRes.json(),
        domainsRes.json(),
      ]);

      setFollowUps(followUpsData.followUps || []);
      setContacts(contactsData.contacts || []);
      setDomains(domainsData.domains || []);

      // Calculate stats from the data
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const clientEmails =
        followUpsData.followUps?.filter(
          (f: FollowUpTask) => f.priority_level === 'client' || f.priority_level === 'vip',
        ).length || 0;

      const urgentEmails =
        followUpsData.followUps?.filter((f: FollowUpTask) => f.priority_level === 'urgent').length || 0;

      const overdueEmails =
        followUpsData.followUps?.filter(
          (f: FollowUpTask) => new Date(f.response_deadline) < now && f.status === 'pending',
        ).length || 0;

      const todayDeadlines =
        followUpsData.followUps?.filter(
          (f: FollowUpTask) => new Date(f.response_deadline) <= todayEnd && f.status === 'pending',
        ).length || 0;

      setStats({
        clientEmails,
        urgentEmails,
        overdueEmails,
        todayDeadlines,
        avgResponseTime: 4.2, // Mock data - calculate from analytics
        complianceRate: 94, // Mock data - calculate from response analytics
      });
    } catch (error) {
      console.error('Error fetching priority data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'client':
      case 'vip':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'standard':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return `Overdue by ${Math.abs(Math.round(diffHours))}h`;
    } else if (diffHours < 1) {
      return `Due in ${Math.round(diffHours * 60)}m`;
    } else if (diffHours < 24) {
      return `Due in ${Math.round(diffHours)}h`;
    } else {
      return `Due in ${Math.round(diffHours / 24)}d`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Emails</CardTitle>
            <Star className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientEmails}</div>
            <p className="text-xs text-muted-foreground">24-hour response required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Emails</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentEmails}</div>
            <p className="text-xs text-muted-foreground">Immediate attention needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueEmails}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDeadlines}</div>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}h</div>
            <p className="text-xs text-muted-foreground">Across all emails</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">Meeting deadlines</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Alerts */}
      {stats.overdueEmails > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have{' '}
            <strong>
              {stats.overdueEmails} overdue email{stats.overdueEmails > 1 ? 's' : ''}
            </strong>{' '}
            that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="followups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="followups">Follow-ups ({followUps.length})</TabsTrigger>
          <TabsTrigger value="contacts">Priority Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="domains">Priority Domains ({domains.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="followups" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Priority Follow-ups</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          </div>

          <div className="grid gap-4">
            {followUps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No pending follow-ups</p>
                  <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              followUps.map((followUp) => (
                <Card key={followUp.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(followUp.priority_level)}>
                            {followUp.priority_level.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">From: {followUp.from_email}</span>
                        </div>
                        <h4 className="font-medium mb-1">{followUp.subject}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDeadline(followUp.response_deadline)}
                          </span>
                          <span>•</span>
                          <span>Status: {followUp.status}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="default">
                          Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Priority Contacts</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{contact.name || 'Unnamed Contact'}</h4>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                      {contact.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
                    </div>
                    <Badge className={getPriorityColor(contact.priority_level)}>
                      {contact.priority_level.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {contact.response_deadline_hours}h response time
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Priority Domains</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {domains.map((domain) => (
              <Card key={domain.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{domain.domain}</h4>
                      {domain.company_name && <p className="text-sm text-muted-foreground">{domain.company_name}</p>}
                    </div>
                    <Badge className={getPriorityColor(domain.priority_level)}>
                      {domain.priority_level.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {domain.response_deadline_hours}h response time
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
