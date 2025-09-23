export interface PriorityContact {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  company?: string;
  domain?: string;
  priority_level: 'client' | 'vip' | 'standard' | 'low';
  response_deadline_hours: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PriorityDomain {
  id: string;
  user_id: string;
  domain: string;
  company_name?: string;
  priority_level: 'client' | 'vip' | 'standard' | 'low';
  response_deadline_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUpTask {
  id: string;
  user_id: string;
  classification_id: string;
  email_id: string;
  subject: string;
  from_email: string;
  priority_level: 'client' | 'vip' | 'urgent' | 'standard' | 'low';
  response_deadline: string;
  status: 'pending' | 'completed' | 'overdue' | 'snoozed';
  reminder_sent: boolean;
  escalation_sent: boolean;
  completed_at?: string;
  snoozed_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResponseAnalytics {
  id: string;
  user_id: string;
  email_id: string;
  classification_id: string;
  from_email: string;
  priority_level: string;
  response_deadline: string;
  actual_response_time: string;
  response_duration_hours: number;
  met_deadline: boolean;
  created_at: string;
}

export interface UserPriorityPreferences {
  id?: string;
  user_id: string;
  client_deadline_hours: number;
  urgent_deadline_hours: number;
  standard_deadline_hours: number;
  low_deadline_hours: number;
  enable_escalation_emails: boolean;
  enable_reminder_emails: boolean;
  reminder_hours_before: number;
  auto_categorize?: boolean;
  auto_respond?: boolean;
  response_tone?: 'professional' | 'casual' | 'formal';
  notification_enabled?: boolean;
  deadline_reminder_hours?: number;
  max_emails_per_day?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PriorityStats {
  clientEmails: number;
  urgentEmails: number;
  overdueEmails: number;
  todayDeadlines: number;
  avgResponseTime: number;
  complianceRate: number;
  totalProcessed: number;
  thisWeekProcessed: number;
  thisMonthProcessed: number;
}

export interface PriorityClassification {
  id: string;
  user_id: string;
  email_id: string;
  subject: string;
  body: string;
  from_email: string;
  category: 'Urgent' | 'Request' | 'Question' | 'Update' | 'Spam';
  priority: number;
  deadline?: string | null;
  keywords: string[];
  confidence: number;
  processed_at: string;

  // Enhanced fields
  business_priority: number;
  action_items: string[];
  deadlines: string[];
  business_context: Record<string, unknown>;
  quick_actions: string[];
  follow_up_required: boolean;
  response_complexity: 'simple' | 'moderate' | 'complex';
  estimated_time: number;

  // Priority tiering system
  priority_level: 'client' | 'vip' | 'urgent' | 'standard' | 'low';
  priority_deadline?: string;
  response_status: 'pending' | 'completed' | 'overdue';
}

export interface ClientHealthScore {
  id: string;
  user_id: string;
  contact_email: string;
  contact_name?: string;
  company?: string;
  domain?: string;
  health_score: number;
  response_time_avg: number;
  sentiment_score: number;
  email_frequency: number;
  last_interaction: string;
  relationship_trend: 'improving' | 'stable' | 'declining' | 'critical';
  response_pattern?: Record<string, string | number | boolean>;
  interaction_quality?: Record<string, string | number | boolean>;
  risk_factors?: {
    overall_risk?: string;
    factors?: Array<{ description: string; severity: string }>;
    [key: string]: string | number | boolean | Array<{ description: string; severity: string }> | undefined;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PredictiveRecommendation {
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
