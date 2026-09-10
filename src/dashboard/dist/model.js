(function (root) {
  'use strict';
  const DAY = 86400000;
  const STAGES = [
    { id: 'epg', label: 'EPG 接收', short: '接收 EPG', progress: 8 },
    { id: 'match', label: '素材匹配', short: '素材匹配中', progress: 26 },
    { id: 'arrange', label: '智能编排', short: '智能编排中', progress: 48 },
    { id: 'check', label: '检查与产出', short: '检查与产出', progress: 68 },
    { id: 'waiting', label: '待编单员接手', short: '待编单员接手', progress: 78 },
    { id: 'human', label: '编单员处理中', short: '编单员处理中', progress: 88 },
    { id: 'accepted', label: 'Playbox 已接收', short: 'Playbox 已接收', progress: 100 }
  ];
  const CHANNEL_NAMES = ['星光动画','环球影院','都市剧场','生活时尚','非洲故事','世界纪实','快乐少儿','经典剧场','家庭影院','文化视野','音乐现场','自然探索','东方故事','青春剧场','风尚生活','旅行世界','星光综艺','人文记录','成长天地','经典影院'];
  const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));
  function dayKey(time) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time));
  }
  function startOfDay(key) { return Date.parse(key + 'T00:00:00+08:00'); }
  function offsetDay(key, offset) { return dayKey(startOfDay(key) + offset * DAY); }
  function deadlineFor(broadcastDate) { return startOfDay(broadcastDate) - DAY; }
  function duration(ms) {
    const mins = Math.max(0, Math.floor(ms / 60000));
    if (mins >= 1440) return Math.floor(mins / 1440) + '天' + Math.floor(mins % 1440 / 60) + '时';
    if (mins >= 60) return Math.floor(mins / 60) + '时' + mins % 60 + '分';
    return mins + '分';
  }
  function seed(now = Date.now(), count = 20) {
    const today = dayKey(now);
    const channels = Array.from({ length: count }, (_, i) => ({ id: i + 1, name: CHANNEL_NAMES[i] || '演示频道 ' + String(i + 1).padStart(2, '0') }));
    const tasks = [];
    function make(channel, workDate, broadcastDate, stage, suffix, options = {}) {
      const deadline = deadlineFor(broadcastDate);
      const sameDay = workDate === today;
      const createdAt = sameDay ? Math.max(startOfDay(today), now - (35 + channel.id * 4) * 60000) : startOfDay(workDate) + 8 * 3600000;
      const acceptedAt = stage === 'accepted' ? (sameDay ? Math.max(createdAt, now - (channel.id + 1) * 60000) : startOfDay(workDate) + (10 + channel.id % 5) * 3600000) : null;
      const task = {
        id: workDate + ':' + channel.id + ':' + suffix, channelId: channel.id, workDate, broadcastDate,
        deadline, createdAt, stage, stageSince: sameDay ? Math.max(createdAt, now - (2 + channel.id % 12) * 60000) : createdAt,
        acceptedAt, outputAt: ['waiting', 'human', 'accepted'].includes(stage) ? Math.min(acceptedAt || now, createdAt + (5 + channel.id % 8) * 60000) : null,
        blocked: null, feedback: stage === 'accepted' ? (channel.id % 5 === 0 ? 'waiting' : 'compared') : 'ineligible',
        hasDifference: stage === 'accepted' && channel.id % 7 === 0,
        ...options
      };
      tasks.push(task);
      return task;
    }
    const cycle = ['arrange', 'match', 'check', 'human', 'accepted', 'accepted', 'waiting', 'accepted', 'arrange', 'accepted', 'epg', 'accepted', 'human', 'match', 'accepted', 'check', 'accepted', 'waiting', 'human', 'accepted'];
    channels.forEach((c, i) => make(c, today, offsetDay(today, 2), cycle[i % cycle.length], 'main', i === 1 ? { blocked: '素材缺失', stageSince: now - 42 * 60000 } : {}));
    [3, 8, 13, 18].filter(id => id <= count).forEach((id, i) => make(channels[id - 1], today, offsetDay(today, i === 0 ? 1 : 3), ['human', 'match', 'epg', 'check'][i], 'extra', i === 0 ? { blocked: '待编单员交付', stageSince: now - 76 * 60000 } : {}));
    for (const offset of [-1, -2]) {
      channels.forEach(c => {
        const carry = c.id === (offset === -1 ? 1 : 6);
        make(c, offsetDay(today, offset), offsetDay(today, offset + 2), carry ? 'check' : 'accepted', 'history', carry ? { blocked: offset === -1 ? '编排冲突' : '检查未通过' } : {});
      });
    }
    return { today, channels, tasks, updatedAt: now, sequence: 0, latest: '已载入今日频道任务与前两天记录', changedTask: null, lastTransition: null };
  }
  function isDone(t) { return t.stage === 'accepted' && Number.isFinite(t.acceptedAt); }
  function isOverdue(t, now) { return !isDone(t) && now >= t.deadline; }
  function isCarry(t, today) { return t.workDate < today && !isDone(t); }
  function isAttention(t, now) { return Boolean(t.blocked) || isOverdue(t, now) || (!isDone(t) && t.deadline - now <= 4 * 3600000); }
  function visibleTasks(state) { return state.tasks.filter(t => t.workDate === state.today || isCarry(t, state.today)); }
  function priority(t, state, now) { return isOverdue(t, now) ? 100 : t.blocked ? 80 : isCarry(t, state.today) ? 70 : isAttention(t, now) ? 60 : isDone(t) ? 0 : 20; }
  function recentTasks(state) { return state.tasks.filter(t => t.workDate >= offsetDay(state.today, -2)); }
  function feedbackStats(tasks) {
    const eligible = tasks.filter(isDone);
    const compared = eligible.filter(t => t.feedback === 'compared');
    return { eligible: eligible.length, compared: compared.length, reading: eligible.filter(t => t.feedback === 'reading').length, waiting: eligible.filter(t => t.feedback === 'waiting').length, differences: compared.filter(t => t.hasDifference).length };
  }
  function summary(state, now) {
    const today = state.tasks.filter(t => t.workDate === state.today);
    const visible = visibleTasks(state);
    const accepted = today.filter(isDone);
    return {
      total: today.length, accepted: accepted.length,
      automatic: today.filter(t => ['epg', 'match', 'arrange', 'check'].includes(t.stage)).length,
      waiting: today.filter(t => t.stage === 'waiting').length,
      human: today.filter(t => t.stage === 'human').length,
      attention: visible.filter(t => isAttention(t, now)).length,
      carry: visible.filter(t => isCarry(t, state.today)).length,
      onTime: accepted.filter(t => t.acceptedAt <= t.deadline).length,
      feedback: feedbackStats(recentTasks(state))
    };
  }
  function history(state, offset) {
    const date = offsetDay(state.today, offset);
    const list = state.tasks.filter(t => t.workDate === date);
    const delivered = list.filter(isDone);
    const produced = list.filter(t => t.outputAt != null);
    const average = produced.length ? produced.reduce((sum, t) => sum + Math.max(0, t.outputAt - t.createdAt), 0) / produced.length : null;
    return { date, total: list.length, accepted: delivered.length, remaining: list.length - delivered.length, average, feedback: feedbackStats(list) };
  }
  function advance(state, now) {
    if (dayKey(now) !== state.today) {
      const fresh = seed(now, state.channels.length);
      const retained = state.tasks.filter(t => !isDone(t) || t.workDate >= offsetDay(fresh.today, -2));
      fresh.tasks = [...retained, ...fresh.tasks.filter(t => t.workDate === fresh.today && !retained.some(old => old.id === t.id))];
      fresh.latest = '新工作日已开始 · 未完成任务继续保留';
      return fresh;
    }
    const next = { ...state, tasks: state.tasks.map(t => ({ ...t })), updatedAt: now, sequence: state.sequence + 1, changedTask: null, lastTransition: null };
    const eligible = next.tasks.filter(t => t.workDate === next.today && !isDone(t) && !t.blocked);
    if (next.sequence % 3 !== 0 && eligible.length) {
      const t = eligible[(Math.floor(next.sequence / 2)) % eligible.length];
      const stage = STAGES.findIndex(s => s.id === t.stage);
      const from = STAGE_BY_ID[t.stage].label;
      t.stage = STAGES[Math.min(stage + 1, STAGES.length - 1)].id;
      next.lastTransition = { from, to: STAGE_BY_ID[t.stage].label };
      t.stageSince = now;
      if (t.stage === 'waiting') t.outputAt = now;
      if (t.stage === 'accepted') { t.acceptedAt = now; t.feedback = 'waiting'; }
      next.changedTask = t.id;
      next.latest = next.channels.find(c => c.id === t.channelId).name + ' · ' + t.broadcastDate.slice(5).replace('-', '/') + ' 播出单 → ' + STAGE_BY_ID[t.stage].label;
    } else {
      const t = next.tasks.find(t => isDone(t) && ['waiting', 'reading'].includes(t.feedback));
      if (t) {
        t.feedback = t.feedback === 'waiting' ? 'reading' : 'compared';
        next.lastTransition = { from: 'Playbox 已接收', to: t.feedback === 'reading' ? '回读与对比' : '优化反馈已记录' };
        if (t.feedback === 'compared') t.hasDifference = t.channelId % 4 === 0;
        next.changedTask = t.id;
        next.latest = next.channels.find(c => c.id === t.channelId).name + ' · ' + (t.feedback === 'reading' ? '开始回读最终执行文件' : '已完成对比，反馈已记录');
      } else next.latest = '正在等待需关注任务处理 · 交付记录与优化反馈持续保留';
    }
    return next;
  }
  const api = { DAY, STAGES, STAGE_BY_ID, dayKey, startOfDay, offsetDay, deadlineFor, duration, seed, isDone, isOverdue, isCarry, isAttention, visibleTasks, priority, recentTasks, feedbackStats, summary, history, advance };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JinshuModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
