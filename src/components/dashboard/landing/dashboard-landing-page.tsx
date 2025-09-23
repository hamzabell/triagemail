import { DashboardUsageCardGroup } from '@/components/dashboard/landing/components/dashboard-usage-card-group';
import { DashboardSubscriptionCardGroup } from '@/components/dashboard/landing/components/dashboard-subscription-card-group';
import { DashboardTutorialCard } from '@/components/dashboard/landing/components/dashboard-tutorial-card';
import { DashboardTeamMembersCard } from '@/components/dashboard/landing/components/dashboard-team-members-card';
import { PriorityDashboard } from '@/components/dashboard/priority/priority-dashboard';
import { ClientHealthDashboard } from '@/components/dashboard/client-health/client-health-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Heart, TrendingUp, Target, Clock, Users, Zap, BarChart3, Star, ArrowRight } from 'lucide-react';

export function DashboardLandingPage() {
  return (
    <div className="space-y-6">
      {/* Hero Section - Game-Changing Features */}
      <div className="border rounded-lg p-8 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">The Future of Email Intelligence is Here</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Transform your email from a chore into a strategic advantage with AI-powered relationship intelligence and
            predictive insights that no other email assistant provides.
          </p>
        </div>

        {/* Key Differentiators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-300" />
                <div>
                  <CardTitle className="text-white">Client Health Scoring</CardTitle>
                  <CardDescription className="text-white/80">
                    Know exactly how strong your relationships are
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-white/90">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-300" />
                  0-100 relationship health scores
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-300" />
                  Real-time trend analysis
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-300" />
                  At-risk relationship alerts
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-purple-300" />
                <div>
                  <CardTitle className="text-white">Predictive Intelligence</CardTitle>
                  <CardDescription className="text-white/80">
                    AI that learns your patterns and predicts optimal response times
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-white/90">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-300" />
                  Optimal response time predictions
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-300" />
                  Best communication timing
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-300" />
                  Sentiment analysis & insights
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Explore Your Intelligence Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Client Health Intelligence Section */}
      <div className="border rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Client Health Intelligence™</h2>
              <p className="text-muted-foreground">
                The world&apos;s first AI-powered relationship health scoring system for email
              </p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">NEW</Badge>
        </div>
        <ClientHealthDashboard userId="current-user" />
      </div>

      {/* Priority Management Section */}
      <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Smart Priority Management</h2>
              <p className="text-muted-foreground">
                Never miss a critical deadline with intelligent response optimization
              </p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800">ENTERPRISE-GRADE</Badge>
        </div>
        <PriorityDashboard />
      </div>

      {/* Competitive Advantages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Advanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deep insights into your communication patterns that competitors don&apos;t offer
            </p>
            <ul className="space-y-1 text-xs">
              <li>• Response time optimization</li>
              <li>• Relationship trend analysis</li>
              <li>• Sentiment tracking</li>
              <li>• Predictive recommendations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Machine learning that continuously improves based on your behavior
            </p>
            <ul className="space-y-1 text-xs">
              <li>• Pattern recognition</li>
              <li>• Behavioral analysis</li>
              <li>• Smart recommendations</li>
              <li>• Adaptive learning</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Real-time Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Instant insights that help you make better communication decisions
            </p>
            <ul className="space-y-1 text-xs">
              <li>• Live health monitoring</li>
              <li>• Immediate risk alerts</li>
              <li>• Opportunity detection</li>
              <li>• Performance tracking</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Original Dashboard Content */}
      <div className={'grid flex-1 items-start gap-6 p-0 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}>
        <div className={'grid auto-rows-max items-start gap-6 lg:col-span-2'}>
          <DashboardUsageCardGroup />
          <DashboardSubscriptionCardGroup />
        </div>
        <div className={'grid auto-rows-max items-start gap-6'}>
          <DashboardTeamMembersCard />
          <DashboardTutorialCard />
        </div>
      </div>
    </div>
  );
}
