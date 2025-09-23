import { supabase } from './db';

export interface ClientHealthScore {
  id?: string;
  user_id: string;
  contact_email: string;
  contact_name?: string;
  company?: string;
  health_score: number;
  response_time_avg: number;
  sentiment_score: number;
  email_frequency: number;
  last_interaction: string;
  relationship_trend: 'improving' | 'stable' | 'declining' | 'critical';
  response_pattern?: Record<string, string | number | boolean>;
  interaction_quality?: Record<string, string | number | boolean>;
  risk_factors?: Record<string, string | number | boolean>;
  created_at?: string;
  updated_at?: string;
}

export interface ResponsePattern {
  id?: string;
  user_id: string;
  contact_domain: string;
  day_of_week: number;
  time_of_day: number;
  avg_response_time: number;
  response_count: number;
  prediction_accuracy: number;
  confidence_score: number;
  seasonal_factor: number;
  priority_factor: number;
  pattern_data?: Record<string, string | number | boolean>;
  created_at?: string;
  updated_at?: string;
}

export interface PredictiveRecommendation {
  id?: string;
  user_id: string;
  recommendation_type: 'optimal_response_time' | 'client_outreach' | 'relationship_improvement' | 'risk_mitigation';
  contact_email?: string;
  contact_domain?: string;
  title: string;
  description: string;
  confidence_score: number;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  action_required: string;
  expected_impact?: string;
  implementation_steps?: string[];
  status: 'pending' | 'acknowledged' | 'implemented' | 'dismissed';
  created_at?: string;
  expires_at?: string;
  acknowledged_at?: string;
}

export interface HealthScoreBreakdown {
  response_factor: number;
  sentiment_factor: number;
  frequency_factor: number;
  base_score: number;
  final_score: number;
}

export interface PredictiveInsight {
  optimal_response_time: number;
  confidence_score: number;
  best_times_to_respond: string[];
  risk_assessment: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export class ClientHealthService {
  /**
   * Calculate comprehensive client health score
   */
  async calculateHealthScore(
    userId: string,
    contactEmail: string,
    options?: {
      responseTimeAvg?: number;
      sentimentScore?: number;
      emailFrequency?: number;
      existingScore?: number;
    },
  ): Promise<{ score: number; breakdown: HealthScoreBreakdown }> {
    const {
      responseTimeAvg,
      sentimentScore = 0,
      emailFrequency = 0,
      existingScore = 50, // Base score
    } = options || {};

    // Response time factor (0-40 points)
    let responseFactor = 0;
    if (responseTimeAvg !== undefined) {
      if (responseTimeAvg <= 2) responseFactor = 40;
      else if (responseTimeAvg <= 6) responseFactor = 35;
      else if (responseTimeAvg <= 24) responseFactor = 30;
      else if (responseTimeAvg <= 48) responseFactor = 20;
      else if (responseTimeAvg <= 72) responseFactor = 10;
    }

    // Sentiment factor (0-30 points)
    const sentimentFactor = Math.max(0, Math.min(30, (sentimentScore + 1) * 15));

    // Frequency factor (0-30 points)
    let frequencyFactor = 0;
    if (emailFrequency !== undefined) {
      if (emailFrequency >= 5) frequencyFactor = 30;
      else if (emailFrequency >= 3) frequencyFactor = 25;
      else if (emailFrequency >= 1) frequencyFactor = 20;
      else if (emailFrequency >= 0.5) frequencyFactor = 15;
      else frequencyFactor = 5;
    }

    // Calculate final score with smoothing
    const finalScore = Math.max(
      0,
      Math.min(100, existingScore * 0.6 + responseFactor * 0.25 + sentimentFactor * 0.1 + frequencyFactor * 0.05),
    );

    return {
      score: finalScore,
      breakdown: {
        response_factor: responseFactor,
        sentiment_factor: sentimentFactor,
        frequency_factor: frequencyFactor,
        base_score: existingScore,
        final_score: finalScore,
      },
    };
  }

  /**
   * Update client health score with new interaction data
   */
  async updateHealthScore(
    userId: string,
    contactEmail: string,
    interactionData: {
      responseTime?: number;
      sentimentScore?: number;
      classificationId?: string;
    },
  ): Promise<ClientHealthScore> {
    try {
      // Get contact name from email
      const contactName = this.extractNameFromEmail(contactEmail);

      // Calculate email frequency
      const { data: recentEmails, error: emailError } = await supabase
        .from('classifications')
        .select('created_at')
        .eq('user_id', userId)
        .eq('from_email', contactEmail)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      const emailFrequency = emailError || !recentEmails ? 0 : recentEmails.length / 52;

      // Calculate new health score
      const { score: healthScore } = await this.calculateHealthScore(userId, contactEmail, {
        responseTimeAvg: interactionData.responseTime,
        sentimentScore: interactionData.sentimentScore,
        emailFrequency,
      });

      // Determine relationship trend
      const { data: existingHealth } = await supabase
        .from('client_health_scores')
        .select('health_score')
        .eq('user_id', userId)
        .eq('contact_email', contactEmail)
        .single();

      let relationshipTrend: 'improving' | 'stable' | 'declining' | 'critical' = 'stable';
      if (existingHealth) {
        if (healthScore > existingHealth.health_score + 5) {
          relationshipTrend = 'improving';
        } else if (healthScore < existingHealth.health_score - 5) {
          relationshipTrend = 'declining';
          if (healthScore < 40) relationshipTrend = 'critical';
        }
      }

      // Calculate risk factors
      const riskFactors = this.calculateRiskFactors({
        healthScore,
        responseTime: interactionData.responseTime,
        sentiment: interactionData.sentimentScore,
        frequency: emailFrequency,
      });

      // Update or insert health score
      const { data: healthRecord, error: healthError } = await supabase
        .from('client_health_scores')
        .upsert({
          user_id: userId,
          contact_email: contactEmail,
          contact_name: contactName,
          health_score: healthScore,
          response_time_avg: interactionData.responseTime || 0,
          sentiment_score: interactionData.sentimentScore || 0,
          email_frequency: emailFrequency,
          last_interaction: new Date().toISOString(),
          relationship_trend: relationshipTrend,
          risk_factors: riskFactors,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (healthError) throw healthError;

      // Update response patterns for predictive intelligence
      if (interactionData.responseTime) {
        await this.updateResponsePatterns(userId, contactEmail, interactionData.responseTime);
      }

      return healthRecord;
    } catch (error) {
      console.error('Error updating health score:', error);
      throw error;
    }
  }

  /**
   * Get all client health scores for a user with analytics
   */
  async getClientHealthScores(userId: string): Promise<{
    scores: ClientHealthScore[];
    analytics: {
      totalContacts: number;
      averageHealthScore: number;
      criticalRelationships: number;
      improvingRelationships: number;
      decliningRelationships: number;
    };
  }> {
    try {
      const { data: scores, error } = await supabase
        .from('client_health_scores')
        .select('*')
        .eq('user_id', userId)
        .order('health_score', { ascending: false });

      if (error) {
        console.error('Database error fetching client health scores:', error);
        // Return default values instead of throwing
        return {
          scores: [],
          analytics: {
            totalContacts: 0,
            averageHealthScore: 0,
            criticalRelationships: 0,
            improvingRelationships: 0,
            decliningRelationships: 0,
          },
        };
      }

      // Handle case where no scores exist yet
      if (!scores || scores.length === 0) {
        return {
          scores: [],
          analytics: {
            totalContacts: 0,
            averageHealthScore: 0,
            criticalRelationships: 0,
            improvingRelationships: 0,
            decliningRelationships: 0,
          },
        };
      }

      const analytics = {
        totalContacts: scores.length,
        averageHealthScore: scores.reduce((sum, score) => sum + score.health_score, 0) / scores.length || 0,
        criticalRelationships: scores.filter((s) => s.relationship_trend === 'critical').length,
        improvingRelationships: scores.filter((s) => s.relationship_trend === 'improving').length,
        decliningRelationships: scores.filter((s) => s.relationship_trend === 'declining').length,
      };

      return { scores, analytics };
    } catch (error) {
      console.error('Error getting client health scores:', error);
      // Return default values instead of throwing
      return {
        scores: [],
        analytics: {
          totalContacts: 0,
          averageHealthScore: 0,
          criticalRelationships: 0,
          improvingRelationships: 0,
          decliningRelationships: 0,
        },
      };
    }
  }

  /**
   * Get predictive insights for a specific contact
   */
  async getPredictiveInsights(userId: string, contactEmail: string): Promise<PredictiveInsight> {
    try {
      const contactDomain = contactEmail.split('@')[1];

      // Get response patterns for this domain
      const { data: patterns, error: patternError } = await supabase
        .from('response_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_domain', contactDomain)
        .gte('confidence_score', 0.5)
        .order('confidence_score', { ascending: false });

      if (patternError) throw patternError;

      // Calculate optimal response time
      const optimalResponseTime =
        patterns.length > 0
          ? patterns.reduce((sum, pattern) => sum + pattern.avg_response_time, 0) / patterns.length
          : 24; // Default 24 hours

      // Get best times to respond based on patterns
      const bestTimes = this.analyzeBestResponseTimes(patterns);

      // Assess risk based on response patterns
      const riskAssessment = this.assessResponseRisk(patterns);

      // Generate recommendations
      const recommendations = await this.generateContactRecommendations(userId, contactEmail);

      return {
        optimal_response_time: optimalResponseTime,
        confidence_score: patterns.length > 0 ? patterns[0].confidence_score : 0.5,
        best_times_to_respond: bestTimes,
        risk_assessment: riskAssessment,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting predictive insights:', error);
      throw error;
    }
  }

  /**
   * Get predictive recommendations for a user
   */
  async getRecommendations(userId: string): Promise<PredictiveRecommendation[]> {
    try {
      const { data: recommendations, error } = await supabase
        .from('predictive_recommendations')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'acknowledged'])
        .order('priority_level', { ascending: false })
        .order('confidence_score', { ascending: false });

      if (error) {
        console.error('Database error fetching recommendations:', error);
        return [];
      }

      // Handle case where no recommendations exist
      if (!recommendations || recommendations.length === 0) {
        return [];
      }

      // Filter out expired recommendations
      const now = new Date();
      return recommendations.filter((rec) => !rec.expires_at || new Date(rec.expires_at) > now);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Update response patterns for predictive intelligence
   */
  private async updateResponsePatterns(userId: string, contactEmail: string, responseTime: number): Promise<void> {
    try {
      const contactDomain = contactEmail.split('@')[1];
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hourOfDay = now.getHours();

      // Check if pattern exists
      const { data: existingPattern } = await supabase
        .from('response_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_domain', contactDomain)
        .eq('day_of_week', dayOfWeek)
        .eq('time_of_day', hourOfDay)
        .single();

      const learningRate = 0.1;

      if (existingPattern) {
        // Update existing pattern with exponential moving average
        const newAvgResponseTime = existingPattern.avg_response_time * (1 - learningRate) + responseTime * learningRate;
        const newConfidence = Math.min(1, existingPattern.confidence_score + learningRate * 0.1);

        await supabase
          .from('response_patterns')
          .update({
            avg_response_time: newAvgResponseTime,
            response_count: existingPattern.response_count + 1,
            confidence_score: newConfidence,
            updated_at: now.toISOString(),
          })
          .eq('id', existingPattern.id);
      } else {
        // Create new pattern
        await supabase.from('response_patterns').insert({
          user_id: userId,
          contact_domain: contactDomain,
          day_of_week: dayOfWeek,
          time_of_day: hourOfDay,
          avg_response_time: responseTime,
          response_count: 1,
          confidence_score: 0.5,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating response patterns:', error);
      throw error;
    }
  }

  /**
   * Calculate risk factors for a client relationship
   */
  private calculateRiskFactors(data: {
    healthScore: number;
    responseTime?: number;
    sentiment?: number;
    frequency: number;
  }): Record<string, string | number | boolean | Array<{ description: string; severity: string }>> {
    const riskFactors: Record<string, string | number | boolean | Array<{ description: string; severity: string }>> = {
      overall_risk: 'low',
      factors: [],
    };

    // Health score risk
    if (data.healthScore < 40) {
      riskFactors.overall_risk = 'high';
      (riskFactors.factors as Array<{ description: string; severity: string }>).push({
        description: `Low health score: ${data.healthScore}`,
        severity: 'high',
      });
    } else if (data.healthScore < 60) {
      riskFactors.overall_risk = 'medium';
      (riskFactors.factors as Array<{ description: string; severity: string }>).push({
        description: `Low health score: ${data.healthScore}`,
        severity: 'medium',
      });
    }

    // Response time risk
    if (data.responseTime && data.responseTime > 48) {
      riskFactors.overall_risk = riskFactors.overall_risk === 'high' ? 'high' : 'medium';
      (riskFactors.factors as Array<{ description: string; severity: string }>).push({
        description: `Slow response time: ${data.responseTime}h`,
        severity: 'medium',
      });
    }

    // Sentiment risk
    if (data.sentiment && data.sentiment < -0.3) {
      riskFactors.overall_risk = riskFactors.overall_risk === 'high' ? 'high' : 'medium';
      (riskFactors.factors as Array<{ description: string; severity: string }>).push({
        description: `Negative sentiment: ${data.sentiment}`,
        severity: 'high',
      });
    }

    // Frequency risk
    if (data.frequency < 0.5) {
      (riskFactors.factors as Array<{ description: string; severity: string }>).push({
        description: `Low email frequency: ${data.frequency}/month`,
        severity: 'low',
      });
    }

    return riskFactors;
  }

  /**
   * Analyze best response times based on patterns
   */
  private analyzeBestResponseTimes(patterns: ResponsePattern[]): string[] {
    if (patterns.length === 0) return [];

    // Group patterns by day and find best hours
    const bestTimes: string[] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    patterns.forEach((pattern) => {
      if (pattern.avg_response_time <= 24 && pattern.confidence_score >= 0.6) {
        const dayName = days[pattern.day_of_week];
        const hour = pattern.time_of_day;
        const timeLabel = hour >= 12 ? (hour > 12 ? `${hour - 12} PM` : '12 PM') : hour === 0 ? '12 AM' : `${hour} AM`;

        bestTimes.push(`${dayName} ${timeLabel}`);
      }
    });

    return [...new Set(bestTimes)].slice(0, 5); // Return top 5 unique times
  }

  /**
   * Assess response risk based on patterns
   */
  private assessResponseRisk(patterns: ResponsePattern[]): 'low' | 'medium' | 'high' {
    if (patterns.length === 0) return 'medium';

    const avgResponseTime = patterns.reduce((sum, p) => sum + p.avg_response_time, 0) / patterns.length;
    const confidence = patterns[0].confidence_score;

    if (avgResponseTime > 48 && confidence > 0.7) return 'high';
    if (avgResponseTime > 24 && confidence > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generate contact-specific recommendations
   */
  private async generateContactRecommendations(userId: string, contactEmail: string): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      // Get health score for this contact
      const { data: healthScore } = await supabase
        .from('client_health_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_email', contactEmail)
        .single();

      if (healthScore) {
        if (healthScore.health_score < 50) {
          recommendations.push('Consider reaching out to improve the relationship');
          recommendations.push('Review recent communication patterns');
        }

        if (healthScore.response_time_avg > 24) {
          recommendations.push('Aim to respond within 24 hours for better satisfaction');
        }

        if (healthScore.sentiment_score < 0) {
          recommendations.push('Focus on more positive and engaging communication');
        }
      }

      // Get response patterns
      const contactDomain = contactEmail.split('@')[1];
      const { data: patterns } = await supabase
        .from('response_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_domain', contactDomain);

      if (patterns && patterns.length > 0) {
        const avgResponseTime = patterns.reduce((sum, p) => sum + p.avg_response_time, 0) / patterns.length;
        if (avgResponseTime > 48) {
          recommendations.push('Set up email notifications for faster responses');
        }
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string {
    // Remove "Name <email@domain.com>" format
    const nameMatch = email.match(/^([^<]+)</);
    if (nameMatch) return nameMatch[1].trim();

    // Extract from email local part
    const emailMatch = email.match(/([^@<]+)@/);
    if (emailMatch) {
      return emailMatch[1].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return '';
  }

  /**
   * Acknowledge a recommendation
   */
  async acknowledgeRecommendation(recommendationId: string): Promise<void> {
    try {
      await supabase
        .from('predictive_recommendations')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);
    } catch (error) {
      console.error('Error acknowledging recommendation:', error);
      throw error;
    }
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(recommendationId: string): Promise<void> {
    try {
      await supabase.from('predictive_recommendations').update({ status: 'dismissed' }).eq('id', recommendationId);
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      throw error;
    }
  }

  /**
   * Get client health information for a specific email sender
   */
  async getClientHealthForEmail(
    userId: string,
    fromEmail: string,
  ): Promise<{
    clientHealth?: ClientHealthScore;
    recommendations?: PredictiveRecommendation[];
    insights?: {
      relationshipStatus: string;
      suggestedActions: string[];
      riskLevel: 'low' | 'medium' | 'high';
    };
  }> {
    try {
      // Extract email address from "Name <email@domain.com>" format
      const emailMatch = fromEmail.match(/<([^>]+)>/) || [fromEmail, fromEmail];
      const email = emailMatch[1];

      // Get existing client health record
      const { data: clientHealth } = await supabase
        .from('client_health_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_email', email)
        .single();

      // Get active recommendations for this contact
      const { data: recommendations } = await supabase
        .from('predictive_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_email', email)
        .in('status', ['pending', 'acknowledged'])
        .order('priority_level', { ascending: false });

      // Generate insights
      const insights = this.generateInsights(clientHealth, recommendations || []);

      return {
        clientHealth: clientHealth || undefined,
        recommendations: recommendations || [],
        insights,
      };
    } catch (error) {
      console.error('Error getting client health for email:', error);

      // Return basic insights for new contacts
      return {
        clientHealth: undefined,
        recommendations: [],
        insights: {
          relationshipStatus: 'New Contact',
          suggestedActions: [
            'Send a friendly response to establish relationship',
            'Track response time for future insights',
          ],
          riskLevel: 'low',
        },
      };
    }
  }

  /**
   * Generate insights based on client health and recommendations
   */
  private generateInsights(
    clientHealth?: ClientHealthScore,
    recommendations: PredictiveRecommendation[] = [],
  ): {
    relationshipStatus: string;
    suggestedActions: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    if (!clientHealth) {
      return {
        relationshipStatus: 'New Contact',
        suggestedActions: [
          'Send a friendly response to establish relationship',
          'Track response time for future insights',
        ],
        riskLevel: 'low',
      };
    }

    const { health_score, relationship_trend } = clientHealth;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let relationshipStatus = 'Healthy';
    const suggestedActions: string[] = [];

    // Determine risk level and status
    if (health_score >= 80) {
      relationshipStatus = 'Excellent';
      suggestedActions.push('Maintain current engagement level');
    } else if (health_score >= 60) {
      relationshipStatus = 'Good';
      suggestedActions.push('Consider increasing communication frequency');
    } else if (health_score >= 40) {
      relationshipStatus = 'Needs Attention';
      riskLevel = 'medium';
      suggestedActions.push('Reach out to re-engage the contact');
      suggestedActions.push('Review recent interactions for issues');
    } else {
      relationshipStatus = 'At Risk';
      riskLevel = 'high';
      suggestedActions.push('Immediate outreach recommended');
      suggestedActions.push('Consider offering additional value or support');
    }

    // Add trend-based actions
    if (relationship_trend === 'declining') {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      suggestedActions.push('Investigate reasons for declining relationship');
    } else if (relationship_trend === 'improving') {
      suggestedActions.push('Continue current successful approach');
    }

    // Add recommendation-based actions
    recommendations.forEach((rec) => {
      if (rec.priority_level === 'high' || rec.priority_level === 'critical') {
        suggestedActions.push(rec.action_required);
      }
    });

    return {
      relationshipStatus,
      suggestedActions: suggestedActions.slice(0, 5), // Limit to top 5 actions
      riskLevel,
    };
  }
}

export const clientHealthService = new ClientHealthService();
