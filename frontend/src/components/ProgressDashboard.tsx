'use client';

import React, { useState, useEffect } from 'react';
import { enhancedLabService, LearningInsights, ProgressSession } from '../services/EnhancedLabService';

export interface ProgressDashboardProps {
  userId: string;
  labId: string;
  className?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userId,
  labId,
  className = '',
}) => {
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [session, setSession] = useState<ProgressSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Set up connection status listener
    const handleConnectionStatus = (status: { connected: boolean }) => {
      setIsConnected(status.connected);
    };

    // Set up insights listener
    const handleLearningInsights = (data: LearningInsights) => {
      setInsights(data);
      setLoading(false);
    };

    // Set up error listener
    const handleInsightsError = (error: any) => {
      setError(error.message || 'Failed to load insights');
      setLoading(false);
    };

    // Add event listeners
    enhancedLabService.on('connection-status', handleConnectionStatus);
    enhancedLabService.on('learning-insights', handleLearningInsights);
    enhancedLabService.on('insights-error', handleInsightsError);

    // Initialize connection and fetch data
    const initializeService = async () => {
      try {
        if (!enhancedLabService.isConnected) {
          await enhancedLabService.authenticate(userId);
        }

        // Fetch learning insights
        await enhancedLabService.getLearningInsights(labId);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to lab service');
        setLoading(false);
      }
    };

    initializeService();

    // Cleanup listeners on unmount
    return () => {
      enhancedLabService.off('connection-status', handleConnectionStatus);
      enhancedLabService.off('learning-insights', handleLearningInsights);
      enhancedLabService.off('insights-error', handleInsightsError);
    };
  }, [userId, labId]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getCompletionStatusColor = (rate: number): string => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Progress</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <p className="text-gray-500 text-center">No progress data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Learning Progress</h2>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-900">Total Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatTime(insights.totalTimeSpent)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-900">Completion Rate</p>
                <p className={`text-2xl font-bold ${getCompletionStatusColor(insights.completionRate)}`}>
                  {insights.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-900">Average Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {insights.averageScore.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-900">Avg Task Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatTime(Math.round(insights.averageTaskTime))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{insights.completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getScoreColor(insights.completionRate)}`}
              style={{ width: `${Math.min(insights.completionRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Topics Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Struggling Topics */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Improvement</h3>
            {insights.strugglingTopics.length > 0 ? (
              <div className="space-y-2">
                {insights.strugglingTopics.slice(0, 5).map((topic, index) => (
                  <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-3 text-sm text-red-800">{topic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                Great job! No struggling topics identified.
              </p>
            )}
          </div>

          {/* Strong Topics */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Strong Areas</h3>
            {insights.strongTopics.length > 0 ? (
              <div className="space-y-2">
                {insights.strongTopics.slice(0, 5).map((topic, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-3 text-sm text-green-800">{topic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                Keep working to identify your strong areas!
              </p>
            )}
          </div>
        </div>

        {/* Learning Streak */}
        {insights.streak > 0 && (
          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Learning Streak</p>
                <p className="text-lg font-bold text-yellow-700">{insights.streak} days</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
