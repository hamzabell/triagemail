'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Calendar, Users, MessageCircle, Archive, Send, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QuickAction {
  type: 'accept' | 'decline' | 'schedule' | 'delegate' | 'follow_up' | 'archive';
  label: string;
  description: string;
  autoResponse?: string;
}

interface QuickActionsButtonProps {
  classificationId: string;
  quickActions: QuickAction[];
  suggestedResponse?: string;
  onActionComplete?: (action: string, result: { message: string; timestamp: string }) => void;
}

const actionIcons = {
  accept: Check,
  decline: X,
  schedule: Calendar,
  delegate: Users,
  follow_up: MessageCircle,
  archive: Archive,
};

const actionColors = {
  accept: 'bg-green-500 hover:bg-green-600',
  decline: 'bg-red-500 hover:bg-red-600',
  schedule: 'bg-blue-500 hover:bg-blue-600',
  delegate: 'bg-purple-500 hover:bg-purple-600',
  follow_up: 'bg-orange-500 hover:bg-orange-600',
  archive: 'bg-gray-500 hover:bg-gray-600',
};

export default function QuickActionsButton({
  classificationId,
  quickActions,
  suggestedResponse,
  onActionComplete,
}: QuickActionsButtonProps) {
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [delegatedTo, setDelegatedTo] = useState('');
  const [customResponse, setCustomResponse] = useState(suggestedResponse || '');
  const { toast } = useToast();

  const executeAction = async (actionType: string) => {
    setIsExecuting(actionType);

    try {
      const response = await fetch('/api/quick-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType,
          classificationId,
          customResponse: customResponse || undefined,
          scheduledTime: actionType === 'schedule' ? scheduledTime : undefined,
          delegatedTo: actionType === 'delegate' ? delegatedTo : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute action');
      }

      const result = await response.json();

      toast({
        title: 'Action executed successfully',
        description: `${actionType} action completed`,
      });

      onActionComplete?.(actionType, result);

      // Reset modals
      setShowScheduleModal(false);
      setShowDelegateModal(false);
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: 'Action failed',
        description: 'Failed to execute the quick action',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(null);
    }
  };

  const handleActionClick = (actionType: string) => {
    switch (actionType) {
      case 'schedule':
        setShowScheduleModal(true);
        break;
      case 'delegate':
        setShowDelegateModal(true);
        break;
      case 'accept':
      case 'decline':
      case 'follow_up':
      case 'archive':
        executeAction(actionType);
        break;
      default:
        executeAction(actionType);
    }
  };

  if (!quickActions || quickActions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => {
          const Icon = actionIcons[action.type];
          return (
            <Button
              key={action.type}
              size="sm"
              variant="outline"
              className={`text-xs ${actionColors[action.type]} text-white hover:text-white`}
              onClick={() => handleActionClick(action.type)}
              disabled={isExecuting === action.type}
            >
              {isExecuting === action.type ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
              ) : (
                <Icon className="h-3 w-3 mr-1" />
              )}
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Suggested Response */}
      {suggestedResponse && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="h-4 w-4" />
              Suggested Response
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowResponse(!showResponse)}>
                {showResponse ? 'Hide' : 'Show'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showResponse && (
            <CardContent>
              <div className="space-y-3">
                <textarea
                  value={customResponse}
                  onChange={(e) => setCustomResponse(e.target.value)}
                  className="w-full p-3 border rounded-md text-sm resize-none"
                  rows={4}
                  placeholder="Edit the suggested response..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const acceptAction =
                        quickActions.find((a) => a.type === 'accept') ||
                        quickActions.find((a) => a.type === 'follow_up');
                      if (acceptAction) {
                        executeAction(acceptAction.type);
                      }
                    }}
                    className="bg-[#FF3366] hover:bg-[#E63946] text-white"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Response
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCustomResponse(suggestedResponse)}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <Card className="mt-4 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Schedule Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => executeAction('schedule')}
                  disabled={!scheduledTime}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Schedule
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delegate Modal */}
      {showDelegateModal && (
        <Card className="mt-4 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Delegate Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Delegate To</label>
                <input
                  type="text"
                  value={delegatedTo}
                  onChange={(e) => setDelegatedTo(e.target.value)}
                  placeholder="Email address or name"
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => executeAction('delegate')}
                  disabled={!delegatedTo}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Delegate
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDelegateModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
