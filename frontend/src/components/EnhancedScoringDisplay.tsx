/**
 * Enhanced Scoring Display Component
 *
 * Displays detailed scoring information from the enhanced scoring system
 * including step breakdown, penalties, bonuses, and attempt tracking
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Trophy, Target, TrendingDown } from 'lucide-react';
import { EnhancedScoringData, StepScoreBreakdown, ValidationTrackingInfo } from '@/types/enhanced-scoring';

interface EnhancedScoringDisplayProps {
  enhancedScoring?: EnhancedScoringData;
  tracking: ValidationTrackingInfo;
  totalSteps: number;
  passedSteps: number;
  isVisible?: boolean;
}

export const EnhancedScoringDisplay: React.FC<EnhancedScoringDisplayProps> = ({
  enhancedScoring,
  tracking,
  totalSteps,
  passedSteps,
  isVisible = true
}) => {
  if (!isVisible || !enhancedScoring) {
    return null;
  }

  const {
    scorePercent,
    finalScore,
    basePoints,
    attemptNumber,
    penaltyApplied,
    bonusApplied,
    minimumFloorApplied,
    stepBreakdown
  } = enhancedScoring;

  const successRate = (passedSteps / totalSteps) * 100;

  return (
    <Card className="w-full mt-4 bg-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-blue-500" />
          Enhanced Scoring Results
          <Badge variant={bonusApplied ? "default" : "secondary"} className="ml-auto">
            Attempt {attemptNumber}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {finalScore.toFixed(1)}
            </div>
            <div className="text-sm text-blue-600">
              Final Score
            </div>
            <div className="text-xs text-blue-500">
              out of {basePoints} points
            </div>
          </div>

          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {scorePercent.toFixed(1)}%
            </div>
            <div className="text-sm text-green-600">
              Score Percentage
            </div>
            <div className="text-xs text-green-500">
              {passedSteps}/{totalSteps} steps passed
            </div>
          </div>

          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {tracking.remainingAttempts}
            </div>
            <div className="text-sm text-purple-600">
              Attempts Left
            </div>
            <div className="text-xs text-purple-500">
              of {tracking.remainingAttempts + attemptNumber} total
            </div>
          </div>
        </div>
        {/* Scoring Modifiers */}
        <div className="flex flex-wrap gap-2">
          {bonusApplied && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <Trophy className="h-3 w-3 mr-1" />
              First Attempt Bonus
            </Badge>
          )}

          {penaltyApplied > 0 && (
            <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -{penaltyApplied.toFixed(1)}% Penalty
            </Badge>
          )}

          {minimumFloorApplied && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Minimum Score Applied
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface StepBreakdownItemProps {
  step: StepScoreBreakdown;
  stepIndex: number;
}

const StepBreakdownItem: React.FC<StepBreakdownItemProps> = ({ step, stepIndex }) => {
  const { stepNumber, passed, points, percentage, weight } = step;

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          Step {stepNumber}
        </span>
        <Badge variant="outline" className="text-xs">
          Weight: {weight.toFixed(1)}%
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {percentage.toFixed(1)}%
        </span>
        <span className="text-gray-500">
          ({points.toFixed(2)} pts)
        </span>
      </div>
    </div>
  );
};

export default EnhancedScoringDisplay;
