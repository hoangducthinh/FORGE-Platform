'use client';

import { useState, useEffect } from 'react';
import { CustomerScenario, SalesSession } from '@/lib/types';
import { ConversationSimulator } from './ConversationSimulator';
import { SALES_SCENARIOS } from '@/lib/sales-simulator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Play, RotateCcw } from 'lucide-react';
import { stopCurrentAudio } from '@/lib/voice-utils';

interface SimulatorLessonProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
  scenarioType?: CustomerScenario;
  productName?: string;
  onLessonComplete?: (session: SalesSession) => void;
}

export function SimulatorLesson({
  lessonId,
  lessonTitle,
  lessonContent,
  scenarioType = 'random',
  productName = 'Căn hộ cao cấp',
  onLessonComplete,
}: SimulatorLessonProps) {
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<CustomerScenario>(scenarioType);
  const [sessionMetrics, setSessionMetrics] = useState<any>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<CustomerScenario | null>(null);
  const [turnScores, setTurnScores] = useState<number[]>([]);
  const [finalSessionScore, setFinalSessionScore] = useState<number>(0);

  const scenario = SALES_SCENARIOS[currentScenario];
  const scenarioOptions: CustomerScenario[] = ['skeptical', 'warm_lead', 'random'];

  const getInitialMessage = (): string => {
    return scenario.initialObjection || "Chào bạn, tôi muốn tìm hiểu thêm về dự án.";
  };

  const handleStartSimulation = (chosen?: CustomerScenario) => {
    if (chosen) {
      setCurrentScenario(chosen);
      setSelectedScenario(chosen);
    }
    setSimulationStarted(true);
    setSessionMetrics(null);
    setConversationMessages([]);
    setTurnScores([]);
    setFinalSessionScore(0);
  };

  const handleResetSimulation = () => {
    stopCurrentAudio(); // Stop any ongoing audio
    setSimulationStarted(false);
    setSelectedScenario(null);
    setSessionMetrics(null);
    setConversationMessages([]);
    setTurnScores([]);
    setFinalSessionScore(0);
  };

  const handleMetricsUpdate = (metrics: any) => {
    setSessionMetrics(metrics);
    if (metrics.turnScore !== undefined) {
      setTurnScores((prev) => [...prev, metrics.turnScore]);
    }
    if (metrics.finalSessionScore !== undefined) {
      setFinalSessionScore(metrics.finalSessionScore);
    }
  };

  if (!simulationStarted) {
    return (
      <div className="space-y-6 max-w-4xl">
        {/* Lesson Overview */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
            <CardTitle>{lessonTitle}</CardTitle>
            <CardDescription className="text-orange-100">
              Interactive Sales Training Simulation
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: lessonContent }}
            />
          </CardContent>
        </Card>

        {/* Scenario Selection */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Choose Your Challenge</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarioOptions.map((scenario) => {
              const scenarioData = SALES_SCENARIOS[scenario];
              return (
                <Card
                  key={scenario}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedScenario === scenario ? 'ring-2 ring-orange-600 shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900">
                      {scenarioData.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{scenarioData.customerPersonality}</p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Initial Objection:</p>
                      <p className="text-xs text-gray-600 italic">
                        "{scenarioData.initialObjection}"
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-gray-700 mb-2">Win Conditions:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {scenarioData.winConditions.slice(0, 2).map((condition, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-orange-600">•</span>
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => {
              // Reset selection
              setSelectedScenario(null);
            }}
            disabled={!selectedScenario}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Selection
          </Button>
          <Button
            onClick={() => handleStartSimulation(selectedScenario || 'random')}
            disabled={!selectedScenario}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Sales Simulation
          </Button>
        </div>
      </div>
    );
  }

  // Simulation in progress
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{lessonTitle}</h2>
          <p className="text-gray-600">Scenario: {scenario.name}</p>
        </div>
        <Button
          onClick={handleResetSimulation}
          variant="outline"
          className="border-orange-600 text-orange-600 hover:bg-orange-50"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>

      <ConversationSimulator
        scenario={currentScenario}
        productName={productName}
        initialMessage={getInitialMessage()}
        onConversationUpdate={setConversationMessages}
        onMetricsUpdate={handleMetricsUpdate}
      />

      {/* Debrief Section */}
      {conversationMessages.length > 4 && sessionMetrics && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900">Simulation Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-orange-900 mb-2">Key Takeaways</p>
              <ul className="text-sm text-orange-800 space-y-1">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Your conviction rate ({Math.round(sessionMetrics.convictionRate)}%) shows how
                    well you're persuading the customer
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Your session average score is {Math.round(finalSessionScore)}/100
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Focus on specific benefits and examples to increase pitch quality
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    Address objections directly rather than avoiding them
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
