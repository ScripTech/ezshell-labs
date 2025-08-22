"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Activity,
  Clock,
  Server,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

interface InstanceData {
  instanceId: string;
  state: string;
  publicIp?: string;
  userId?: string;
  labId?: string;
  enrollmentId?: string;
  uptime?: number; // in minutes
  provisionedAt?: string;
  launchTime?: string;
  sessionCost?: number;
  hourlyCost?: number;
}

interface InstanceStats {
  total: number;
  byState: Record<string, number>;
  costs: {
    estimatedHourlyCost: number;
    estimatedDailyCost: number;
    currency: string;
  };
}

const getStateColor = (state: string) => {
  switch (state) {
    case 'running':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'stopped':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'stopping':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'terminated':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatUptime = (minutes: number | null | undefined): string => {
  if (!minutes) return 'N/A';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export default function AWSInstancesMonitorPage() {
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const [instancesResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/aws-instances'),
        fetch('/api/admin/aws-instances/stats'),
      ]);

      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        setInstances(instancesData.data || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runningInstances = instances.filter(i => i.state === 'running');
  const longRunningInstances = runningInstances.filter(i => (i.uptime || 0) > 120); // > 2 hours

  return (
    <div className="px-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Instance Monitor</h1>
          <p className="text-muted-foreground">Real-time AWS EC2 instance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {lastUpdate && (
        <div className="mb-4 text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {/* Real-time Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Instances</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byState.running || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.total} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Long Running</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {longRunningInstances.length}
              </div>
              <p className="text-xs text-muted-foreground">
                over 2 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hourly Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.costs.estimatedHourlyCost}
              </div>
              <p className="text-xs text-muted-foreground">
                estimated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.costs.estimatedDailyCost}
              </div>
              <p className="text-xs text-muted-foreground">
                estimated
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {longRunningInstances.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Long Running Instances Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-3">
              {longRunningInstances.length} instance(s) have been running for over 2 hours.
              Consider reviewing if they are still needed.
            </p>
            <div className="space-y-2">
              {longRunningInstances.map((instance) => (
                <div key={instance.instanceId} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div>
                    <div className="font-mono text-sm">{instance.instanceId}</div>
                    <div className="text-xs text-muted-foreground">
                      User: {instance.userId} | Lab: {instance.labId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatUptime(instance.uptime)}</div>
                    <Badge className={getStateColor(instance.state)}>{instance.state}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* State Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Instance State Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats && Object.entries(stats.byState).map(([state, count]) => (
              <div key={state} className="text-center">
                <Badge className={`${getStateColor(state)} mb-2`}>{state}</Badge>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {runningInstances.slice(0, 5).map((instance) => (
              <div key={instance.instanceId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={getStateColor(instance.state)}>{instance.state}</Badge>
                  <div>
                    <div className="font-mono text-sm">{instance.instanceId}</div>
                    <div className="text-xs text-muted-foreground">
                      {instance.publicIp} | {instance.userId}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatUptime(instance.uptime)}</div>
                  <div className="text-xs text-muted-foreground">
                    {instance.provisionedAt ? new Date(instance.provisionedAt).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
            {runningInstances.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No active instances at the moment
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
