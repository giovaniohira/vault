'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  eventType: string;
  userId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    email: string | null;
  } | null;
}

interface AuditStats {
  totalLogs: number;
  loginSuccessCount: number;
  loginFailedCount: number;
  userRegisteredCount: number;
  credentialCreatedCount: number;
  totpCreatedCount: number;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    limit: 50
  });

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams();
      
      if (filters.eventType) queryParams.append('eventType', filters.eventType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/audit/logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: AuditLogsResponse = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/audit/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: AuditStats = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAuditLogs(), fetchAuditStats()]);
      setLoading(false);
    };
    loadData();
  }, [filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'LOGIN_SUCCESS': 'Login Success',
      'LOGIN_FAILED': 'Login Failed',
      'USER_REGISTERED': 'User Registered',
      'CREDENTIAL_CREATED': 'Credential Created',
      'TOTP_CREATED': 'TOTP Created'
    };
    return labels[eventType] || eventType;
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      'LOGIN_SUCCESS': 'text-green-400',
      'LOGIN_FAILED': 'text-red-400',
      'USER_REGISTERED': 'text-blue-400',
      'CREDENTIAL_CREATED': 'text-yellow-400',
      'TOTP_CREATED': 'text-purple-400'
    };
    return colors[eventType] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">Total Events</h3>
            <p className="text-xl font-bold text-white">{stats.totalLogs}</p>
          </div>
          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">Successful Logins</h3>
            <p className="text-xl font-bold text-green-400">{stats.loginSuccessCount}</p>
          </div>
          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">Failed Logins</h3>
            <p className="text-xl font-bold text-red-400">{stats.loginFailedCount}</p>
          </div>
          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">New Users</h3>
            <p className="text-xl font-bold text-blue-400">{stats.userRegisteredCount}</p>
          </div>
          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">Credentials Created</h3>
            <p className="text-xl font-bold text-yellow-400">{stats.credentialCreatedCount}</p>
          </div>
          <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">TOTPs Created</h3>
            <p className="text-xl font-bold text-purple-400">{stats.totpCreatedCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">All Events</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="USER_REGISTERED">User Registered</option>
              <option value="CREDENTIAL_CREATED">Credential Created</option>
              <option value="TOTP_CREATED">TOTP Created</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
              placeholder="Start Date"
            />
          </div>
          <div className="flex-1">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
              placeholder="End Date"
            />
          </div>
          <div className="w-24">
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Audit Logs</h3>
            <span className="text-xs text-zinc-400">
              {logs.length} logs
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-h-64 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-900 sticky top-0 z-10">
                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Details
                </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(log.eventType)}`}>
                        {getEventTypeLabel(log.eventType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                      {log.user ? (
                        <div>
                          <div className="font-medium">{log.user.username}</div>
                          <div className="text-zinc-500 text-xs">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-500">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      <div className="max-w-xs">
                        {log.details && typeof log.details === 'object' ? (
                          <pre className="text-xs bg-zinc-900 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span className="break-words">{log.details || 'N/A'}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {logs.length === 0 && (
          <div className="px-6 py-8 text-center text-zinc-500">
            No audit logs found
          </div>
        )}
        {logs.length > 0 && (
          <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
            <div className="text-xs text-zinc-400 text-center">
              Scroll to see more logs
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 