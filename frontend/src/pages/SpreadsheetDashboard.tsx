import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellEditingStoppedEvent,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  exportToExcel,
  exportToPdf,
  fetchPostMetricsByUrl,
  fetchProfileByUrl,
  loadSpreadsheetRows,
  saveSpreadsheetRows,
  deleteAllSpreadsheetRows,
  type SpreadsheetRowPayload,
} from '../api/apiClient';
import { useWebSocket } from '../hooks/useWebSocket';

// AG Grid v33+ requires explicit module registration.
ModuleRegistry.registerModules([AllCommunityModule]);

export interface RowData {
  id: string;
  profileUrl: string;
  username: string;
  followersCount: number | null;
  followingCount: number | null;
  totalPosts: number | null;
  postUrl: string;
  likesCount: number | null;
  commentsCount: number | null;
  viewsCount: number | null;
  reach: number | null;
  isLoadingProfile: boolean;
  isLoadingPost: boolean;
}

interface SpreadsheetUpdate {
  type: 'PROFILE_UPDATE' | 'POST_METRICS_UPDATE';
  profileUrl?: string;
  postUrl?: string;
  data: Partial<RowData>;
}

const createEmptyRow = (): RowData => ({
  id: crypto.randomUUID(),
  profileUrl: '',
  username: '',
  followersCount: null,
  followingCount: null,
  totalPosts: null,
  postUrl: '',
  likesCount: null,
  commentsCount: null,
  viewsCount: null,
  reach: null,
  isLoadingProfile: false,
  isLoadingPost: false,
});

const REFRESH_COOLDOWN_SECONDS = 5;
const AUTOSAVE_DELAY_MS = 2000;

/** Convert RowData[] to the payload format expected by the backend. */
const toSavePayload = (rows: RowData[]): SpreadsheetRowPayload[] =>
  rows.map((r, i) => ({
    id: r.id,
    rowOrder: i,
    profileUrl: r.profileUrl,
    username: r.username,
    followersCount: r.followersCount,
    followingCount: r.followingCount,
    totalPosts: r.totalPosts,
    postUrl: r.postUrl,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    viewsCount: r.viewsCount,
    reach: r.reach,
  }));

/** Convert a backend payload row into a frontend RowData. */
const fromPayload = (p: SpreadsheetRowPayload): RowData => ({
  id: p.id,
  profileUrl: p.profileUrl || '',
  username: p.username || '',
  followersCount: p.followersCount,
  followingCount: p.followingCount,
  totalPosts: p.totalPosts,
  postUrl: p.postUrl || '',
  likesCount: p.likesCount,
  commentsCount: p.commentsCount,
  viewsCount: p.viewsCount,
  reach: p.reach,
  isLoadingProfile: false,
  isLoadingPost: false,
});

const SpreadsheetDashboard: React.FC = () => {
  const [rowData, setRowData] = useState<RowData[]>([createEmptyRow()]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  // Ref for the debounce timer so we can cancel on unmount.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the initial load is complete (to avoid saving loaded data right back).
  const initialLoadDoneRef = useRef(false);

  // --- Load saved rows on mount ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    loadSpreadsheetRows(token)
      .then((saved) => {
        if (saved.length > 0) {
          setRowData(saved.map(fromPayload));
        }
        // else keep the default single empty row
      })
      .catch((err) => {
        console.error('Failed to load saved rows:', err);
        setMessage('Could not load your saved data.');
      })
      .finally(() => {
        setIsLoading(false);
        // Small delay so the initial setRowData doesn't trigger auto-save.
        setTimeout(() => { initialLoadDoneRef.current = true; }, 100);
      });
  }, []);

  // --- Auto-save whenever rowData changes (debounced) ---
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveSpreadsheetRows(toSavePayload(rowData), token).catch((err) => {
        console.error('Auto-save failed:', err);
      });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [rowData]);

  const updateRowData = useCallback((rowId: string, updates: Partial<RowData>) => {
    setRowData((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row))
    );
  }, []);

  // --- Issue #5: real-time updates via WebSocket ---
  const handleSpreadsheetUpdate = useCallback((update: SpreadsheetUpdate) => {
    setRowData((prev) =>
      prev.map((row) => {
        if (update.type === 'PROFILE_UPDATE' && update.profileUrl && row.profileUrl === update.profileUrl) {
          return { ...row, ...update.data };
        }
        if (update.type === 'POST_METRICS_UPDATE' && update.postUrl && row.postUrl === update.postUrl) {
          return { ...row, ...update.data };
        }
        return row;
      })
    );
  }, []);

  const { connected } = useWebSocket('/topic/spreadsheet/updates', handleSpreadsheetUpdate);

  // Refresh-button cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Close the export menu when clicking outside of it.
  useEffect(() => {
    if (!showExportMenu) return;
    const onClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showExportMenu]);

  // --- Issue #4: auto-fetch on cell edit ---
  const onCellEditingStopped = useCallback(
    async (event: CellEditingStoppedEvent<RowData>) => {
      const { colDef, data, newValue, oldValue } = event;
      if (!data || newValue === oldValue || !newValue) return;

      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('You are not logged in. Please log in again.');
        return;
      }

      if (colDef.field === 'profileUrl') {
        updateRowData(data.id, { isLoadingProfile: true });
        try {
          const profileData = await fetchProfileByUrl(newValue, token);
          updateRowData(data.id, {
            username: profileData.username,
            followersCount: profileData.followersCount,
            followingCount: profileData.followingCount,
            totalPosts: profileData.totalPosts,
            isLoadingProfile: false,
          });
        } catch (error: any) {
          updateRowData(data.id, { isLoadingProfile: false });
          setMessage(error?.message || 'Failed to fetch profile data');
        }
      }

      if (colDef.field === 'postUrl') {
        updateRowData(data.id, { isLoadingPost: true });
        try {
          const metricsData = await fetchPostMetricsByUrl(newValue, token);
          updateRowData(data.id, {
            likesCount: metricsData.likesCount,
            commentsCount: metricsData.commentsCount,
            viewsCount: metricsData.viewsCount,
            reach: metricsData.reach,
            isLoadingPost: false,
          });
        } catch (error: any) {
          updateRowData(data.id, { isLoadingPost: false });
          setMessage(error?.message || 'Failed to fetch post metrics');
        }
      }
    },
    [updateRowData]
  );

  const addRow = () => setRowData((prev) => [...prev, createEmptyRow()]);

  const deleteRow = useCallback((rowId: string) => {
    setRowData((prev) => prev.filter((row) => row.id !== rowId));
  }, []);

  // --- Delete All Rows ---
  const handleDeleteAll = async () => {
    setShowDeleteConfirm(false);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await deleteAllSpreadsheetRows(token);
      } catch (err) {
        console.error('Failed to delete all rows on server:', err);
      }
    }
    // Reset to single empty row locally — this also triggers auto-save as a fallback.
    initialLoadDoneRef.current = false;
    setRowData([createEmptyRow()]);
    setMessage('All rows deleted.');
    setTimeout(() => { initialLoadDoneRef.current = true; }, 100);
  };

  // --- Issue #6: refresh all rows ---
  const handleRefreshAll = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You are not logged in. Please log in again.');
      return;
    }

    setIsRefreshing(true);
    setMessage(null);

    const results = await Promise.allSettled(
      rowData.map(async (row) => {
        const updates: Partial<RowData> = {};
        if (row.profileUrl) {
          try {
            const profileData = await fetchProfileByUrl(row.profileUrl, token);
            updates.username = profileData.username;
            updates.followersCount = profileData.followersCount;
            updates.followingCount = profileData.followingCount;
            updates.totalPosts = profileData.totalPosts;
          } catch (err) {
            console.error(`Failed to refresh profile for row ${row.id}:`, err);
          }
        }
        if (row.postUrl) {
          try {
            const metricsData = await fetchPostMetricsByUrl(row.postUrl, token);
            updates.likesCount = metricsData.likesCount;
            updates.commentsCount = metricsData.commentsCount;
            updates.viewsCount = metricsData.viewsCount;
            updates.reach = metricsData.reach;
          } catch (err) {
            console.error(`Failed to refresh metrics for row ${row.id}:`, err);
          }
        }
        return { id: row.id, updates, hasUrl: Boolean(row.profileUrl || row.postUrl) };
      })
    );

    setRowData((prev) =>
      prev.map((row) => {
        const result = results.find(
          (r) => r.status === 'fulfilled' && r.value.id === row.id
        );
        if (result && result.status === 'fulfilled') {
          return { ...row, ...result.value.updates };
        }
        return row;
      })
    );

    const refreshable = results.filter(
      (r) => r.status === 'fulfilled' && r.value.hasUrl
    ).length;
    setMessage(`Refreshed ${refreshable}/${rowData.length} rows`);
    setIsRefreshing(false);
    setCooldown(REFRESH_COOLDOWN_SECONDS);
  };

  // --- Issue #7: export ---
  const handleExport = async (format: 'excel' | 'pdf') => {
    setShowExportMenu(false);
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You are not logged in. Please log in again.');
      return;
    }
    try {
      const blob =
        format === 'excel'
          ? await exportToExcel(rowData, token)
          : await exportToPdf(rowData, token);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'excel' ? 'instagram-analytics.xlsx' : 'instagram-analytics.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setMessage(error?.message || 'Export failed');
    }
  };

  // Cell renderer for auto-fetched columns: shows a spinner while loading.
  const makeAutoRenderer = (loadingKey: 'isLoadingProfile' | 'isLoadingPost') =>
    (params: ICellRendererParams<RowData>) => {
      if (params.data?.[loadingKey]) {
        return (
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
            Loading…
          </span>
        );
      }
      const value = params.value;
      if (value === null || value === undefined || value === '') return '—';
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    };

  const numericCellStyle = { textAlign: 'right' as const };

  const columnDefs = useMemo<ColDef<RowData>[]>(
    () => [
      { headerName: 'Profile URL', field: 'profileUrl', editable: true, minWidth: 240, flex: 2 },
      {
        headerName: 'Username',
        field: 'username',
        editable: false,
        cellRenderer: makeAutoRenderer('isLoadingProfile'),
        minWidth: 140,
      },
      {
        headerName: 'Followers',
        field: 'followersCount',
        editable: false,
        cellStyle: numericCellStyle,
        cellRenderer: makeAutoRenderer('isLoadingProfile'),
        minWidth: 120,
      },
      {
        headerName: 'Following',
        field: 'followingCount',
        editable: false,
        cellStyle: numericCellStyle,
        cellRenderer: makeAutoRenderer('isLoadingProfile'),
        minWidth: 120,
      },
      {
        headerName: 'No. of Posts',
        field: 'totalPosts',
        editable: false,
        cellStyle: numericCellStyle,
        cellRenderer: makeAutoRenderer('isLoadingProfile'),
        minWidth: 120,
      },
      { headerName: 'Post URL', field: 'postUrl', editable: true, minWidth: 240, flex: 2 },
      {
        headerName: 'Likes',
        field: 'likesCount',
        editable: false,
        cellStyle: numericCellStyle,
        cellRenderer: makeAutoRenderer('isLoadingPost'),
        minWidth: 110,
      },
      {
        headerName: 'Comments',
        field: 'commentsCount',
        editable: false,
        cellStyle: numericCellStyle,
        cellRenderer: makeAutoRenderer('isLoadingPost'),
        minWidth: 110,
      },
      {
        headerName: 'Views',
        field: 'viewsCount',
        editable: false,
        cellStyle: numericCellStyle,
        cellRenderer: makeAutoRenderer('isLoadingPost'),
        minWidth: 110,
      },
      {
        headerName: 'Reach',
        field: 'reach',
        editable: false,
        cellStyle: numericCellStyle,
        cellRenderer: makeAutoRenderer('isLoadingPost'),
        minWidth: 110,
      },
      {
        headerName: '',
        colId: 'actions',
        pinned: 'right',
        width: 70,
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<RowData>) => (
          <button
            onClick={() => params.data && deleteRow(params.data.id)}
            title="Delete row"
            className="text-gray-400 hover:text-red-600 font-bold text-lg leading-none transition-colors"
          >
            ×
          </button>
        ),
      },
    ],
    [deleteRow]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({ resizable: true, sortable: true, filter: false }),
    []
  );

  const getRowId = useCallback((params: { data: RowData }) => params.data.id, []);

  const refreshDisabled = isRefreshing || cooldown > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex items-center gap-3 text-gray-500">
          <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              Instagram Analytics Dashboard
            </h2>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={
                connected
                  ? { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }
                  : { background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }
              }
              title={connected ? 'Live updates connected' : 'Live updates disconnected'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}
              />
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={refreshDisabled}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white font-medium transition-all ${
                refreshDisabled
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRefreshing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Refreshing…
                </>
              ) : cooldown > 0 ? (
                <>Wait {cooldown}s</>
              ) : (
                <>↻ Refresh All</>
              )}
            </button>

            {/* Delete All Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
            >
              🗑 Delete All
            </button>

            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu((s) => !s)}
                className="px-4 py-2 rounded-lg flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium transition-all"
              >
                ⬇ Export ▾
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    📊 Export as Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    📄 Export as PDF (.pdf)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete All Rows?</h3>
            <p className="text-sm text-gray-600 mb-5">
              This will permanently delete all rows from your dashboard. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 ag-theme-alpine">
        <AgGridReact<RowData>
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={getRowId}
          singleClickEdit
          onCellEditingStopped={onCellEditingStopped}
          stopEditingWhenCellsLoseFocus
        />
      </div>

      {/* Add row */}
      <div className="px-6 py-3 border-t border-gray-100 bg-white">
        <button
          onClick={addRow}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center gap-1.5 transition-all"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
};

export default SpreadsheetDashboard;
