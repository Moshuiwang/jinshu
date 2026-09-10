const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/dashboard/dist/model.js');
const now=Date.parse('2026-09-10T14:00:00+08:00');
const date='2026-09-11';

test('播出日前一天零点为24小时截止，跨月跨年和时区正确',()=>{
 assert.equal(M.deadlineFor('2026-09-12'),Date.parse('2026-09-11T00:00:00+08:00'));
 assert.equal(M.dayKey(Date.parse('2026-09-10T16:01:00Z')),'2026-09-11');
 assert.equal(M.dayKey(M.deadlineFor('2027-01-01')),'2026-12-31');
 assert.equal(M.dayKey(M.deadlineFor('2028-03-01')),'2028-02-29');
});
test('三日按播出日期独立，每日完整20频道、每个节点完整六态集合',()=>{
 const s=M.seed(now);assert.equal(s.channels.length,20);assert.equal(s.tasks.length,60);
 assert.equal(new Set(s.tasks.map(t=>t.id)).size,60);
 for(const offset of [0,1,2]){const tasks=M.tasksForDate(s,M.offsetDay(s.today,offset));assert.equal(tasks.length,20);assert.equal(new Set(tasks.map(t=>t.channelId)).size,20);for(const t of tasks){assert.equal(t.slots.length,6);assert.ok(t.slots.every(v=>M.STATES.includes(v)));}}
 assert.equal(s.channels[0].number,'001');assert.equal(s.channels[19].number,'020');
 assert.equal(M.summary(s,date,now).accepted,6);
});
test('尚未走入的EPG槽位保持未使用，开始后才变成处理色',()=>{
 const t=M.newTask(1,date,now);assert.deepEqual(t.slots,Array(6).fill('unused'));
 const next=M.applyEvent(t,{type:'start'},now);assert.equal(next.slots[0],'processing');assert.equal(t.slots[0],'unused');
});
test('正确完成保留通过环，下一步只有一个正在处理槽位',()=>{
 const t=M.newTask(1,date,now,0,'running');const next=M.applyEvent(t,{type:'complete'},now);
 assert.deepEqual(next.slots,['passed','processing','unused','unused','unused','unused']);assert.equal(next.cursor,1);
});
test('带警告通过会记录警告，不阻止进入下一步',()=>{
 const t=M.newTask(3,date,now,1,'running');const next=M.applyEvent(t,{type:'complete',warning:true},now);
 assert.equal(next.slots[1],'warning');assert.equal(next.slots[2],'processing');assert.deepEqual(next.warnings,[1]);
});
test('当前故障与回退故障区分，回退只返回相邻节点且清除失效产出',()=>{
 let t=M.newTask(9,date,now,4,'running');assert.ok(t.outputAt);
 t=M.applyEvent(t,{type:'fault'},now);assert.equal(t.slots[4],'fault');assert.equal(t.status,'fault');assert.equal(M.isDone(t),false);
 const back=M.applyEvent(t,{type:'rollback'},now+1);assert.equal(back.slots[4],'rollback');assert.equal(back.slots[3],'processing');assert.equal(back.cursor,3);assert.equal(back.outputAt,null);
 assert.deepEqual(M.connections([back]),[{taskId:t.id,channelId:9,from:4,to:3,kind:'rollback',moving:true}]);
 const retry=M.applyEvent(back,{type:'retry'},now+2);assert.equal(retry.returnFrom,null);assert.equal(retry.slots[4],'rollback');
 const forward=M.applyEvent(retry,{type:'complete'},now+3);assert.equal(forward.slots[3],'passed');assert.equal(forward.status,'waiting');
 const human=M.applyEvent(forward,{type:'start'},now+4);assert.equal(human.slots[4],'processing');
});
test('首节点故障不能回退到不存在的节点，故障不能假装完成',()=>{
 const t=M.applyEvent(M.newTask(1,date,now,0,'running'),{type:'fault'},now);
 assert.throws(()=>M.applyEvent(t,{type:'rollback'},now));assert.throws(()=>M.applyEvent(t,{type:'complete'},now));assert.equal(M.connections([t]).length,0);
});
test('Output生成不等于人工已处理，人工开始必须有独立事件',()=>{
 const t=M.applyEvent(M.newTask(1,date,now,3,'running'),{type:'complete'},now);
 assert.equal(t.outputAt,now);assert.equal(t.cursor,4);assert.equal(t.status,'waiting');assert.equal(t.slots[4],'unused');assert.equal(M.isDone(t),false);
 assert.equal(M.connections([t]).length,0);
 const active=M.applyEvent(t,{type:'start'},now+1000);assert.equal(active.slots[4],'processing');assert.equal(M.connections([active])[0].to,4);
});
test('最终接收必须有成功状态与接收时间，不能用上传或警告冒充',()=>{
 const t=M.newTask(1,date,now,5,'running');assert.equal(M.isDone(t),false);assert.equal(M.isOverdue(t,now),true);
 assert.throws(()=>M.applyEvent(t,{type:'complete',warning:true},now));
 assert.equal(M.isDone({...t,status:'accepted'}),false);
 const done=M.applyEvent(t,{type:'complete'},now);assert.equal(M.isDone(done),true);assert.equal(M.isOverdue(done,now),false);assert.equal(M.connections([done]).length,0);
});
test('回读与对比仅适用于已接收任务，未知不算无差异，不影响交付',()=>{
 const t=M.newTask(1,date,now,5,'running');assert.throws(()=>M.applyEvent(t,{type:'readback'},now));
 const done=M.applyEvent(t,{type:'complete'},now);assert.equal(M.feedbackStats([done]).waiting,1);
 const reading=M.applyEvent(done,{type:'readback'},now+1);const compared=M.applyEvent(reading,{type:'compare',difference:true},now+2);
 assert.equal(M.isDone(compared),true);assert.equal(compared.acceptedAt,done.acceptedAt);
 assert.deepEqual(M.feedbackStats([compared,t]),{eligible:1,compared:1,reading:0,waiting:0,differences:1});
 assert.deepEqual(M.feedbackStats([]),{eligible:0,compared:0,reading:0,waiting:0,differences:0});
});
test('跨午夜保留原播出日的未完成任务，新日期不覆盖旧任务',()=>{
 const s=M.seed(now),original=s.tasks.find(t=>t.broadcastDate===s.today&&!M.isDone(t));
 const next=M.rollover(s,Date.parse('2026-09-11T00:01:00+08:00'));
 assert.equal(next.today,'2026-09-11');assert.deepEqual(M.taskById(next,original.id),original);
 for(const d of ['2026-09-11','2026-09-12','2026-09-13'])assert.equal(M.tasksForDate(next,d).length,20);
 assert.equal(new Set(next.tasks.map(t=>t.id)).size,next.tasks.length);
});
test('所有流线只跨相邻节点且保留所属频道，故障线不移动',()=>{
 const s=M.seed(now),tasks=M.tasksForDate(s,date),edges=M.connections(tasks);
 assert.ok(edges.some(e=>e.kind==='rollback'));assert.ok(edges.some(e=>e.kind==='fault'));
 for(const e of edges){assert.equal(Math.abs(e.from-e.to),1);assert.equal(M.taskById(s,e.taskId).channelId,e.channelId);assert.ok(e.from>=0&&e.to<=5);if(e.kind==='fault')assert.equal(e.moving,false);}
});
test('40频道复用状态结构，每播出日完整保留040及所有编号',()=>{
 const s=M.seed(now,40);assert.equal(s.tasks.length,120);assert.equal(s.channels[39].number,'040');assert.equal(M.summary(s,date,now).total,40);
});
test('连续模拟事件保持单个活动槽位和统计守恒，不自动清除未获恢复事件的故障',()=>{
 let s=M.seed(now);const fault=s.tasks.find(t=>t.broadcastDate===date&&t.status==='fault');
 for(let i=1;i<=300;i++){
  s=M.advance(s,now+i*8000,date);
  for(const t of M.tasksForDate(s,date)){assert.ok(t.slots.filter(v=>v==='processing').length<=1);assert.ok(t.slots.every(v=>M.STATES.includes(v)));}
  const stats=M.summary(s,date,now+i*8000);assert.equal(stats.total,20);assert.equal(stats.feedback.compared+stats.feedback.waiting+stats.feedback.reading,stats.accepted);
  assert.equal(M.taskById(s,fault.id).status,'fault');
 }
});
