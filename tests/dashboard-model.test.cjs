const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/dashboard/dist/model.js');
const now = Date.parse('2026-09-10T14:00:00+08:00');

test('播出日从 00:00 开始，截止点是前一天 00:00，跨月跨年均按北京时间计算', () => {
  assert.equal(M.deadlineFor('2026-09-12'), Date.parse('2026-09-11T00:00:00+08:00'));
  assert.equal(M.dayKey(Date.parse('2026-09-10T16:01:00Z')), '2026-09-11');
  assert.equal(M.dayKey(M.deadlineFor('2027-01-01')), '2026-12-31');
  assert.equal(M.dayKey(M.deadlineFor('2028-03-01')), '2028-02-29');
});

test('工作日期与播出日期独立；一个频道可有多份任务；所有首批频道可见', () => {
  const state = M.seed(now);
  const visible = M.visibleTasks(state);
  assert.equal(state.channels.length, 20);
  assert.equal(new Set(visible.map(t => t.channelId)).size, 20);
  assert.equal(new Set(state.tasks.map(t => t.id)).size, state.tasks.length);
  assert.ok(state.channels.some(c => visible.filter(t => t.channelId === c.id).length > 1));
  assert.ok(visible.some(t => t.workDate !== t.broadcastDate));
  assert.equal(M.summary(state, now).total, 24);
});

test('超时以截止点判断；上传、人工处理或只有状态名称不能冒充已接收', () => {
  const t = { stage: 'human', acceptedAt: null, deadline: now, outputAt: now - 60000 };
  assert.equal(M.isDone(t), false);
  assert.equal(M.isOverdue(t, now - 1), false);
  assert.equal(M.isOverdue(t, now), true);
  assert.equal(M.isDone({ ...t, stage: 'accepted' }), false);
  assert.equal(M.isDone({ ...t, stage: 'accepted', acceptedAt: now }), true);
});

test('已交付任务从关注项移出，回读缺失仍保留待回读，不影响交付', () => {
  const state = M.seed(now);
  const carry = state.tasks.find(t => M.isCarry(t, state.today));
  assert.ok(M.visibleTasks(state).includes(carry));
  assert.ok(M.isAttention(carry, now));
  carry.stage = 'accepted'; carry.acceptedAt = now; carry.blocked = null; carry.feedback = 'waiting';
  assert.equal(M.isDone(carry), true);
  assert.equal(M.isAttention(carry, now), false);
  assert.equal(M.visibleTasks(state).includes(carry), false);
  assert.equal(M.history(state, -1).remaining, 0);
  assert.equal(M.feedbackStats([carry]).waiting, 1);
});

test('遗留不重复计入今日分母；今日状态数相加等于任务总数', () => {
  const s = M.summary(M.seed(now), now);
  assert.equal(s.accepted + s.automatic + s.waiting + s.human, s.total);
  assert.equal(s.carry, 2);
  assert.equal(s.attention, 4);
});

test('对比分母仅为已交付任务；未回读不被统计为已对比或无差异', () => {
  const result = M.feedbackStats([
    { stage: 'accepted', acceptedAt: now, feedback: 'waiting', hasDifference: false },
    { stage: 'accepted', acceptedAt: now, feedback: 'compared', hasDifference: true },
    { stage: 'human', feedback: 'ineligible', hasDifference: false }
  ]);
  assert.deepEqual(result, { eligible: 2, compared: 1, reading: 0, waiting: 1, differences: 1 });
  assert.deepEqual(M.feedbackStats([]), { eligible: 0, compared: 0, reading: 0, waiting: 0, differences: 0 });
});

test('模拟事件按流程推进并保持统计一致，不自动清除异常或伪造人工修复', () => {
  let state = M.seed(now);
  const blocked = state.tasks.filter(t => t.blocked).map(t => ({ id: t.id, stage: t.stage }));
  for (let n = 1; n <= 400; n++) {
    const next = M.advance(state, now + n * 12000);
    const changed = next.tasks.filter((t, i) => t.stage !== state.tasks[i].stage);
    assert.ok(changed.length <= 1);
    for (const task of changed) {
      const before = state.tasks.find(t => t.id === task.id);
      assert.equal(M.STAGES.findIndex(s => s.id === task.stage), M.STAGES.findIndex(s => s.id === before.stage) + 1);
    }
    const s = M.summary(next, now + n * 12000);
    assert.equal(s.accepted + s.automatic + s.waiting + s.human, s.total);
    assert.equal(s.feedback.waiting + s.feedback.reading + s.feedback.compared, s.feedback.eligible);
    for (const b of blocked) assert.equal(next.tasks.find(t => t.id === b.id).stage, b.stage);
    state = next;
  }
});

test('40 频道沿用相同数据结构，每频道与任务完整保留', () => {
  const state = M.seed(now, 40);
  assert.equal(state.channels.length, 40);
  assert.equal(new Set(M.visibleTasks(state).map(t => t.channelId)).size, 40);
  assert.equal(M.summary(state, now).total, 44);
});

test('历史系统耗时截至 Output，人工交付等待不会计入系统编单耗时', () => {
  const state = M.seed(now);
  const before = M.history(state, -1).average;
  state.tasks.filter(t => t.workDate === M.offsetDay(state.today, -1) && M.isDone(t)).forEach(t => { t.acceptedAt += 10 * 3600000; });
  assert.equal(M.history(state, -1).average, before);
});

test('跨午夜仍保留原任务与遗留状态，不将它们重置成新的演示任务', () => {
  const state = M.seed(now);
  const carried = state.tasks.find(t => t.workDate === '2026-09-08' && t.blocked);
  const next = M.advance(state, Date.parse('2026-09-11T00:01:00+08:00'));
  assert.equal(next.today, '2026-09-11');
  assert.ok(next.tasks.some(t => t.id === carried.id && t.blocked === carried.blocked));
  assert.ok(M.visibleTasks(next).some(t => t.id === carried.id));
  assert.equal(M.recentTasks(next).some(t => t.id === carried.id), false);
  assert.equal(new Set(next.tasks.map(t => t.id)).size, next.tasks.length);
});
