(function () {
  'use strict';
  const M=window.JinshuModel;
  const $=id=>document.getElementById(id);
  const params=new URLSearchParams(location.search);
  let state=M.seed(Date.now(),params.get('channels')==='40'?40:20);
  let selected=M.offsetDay(state.today,1);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches,rotate=true,nextRotation=Date.now()+30000;
  let paths=[],phase=0.2,lastFrame=performance.now();
  const ns='http://www.w3.org/2000/svg';
  const stateNames={unused:'从未使用',passed:'正确通过',warning:'告警通过',rollback:'故障已回退',processing:'正在处理',fault:'当前节点故障'};
  const icons=[
    '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
    '<path d="M3 7V5h7l2 3h9v12H3Z"/>',
    '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    '<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3Z"/>',
    '<path d="m12 3 9 5v9l-9 5-9-5V8Zm0 10v9M3 8l9 5 9-5M8 5l9 5"/>'
  ];
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clock=time=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(time));
  function fit(){ $('screen-shell').style.setProperty('--screen-scale',Math.min(innerWidth/1920,innerHeight/1080)); }
  function setTheme(theme){document.documentElement.dataset.theme=theme;$('theme').textContent=theme==='light'?'☾':'☀';$('theme').setAttribute('aria-label',theme==='light'?'切换到深色背景':'切换到浅色背景');try{localStorage.setItem('jinshu-numbered-theme',theme);}catch{}if(paths.length)drawLines();}
  let saved;try{saved=localStorage.getItem('jinshu-numbered-theme');}catch{}
  setTheme(params.get('theme')==='dark'?'dark':params.get('theme')==='light'?'light':saved==='dark'?'dark':'light');
  $('dashboard').classList.toggle('expanded',state.channels.length>20);
  function renderTabs(){
    $('day-tabs').innerHTML=[0,1,2].map((offset)=>{const date=M.offsetDay(state.today,offset);return `<button type="button" data-date="${date}" ${date===selected?'aria-current="date"':''}><span>${['今天','明天','后天'][offset]}</span><small>${date.slice(5).replace('-','/')}</small></button>`;}).join('');
  }
  function coordinates(stage,index){
    const count=state.channels.length,cols=count>20?4:2;
    const width=$('workflow').clientWidth/6,height=$('workflow').clientHeight;
    const size=count>20?28:44,top=124+size/2,bottom=height-5-size/2;
    const x=width*stage+width/2+((index%cols)-(cols-1)/2)*(cols===2?79:42)+(stage%2?5:-5);
    return {x,y:top+(bottom-top)*index/(count-1),size,width};
  }
  function renderSlots(){
    const tasks=M.tasksForDate(state,selected);
    const byChannel=new Map(tasks.map(t=>[t.channelId,t]));
    const summary=M.summary(state,selected,Date.now());
    $('stages').innerHTML=M.STAGES.map((stage,si)=>{
      const processing=tasks.filter(t=>t.cursor===si&&t.status==='running'&&t.slots[si]==='processing').length;
      const working=M.isAgentWorking(tasks,si);
      const caption=si===4?`${summary.humanWaiting} 待接手 · ${summary.humanWorking} 处理中`:si===5?'已接收后待执行':`共享 Agent · ${processing} 处理中`;
      return `<section class="stage ${working?'is-working':''}" data-stage="${stage.id}" data-working="${working}" aria-label="${stage.label}"><div class="stage-heading"><div class="stage-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[si]}</svg></div><h3>${stage.label}</h3><small>${caption}</small></div><div class="slot-field">${state.channels.map((channel,index)=>{
        const point=coordinates(si,index),task=byChannel.get(channel.id),slotState=task?task.slots[si]:'unused';
        const label=channel.number+' '+channel.name+' · '+stage.label+' · '+stateNames[slotState];
        const dark=`hsl(${208+((channel.id-1)%20)*3.8} 62% 57%)`;
        return `<span class="slot" id="slot-${si}-${channel.id}" data-channel="${channel.id}" data-stage="${si}" data-state="${slotState}" role="img" aria-label="${esc(label)}" title="${esc(label)}" style="left:${point.x-si*point.width}px;top:${point.y-120}px;--slot-size:${point.size}px;--slot-font:${state.channels.length>20?9:13}px;--channel-base:${channel.color};--channel-dark:${dark}"><b>${channel.number}</b></span>`;
      }).join('')}</div></section>`;
    }).join('');
    $('channel-legend').innerHTML=state.channels.map(c=>{const t=byChannel.get(c.id);return `<div class="channel-item ${t&&['fault','returned'].includes(t.status)?'issue':''}"><span class="channel-number" style="--channel-color:${c.color}">${c.number}</span><span class="channel-name">${esc(c.name)}</span></div>`;}).join('');
  }
  function drawLines(){
    const svg=$('flow-lines'),width=$('workflow').clientWidth,height=$('workflow').clientHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.replaceChildren();paths=[];
    for(const connection of M.connections(M.tasksForDate(state,selected))){
      const index=state.channels.findIndex(c=>c.id===connection.channelId);
      const a=coordinates(connection.from,index),b=coordinates(connection.to,index);
      const sign=b.x>a.x?1:-1;
      const start=a.x+sign*(a.size/2+1),end=b.x-sign*(b.size/2+1),dx=end-start;
      const bend=(connection.channelId%2?1:-1)*6;
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',`M${start} ${a.y} C${start+dx*.35} ${a.y+bend} ${start+dx*.65} ${b.y-bend} ${end} ${b.y}`);
      path.setAttribute('class','flow-path '+connection.kind);
      path.dataset.kind=connection.kind;
      path.dataset.channel=connection.channelId;path.dataset.from=connection.from;path.dataset.to=connection.to;path.dataset.fromChannel=connection.channelId;path.dataset.toChannel=connection.channelId;
      const failed=['fault','rollback'].includes(connection.kind);
      const color=failed?'var(--red)':connection.kind==='completed'?'var(--green)':M.color(connection.channelId);
      path.style.setProperty('--flow-color',color);svg.append(path);
      if(connection.moving){const dot=document.createElementNS(ns,'circle');dot.setAttribute('r','3.2');dot.setAttribute('class','flow-bead');dot.style.setProperty('--flow-color',color);dot.dataset.channel=connection.channelId;svg.append(dot);paths.push({path,dot,length:path.getTotalLength(),offset:connection.channelId*.047,speed:connection.kind==='rollback'?1.35:1});}
    }
    paint();
  }
  function renderContext(){
    const now=Date.now(),s=M.summary(state,selected,now),offset=Math.round((M.startOfDay(selected)-M.startOfDay(state.today))/M.DAY);
    $('page-title').textContent=['今日播出准备','明日播出准备','后天播出准备'][offset]||'播出准备';
    $('broadcast-date').textContent=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'short'}).format(new Date(M.startOfDay(selected)));
    $('channel-count').textContent=state.channels.length+' 个频道';$('accepted-count').textContent=s.accepted;$('total-count').textContent='/ '+s.total;
    const alerts=[];if(s.overdue)alerts.push(s.overdue+' 份超过交付时限');if(s.faults||s.returned)alerts.push((s.faults+s.returned)+' 份故障／回退');
    $('attention').textContent=alerts.join(' · ')||'当前没有需关注任务';$('attention').style.color=alerts.length?'var(--orange)':'var(--green)';
    const f=s.feedback;$('feedback').textContent=`${f.compared} 已对比 · ${f.reading} 对比中 · ${f.waiting} 待回读`;
    $('latest-event').textContent=state.latest;$('updated').textContent='最近更新 '+clock(state.updatedAt);
  }
  function render(){renderTabs();renderSlots();drawLines();renderContext();}
  function paint(){for(const item of paths){const fraction=(phase*item.speed+item.offset)%1;const point=item.path.getPointAtLength(fraction*item.length);item.dot.setAttribute('cx',point.x);item.dot.setAttribute('cy',point.y);}}
  function frame(now){const dt=Math.min(now-lastFrame,80);lastFrame=now;if(!paused){phase+=dt/3400;paint();}requestAnimationFrame(frame);}
  function motion(){document.body.classList.toggle('is-paused',paused);$('motion').textContent=paused?'▷':'Ⅱ';$('motion').setAttribute('aria-label',paused?'播放动效':'暂停动效');$('motion').setAttribute('aria-pressed',String(paused));$('motion').disabled=reduced.matches;}
  function update(){const now=Date.now();try{state=M.advance(state,now,selected);const offset=(M.startOfDay(selected)-M.startOfDay(state.today))/M.DAY;if(offset<0||offset>2)selected=M.offsetDay(state.today,1);render();}catch(error){$('connection').textContent='模拟记录更新中断';$('connection').classList.add('stale');console.error(error);}}
  function tick(){const now=Date.now();$('clock').textContent=clock(now);$('date').textContent=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).format(new Date(now));const stale=now-state.updatedAt>35000;$('connection').textContent=stale?'数据未更新':'模拟状态已连接';$('connection').classList.toggle('stale',stale);if(rotate&&now>=nextRotation){const index=[0,1,2].findIndex(i=>M.offsetDay(state.today,i)===selected);selected=M.offsetDay(state.today,(index+1)%3);nextRotation=now+30000;render();}if(M.dayKey(now)!==state.today)update();}
  $('state-key').innerHTML=M.STATES.map(id=>`<span class="key-item"><i class="key-sample ${id}"></i>${stateNames[id]}</span>`).join('');
  $('day-tabs').addEventListener('click',event=>{const button=event.target.closest('button[data-date]');if(!button)return;selected=button.dataset.date;nextRotation=Date.now()+30000;render();});
  $('rotation').addEventListener('click',()=>{rotate=!rotate;nextRotation=Date.now()+30000;$('rotation').setAttribute('aria-pressed',String(rotate));$('rotation-label').textContent=rotate?'自动切换':'停留本日';});
  $('theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='light'?'dark':'light'));
  $('motion').addEventListener('click',()=>{paused=!paused;motion();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;motion();});
  window.addEventListener('resize',fit);
  document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(!document.hidden){if(Date.now()-state.updatedAt>35000)update();tick();}});
  fit();render();motion();tick();requestAnimationFrame(frame);setInterval(tick,1000);setInterval(update,8000);
})();
