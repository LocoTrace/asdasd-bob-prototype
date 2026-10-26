(()=>{'use strict';
 if(document.querySelector('#bob-companion'))return;
 const config=document.currentScript?.dataset||{},model=window.BobBehavior;
 let state=model.create(),walkingEnabled=true,hidden=false,ready=false,front,profile,sideWeight=0,motion=null,turn=0,walkEnergy=0;
 let cw=178,ch=260,gutter=25,dpr=1,last=0,previousEmotion='',pointTarget=null,pending=null,dense=null,pointAmount=0,pointSide='pointRight';
 const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');let reduced=reducedQuery.matches;
 reducedQuery.addEventListener('change',e=>reduced=e.matches);
 const stage=document.createElement('div');stage.id='bob-companion';stage.innerHTML='<canvas id="bob-canvas" tabindex="0" role="button" aria-label="Боб. Нажмите для вопросов об агентстве. Можно схватить и бросить."></canvas><span class="bob-load">Боб идёт…</span><span class="bob-status" role="status" aria-live="polite"></span>';document.body.append(stage);
 const canvas=stage.querySelector('canvas'),ctx=canvas.getContext('2d'),loading=stage.querySelector('.bob-load'),status=stage.querySelector('.bob-status');
 const menu=document.createElement('section');menu.id='bob-questions';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-labelledby','bob-menu-title');menu.innerHTML='<div class="bob-menu-head"><button class="bob-back" hidden>← Назад</button><button class="bob-close" aria-label="Закрыть вопросы">×</button></div><div class="bob-menu-home"><h2 id="bob-menu-title">Что интересно?</h2><div class="bob-chips"></div></div><div class="bob-menu-detail" hidden><h2 class="bob-answer-title"></h2><div class="bob-answer" aria-live="polite"></div></div>';document.body.append(menu);
 const recallButton=document.createElement('button');recallButton.id='bob-recall';recallButton.textContent='Вернуть Боба ↩';recallButton.hidden=true;document.body.append(recallButton);
 const pointer={active:false,x:0,y:0,clientX:0,clientY:0};
 const frontURL=config.image||'../анфас_без теней.png',profileURL=config.profile||'../профиль_без теней.png';
 const atlasURL=config.atlas||'generated/bob-motion-atlas-v1.png';
 const denseURL=config.dense||'generated/bob-dense-v1.webp',walkURL=config.walk||'generated/bob-walk-finish-v1.webp';
 async function loadAssets(){
  try{dense=await window.BobMotion.loadDense(denseURL,walkURL);stage.dataset.frames=String(dense.frames.length);stage.dataset.version='14';}
  catch(error){try{motion=await window.BobMotion.load(atlasURL);}catch(fallback){[front,profile]=await Promise.all([window.BobAssets.load(frontURL,'front'),window.BobAssets.load(profileURL,'profile')]);}}
  ready=true;loading.hidden=true;stage.dataset.ready='true';stage.dataset.generated=String(Boolean(dense||motion));
 }
 loadAssets().catch(()=>{loading.textContent='Не удалось загрузить ракурсы Боба';});
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function size(){const r=stage.getBoundingClientRect();cw=r.width;ch=r.height;gutter=cw*.14;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round((cw+gutter*2)*dpr);canvas.height=Math.round(ch*dpr);if(state.phase==='held')releasePending(true);}
 addEventListener('resize',size);size();
 function closeMenu(focus=false){menu.hidden=true;state.menuOpen=false;canvas.setAttribute('aria-expanded','false');if(focus&&!hidden)canvas.focus({preventScroll:true});}
 function menuPosition(){if(menu.hidden)return;const r=menu.getBoundingClientRect(),x=clamp((state.x??0)+cw*.5-r.width*.65,12,Math.max(12,innerWidth-r.width-12));let y=innerHeight-state.altitude-ch-r.height+cw*.27-14;y=clamp(y,12,Math.max(12,innerHeight-r.height-12));menu.style.left=x+'px';menu.style.top=y+'px';}
 function showQuestions(focus=false){menu.querySelector('.bob-menu-home').hidden=false;menu.querySelector('.bob-menu-detail').hidden=true;menu.querySelector('.bob-back').hidden=true;menu.setAttribute('aria-labelledby','bob-menu-title');if(focus)menu.querySelector('.bob-chips button')?.focus({preventScroll:true});}
 function openMenu(){showQuestions();menu.hidden=false;state.menuOpen=true;state.walking=false;state.speed=0;state.context=null;canvas.setAttribute('aria-expanded','true');menuPosition();menu.querySelector('.bob-chips button')?.focus({preventScroll:true});}
 canvas.setAttribute('aria-haspopup','dialog');canvas.setAttribute('aria-controls','bob-questions');canvas.setAttribute('aria-expanded','false');
 menu.querySelector('.bob-close').addEventListener('click',()=>closeMenu(true));
 menu.querySelector('.bob-back').addEventListener('click',()=>showQuestions(true));
 stage.dataset.input='pointer';menu.dataset.input='pointer';document.addEventListener('pointerdown',()=>{stage.dataset.input='pointer';menu.dataset.input='pointer';},true);document.addEventListener('keydown',e=>{if(e.key==='Tab'){stage.dataset.input='keyboard';menu.dataset.input='keyboard';}},true);
 document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!stage.contains(e.target))closeMenu();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(pending||!menu.hidden)){if(pending)releasePending(true);closeMenu(true);}});
 function readQuestions(){
  const services=Array.from(document.querySelectorAll('h2[class*="WhatWeDoSlider_title"]')).map(h=>h.textContent.trim());
  const projects=Array.from(document.querySelectorAll('[class*="ProjectCard_card__"]')).map(card=>({label:card.querySelector('img')?.alt,url:card.querySelector('a')?.href})).filter(x=>x.label&&x.url);
  const upgrade=document.querySelector('[class*="Home_workFormatTitle"]');const upgradeText=upgrade?.parentElement.querySelector('p')?.textContent.trim();
  const contact=Array.from(document.querySelectorAll('a')).find(a=>a.href==='https://t.me/asdasd_com');
  const items=[
   {title:'Чем занимается агентство?',text:services.length?'На сайте представлены направления: '+services.join(', ')+'.':'Направления работы и услуги представлены на сайте ASDASD.',links:services.length?[]:[{label:'Открыть сайт агентства',url:'https://asdasdagency.com/'}]},
   {title:'Какие проекты посмотреть?',text:'Вот работы, представленные на главной:',links:projects.length?projects:[{label:'Все проекты ASDASD',url:'https://asdasdagency.com/projects/'}]},
   {title:'Что такое Business upgrade?',text:upgradeText||'На главной есть отдельный блок Business upgrade — о том, как меняются оформление, стиль и подача бренда.',links:[{label:'Подробнее о Business upgrade ↗',url:'https://upgrade.asdasdagency.com/'}]},
   {title:'Как начать работу?',text:'Кнопки «Как начать работу» и «Связаться с нами» на сайте ведут в Telegram агентства. Там можно обсудить задачу.',links:[{label:'Написать агентству в Telegram ↗',url:contact?.href||'https://t.me/asdasd_com'}]},
   {title:'А с тобой что можно?',text:'Я Боб — глаза твоего клиента. Наведи курсор на проект или «Подробнее». Меня можно взять мышкой, перенести и бросить. После приземления я снова пойду по нижнему краю.',links:[]}
  ];
  const chips=menu.querySelector('.bob-chips'),answer=menu.querySelector('.bob-answer');
  items.forEach(item=>{const button=document.createElement('button');button.textContent=item.title;button.addEventListener('click',()=>{answer.replaceChildren();menu.querySelector('.bob-answer-title').textContent=item.title;menu.querySelector('.bob-answer-title').id='bob-answer-title';menu.querySelector('.bob-menu-home').hidden=true;menu.querySelector('.bob-menu-detail').hidden=false;menu.querySelector('.bob-back').hidden=false;menu.setAttribute('aria-labelledby','bob-answer-title');const p=document.createElement('p');p.textContent=item.text;answer.append(p);for(const link of item.links||[]){const a=document.createElement('a');a.textContent=link.label;a.href=link.url;a.target='_blank';a.rel='noopener';answer.append(a);}model.greet(state);menuPosition();menu.querySelector('.bob-back').focus({preventScroll:true});});chips.append(button);});
 }
 readQuestions();
 function setHidden(value){hidden=value;stage.classList.toggle('bob-hidden',hidden);if(hidden){releasePending(true);closeMenu();}document.querySelectorAll('[data-bob-toggle],#toggle-bob').forEach(b=>{b.setAttribute('aria-pressed',String(hidden));b.textContent=hidden?'Вернуть Боба':'Скрыть Боба';});}
 function reset(){releasePending(true);closeMenu();pointTarget?.classList.remove('bob-point-target');pointTarget=null;state=model.create();pointer.active=false;sideWeight=0;turn=0;walkEnergy=0;setHidden(false);const range=document.querySelector('#reveal');if(range){range.value='18';range.setAttribute('aria-valuetext','Обновлённый вариант открыт на 18 процентов');document.querySelector('#compare')?.style.setProperty('--reveal','18%');}}
 recallButton.addEventListener('click',()=>{model.recall(state,innerWidth,cw);setHidden(false);recallButton.hidden=true;});
 document.addEventListener('bob:walking',e=>walkingEnabled=Boolean(e.detail.enabled));document.addEventListener('bob:hidden',e=>setHidden(Boolean(e.detail.hidden)));document.addEventListener('bob:reset',reset);
 document.querySelectorAll('[data-bob-toggle],#toggle-bob').forEach(b=>b.addEventListener('click',()=>setHidden(!hidden)));document.querySelector('#reset')?.addEventListener('click',reset);
 // Existing demo compatibility. The actual site uses project/button hover instead.
 document.addEventListener('bob:compare',e=>model.compare(state,Number(e.detail.value),Boolean(e.detail.dragging)));
 const range=document.querySelector('#reveal');let comparisonDrag=false;
 function compare(value,drag=comparisonDrag){if(!range)return;range.value=value;document.querySelector('#compare').style.setProperty('--reveal',value+'%');range.setAttribute('aria-valuetext','Обновлённый вариант открыт на '+value+' процентов');model.compare(state,Number(value),drag);}
 range?.addEventListener('input',()=>compare(range.value));range?.addEventListener('pointerdown',()=>{comparisonDrag=true;compare(range.value);});
 const finishCompare=()=>{if(comparisonDrag){comparisonDrag=false;compare(range.value,false);}};document.addEventListener('pointerup',finishCompare);document.addEventListener('pointercancel',finishCompare);range?.addEventListener('blur',finishCompare);
 document.querySelectorAll('[data-value]').forEach(b=>b.addEventListener('click',()=>compare(b.dataset.value,false)));
 function contextAt(target){
  if(!target?.closest||target.closest('#bob-companion,#bob-questions,#bob-lab'))return null;
  const more=target.closest('a[class*="MoreButton_moreButton"],a[class*="VideoButton_videoButton"],a[class*="Home_homeAboutStartTitle"]');
  if(more)return {kind:'more',element:more};
  const project=target.closest('[class*="ProjectCard_card__"]');if(project)return {kind:'project',element:project};
  return null;
 }
 function updateContext(target){const next=contextAt(target);if(pointTarget!==next?.element){pointTarget?.classList.remove('bob-point-target');pointTarget=next?.kind==='more'?next.element:null;pointTarget?.classList.add('bob-point-target');}state.context=next;}
 document.querySelectorAll('[class*="ProjectCard_card__"]').forEach(card=>{card.tabIndex=0;card.setAttribute('role','group');card.setAttribute('aria-label',card.querySelector('img')?.alt||'Проект агентства');});
 document.addEventListener('pointerover',e=>{if(!pending)updateContext(e.target);});
 document.addEventListener('pointerout',e=>{if(!pending)updateContext(e.relatedTarget);});
 document.addEventListener('focusin',e=>{if(!menu.contains(e.target)&&!stage.contains(e.target))updateContext(e.target);});
 document.addEventListener('focusout',e=>{if(!pending)updateContext(e.relatedTarget);});
 document.addEventListener('pointermove',e=>{pointer.clientX=e.clientX;pointer.clientY=e.clientY;pointer.active=e.pointerType!=='touch';},{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>{pointer.active=false;if(!pending)state.context=null;});
 function sample(e){pending.samples.push({x:e.clientX,y:e.clientY,t:performance.now()});const cutoff=performance.now()-130;pending.samples=pending.samples.filter(p=>p.t>=cutoff);}
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||!ready)return;const hx=Math.floor(e.offsetX*dpr),hy=Math.floor(e.offsetY*dpr);if(hx<0||hy<0||hx>=canvas.width||hy>=canvas.height||ctx.getImageData(hx,hy,1,1).data[3]<12)return;e.preventDefault();canvas.focus({preventScroll:true});
  const r=canvas.getBoundingClientRect();pending={id:e.pointerId,startX:e.clientX,startY:e.clientY,startTime:performance.now(),anchorX:e.clientX-r.left-gutter,anchorY:e.clientY-r.top,moved:false,samples:[]};sample(e);state.dragIntent=true;state.speed=0;state.walking=false;canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pending||pending.id!==e.pointerId)return;sample(e);
  const distance=Math.hypot(e.clientX-pending.startX,e.clientY-pending.startY);
  if(!pending.moved&&(distance>6||performance.now()-pending.startTime>180)){pending.moved=true;closeMenu();model.grab(state);pointTarget?.classList.remove('bob-point-target');pointTarget=null;}
  if(pending.moved){state.x=e.clientX-pending.anchorX;state.altitude=innerHeight-e.clientY-ch+pending.anchorY;const samples=pending.samples,a=samples[0],b=samples[samples.length-1];state.rotation=reduced?0:clamp((b.x-a.x)/140,-.18,.18);}
 });
 function releasePending(cancel=false){
  if(!pending)return;const p=pending;pending=null;state.dragIntent=false;
  if(canvas.hasPointerCapture(p.id))canvas.releasePointerCapture(p.id);
  if(p.moved){const samples=p.samples,a=samples[0],b=samples[samples.length-1],seconds=Math.max(.016,(b.t-a.t)/1000);const recent=performance.now()-b.t<100;model.release(state,!cancel&&recent?(b.x-a.x)/seconds:0,!cancel&&recent?-(b.y-a.y)/seconds:0,reduced);}
  else if(!cancel){model.greet(state);if(menu.hidden)openMenu();else closeMenu();}
 }
 canvas.addEventListener('pointerup',e=>{if(pending?.id===e.pointerId)releasePending();});canvas.addEventListener('pointercancel',()=>releasePending(true));canvas.addEventListener('lostpointercapture',()=>{if(pending)releasePending(true);});
 canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.code==='Space'){e.preventDefault();if(menu.hidden)openMenu();else closeMenu();}});
 addEventListener('blur',()=>{pointer.active=false;releasePending(true);});document.addEventListener('visibilitychange',()=>{last=0;pointer.active=false;releasePending(true);});
 function eye(emotion,x,y,r,t,index,glow){
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=glow?'#d9ff8b':'#eeeaf0';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=r*.2;ctx.lineCap='round';ctx.lineJoin='round';
  if(glow){ctx.shadowColor='#b3ff00';ctx.shadowBlur=r*2.4;}
  ctx.beginPath();
  if(!reduced&&Math.sin(t*.67+index*.035)>.995){ctx.moveTo(-r*.8,0);ctx.lineTo(r*.8,0);ctx.stroke();}
  else if(emotion==='inspired'){ctx.moveTo(0,-r*1.3);ctx.quadraticCurveTo(r*.27,-r*.22,r*.88,0);ctx.quadraticCurveTo(r*.2,r*.25,0,r*1.3);ctx.quadraticCurveTo(-r*.22,r*.2,-r*.88,0);ctx.quadraticCurveTo(-r*.22,-r*.2,0,-r*1.3);ctx.stroke();}
  else if(emotion==='focus'){ctx.arc(0,0,r*.78,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.32,0,Math.PI*2);ctx.fill();}
  else if(['curious','doubt','surprised'].includes(emotion)){ctx.ellipse(0,0,r*.65,r*(emotion==='surprised'?1:.75),0,0,Math.PI*2);ctx.stroke();}
  else if(emotion==='joy'){ctx.moveTo(-r*.85,r*.25);ctx.lineTo(0,-r*.65);ctx.lineTo(r*.85,r*.25);ctx.stroke();}
  else{ctx.moveTo(-r*.85,r*.2);ctx.quadraticCurveTo(0,-r,r*.85,r*.2);ctx.stroke();}ctx.restore();
 }
 function drawAsset(asset,alpha=1){
  if(alpha<.005)return;const a=asset.atlas,h=front.atlas.height*(cw*.88/front.atlas.width),scale=h/a.height,renderWidth=a.width*scale,left=(cw-renderWidth)/2,top=ch-h;
  ctx.save();ctx.globalAlpha=alpha;
  const side=asset.view==='profile',flip=side&&state.direction<0;if(flip){ctx.translate(cw,0);ctx.scale(-1,1);}
  const feet=model.feet(state.gait,state.walking,renderWidth,state.direction),footTop=Math.floor(a.height*(side?.91:.914));
  for(let leg=0;leg<2;leg++){
   if(side){const sh=Math.max(...asset.soles)-footTop+1;ctx.globalAlpha=alpha*(leg===0?.78:1);ctx.drawImage(a,0,footTop,a.width,sh,left+feet[leg].dx,ch-sh*scale-feet[leg].lift,renderWidth,sh*scale);ctx.globalAlpha=alpha;}
   else {const x0=Math.floor(leg*a.width/2),sw=Math.floor((leg+1)*a.width/2)-x0,sh=asset.soles[leg]-footTop+1;ctx.drawImage(a,x0,footTop,sw,sh,left+x0*scale+feet[leg].dx,ch-sh*scale-feet[leg].lift,sw*scale,sh*scale);}
  }
  const greeting=!reduced&&state.greeting>0?Math.sin((1.8-state.greeting)*Math.PI*2.4)*.01:0;
  const lean=state.lean*.45+greeting+(state.walking?Math.sin(state.gait)*.009:0);
  const land=!reduced&&state.landing>0?Math.sin(state.landing/.45*Math.PI)*.06:0;
  ctx.translate(cw*.5,ch-h*.12);ctx.rotate(lean);ctx.scale(1+land*.4,1-land);
  const bodyY=top-(ch-h*.12),upperH=Math.floor(a.height*.94);
  let armSide=-1,armAngle=0;
  if(!side&&state.context?.kind==='more'){
   const target=state.context.element.getBoundingClientRect();const tx=target.x+target.width*.5-(state.x+cw*.5),ty=target.y+target.height*.5-(innerHeight-state.altitude-h*.48);
   armSide=tx>=0?1:0;const arm=asset.arms[armSide],angle=Math.atan2(ty,tx)-arm.rest;
   armAngle=Math.atan2(Math.sin(angle),Math.cos(angle));armAngle=armSide?clamp(armAngle,-2.35,.1):clamp(armAngle,-.1,2.35);
  }
  ctx.drawImage(armSide>=0?asset.noArm[armSide]:a,0,0,a.width,upperH,-renderWidth/2,bodyY,renderWidth,upperH*scale);
  if(armSide>=0){const arm=asset.arms[armSide],px=left+arm.pivot.x*scale-cw*.5,py=bodyY+arm.pivot.y*scale;ctx.save();ctx.translate(px,py);ctx.rotate(armAngle);ctx.drawImage(arm.canvas,-arm.pivot.x*scale,-arm.pivot.y*scale,renderWidth,h);ctx.restore();}
  const mx=state.lookX*renderWidth*.006,my=state.lookY*renderWidth*.003;
  asset.eyes.forEach((x,i)=>eye(state.emotion,x*scale-renderWidth/2+mx,asset.eyeY*scale+bodyY+my,renderWidth*.017,state.time,i,state.context?.kind==='project'));
  ctx.restore();
 }
 function spriteFrame(index,alpha=1,flip=false){
  if(alpha<.004)return;if(index===0)flip=false;const f=motion.frames[index],[bx,by,bw,bh]=f.bounds,scale=cw*1.12/326;
  const x=cw*.5-(bx+bw*.5)*scale,y=ch-(by+bh)*scale;
  ctx.save();ctx.globalAlpha=alpha;if(flip){ctx.translate(cw,0);ctx.scale(-1,1);}
  const squash=!reduced&&state.landing>0?Math.sin(Math.min(1,state.landing/.45)*Math.PI)*.075:0;
  const breath=reduced?0:Math.sin(state.time*(state.walking?5:1.6))*(state.walking?.01:.002);
  ctx.translate(cw*.5,ch);ctx.scale(1+squash*.5,1-squash+breath);ctx.translate(-cw*.5,-ch);
  const base=f.canvas;ctx.drawImage(base,x,y,base.width*scale,base.height*scale);
  const mx=state.lookX*cw*.005,my=state.lookY*cw*.0025;
  f.eyes.forEach((e,i)=>eye(state.emotion,x+e.x*scale+mx,y+e.y*scale+my,Math.max(1.5,(e.box[2]-3)*scale*.43),state.time,i,state.context?.kind==='project'));
  ctx.restore();
 }
 function sequence(indices,position,alpha=1,flip=false){const floor=Math.floor(position),fraction=position-floor,u=fraction*fraction*(3-2*fraction);spriteFrame(indices[(floor%indices.length+indices.length)%indices.length],alpha*(1-u),flip);spriteFrame(indices[((floor+1)%indices.length+indices.length)%indices.length],alpha*u,flip);}
 function generatedPose(){
  if(state.phase==='held'||state.dragIntent){sequence([8,9,8,10],state.time*2);return;}
  if(state.phase==='air'){sequence([11,9,11,10],state.time*3);return;}
  if(state.context?.kind==='more'){spriteFrame(0);return;}
  const amount=clamp(Math.abs(turn),0,1),flip=turn<0;
  const walkBlend=walkEnergy*clamp((amount-.62)/.38,0,1);
  const angle=amount*3,lower=Math.min(2,Math.floor(angle)),u=angle-lower;
  spriteFrame(lower,(1-walkBlend)*(1-u),flip);spriteFrame(lower+1,(1-walkBlend)*u,flip);
  if(walkBlend>.005)sequence([4,5,6,7],state.gait/(Math.PI*2)*4,walkBlend,flip);
 }
 function densePose(){
  let clip='turn',position=clamp(Math.abs(turn),0,1),flip=turn<0;
  if(state.phase==='held'||state.dragIntent){clip='held';position=0;flip=false;}
  else if(state.phase==='air'){clip='air';position=reduced?0:(state.time*.75)%1;flip=false;}
  else if(pointAmount>.01){clip='pointRight';position=pointAmount;flip=pointSide==='pointLeft';}
  else if(state.walking&&Math.abs(turn)>.85){clip='walk';position=reduced?0:(state.gait/(Math.PI*2))%1;}
  const indices=dense.clips[clip],loop=['walk','held','air'].includes(clip),index=indices[Math.min(indices.length-1,Math.floor(position*(loop?indices.length:indices.length-1)))];
  const f=dense.frames[index],scale=cw*1.12/dense.body_height,x=cw/2-dense.frame_size/2*scale,y=ch-dense.baseline*scale;
  ctx.save();
  if(clip==='held'&&!reduced){
   const px=pending?.anchorX??cw/2,py=pending?.anchorY??ch*.6;
   ctx.translate(px,py);ctx.rotate(Math.sin(state.time*7)*.018);ctx.translate(-px,-py);
  }
  if(flip&&index!==0){ctx.translate(cw,0);ctx.scale(-1,1);}
  const squash=!reduced&&state.landing>0?Math.sin(Math.min(1,state.landing/.45)*Math.PI)*.075:0;
  ctx.translate(cw/2,ch);ctx.scale(1+squash*.5,1-squash);ctx.translate(-cw/2,-ch);
  ctx.drawImage(f.canvas,x,y,dense.frame_size*scale,dense.frame_size*scale);
  const mx=state.lookX*cw*.005,my=state.lookY*cw*.0025;
  f.eyes.forEach((e,i)=>eye(state.emotion,x+e.x*scale+mx,y+e.y*scale+my,Math.max(1.5,(e.box[2]-3)*scale*.43),state.time,i,state.context?.kind==='project'));
  ctx.restore();stage.dataset.clip=clip;stage.dataset.sprite=String(index);
 }
 function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(dpr,0,0,dpr,gutter*dpr,0);if(!ready)return;if(dense){densePose();}else if(motion){ctx.globalCompositeOperation='lighter';generatedPose();ctx.globalCompositeOperation='source-over';}else{drawAsset(front,1-sideWeight);drawAsset(profile,sideWeight);}}
 function frame(now){const dt=last?Math.min((now-last)/1000,.04):0;last=now;
  if(!document.hidden&&!hidden){
   if(state.x!==null){pointer.x=(pointer.clientX-(state.x+cw*.5))/(cw*.5);pointer.y=(pointer.clientY-(innerHeight-state.altitude-ch*.65))/(ch*.5);}
   model.step(state,pointer,dt,reduced);model.physics(state,dt,{width:innerWidth,height:innerHeight,sprite:cw,bodyHeight:ch,reduced});model.walk(state,pointer,dt,{width:innerWidth,sprite:cw,reduced,enabled:walkingEnabled,hidden});
   const pointing=state.context?.kind==='more'&&state.phase==='ground'&&!state.dragIntent;
   if(pointing&&pointAmount<.02){const r=state.context.element.getBoundingClientRect();pointSide=r.x+r.width/2>state.x+cw/2?'pointRight':'pointLeft';}
   pointAmount=clamp(pointAmount+(pointing?1:-1)*dt/(reduced?.01:.32),0,1);
   const sideTarget=state.walking&&state.phase==='ground'?1:0;sideWeight+=(sideTarget-sideWeight)*(1-Math.exp(-dt*9));
   const turnTarget=state.walking&&state.phase==='ground'?state.direction:0;
   const turnRate=reduced?100:turnTarget===0?12:9;
   turn+=(turnTarget-turn)*(1-Math.exp(-dt*turnRate));walkEnergy+=(Number(state.walking)-walkEnergy)*(1-Math.exp(-dt*5));
   stage.style.transform='translate('+state.x.toFixed(2)+'px,'+(-state.altitude).toFixed(2)+'px) rotate('+state.rotation.toFixed(4)+'rad)';stage.dataset.phase=state.phase;stage.dataset.motion=state.walking?'walking':state.phase;stage.dataset.emotion=state.emotion;stage.dataset.view=Math.abs(turn)>.7?'profile':Math.abs(turn)>.15?'turn':'front';draw();menuPosition();
   recallButton.hidden=!(state.x+cw<0||state.x>innerWidth);
   if(previousEmotion!==state.emotion){previousEmotion=state.emotion;status.textContent={calm:'Боб спокойно стоит.',curious:'Боб заметил тебя.',joy:'Боб рад знакомству.',focus:'Боб показывает на кнопку.',doubt:'Боб сомневается.',inspired:'Боб рассматривает проект.',surprised:'Боба подняли.'}[state.emotion];}
  }
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
})();
