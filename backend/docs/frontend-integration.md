# Frontend Integration Guide: Enhanced Lab Progress & Real-time Analytics

## 🚀 Overview

This guide shows how to integrate the enhanced lab progress persistence and real-time analytics features with your frontend application.

## 📡 WebSocket Events

### Enhanced Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

interface EnhancedLabConnection {
  socket: Socket;
  userId: string;
  currentSession?: string;
  isAuthenticated: boolean;
}

class EnhancedLabService {
  private socket: Socket;
  private userId: string;
  private currentSessionId?: string;

  constructor(serverUrl: string, userId: string) {
    this.socket = io(serverUrl);
    this.userId = userId;
    this.setupEventHandlers();
  }

  // Authenticate user and enable enhanced features
  authenticate(token?: string) {
    this.socket.emit('user-authenticate', {
      userId: this.userId,
      token
    });
  }

  // Start a lab session with progress tracking
  async startLabSession(labId: string, enrollmentId: string) {
    return new Promise((resolve, reject) => {
      this.socket.emit('start-lab-session', {
        userId: this.userId,
        labId,
        enrollmentId
      });

      this.socket.once('lab-session-started', (data) => {
        this.currentSessionId = data.sessionId;
        resolve(data);
      });

      this.socket.once('lab-session-error', (error) => {
        reject(error);
      });
    });
  }

  // Enhanced task validation with step-by-step progress
  async validateTaskEnhanced(taskId: string, labId: string, validationData: any) {
    return new Promise((resolve, reject) => {
      this.socket.emit('validate-task-enhanced', {
        userId: this.userId,
        taskId,
        attemptId: 'auto-generated', // Will be created by backend
        validationData
      });

      // Listen for validation progress
      this.socket.on('validation-enhanced-start', (data) => {
        console.log('Validation started:', data);
        // Update UI with total steps
      });

      this.socket.on('validation-step-progress', (data) => {
        console.log('Step progress:', data);
        // Update progress bar
      });

      this.socket.on('validation-step-complete', (data) => {
        console.log('Step completed:', data);
        // Update step status in UI
      });

      this.socket.on('validation-enhanced-complete', (data) => {
        console.log('Validation complete:', data);
        resolve(data);
      });

      this.socket.once('validation-error', (error) => {
        reject(error);
      });
    });
  }

  // Request learning insights
  requestLearningInsights(labId: string) {
    this.socket.emit('get-learning-insights', {
      userId: this.userId,
      labId
    });
  }

  // Track command execution for analytics
  trackCommand(command: string, output?: string, exitCode?: number) {
    this.socket.emit('command-executed', {
      userId: this.userId,
      command,
      output,
      exitCode
    });
  }

  // Request hint with tracking
  requestHint(taskId: string, attemptId?: string) {
    this.socket.emit('request-hint', {
      userId: this.userId,
      taskId,
      attemptId
    });
  }

  private setupEventHandlers() {
    // Real-time analytics updates
    this.socket.on('real-time-analytics', (analytics) => {
      console.log('Analytics update:', analytics);
      // Update dashboard if admin
    });

    // Learning insights response
    this.socket.on('learning-insights', (insights) => {
      console.log('Learning insights:', insights);
      // Update user progress dashboard
    });

    // Dashboard updates
    this.socket.on('dashboard-update', (data) => {
      console.log('Dashboard update:', data);
      // Update general dashboard stats
    });

    // Connection status
    this.socket.on('connected', (data) => {
      console.log('Connected with features:', data.features);
    });
  }
}
```

## 📊 React Components

### 1. Enhanced Progress Dashboard

```typescript
import React, { useState, useEffect } from 'react';
import { EnhancedLabService } from './EnhancedLabService';

interface ProgressDashboardProps {
  userId: string;
  labId: string;
  labService: EnhancedLabService;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userId,
  labId,
  labService
}) => {
  const [insights, setInsights] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();

    // Listen for real-time updates
    labService.socket.on('learning-insights', setInsights);
    labService.socket.on('progress-summary', (data) => {
      setInsights(data.insights);
      setActiveSession(data.activeSession);
    });

    return () => {
      labService.socket.off('learning-insights');
      labService.socket.off('progress-summary');
    };
  }, []);

  const loadProgressData = async () => {
    try {
      // Request current progress summary
      labService.socket.emit('request-progress-summary', { userId, labId });

      // Also load via API for initial data
      const response = await fetch(`/api/progress/insights/${userId}/${labId}`);
      const data = await response.json();

      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading progress...</div>;

  return (
    <div className="progress-dashboard">
      <h2>Your Lab Progress</h2>

      {activeSession && (
        <div className="active-session">
          <h3>Current Session</h3>
          <p>Started: {new Date(activeSession.sessionStart).toLocaleString()}</p>
          <p>Tasks Completed: {activeSession.tasksCompleted}</p>
          <p>Time Spent: {Math.floor(activeSession.totalTimeSpent / 60)} minutes</p>
        </div>
      )}

      {insights && (
        <div className="learning-insights">
          <h3>Learning Insights</h3>
          <div className="metrics">
            <div className="metric">
              <span>Completion Rate</span>
              <span>{insights.completionRate.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span>Average Score</span>
              <span>{insights.averageScore.toFixed(1)}</span>
            </div>
            <div className="metric">
              <span>Total Time</span>
              <span>{Math.floor(insights.totalTimeSpent / 3600)}h {Math.floor((insights.totalTimeSpent % 3600) / 60)}m</span>
            </div>
          </div>

          {insights.strugglingTopics.length > 0 && (
            <div className="struggling-topics">
              <h4>Areas for Improvement</h4>
              <ul>
                {insights.strugglingTopics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.strongTopics.length > 0 && (
            <div className="strong-topics">
              <h4>Strong Areas</h4>
              <ul>
                {insights.strongTopics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 2. Real-time Validation Progress

```typescript
import React, { useState, useEffect } from 'react';

interface ValidationProgressProps {
  labService: EnhancedLabService;
  taskId: string;
  onComplete: (result: any) => void;
}

export const ValidationProgress: React.FC<ValidationProgressProps> = ({
  labService,
  taskId,
  onComplete
}) => {
  const [validationState, setValidationState] = useState({
    isRunning: false,
    steps: [],
    currentStep: 0,
    totalSteps: 0,
    currentScore: 0
  });

  useEffect(() => {
    // Listen for validation events
    labService.socket.on('validation-enhanced-start', (data) => {
      setValidationState({
        isRunning: true,
        steps: data.steps,
        currentStep: 0,
        totalSteps: data.totalSteps,
        currentScore: 0
      });
    });

    labService.socket.on('validation-step-progress', (stepData) => {
      setValidationState(prev => ({
        ...prev,
        currentStep: stepData.progress
      }));
    });

    labService.socket.on('validation-step-complete', (stepData) => {
      setValidationState(prev => ({
        ...prev,
        currentStep: stepData.progress,
        currentScore: stepData.currentScore,
        steps: prev.steps.map(step =>
          step.id === stepData.stepId
            ? { ...step, status: stepData.status, result: stepData.result }
            : step
        )
      }));
    });

    labService.socket.on('validation-enhanced-complete', (result) => {
      setValidationState(prev => ({ ...prev, isRunning: false }));
      onComplete(result);
    });

    return () => {
      labService.socket.off('validation-enhanced-start');
      labService.socket.off('validation-step-progress');
      labService.socket.off('validation-step-complete');
      labService.socket.off('validation-enhanced-complete');
    };
  }, []);

  const startValidation = async (validationData: any) => {
    try {
      await labService.validateTaskEnhanced(taskId, 'EX200', validationData);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div className="validation-progress">
      <h3>Validation Progress</h3>

      {validationState.isRunning && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(validationState.currentStep / validationState.totalSteps) * 100}%`
              }}
            />
          </div>
          <p>
            Step {validationState.currentStep} of {validationState.totalSteps}
            {validationState.currentScore > 0 && ` - Score: ${validationState.currentScore}`}
          </p>
        </div>
      )}

      <div className="validation-steps">
        {validationState.steps.map((step, index) => (
          <div key={step.id} className={`step ${step.status || 'pending'}`}>
            <span className="step-number">{index + 1}</span>
            <span className="step-name">{step.name}</span>
            <span className="step-status">{step.status || 'pending'}</span>
          </div>
        ))}
      </div>

      {!validationState.isRunning && (
        <button
          onClick={() => startValidation({ /* your validation data */ })}
          className="start-validation-btn"
        >
          Start Validation
        </button>
      )}
    </div>
  );
};
```

### 3. Admin Analytics Dashboard

```typescript
import React, { useState, useEffect } from 'react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Subscribe to admin analytics
    const socket = io();

    socket.emit('subscribe-admin-analytics', {
      userId: 'current-user-id',
      isAdmin: true
    });

    socket.on('real-time-analytics', setAnalytics);

    return () => {
      socket.off('real-time-analytics');
      socket.disconnect();
    };
  }, []);

  if (!isAdmin) return <div>Access denied</div>;

  return (
    <div className="admin-dashboard">
      <h2>Live Lab Analytics</h2>

      {analytics && (
        <div className="analytics-grid">
          <div className="metric-card">
            <h3>Active Users</h3>
            <span className="metric-value">{analytics.activeUsers}</span>
          </div>

          <div className="metric-card">
            <h3>Sessions in Progress</h3>
            <span className="metric-value">{analytics.sessionsInProgress}</span>
          </div>

          <div className="metric-card">
            <h3>Tasks Being Attempted</h3>
            <span className="metric-value">{analytics.tasksBeingAttempted}</span>
          </div>

          <div className="metric-card">
            <h3>Average Session Time</h3>
            <span className="metric-value">{analytics.averageSessionTime}min</span>
          </div>

          {analytics.topStrugglingTopics.length > 0 && (
            <div className="struggling-topics-card">
              <h3>Top Struggling Topics</h3>
              <ul>
                {analytics.topStrugglingTopics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {analytics.recentCompletions.length > 0 && (
            <div className="recent-completions-card">
              <h3>Recent Completions</h3>
              <ul>
                {analytics.recentCompletions.map((completion, index) => (
                  <li key={index}>
                    {completion.taskName} - {completion.score}%
                    ({completion.timeAgo})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## 🎯 Integration Checklist

### Frontend Setup
- [ ] Install socket.io-client
- [ ] Implement EnhancedLabService
- [ ] Add progress dashboard components
- [ ] Integrate real-time validation progress
- [ ] Set up admin analytics dashboard

### Backend Verification
- [ ] Enhanced WebSocket Service running
- [ ] Progress API endpoints working
- [ ] Database tables migrated
- [ ] Real-time events logging

### Testing
- [ ] WebSocket connection established
- [ ] Session management working
- [ ] Step-by-step validation tracking
- [ ] Learning insights generation
- [ ] Admin dashboard updates

## 🚀 Next Steps

1. **Database Migration**: Run the progress tables migration
2. **Frontend Integration**: Implement the React components
3. **Real-time Testing**: Test WebSocket events and progress tracking
4. **Analytics Validation**: Verify learning insights calculation
5. **Admin Dashboard**: Set up real-time admin monitoring

Your enhanced lab system is now ready for production with comprehensive progress tracking and real-time analytics! 🎉
