(function (root) {
  'use strict';
  const DAY = 86400000;
  const STAGES = [
    {id:'epg',label:'EPG 接收'}, {id:'match',label:'素材匹配'},
    {id:'arrange',label:'智能编排'}, {id:'check',label:'检查产出'},
    {id:'human',label:'编单员'}, {id:'playbox',label:'Playbox 已接收'}
  ];
  const STATES = ['unused','passed','warning','rollback','processing','fault'];
  const NAMES = ['星光动画','环球影院','都市剧场','生活时尚','非洲故事','世界纪实','快乐少儿','经典剧场','家庭影院','文化视野','音乐现场','自然探索','东方故事','青春剧场','风尚生活','旅行世界','星光综艺','人文记录','成长天地','经典影院'];
  function dayKey(time) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time)); }
  function startOfDay(key) { return Date.parse(key+'T00:00:00+08:00'); }
  function offsetDay(key,offset) { return dayKey(startOfDay(key)+offset*DAY); }
  function deadlineFor(date) { return startOfDay(date)-DAY; }
  function number(id) { return String(id).padStart(3,'0'); }
  function color(id) { return `hsl(${208+((id-1)%20)*3.8} 62% 48%)`; }
  function newTask(channelId,broadcastDate,now,cursor=0,status='waiting') {
    return {
      id:broadcastDate+':'+number(channelId),channelId,broadcastDate,
      workDate:dayKey(now),createdAt:now-((channelId%9)+3)*60000,
      deadline:deadlineFor(broadcastDate),cursor,status,returnFrom:null,
      slots:STAGES.map((_,index)=>index<cursor?'passed':index===cursor&&status==='running'?'processing':'unused'),
      stageSince:now-(channelId%6)*60000,outputAt:cursor>=4?now-60000:null,
      acceptedAt:null,feedback:'ineligible',difference:false,warnings:[],events:[]
    };
  }
  function isDone(task) { return task.status==='accepted'&&Number.isFinite(task.acceptedAt)&&task.slots[5]==='passed'; }
  function isOverdue(task,now) { return !isDone(task)&&now>=task.deadline; }
  function taskById(state,id) { return state.tasks.find(task=>task.id===id); }
  function applyEvent(task,event,now) {
    const next={...task,slots:[...task.slots],warnings:[...task.warnings],events:[...task.events]};
    function finish() { next.events.push({type:event.type,at:now,stage:next.cursor});next.stageSince=now;return next; }
    if(event.type==='start'&&task.status==='waiting') { next.status='running';next.slots[next.cursor]='processing';return finish(); }
    if(event.type==='complete'&&task.status==='running') {
      const index=task.cursor;
      if(event.warning&&index===5) throw new Error('Playbox接收须有明确成功结果，不能以警告代替');
      next.slots[index]=event.warning?'warning':'passed';
      if(event.warning) next.warnings.push(index);
      if(index===3) next.outputAt=now;
      if(index===5) { next.status='accepted';next.acceptedAt=now;next.feedback='waiting'; }
      else { next.cursor=index+1;next.status=next.cursor===4?'waiting':'running';if(next.status==='running') next.slots[next.cursor]='processing'; }
      return finish();
    }
    if(event.type==='fault'&&task.status==='running') { next.slots[next.cursor]='fault';next.status='fault';return finish(); }
    if(event.type==='rollback'&&task.status==='fault'&&task.cursor>0) {
      const failed=task.cursor;next.slots[failed]='rollback';next.cursor=failed-1;
      next.slots[next.cursor]='processing';next.status='returned';next.returnFrom=failed;
      // Rework at or before validation invalidates the previous generated output.
      if(next.cursor<=3) next.outputAt=null;
      return finish();
    }
    if(event.type==='retry'&&['fault','returned'].includes(task.status)) {
      next.status='running';next.returnFrom=null;next.slots[next.cursor]='processing';return finish();
    }
    if(event.type==='readback'&&isDone(task)&&task.feedback==='waiting') {next.feedback='reading';return finish();}
    if(event.type==='compare'&&isDone(task)&&task.feedback==='reading') {next.feedback='compared';next.difference=Boolean(event.difference);return finish();}
    throw new Error('当前任务状态不允许该事件：'+task.status+' / '+event.type);
  }
  function acceptedTask(id,date,now) {
    const task=newTask(id,date,now,5,'running');
    const result=applyEvent(task,{type:'complete'},now-60000*(id%8+1));
    result.createdAt=now-30*60000;result.outputAt=now-22*60000;
    result.feedback=id%3===0?'waiting':'compared';result.difference=id%7===0;
    return result;
  }
  function makeDay(date,relative,channels,now) {
    return channels.map(channel=>{
      const i=(channel.id-1)%20;
      if(relative===0&&i>=3||relative===1&&i>=14) return acceptedTask(channel.id,date,now);
      if(relative===2) return newTask(channel.id,date,now,i<4?0:i<7?1:0,i<7?'running':'waiting');
      const cursors=[0,1,2,3,4,5,0,1,2,3,3,4,4,0];
      let task=newTask(channel.id,date,now,cursors[i]||0,i===11||i===13?'waiting':'running');
      if(i===7){task.slots[0]='warning';task.warnings=[0];}
      if(i===9) task=applyEvent(task,{type:'fault'},now-90000);
      if(i===10){task=applyEvent(task,{type:'fault'},now-95000);task=applyEvent(task,{type:'rollback'},now-80000);}
      return task;
    });
  }
  function seed(now=Date.now(),count=20) {
    const today=dayKey(now);
    const channels=Array.from({length:count},(_,i)=>({id:i+1,number:number(i+1),name:NAMES[i]||'演示频道 '+number(i+1),color:color(i+1)}));
    return {today,channels,tasks:[0,1,2].flatMap(offset=>makeDay(offsetDay(today,offset),offset,channels,now)),updatedAt:now,sequence:0,latest:'模拟任务记录已就绪',changedTask:null};
  }
  function tasksForDate(state,date) { return state.tasks.filter(t=>t.broadcastDate===date); }
  function feedbackStats(tasks) {
    const accepted=tasks.filter(isDone);
    return {eligible:accepted.length,compared:accepted.filter(t=>t.feedback==='compared').length,reading:accepted.filter(t=>t.feedback==='reading').length,waiting:accepted.filter(t=>t.feedback==='waiting').length,differences:accepted.filter(t=>t.feedback==='compared'&&t.difference).length};
  }
  function summary(state,date,now) {
    const tasks=tasksForDate(state,date);
    return {total:tasks.length,accepted:tasks.filter(isDone).length,overdue:tasks.filter(t=>isOverdue(t,now)).length,faults:tasks.filter(t=>t.status==='fault').length,returned:tasks.filter(t=>t.status==='returned').length,humanWaiting:tasks.filter(t=>t.cursor===4&&t.status==='waiting').length,humanWorking:tasks.filter(t=>t.cursor===4&&['running','returned'].includes(t.status)).length,feedback:feedbackStats(tasks)};
  }
  function connections(tasks) {
    return tasks.flatMap(task=>{
      if(task.status==='returned') return [{taskId:task.id,channelId:task.channelId,from:task.returnFrom,to:task.cursor,kind:'rollback',moving:true}];
      if(task.cursor>0&&task.status==='running') return [{taskId:task.id,channelId:task.channelId,from:task.cursor-1,to:task.cursor,kind:'processing',moving:true}];
      if(task.cursor>0&&task.status==='fault') return [{taskId:task.id,channelId:task.channelId,from:task.cursor-1,to:task.cursor,kind:'fault',moving:false}];
      return [];
    });
  }
  function rollover(state,now) {
    const today=dayKey(now);if(today===state.today)return state;
    // Retain every unfinished task. Existing day data is never regenerated.
    const tasks=state.tasks.filter(t=>!isDone(t)||t.broadcastDate>=offsetDay(today,-2));
    for(let offset=0;offset<3;offset++){
      const date=offsetDay(today,offset);
      if(!tasks.some(t=>t.broadcastDate===date))tasks.push(...makeDay(date,offset,state.channels,now));
    }
    return {...state,today,tasks,latest:'播出日期已更新，未完成任务记录保留'};
  }
  function advance(state,now,visibleDate) {
    const base=rollover(state,now);
    const next={...base,tasks:[...base.tasks],sequence:base.sequence+1,updatedAt:now,changedTask:null};
    const date=visibleDate&&visibleDate>=base.today?visibleDate:offsetDay(base.today,1);
    const candidates=tasksForDate(next,date).filter(t=>['running','waiting','returned'].includes(t.status));
    let task,event;
    if(next.sequence%3===0){task=tasksForDate(next,date).find(t=>isDone(t)&&['waiting','reading'].includes(t.feedback));if(task)event={type:task.feedback==='waiting'?'readback':'compare',difference:task.channelId%4===0};}
    if(!task&&candidates.length){task=candidates[Math.floor(next.sequence/2)%candidates.length];event={type:task.status==='waiting'?'start':task.status==='returned'?'retry':'complete',warning:task.cursor===1&&task.channelId%7===0};}
    if(task){const index=next.tasks.findIndex(t=>t.id===task.id);next.tasks[index]=applyEvent(task,event,now);next.changedTask=task.id;const name=next.channels.find(c=>c.id===task.channelId).name;const result=next.tasks[index];next.latest=number(task.channelId)+' '+name+' · '+(event.type==='readback'?'正在回读':event.type==='compare'?'对比已记录':isDone(result)?'Playbox 已接收':STAGES[result.cursor].label+(result.status==='waiting'?'待接手':'处理中'));}
    else next.latest='等待任务更新 · 故障记录保留';
    return next;
  }
  const api={DAY,STAGES,STATES,dayKey,startOfDay,offsetDay,deadlineFor,number,color,newTask,isDone,isOverdue,taskById,applyEvent,seed,tasksForDate,feedbackStats,summary,connections,rollover,advance};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.JinshuModel=api;
})(typeof window!=='undefined'?window:globalThis);
