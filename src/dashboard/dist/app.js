(function () {
  'use strict';
  const M = window.JinshuModel;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let state = M.seed(Date.now(), params.get('channels') === '40' ? 40 : 20);
  let suspended = false;
  const shortDate = date => date.slice(5).replace('-', '/');
  const time = now => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(now));
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    $('theme-toggle').textContent = theme === 'dark' ? '☀' : '☾';
    $('theme-toggle').setAttribute('aria-label', theme === 'dark' ? '切换到浅色主题' : '切换到深色主题');
    try { localStorage.setItem('jinshu-display-theme', theme); } catch (_) { /* Private browsing can disallow preference storage. */ }
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem('jinshu-display-theme'); } catch (_) {}
  const requestedTheme = params.get('theme');
  setTheme(['dark', 'light'].includes(requestedTheme) ? requestedTheme : savedTheme === 'light' ? 'light' : 'dark');
  $('theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('corporate-logo').addEventListener('error', () => { $('corporate-logo').hidden = true; $('corporate-fallback').hidden = false; });
  if ($('corporate-logo').complete && !$('corporate-logo').naturalWidth) { $('corporate-logo').hidden = true; $('corporate-fallback').hidden = false; }
  $('dashboard').classList.toggle('expanded', state.channels.length > 20);
  function fitScreen() {
    const width = state.channels.length > 20 ? 2560 : 1920;
    const height = width * 9 / 16;
    $('screen-shell').style.width = width + 'px';
    $('screen-shell').style.height = height + 'px';
    $('screen-shell').style.setProperty('--screen-scale', Math.min(window.innerWidth / width, window.innerHeight / height));
  }
  fitScreen(); window.addEventListener('resize', fitScreen);
  function renderOverview(now) {
    const s = M.summary(state, now);
    const metrics = [
      ['今日编单任务', s.total, state.channels.length + ' 个频道', 'TODAY', 'blue', true],
      ['Playbox 已接收', s.accepted, '今日已交付 · ' + Math.round(s.accepted / s.total * 100) + '%', 'DELIVERED', 'green'],
      ['Agent 编单阶段', s.automatic, '接收 · 匹配 · 编排 · 检查', 'AGENTS', 'blue'],
      ['待编单员接手', s.waiting, '系统产出已就绪', 'HANDOVER', 'purple'],
      ['编单员处理中', s.human, '检查修改与交付', 'HUMAN', 'purple'],
      ['需关注任务', s.attention, '含 ' + s.carry + ' 份跨天遗留', 'ATTENTION', 'amber']
    ];
    $('overview').innerHTML = metrics.map(([label, value, note, code, color, primary]) => `<article class="metric ${primary ? 'primary' : ''}" style="--accent:var(--${color})"><span class="metric-line"></span><div class="metric-label">${label}<span class="metric-code">${code}</span></div><div class="metric-value"><b style="${!primary ? 'color:var(--' + color + ')' : ''}">${value.toString().padStart(2, '0')}</b><span>${note}</span></div></article>`).join('');
  }
  function taskView(t, now) {
    const stage = M.STAGE_BY_ID[t.stage];
    const overdue = M.isOverdue(t, now);
    const carry = M.isCarry(t, state.today);
    const done = M.isDone(t);
    const style = done ? 'accepted' : overdue ? 'overdue' : t.blocked ? 'blocked' : ['waiting', 'human'].includes(t.stage) ? 'human' : 'active';
    const color = { accepted: 'green', overdue: 'red', blocked: 'amber', human: 'purple', active: 'blue' }[style];
    let label = t.blocked || stage.short;
    if (overdue) label = '超时 · ' + label;
    else if (carry) label = '遗留 · ' + label;
    const feedback = t.feedback === 'compared' ? (t.hasDifference ? '已对比·有差异' : '已对比') : t.feedback === 'reading' ? '回读中' : '待回读';
    if (done) label = '已接收 · ' + feedback;
    return `<div class="task" aria-label="${escape(t.broadcastDate + ' 播出；工作日期 ' + t.workDate + '；' + label)}"><span class="task-date">${shortDate(t.broadcastDate)} 播</span><span class="task-state ${style}">${escape(label)}</span><div class="task-progress" role="progressbar" aria-label="${escape(t.broadcastDate + ' 编单阶段进度')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stage.progress}" aria-valuetext="${escape(stage.label)}" style="--progress:${stage.progress}%;--state-color:var(--${color})"><span></span></div></div>`;
  }
  function renderChannels(now) {
    const visible = M.visibleTasks(state);
    const channels = state.channels.map(c => ({ ...c, tasks: visible.filter(t => t.channelId === c.id) }));
    channels.sort((a, b) => Math.max(...b.tasks.map(t => M.priority(t, state, now))) - Math.max(...a.tasks.map(t => M.priority(t, state, now))) || a.id - b.id);
    $('channel-count').textContent = state.channels.length + ' 频道 · ' + visible.length + ' 份在板';
    $('work-date').textContent = '工作日 ' + state.today.replaceAll('-', '.');
    $('channel-grid').innerHTML = channels.map(c => {
      c.tasks.sort((a, b) => M.priority(b, state, now) - M.priority(a, state, now) || a.broadcastDate.localeCompare(b.broadcastDate));
      const urgent = c.tasks.some(t => M.isOverdue(t, now));
      const warn = c.tasks.some(t => M.isAttention(t, now));
      return `<article class="channel-card ${urgent ? 'urgent' : warn ? 'warn' : ''}"><div class="channel-top"><span class="channel-index">${String(c.id).padStart(2, '0')}</span><span class="channel-name">${escape(c.name)}</span><span class="task-number">${c.tasks.length > 1 ? c.tasks.length + ' 份编单' : 'PLAYBOX'}</span></div>${c.tasks.map(t => taskView(t, now)).join('')}</article>`;
    }).join('');
  }
  function renderTeam(now) {
    const tasks = M.visibleTasks(state);
    const icons = {
      epg: '<path d="M4 4h16v16H4zM8 8h8M8 12h5M8 16h8"/>',
      match: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/>',
      arrange: '<path d="M4 5h11v4H4zM9 11h11v4H9zM4 17h11v4H4z"/>',
      check: '<path d="m5 12 4 4L19 6M4 21h16"/>',
      human: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
      accepted: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m10 8 5 3-5 3zM8 22h8M12 18v4"/>'
    };
    const nodes = [
      ['epg', 'EPG 接收', 'AGENT 01', ['epg']],
      ['match', '素材匹配', 'AGENT 02', ['match']],
      ['arrange', '智能编排', 'AGENT 03', ['arrange']],
      ['check', '检查与产出', 'AGENT 04', ['check']],
      ['human', '编单员', 'HUMAN HANDOVER', ['waiting', 'human'], 'person'],
      ['accepted', 'Playbox', 'DELIVERY ACCEPTED', ['accepted'], 'receiver']
    ];
    $('team').innerHTML = nodes.map(([id, name, type, stages, kind], index) => {
      const group = tasks.filter(t => stages.includes(t.stage));
      group.sort((a, b) => (b.id === state.changedTask ? 1 : 0) - (a.id === state.changedTask ? 1 : 0) || b.stageSince - a.stageSince);
      const blocked = group.filter(t => t.blocked).length;
      const arriving = group.some(t => t.id === state.changedTask) && state.lastTransition && stages.some(stage => M.STAGE_BY_ID[stage].label === state.lastTransition.to);
      let detail = group.length ? (blocked ? blocked + ' 份待处理 · ' : '') + '当前步骤 ' + M.duration(now - Math.min(...group.map(t => t.stageSince))) : '等待新任务 · 随时就绪';
      let status = blocked && blocked === group.length ? '等待处理' : group.length ? '执行中' : '空闲';
      if (kind === 'person') {
        detail = group.filter(t => t.stage === 'waiting').length + ' 份待接手 · ' + group.filter(t => t.stage === 'human').length + ' 份处理中';
        status = '人工节点';
      }
      if (kind === 'receiver') { detail = '接收成功，已开始后续处理'; status = '已交付'; }
      const tokens = group.length ? group.slice(0, 2).map(t => '<span class="work-token ' + (t.id === state.changedTask ? 'active-token' : '') + '">' + escape(state.channels.find(c => c.id === t.channelId).name) + '<small>' + shortDate(t.broadcastDate) + '</small></span>').join('') : '<span class="work-token">待分配</span>';
      return `<div id="flow-${id}" class="flow-step ${kind || ''} ${blocked ? 'blocked' : ''} ${arriving ? 'arrival' : ''}" data-stage="${id}">${arriving && index > 0 ? '<span class="packet" aria-hidden="true"></span>' : ''}<span class="node-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg></span><div class="node-info"><div class="node-title">${name}</div><div class="node-type">${type}</div></div><div class="node-work"><div class="node-tokens">${tokens}</div><div class="node-detail">${escape(detail)}</div></div><div class="node-status"><b>${String(group.length).padStart(2, '0')}</b> 份<small>${status}</small></div><span class="node-ordinal">${String(index + 1).padStart(2, '0')}</span></div>`;
    }).join('');
    const f = M.feedbackStats(M.recentTasks(state));
    $('branch-stats').innerHTML = `${f.waiting} 份待回读 · ${f.reading} 份对比中<br><b>${f.compared}</b> 份反馈已记录`;
    const moved = state.tasks.find(t => t.id === state.changedTask);
    $('handoff-event').innerHTML = moved ? `<div class="handoff-channel">${escape(state.channels.find(c => c.id === moved.channelId).name)}</div><div class="handoff-route"><span>${shortDate(moved.broadcastDate)} 播出单</span><br>${escape(state.lastTransition ? state.lastTransition.from : '')}<br>↓ ${escape(state.lastTransition ? state.lastTransition.to : M.STAGE_BY_ID[moved.stage].label)}</div><div class="handoff-time">${time(state.updatedAt)} · 状态已同步</div>` : '<div class="handoff-route">任务正在各节点执行<br><span>下一次交接将在此呈现</span></div>';
  }
  function renderAttention(now) {
    const tasks = M.visibleTasks(state).filter(t => M.isAttention(t, now)).sort((a, b) => M.priority(b, state, now) - M.priority(a, state, now) || a.deadline - b.deadline);
    $('attention-count').textContent = tasks.length + ' 份需关注';
    $('attention-list').innerHTML = tasks.length ? tasks.slice(0, 4).map(t => {
      const overdue = M.isOverdue(t, now);
      const c = state.channels.find(c => c.id === t.channelId);
      const status = overdue ? '已超时 ' + M.duration(now - t.deadline) : t.blocked ? '等待 ' + M.duration(now - t.stageSince) : '距截止 ' + M.duration(t.deadline - now);
      const reason = (M.isCarry(t, state.today) ? shortDate(t.workDate) + ' 遗留 · ' : '') + (t.blocked || M.STAGE_BY_ID[t.stage].label);
      return `<article class="notice ${overdue ? 'critical' : ''}"><div class="notice-head"><strong>${escape(c.name)} · ${shortDate(t.broadcastDate)} 播</strong><span>${status}</span></div><p>${escape(reason)} · 截止 ${shortDate(M.dayKey(t.deadline))} 00:00</p></article>`;
    }).join('') : '<div class="notice"><div class="notice-head"><strong>当前没有需关注任务</strong></div><p>任务正常推进，状态自动更新</p></div>';
    document.querySelector('.attention-foot').textContent = tasks.length > 4 ? '另 ' + (tasks.length - 4) + ' 份已在频道区标记 · 无声音提醒' : '完整状态同步标注在对应频道 · 无声音提醒';
  }
  function renderHistory() {
    $('history').innerHTML = [-1, -2].map(offset => {
      const h = M.history(state, offset);
      return `<article class="history-day"><div class="history-title">${offset === -1 ? '昨天' : '前天'} · ${shortDate(h.date)}<span>${h.accepted === h.total ? '全部交付' : h.remaining + ' 份遗留持续跟进'}</span></div><div class="history-metrics"><div><b>${h.total}</b><small>编单任务</small></div><div><b class="done">${h.accepted}</b><small>Playbox 已接收</small></div><div><b class="attention">${h.remaining}</b><small>尚未交付</small></div><div><b>${h.average === null ? '—' : Math.round(h.average / 60000) + '′'}</b><small>系统平均编单耗时</small></div></div><div class="history-bar"><span style="width:${h.accepted / h.total * 100}%"></span></div></article>`;
    }).join('');
    const f = M.feedbackStats(M.recentTasks(state));
    const percent = value => f.eligible ? value / f.eligible * 100 : 0;
    $('feedback').innerHTML = `<div class="feedback-main"><div class="feedback-number"><b>${f.compared}</b><span>/ ${f.eligible} 份</span></div><div class="feedback-bars"><div class="segmented" aria-label="已对比 ${f.compared} 份，对比中 ${f.reading} 份，待回读 ${f.waiting} 份"><span style="width:${percent(f.compared)}%;background:var(--blue)"></span><span style="width:${percent(f.reading)}%;background:var(--purple)"></span><span style="width:${percent(f.waiting)}%;background:var(--line)"></span></div><div class="feedback-legend"><span>已对比<b>${f.compared}</b></span><span>对比中<b>${f.reading}</b></span><span>待回读<b>${f.waiting}</b></span><span>分母：已交付任务</span></div></div></div><div class="feedback-caption"><strong>${f.differences} 份存在差异</strong><span>供 Agent 优化分析，原因待核对</span><span>差异 ≠ 编单错误</span></div>`;
  }
  function render(now) {
    renderOverview(now); renderChannels(now); renderTeam(now); renderAttention(now); renderHistory();
    $('latest-event').textContent = state.latest;
    $('updated').textContent = '最近更新 ' + time(state.updatedAt);
  }
  function tick() {
    const now = Date.now();
    $('clock').textContent = time(now);
    $('date').textContent = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }).format(new Date(now)) + ' · 北京时间';
    const stale = suspended || now - state.updatedAt > 65000;
    $('connection').innerHTML = '<i></i>' + (stale ? '数据未更新' : '模拟数据已连接');
    $('connection').style.color = stale ? 'var(--amber)' : 'var(--green)';
    if (M.dayKey(now) !== state.today && !stale) { state = M.advance(state, now); render(now); }
  }
  function update() {
    const now = Date.now();
    try { state = M.advance(state, now); suspended = false; render(now); }
    catch (e) { suspended = true; $('latest-event').textContent = '模拟数据更新中断，保留最后一次记录'; console.error(e); }
    tick();
  }
  render(Date.now()); tick();
  setInterval(tick, 1000);
  setInterval(update, 12000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); if (Date.now() - state.updatedAt > 65000) update(); } });
})();
