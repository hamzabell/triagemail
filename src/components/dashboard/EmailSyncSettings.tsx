'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, RefreshCw, CheckCircle, AlertCircle, Pause, Play } from 'lucide-react';

interface EmailSyncConfig {
  userId: string;
  syncInterval: number;
  maxEmailsPerSync: number;
  enabled: boolean;
  lastSyncAt?: string;
  nextSyncAt?: string;
}

interface ProcessingJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedCount: number;
  totalCount: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface EmailSyncSettingsProps {
  userId: string;
}

export default function EmailSyncSettings({ userId }: EmailSyncSettingsProps) {
  const [config, setConfig] = useState<EmailSyncConfig | null>(null);
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSettings();
    // Poll for job status every 2 seconds if there's an active job
    const interval = setInterval(() => {
      if (currentJob && currentJob.status === 'processing') {
        loadJobStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentJob]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/email/process');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setCurrentJob(data.status);
      }
    } catch (error) {
      console.error('Error loading email sync settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobStatus = async () => {
    try {
      const response = await fetch('/api/email/process');
      if (response.ok) {
        const data = await response.json();
        setCurrentJob(data.status);
      }
    } catch (error) {
      console.error('Error loading job status:', error);
    }
  };

  const toggleSync = async (enabled: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/email/sync-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setConfig((prev) => (prev ? { ...prev, enabled } : null));
      }
    } catch (error) {
      console.error('Error toggling sync:', error);
    } finally {
      setUpdating(false);
    }
  };

  const startManualSync = async () => {
    try {
      setUpdating(true);
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
        const data = await response.json();
        setCurrentJob(data.job);
      }
    } catch (error) {
      console.error('Error starting manual sync:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Pause className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Email Sync Settings
          </CardTitle>
          <CardDescription>Configure automatic email processing and client health monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-sync Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Automatic Email Processing</h4>
              <p className="text-sm text-muted-foreground">
                Automatically fetch and process new emails from your Gmail account
              </p>
            </div>
            <Switch checked={config?.enabled || false} onCheckedChange={toggleSync} disabled={updating} />
          </div>

          {/* Sync Configuration */}
          {config && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Sync Interval</p>
                <p className="text-sm text-muted-foreground">{config.syncInterval} minutes</p>
              </div>
              <div>
                <p className="text-sm font-medium">Max Emails per Sync</p>
                <p className="text-sm text-muted-foreground">{config.maxEmailsPerSync} emails</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Sync</p>
                <p className="text-sm text-muted-foreground">{formatTimeAgo(config.lastSyncAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Next Sync</p>
                <p className="text-sm text-muted-foreground">
                  {config.nextSyncAt ? new Date(config.nextSyncAt).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
          )}

          {/* Manual Sync */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <h4 className="font-medium">Manual Email Processing</h4>
              <p className="text-sm text-muted-foreground">
                Process emails immediately without waiting for the next scheduled sync
              </p>
            </div>
            <Button
              onClick={startManualSync}
              disabled={updating || currentJob?.status === 'processing'}
              className="flex items-center gap-2"
            >
              {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Process Emails Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Job Status */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(currentJob.status)}
              Processing Status
              <Badge className={getStatusColor(currentJob.status)}>{currentJob.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentJob.status === 'processing' && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing emails...</span>
                  <span>
                    {currentJob.processedCount} / {currentJob.totalCount}
                  </span>
                </div>
                <Progress value={(currentJob.processedCount / currentJob.totalCount) * 100} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started:</span>
                <span className="ml-2">
                  {currentJob.startedAt ? new Date(currentJob.startedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              {currentJob.completedAt && (
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="ml-2">{new Date(currentJob.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            {currentJob.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{currentJob.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <p className="font-medium">Automatic Gmail Sync</p>
              <p className="text-sm text-muted-foreground">
                Connects to your Gmail account to fetch new emails automatically
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <p className="font-medium">AI Classification</p>
              <p className="text-sm text-muted-foreground">
                Analyzes and categorizes emails using artificial intelligence
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <p className="font-medium">Client Health Updates</p>
              <p className="text-sm text-muted-foreground">
                Automatically updates relationship scores and sentiment analysis
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium">
              4
            </div>
            <div>
              <p className="font-medium">Smart Recommendations</p>
              <p className="text-sm text-muted-foreground">
                Generates insights and suggestions for improving client relationships
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
