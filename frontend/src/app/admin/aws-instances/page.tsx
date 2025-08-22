"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Server,
  Trash2,
  RefreshCw,
  Eye,
  Activity,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InstanceData {
  instanceId: string;
  state: string;
  publicIp?: string;
  userId?: string;
  labId?: string;
  enrollmentId?: string;
  provisionId?: string;
  createdAt?: string;
  provisionedAt?: string;
  keyPairName?: string;
  uptime?: number; // in minutes
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

const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

export default function AWSInstancesPage() {
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [terminateDialog, setTerminateDialog] = useState<{
    open: boolean;
    instance: InstanceData | null;
    loading: boolean;
  }>({
    open: false,
    instance: null,
    loading: false,
  });

  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    instance: InstanceData | null;
    loading: boolean;
    details: any;
  }>({
    open: false,
    instance: null,
    loading: false,
    details: null,
  });

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/aws-instances');

      if (!response.ok) {
        throw new Error('Failed to fetch instances');
      }

      const data = await response.json();
      setInstances(data.data || []);
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/aws-instances/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTerminateInstance = async () => {
    if (!terminateDialog.instance) return;

    try {
      setTerminateDialog(prev => ({ ...prev, loading: true }));

      const response = await fetch(
        `/api/admin/aws-instances?instanceId=${terminateDialog.instance.instanceId}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ force: false, instanceId: terminateDialog.instance.instanceId }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to terminate instance');
      }

      // Refresh instances list
      await fetchInstances();
      await fetchStats();

      setTerminateDialog({
        open: false,
        instance: null,
        loading: false,
      });
    } catch (error) {
      console.error('Error terminating instance:', error);
      alert('Failed to terminate instance. Please try again.');
    } finally {
      setTerminateDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleViewInstanceDetails = async (instance: InstanceData) => {
    try {
      setDetailsDialog({
        open: true,
        instance,
        loading: true,
        details: null,
      });

      const response = await fetch(`/api/admin/aws-instances/details?instanceId=${instance.instanceId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch instance details');
      }

      const data = await response.json();

      setDetailsDialog(prev => ({
        ...prev,
        loading: false,
        details: data.data,
      }));
    } catch (error) {
      console.error('Error fetching instance details:', error);
      setDetailsDialog(prev => ({
        ...prev,
        loading: false,
        details: { error: 'Failed to load details' },
      }));
    }
  };  useEffect(() => {
    fetchInstances();
    fetchStats();
  }, []);

  // Filter instances based on search and state
  const filteredInstances = instances.filter(instance => {
    const matchesSearch =
      instance.instanceId.toLowerCase().includes(search.toLowerCase()) ||
      (instance.userId && instance.userId.toLowerCase().includes(search.toLowerCase())) ||
      (instance.labId && instance.labId.toLowerCase().includes(search.toLowerCase())) ||
      (instance.publicIp && instance.publicIp.toLowerCase().includes(search.toLowerCase()));

    const matchesState = !stateFilter || instance.state === stateFilter;

    return matchesSearch && matchesState;
  });

  const uniqueStates = Array.from(new Set(instances.map(i => i.state)));

  return (
    <div className="px-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AWS EC2 Instances</h1>
          <p className="text-muted-foreground">Manage lab instances across AWS regions</p>
        </div>
        <Button onClick={() => { fetchInstances(); fetchStats(); }} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byState.running || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hourly Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.costs.estimatedHourlyCost}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.costs.estimatedDailyCost}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by instance ID, user, lab, or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="max-w-[180px]">
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {uniqueStates.map(state => (
              <SelectItem key={state} value={state}>
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Instances Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instance ID</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Public IP</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Lab</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Uptime</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading instances...
                </TableCell>
              </TableRow>
            ) : filteredInstances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No instances found
                </TableCell>
              </TableRow>
            ) : (
              filteredInstances.map((instance) => (
                <TableRow key={instance.instanceId}>
                  <TableCell className="font-mono text-sm">
                    {instance.instanceId}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStateColor(instance.state)}>
                      {instance.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {instance.publicIp || 'N/A'}
                  </TableCell>
                  <TableCell>{instance.userId || 'N/A'}</TableCell>
                  <TableCell>{instance.labId || 'N/A'}</TableCell>
                  <TableCell>
                    {instance.sessionCost ? `$${instance.sessionCost}` : 'N/A'}
                  </TableCell>
                  <TableCell>{formatUptime(instance.uptime)}</TableCell>
                  <TableCell>{formatDateTime(instance.provisionedAt || instance.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInstanceDetails(instance)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTerminateDialog({
                          open: true,
                          instance,
                          loading: false,
                        })}
                        disabled={instance.state === 'terminated' || instance.state === 'stopping'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Terminate Instance Dialog */}
      <Dialog
        open={terminateDialog.open}
        onOpenChange={(open) =>
          !terminateDialog.loading && setTerminateDialog(prev => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Terminate Instance
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate instance{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">
                {terminateDialog.instance?.instanceId}
              </code>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {terminateDialog.instance && (
            <div className="space-y-2 text-sm">
              <div><strong>User:</strong> {terminateDialog.instance.userId || 'N/A'}</div>
              <div><strong>Lab:</strong> {terminateDialog.instance.labId || 'N/A'}</div>
              <div><strong>Public IP:</strong> {terminateDialog.instance.publicIp || 'N/A'}</div>
              <div><strong>Uptime:</strong> {formatUptime(terminateDialog.instance.uptime)}</div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTerminateDialog(prev => ({ ...prev, open: false }))}
              disabled={terminateDialog.loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTerminateInstance}
              disabled={terminateDialog.loading}
            >
              {terminateDialog.loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instance Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onOpenChange={(open) =>
          !detailsDialog.loading && setDetailsDialog(prev => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              Instance Details
            </DialogTitle>
            <DialogDescription>
              Detailed information for instance{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">
                {detailsDialog.instance?.instanceId}
              </code>
            </DialogDescription>
          </DialogHeader>

          {detailsDialog.loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading instance details...
            </div>
          ) : detailsDialog.details?.error ? (
            <div className="text-center py-8 text-red-600">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              {detailsDialog.details.error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Instance ID</label>
                      <div className="font-mono text-sm mt-1">{detailsDialog.instance?.instanceId}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">State</label>
                      <div className="mt-1">
                        <Badge className={getStateColor(detailsDialog.instance?.state || '')}>
                          {detailsDialog.instance?.state}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Public IP</label>
                      <div className="font-mono text-sm mt-1">{detailsDialog.details?.publicIp || detailsDialog.instance?.publicIp || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Private IP</label>
                      <div className="font-mono text-sm mt-1">{detailsDialog.details?.privateIp || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Public DNS</label>
                      <div className="font-mono text-sm mt-1 break-all">{detailsDialog.details?.publicDnsName || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Uptime</label>
                      <div className="text-sm mt-1">{formatUptime(detailsDialog.instance?.uptime)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Instance Type</label>
                      <div className="text-sm mt-1">{detailsDialog.details?.instanceType || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Region</label>
                      <div className="text-sm mt-1">{detailsDialog.details?.region || 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lab Information */}
              {(detailsDialog.instance?.userId || detailsDialog.instance?.labId) && (
                <Card className="shadow-none rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Lab Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">User ID</label>
                        <div className="text-sm mt-1">{detailsDialog.instance?.userId || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Lab ID</label>
                        <div className="text-sm mt-1">{detailsDialog.instance?.labId || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Enrollment ID</label>
                        <div className="font-mono text-sm mt-1">{detailsDialog.instance?.enrollmentId || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Provision ID</label>
                        <div className="font-mono text-sm mt-1">{detailsDialog.instance?.provisionId || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Enrollment Status</label>
                        <div className="text-sm mt-1">{detailsDialog.details?.enrollmentStatus || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Enrolled At</label>
                        <div className="text-sm mt-1">{formatDateTime(detailsDialog.details?.enrolledAt)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
                <Card className="shadow-none rounded-md">
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created At</label>
                      <div className="text-sm mt-1">{formatDateTime(detailsDialog.details?.createdAt || detailsDialog.instance?.createdAt)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Provisioned At</label>
                      <div className="text-sm mt-1">{formatDateTime(detailsDialog.details?.provisionedAt || detailsDialog.instance?.provisionedAt)}</div>
                    </div>
                  </div>
                  {/* Debug info - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4">
                      <summary className="text-xs text-muted-foreground cursor-pointer">Debug: Raw Data</summary>
                      <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">
                        Instance: {JSON.stringify(detailsDialog.instance, null, 2)}
                        {'\n\n'}
                        Details: {JSON.stringify(detailsDialog.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>

              {/* SSH Access */}
              {detailsDialog.instance?.keyPairName && detailsDialog.details?.publicIp && (
                <Card className="shadow-none rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg">SSH Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Key Pair Name</label>
                        <div className="font-mono text-sm mt-1">{detailsDialog.instance.keyPairName}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">SSH Command</label>
                        <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                          ssh -i ~/.ssh/{detailsDialog.instance.keyPairName}.pem labuser@{detailsDialog.details.publicIp}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        * Private key should be downloaded and placed in ~/.ssh/ directory with proper permissions (chmod 600)
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cost Information */}
              {detailsDialog.instance?.uptime && (
                <Card className="shadow-none rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Cost Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
                        <div className="text-sm mt-1">
                          ${detailsDialog.details?.estimatedCost?.hourlyRate || 0.0116} USD
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Current Session Cost</label>
                        <div className="text-sm mt-1">
                          ${detailsDialog.details?.estimatedCost?.sessionCost ||
                            (((detailsDialog.instance.uptime || 0) / 60) * 0.0116).toFixed(4)} USD
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Instance Type</label>
                        <div className="text-sm mt-1">{detailsDialog.details?.instanceType || 't2.micro'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialog(prev => ({ ...prev, open: false }))}
            >
              Close
            </Button>
            {detailsDialog.instance && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDetailsDialog(prev => ({ ...prev, open: false }));
                  setTerminateDialog({
                    open: true,
                    instance: detailsDialog.instance,
                    loading: false,
                  });
                }}
                disabled={detailsDialog.instance.state === 'terminated' || detailsDialog.instance.state === 'stopping'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Terminate Instance
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
