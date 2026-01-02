/**
 * Embedded Web UI for Argus
 * Provides a dashboard for viewing tool calls, runs, and replaying calls
 */

export function getUIHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Argus</title>
  <style>
    :root {
      --bg-primary: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --text-primary: #e6edf3;
      --text-secondary: #8b949e;
      --accent: #58a6ff;
      --success: #3fb950;
      --error: #f85149;
      --warning: #d29922;
      --purple: #a371f7;
      --border: #30363d;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }
    
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    
    .logo { display: flex; align-items: center; gap: 12px; }
    
    .logo-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, var(--accent), var(--purple));
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    
    h1 {
      font-size: 24px; font-weight: 600;
      background: linear-gradient(135deg, var(--accent), var(--purple));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    
    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 16px;
      transition: transform 0.2s, border-color 0.2s;
    }
    
    .stat-card:hover { transform: translateY(-2px); border-color: var(--accent); }
    .stat-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card.error .stat-value { color: var(--error); }
    .stat-card.success .stat-value { color: var(--success); }
    .stat-card.warning .stat-value { color: var(--warning); }
    .stat-card.purple .stat-value { color: var(--purple); }
    
    .toolbar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
    
    button, select {
      font-family: inherit; font-size: 13px;
      padding: 10px 16px; border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s;
      display: flex; align-items: center; gap: 8px;
    }
    
    button:hover, select:hover { background: var(--bg-tertiary); border-color: var(--accent); }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    button.primary:hover { background: #4090e0; }
    button.success { background: var(--success); border-color: var(--success); color: #fff; }
    button.danger { border-color: var(--error); color: var(--error); }
    button.danger:hover { background: rgba(248, 81, 73, 0.1); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    
    select { appearance: none; padding-right: 32px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%238b949e' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; background-size: 16px; }
    
    .run-indicator {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 12px;
    }
    
    .run-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); animation: pulse 2s infinite; }
    .run-dot.inactive { background: var(--text-secondary); animation: none; }
    
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .tab {
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab:hover { color: var(--text-primary); }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    
    .panel { display: none; }
    .panel.active { display: block; }
    
    .timeline {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .timeline-header {
      display: grid;
      grid-template-columns: 100px 1fr 100px 80px 80px;
      padding: 14px 20px;
      background: var(--bg-tertiary);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border);
    }
    
    .call-row {
      display: grid;
      grid-template-columns: 100px 1fr 100px 80px 80px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .call-row:hover { background: var(--bg-tertiary); }
    .call-row:last-child { border-bottom: none; }
    .call-row.replay { background: rgba(163, 113, 247, 0.1); }
    
    .call-time { color: var(--text-secondary); font-size: 12px; }
    .call-tool { font-weight: 600; color: var(--accent); }
    .call-run { color: var(--text-secondary); font-size: 11px; font-family: monospace; }
    .call-latency { font-size: 13px; }
    .call-status { display: flex; align-items: center; gap: 6px; }
    
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.success { background: var(--success); }
    .status-dot.error { background: var(--error); }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      text-transform: uppercase;
    }
    .badge.replay { background: var(--purple); color: #fff; }
    .badge.active { background: var(--success); color: #fff; }
    .badge.completed { background: var(--text-secondary); color: #fff; }
    .badge.changed { background: var(--warning); color: #000; }
    .badge.unchanged { background: var(--success); color: #fff; }
    
    .runs-list { display: flex; flex-direction: column; gap: 8px; }
    
    .run-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .run-card:hover { border-color: var(--accent); }
    .run-card.active { border-color: var(--success); }
    
    .run-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .run-id { font-family: monospace; font-size: 12px; color: var(--accent); }
    .run-stats { display: flex; gap: 16px; font-size: 12px; color: var(--text-secondary); }
    
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      display: none; align-items: center; justify-content: center;
      z-index: 100;
    }
    
    .modal-overlay.active { display: flex; }
    
    .modal {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      width: 90%; max-width: 900px; max-height: 85vh;
      overflow: hidden;
      display: flex; flex-direction: column;
    }
    
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    
    .modal-header h2 { font-size: 18px; display: flex; align-items: center; gap: 10px; }
    
    .modal-close {
      background: none; border: none;
      font-size: 24px; color: var(--text-secondary);
      cursor: pointer; padding: 0;
    }
    
    .modal-close:hover { color: var(--text-primary); }
    
    .modal-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
    .modal-tab {
      padding: 12px 20px;
      background: none; border: none;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .modal-tab:hover { color: var(--text-primary); }
    .modal-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-panel { display: none; }
    .modal-panel.active { display: block; }
    
    .detail-section { margin-bottom: 24px; }
    .detail-section h3 {
      font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.5px; color: var(--text-secondary);
      margin-bottom: 12px;
    }
    
    pre {
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-size: 13px; line-height: 1.5;
    }
    
    .diff-view { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .diff-column h4 { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
    
    .diff-line { padding: 2px 8px; margin: 2px 0; border-radius: 4px; font-size: 12px; font-family: monospace; }
    .diff-line.added { background: rgba(63, 185, 80, 0.2); color: var(--success); }
    .diff-line.removed { background: rgba(248, 81, 73, 0.2); color: var(--error); }
    .diff-line.changed { background: rgba(210, 153, 34, 0.2); color: var(--warning); }
    
    .latency-compare {
      display: flex; gap: 24px; padding: 16px;
      background: var(--bg-primary);
      border-radius: 8px; margin-bottom: 16px;
    }
    .latency-item { text-align: center; }
    .latency-value { font-size: 24px; font-weight: 700; }
    .latency-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; }
    .latency-delta { font-size: 14px; }
    .latency-delta.faster { color: var(--success); }
    .latency-delta.slower { color: var(--error); }
    
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      display: flex; justify-content: flex-end; gap: 12px;
    }
    
    .empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
    .empty-state .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    
    .error-text { color: var(--error); }
    .loading { animation: pulse 1.5s ease-in-out infinite; }
    
    .schema-hint {
      margin-top: 8px; padding: 12px;
      background: rgba(88, 166, 255, 0.1);
      border: 1px solid rgba(88, 166, 255, 0.3);
      border-radius: 8px; font-size: 12px;
    }
    .schema-hint h4 { font-size: 11px; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; }
    .required { color: var(--error); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">
        <div class="logo-icon">🔍</div>
        <div>
          <h1>👁️ Argus</h1>
          <div class="subtitle">See, replay, test every MCP tool call</div>
        </div>
      </div>
      <div class="run-indicator" id="run-indicator">
        <span class="run-dot" id="run-dot"></span>
        <span id="run-status">No active run</span>
      </div>
    </header>
    
    <div class="stats-grid" id="stats">
      <div class="stat-card purple">
        <div class="stat-value" id="total-runs">-</div>
        <div class="stat-label">Runs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="total-calls">-</div>
        <div class="stat-label">Total Calls</div>
      </div>
      <div class="stat-card error">
        <div class="stat-value" id="failed-calls">-</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value" id="avg-latency">-</div>
        <div class="stat-label">Avg Latency</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value" id="max-latency">-</div>
        <div class="stat-label">Max Latency</div>
      </div>
    </div>
    
    <div class="toolbar">
      <button onclick="loadData()" class="primary">⟳ Refresh</button>
      <button onclick="startNewRun()" class="success" id="start-run-btn">▶ New Run</button>
      <button onclick="stopCurrentRun()" id="stop-run-btn" disabled>⏹ Stop Run</button>
      <select id="run-filter" onchange="filterByRun()">
        <option value="">All Runs</option>
      </select>
      <button onclick="clearAll()" class="danger">🗑 Clear All</button>
    </div>
    
    <div class="tabs">
      <button class="tab active" onclick="switchTab('calls')">Tool Calls</button>
      <button class="tab" onclick="switchTab('runs')">Runs</button>
    </div>
    
    <div id="calls-panel" class="panel active">
      <div class="timeline">
        <div class="timeline-header">
          <div>Time</div>
          <div>Tool</div>
          <div>Run</div>
          <div>Latency</div>
          <div>Status</div>
        </div>
        <div id="calls-list"></div>
      </div>
    </div>
    
    <div id="runs-panel" class="panel">
      <div class="runs-list" id="runs-list"></div>
    </div>
  </div>
  
  <div class="modal-overlay" id="modal-overlay" onclick="closeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h2 id="modal-title">Tool Call Details</h2>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-tabs" id="modal-tabs">
        <button class="modal-tab active" onclick="switchModalTab('details')">Details</button>
        <button class="modal-tab" onclick="switchModalTab('diff')" id="diff-tab" style="display:none">Diff</button>
      </div>
      <div class="modal-body">
        <div id="details-panel" class="modal-panel active"></div>
        <div id="diff-panel" class="modal-panel"></div>
      </div>
      <div class="modal-footer">
        <button onclick="closeModal()">Close</button>
        <button class="primary" id="replay-btn" onclick="replayCall()">▶ Replay</button>
      </div>
    </div>
  </div>
  
  <script>
    let currentCallId = null;
    let currentCallData = null;
    let currentRunId = null;
    let selectedRunFilter = '';
    
    function formatTime(ts) { return new Date(ts).toLocaleTimeString(); }
    function formatDateTime(ts) { return new Date(ts).toLocaleString(); }
    function formatLatency(ms) { return ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : ms + 'ms'; }
    function truncateId(id) { return id ? id.slice(0, 8) : '-'; }
    
    async function loadStats() {
      try {
        const url = selectedRunFilter ? '/api/stats?run_id=' + selectedRunFilter : '/api/stats';
        const res = await fetch(url);
        const data = await res.json();
        document.getElementById('total-calls').textContent = data.overview.total_calls || 0;
        document.getElementById('failed-calls').textContent = data.overview.failed_calls || 0;
        document.getElementById('avg-latency').textContent = 
          data.overview.avg_latency ? formatLatency(Math.round(data.overview.avg_latency)) : '-';
        document.getElementById('max-latency').textContent = 
          data.overview.max_latency ? formatLatency(data.overview.max_latency) : '-';
        document.getElementById('total-runs').textContent = data.runs?.total_runs || 0;
        
        // Update run indicator
        if (data.runs?.active_runs > 0) {
          document.getElementById('run-dot').classList.remove('inactive');
          document.getElementById('run-status').textContent = 'Run active';
          document.getElementById('stop-run-btn').disabled = false;
        } else {
          document.getElementById('run-dot').classList.add('inactive');
          document.getElementById('run-status').textContent = 'No active run';
          document.getElementById('stop-run-btn').disabled = true;
        }
      } catch (e) { console.error('Failed to load stats:', e); }
    }
    
    async function loadRuns() {
      try {
        const res = await fetch('/api/runs?limit=50');
        const runs = await res.json();
        
        // Update filter dropdown
        const select = document.getElementById('run-filter');
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Runs</option>' + 
          runs.map(r => '<option value="' + r.id + '"' + (currentValue === r.id ? ' selected' : '') + '>' + 
            truncateId(r.id) + ' (' + r.tool_count + ' calls)</option>').join('');
        
        // Find current active run
        const activeRun = runs.find(r => r.status === 'active');
        currentRunId = activeRun?.id || null;
        
        // Render runs list
        const list = document.getElementById('runs-list');
        if (runs.length === 0) {
          list.innerHTML = '<div class="empty-state"><div class="icon">📂</div><p>No runs recorded yet.</p></div>';
          return;
        }
        
        list.innerHTML = runs.map(run => \`
          <div class="run-card \${run.status === 'active' ? 'active' : ''}" onclick="filterByRunId('\${run.id}')">
            <div class="run-header">
              <span class="run-id">\${run.id}</span>
              <span class="badge \${run.status}">\${run.status}</span>
            </div>
            <div class="run-stats">
              <span>🔧 \${run.tool_count} calls</span>
              <span>❌ \${run.error_count} errors</span>
              <span>📅 \${formatDateTime(run.started_at)}</span>
              <span>🖥 \${run.mcp_server}</span>
            </div>
          </div>
        \`).join('');
      } catch (e) { console.error('Failed to load runs:', e); }
    }
    
    async function loadCalls() {
      try {
        let url = '/api/calls?limit=100';
        if (selectedRunFilter) url += '&run_id=' + selectedRunFilter;
        
        const res = await fetch(url);
        const calls = await res.json();
        
        const list = document.getElementById('calls-list');
        if (calls.length === 0) {
          list.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No tool calls recorded yet.<br>Start using your MCP server to see calls here.</p></div>';
          return;
        }
        
        list.innerHTML = calls.map(call => \`
          <div class="call-row \${call.replayed_from ? 'replay' : ''}" onclick="showDetails('\${call.id}')">
            <div class="call-time">\${formatTime(call.timestamp)}</div>
            <div class="call-tool">
              \${call.tool_name}
              \${call.replayed_from ? '<span class="badge replay">replay</span>' : ''}
            </div>
            <div class="call-run">\${truncateId(call.run_id)}</div>
            <div class="call-latency">\${formatLatency(call.latency_ms)}</div>
            <div class="call-status">
              <span class="status-dot \${call.error ? 'error' : 'success'}"></span>
              \${call.error ? 'Error' : 'OK'}
            </div>
          </div>
        \`).join('');
      } catch (e) { console.error('Failed to load calls:', e); }
    }
    
    function loadData() {
      loadStats();
      loadRuns();
      loadCalls();
    }
    
    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelector('.tab[onclick*="' + tab + '"]').classList.add('active');
      document.getElementById(tab + '-panel').classList.add('active');
    }
    
    function filterByRun() {
      selectedRunFilter = document.getElementById('run-filter').value;
      loadCalls();
      loadStats();
    }
    
    function filterByRunId(runId) {
      selectedRunFilter = runId;
      document.getElementById('run-filter').value = runId;
      switchTab('calls');
      loadCalls();
      loadStats();
    }
    
    async function startNewRun() {
      try {
        await fetch('/api/runs/start', { method: 'POST' });
        loadData();
      } catch (e) { alert('Failed to start run: ' + e.message); }
    }
    
    async function stopCurrentRun() {
      if (!currentRunId) return;
      try {
        await fetch('/api/runs/' + currentRunId + '/stop', { method: 'POST' });
        loadData();
      } catch (e) { alert('Failed to stop run: ' + e.message); }
    }
    
    async function showDetails(id) {
      try {
        const res = await fetch('/api/calls/' + id);
        const call = await res.json();
        currentCallId = id;
        currentCallData = call;
        
        const params = JSON.parse(call.params || '{}');
        const result = call.result ? JSON.parse(call.result) : null;
        
        document.getElementById('modal-title').innerHTML = 
          '<span class="status-dot ' + (call.error ? 'error' : 'success') + '"></span>' +
          call.tool_name +
          (call.replayed_from ? ' <span class="badge replay">replay</span>' : '');
        
        // Show/hide diff tab
        document.getElementById('diff-tab').style.display = call.replayed_from ? 'block' : 'none';
        
        let schemaHtml = '';
        if (call.tool_schema) {
          const schema = call.tool_schema;
          const required = schema.required || [];
          const props = schema.properties || {};
          schemaHtml = '<div class="schema-hint"><h4>Expected Parameters</h4>' +
            Object.entries(props).map(([k, v]) => 
              '<div>' + k + (required.includes(k) ? ' <span class="required">*required</span>' : '') + 
              ' <span style="color:var(--text-secondary)">(' + (v.type || 'any') + ')</span></div>'
            ).join('') + '</div>';
        }
        
        let replayedFromHtml = '';
        if (call.replayed_from && call.original_call) {
          replayedFromHtml = '<div class="detail-section"><h3>Replayed From</h3>' +
            '<pre>ID: ' + call.replayed_from + '\\nTime: ' + formatDateTime(call.original_call.timestamp) + '</pre></div>';
        }
        
        document.getElementById('details-panel').innerHTML = 
          '<div class="detail-section"><h3>Metadata</h3>' +
          '<pre>Server: ' + call.mcp_server + '\\nRun: ' + (call.run_id || '-') + 
          '\\nTime: ' + formatDateTime(call.timestamp) + '\\nLatency: ' + formatLatency(call.latency_ms) + 
          '\\nID: ' + call.id + '</pre></div>' +
          replayedFromHtml +
          '<div class="detail-section"><h3>Parameters</h3><pre>' + JSON.stringify(params, null, 2) + '</pre>' + schemaHtml + '</div>' +
          (call.error ? '<div class="detail-section"><h3>Error</h3><pre class="error-text">' + call.error + '</pre></div>' : '') +
          (result ? '<div class="detail-section"><h3>Result</h3><pre>' + JSON.stringify(result, null, 2) + '</pre></div>' : '');
        
        // Load diff if replayed
        if (call.replayed_from && call.original_call) {
          loadDiffView(call, call.original_call);
        }
        
        switchModalTab('details');
        document.getElementById('modal-overlay').classList.add('active');
      } catch (e) { console.error('Failed to load call details:', e); }
    }
    
    function loadDiffView(replayCall, originalCall) {
      const origResult = originalCall.result ? JSON.parse(originalCall.result) : null;
      const replayResult = replayCall.result ? JSON.parse(replayCall.result) : null;
      
      const latencyDelta = replayCall.latency_ms - originalCall.latency_ms;
      const latencyClass = latencyDelta < 0 ? 'faster' : (latencyDelta > 0 ? 'slower' : '');
      const latencySign = latencyDelta > 0 ? '+' : '';
      
      const resultChanged = JSON.stringify(origResult) !== JSON.stringify(replayResult);
      
      document.getElementById('diff-panel').innerHTML = 
        '<div class="latency-compare">' +
        '<div class="latency-item"><div class="latency-value">' + formatLatency(originalCall.latency_ms) + '</div><div class="latency-label">Original</div></div>' +
        '<div class="latency-item"><div class="latency-value">' + formatLatency(replayCall.latency_ms) + '</div><div class="latency-label">Replay</div></div>' +
        '<div class="latency-item"><div class="latency-value latency-delta ' + latencyClass + '">' + latencySign + latencyDelta + 'ms</div><div class="latency-label">Delta</div></div>' +
        '<div class="latency-item"><span class="badge ' + (resultChanged ? 'changed' : 'unchanged') + '">' + (resultChanged ? 'Changed' : 'Unchanged') + '</span><div class="latency-label">Result</div></div>' +
        '</div>' +
        '<div class="diff-view">' +
        '<div class="diff-column"><h4>Original Result</h4><pre>' + JSON.stringify(origResult, null, 2) + '</pre></div>' +
        '<div class="diff-column"><h4>Replay Result</h4><pre>' + JSON.stringify(replayResult, null, 2) + '</pre></div>' +
        '</div>';
    }
    
    function switchModalTab(tab) {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.modal-panel').forEach(p => p.classList.remove('active'));
      document.querySelector('.modal-tab[onclick*="' + tab + '"]')?.classList.add('active');
      document.getElementById(tab + '-panel')?.classList.add('active');
    }
    
    async function replayCall() {
      if (!currentCallId) return;
      
      const btn = document.getElementById('replay-btn');
      btn.textContent = '⏳ Replaying...';
      btn.disabled = true;
      
      try {
        const res = await fetch('/api/calls/' + currentCallId + '/replay', { method: 'POST' });
        const data = await res.json();
        
        if (data.replayed && data.new_call_id) {
          closeModal();
          loadData();
          // Open the new call to show diff
          setTimeout(() => showDetails(data.new_call_id), 500);
        } else {
          alert(data.message || 'Replay not executed');
        }
      } catch (e) { alert('Replay failed: ' + e.message); }
      finally {
        btn.textContent = '▶ Replay';
        btn.disabled = false;
      }
    }
    
    async function clearAll() {
      if (!confirm('Clear all recordings including runs?')) return;
      try {
        await fetch('/api/calls', { method: 'DELETE' });
        loadData();
      } catch (e) { alert('Failed to clear: ' + e.message); }
    }
    
    function closeModal(event) {
      if (event && event.target !== event.currentTarget) return;
      document.getElementById('modal-overlay').classList.remove('active');
      currentCallId = null;
      currentCallData = null;
    }
    
    // =========== SSE for Real-time Updates ===========
    
    let eventSource = null;
    let sseConnected = false;
    let fallbackInterval = null;
    
    function connectSSE() {
      if (eventSource) {
        eventSource.close();
      }
      
      try {
        eventSource = new EventSource('/api/events');
        
        eventSource.addEventListener('connected', function(e) {
          console.log('SSE connected:', e.data);
          sseConnected = true;
          updateConnectionStatus(true);
          
          // Clear fallback polling if SSE is working
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
        });
        
        eventSource.addEventListener('call', function(e) {
          console.log('New call:', e.data);
          // Refresh data on new call
          loadData();
        });
        
        eventSource.addEventListener('run', function(e) {
          console.log('Run change:', e.data);
          loadData();
        });
        
        eventSource.addEventListener('ping', function(e) {
          // Keep-alive, do nothing
        });
        
        eventSource.onerror = function(e) {
          console.warn('SSE error, falling back to polling');
          sseConnected = false;
          updateConnectionStatus(false);
          eventSource.close();
          
          // Start fallback polling
          if (!fallbackInterval) {
            fallbackInterval = setInterval(loadData, 3000);
          }
          
          // Try to reconnect SSE after 10 seconds
          setTimeout(connectSSE, 10000);
        };
      } catch (e) {
        console.warn('SSE not supported, using polling');
        if (!fallbackInterval) {
          fallbackInterval = setInterval(loadData, 3000);
        }
      }
    }
    
    function updateConnectionStatus(connected) {
      const dot = document.getElementById('run-dot');
      const status = document.getElementById('run-status');
      if (connected) {
        dot.style.boxShadow = '0 0 8px var(--success)';
      } else {
        dot.style.boxShadow = 'none';
      }
    }
    
    // Initial load
    loadData();
    
    // Connect to SSE for real-time updates
    connectSSE();
    
    // Fallback polling (will be disabled if SSE works)
    fallbackInterval = setInterval(loadData, 5000);
  </script>
</body>
</html>`;
}
