'use client';

import { SalesMetrics, CustomerScenario } from '@/lib/types';
import { TrendingUp, Zap, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SalesMetricsTrackerProps {
  metrics: SalesMetrics;
  scenario: CustomerScenario;
  turnScore?: number;
  finalSessionScore?: number;
  feedback?: string;
}

export function SalesMetricsTracker({ 
  metrics, 
  scenario,
  turnScore = 0,
  finalSessionScore = 0,
  feedback = ''
}: SalesMetricsTrackerProps) {
  const getConvictionColor = (rate: number): string => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const scenarioInfo = {
    skeptical: {
      difficulty: 'Hard',
      target: 'Convince through data and ROI',
      baseTarget: 85,
    },
    warm_lead: {
      difficulty: 'Medium',
      target: 'Demonstrate clear value',
      baseTarget: 70,
    },
    random: {
      difficulty: 'Variable',
      target: 'Adapt to customer needs',
      baseTarget: 75,
    },
  };

  const info = scenarioInfo[scenario];
  const isOnTrack = metrics.convictionRate >= info.baseTarget * 0.7;

  return (
    <div className="space-y-4">
      {/* Conviction Rate */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className={`w-4 h-4 ${getConvictionColor(metrics.convictionRate)}`} />
          <h4 className="font-medium text-gray-900">Conviction Rate</h4>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-gray-900">{Math.round(metrics.convictionRate)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                metrics.convictionRate >= 70
                  ? 'bg-green-600'
                  : metrics.convictionRate >= 40
                  ? 'bg-orange-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${metrics.convictionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Turn Score */}
      <div className={`rounded-lg border border-gray-200 p-4 ${getScoreColor(turnScore)}`}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4" />
          <h4 className="font-medium">Current Turn Score</h4>
        </div>
        <div className="text-3xl font-bold">{Math.round(turnScore)}</div>
        {feedback && (
          <p className="text-xs mt-2 opacity-75">{feedback}</p>
        )}
      </div>

      {/* Final Session Score */}
      <div className={`rounded-lg border border-gray-200 p-4 ${getScoreColor(finalSessionScore)}`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" />
          <h4 className="font-medium">Session Score</h4>
        </div>
        <div className="text-3xl font-bold">{Math.round(finalSessionScore)}</div>
        <p className="text-xs mt-2 opacity-75">Average of all turns</p>
      </div>

      {/* Pitch Quality */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Pitch Quality</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Quality Score:</span>
            <span className="font-medium text-gray-900">{Math.round(metrics.pitchQuality)}/100</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${metrics.pitchQuality}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conversation Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Progress</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Turns:</span>
            <span className="font-medium text-gray-900">{metrics.turnsToClose}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Objections:</span>
            <span className="font-medium text-gray-900">{metrics.keyObjectionsHandled}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Engagement:</span>
            <span className="font-medium text-gray-900">{Math.round(metrics.engagementScore)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
