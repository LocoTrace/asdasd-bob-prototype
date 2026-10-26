(function(root){'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function create(){return {time:0,emotion:'calm',lookX:0,lookY:0,lean:0,engagement:0,greeting:0,comparisonUntil:0,value:18,dragging:false,wowUntil:0,x:null,target:null,speed:0,gait:0,nextTrip:.6,walking:false,direction:-1,phase:'ground',altitude:0,vx:0,vy:0,rotation:0,landing:0,outside:0,context:null,menuOpen:false,dragIntent:false};}
 function compare(s,value,dragging){const previous=s.value;s.value=clamp(value,0,100);s.dragging=dragging;s.comparisonUntil=s.time+4;if(previous<72 && s.value>=72)s.wowUntil=s.time+2.4;}
 function greet(s){s.greeting=1.8;}
 function step(s,p,dt,reduced=false){
  dt=clamp(dt,0,.05);s.time+=dt;s.greeting=Math.max(0,s.greeting-dt);
  const near=p.active&&Math.hypot(p.x,p.y)<1.9;
  s.engagement+=(Number(near)-s.engagement)*(1-Math.exp(-dt*2));
  const lookX=p.active?clamp(p.x,-1,1):0,lookY=p.active?clamp(p.y,-1,1):0;
  const blend=1-Math.exp(-dt*5);
  s.lookX+=(lookX-s.lookX)*blend;s.lookY+=(lookY-s.lookY)*blend;
  const targetLean=reduced?0:lookX*(near?.025:.012);
  s.lean+=(targetLean-s.lean)*blend;
  s.landing=Math.max(0,s.landing-dt);
  if(s.phase==='held'||s.phase==='air'||s.dragIntent)s.emotion='surprised';
  else if(s.context?.kind==='project')s.emotion='inspired';
  else if(s.context?.kind==='more')s.emotion='focus';
  else if(s.menuOpen)s.emotion='curious';
  else if(s.greeting>0)s.emotion='joy';
  else if(s.time<s.wowUntil && !s.dragging)s.emotion='inspired';
  else if(s.dragging)s.emotion='focus';
  else if(s.time<s.comparisonUntil)s.emotion=s.value>70?'inspired':s.value<30?'doubt':'focus';
  else s.emotion=near?'curious':'calm';
  return s;
 }
 function walk(s,p,dt,{width,sprite,reduced=false,enabled=true,hidden=false}){
  dt=clamp(dt,0,.05);const max=Math.max(0,width-sprite),rate=Math.min(52,Math.max(24,width*.045));
  if(s.x===null){s.x=max*.82;s.target=s.x;}
  s.x=clamp(s.x,0,max);s.target=clamp(s.target,0,max);
  const visitor=p.active&&Math.hypot(p.x,p.y)<1.8;
  const hold=!enabled||hidden||reduced||visitor||s.greeting>0||s.dragging||s.time<s.comparisonUntil||s.phase!=='ground'||s.context||s.menuOpen||s.dragIntent||s.landing>0;
  if(hold){s.speed=0;s.walking=false;s.nextTrip=Math.max(s.nextTrip,s.time+1);return s;}
  if(Math.abs(s.target-s.x)<1 && s.time>=s.nextTrip){s.target=s.x>max*.5?max*.12:max*.88;}
  const distance=s.target-s.x;
  if(Math.abs(distance)>1){
   s.direction=Math.sign(distance);s.speed+=(rate-s.speed)*(1-Math.exp(-dt*3));
   const dx=s.direction*Math.min(Math.abs(distance),s.speed*dt);
   s.x=clamp(s.x+dx,0,max);s.gait+=Math.abs(dx)/(sprite*.28)*Math.PI*2;s.walking=Math.abs(dx)>.001;
   if(Math.abs(s.target-s.x)<1){s.x=s.target;s.speed=0;s.walking=false;s.nextTrip=s.time+1.2;}
  }else{s.speed=0;s.walking=false;}
  return s;
 }
 function feet(phase,walking,width,direction){
   if(!walking)return [{dx:0,lift:0},{dx:0,lift:0}];
   return [0,Math.PI].map(offset=>({dx:-direction*Math.sin(phase+offset)*width*.023,lift:Math.max(0,Math.sin(phase+offset))*width*.03}));
 }
 function grab(s){s.phase='held';s.walking=false;s.speed=0;s.vx=0;s.vy=0;s.outside=0;s.menuOpen=false;s.context=null;}
 function release(s,vx,vy,reduced=false){s.phase='air';s.vx=reduced?0:clamp(vx,-2100,2100);s.vy=reduced?0:clamp(vy,-1600,1600);s.altitude=Math.max(0,s.altitude);s.dragIntent=false;if(reduced){s.altitude=0;s.phase='ground';s.rotation=0;s.nextTrip=s.time+1;}}
 function recall(s,width,sprite){s.phase='ground';s.altitude=0;s.x=clamp(s.x??0,0,Math.max(0,width-sprite));s.target=s.x;s.vx=0;s.vy=0;s.speed=0;s.rotation=0;s.outside=0;s.nextTrip=s.time+1;s.landing=.6;s.dragIntent=false;}
 function physics(s,dt,{width,height,sprite,bodyHeight,reduced=false}){
  dt=clamp(dt,0,.04);
  if(s.x===null){s.x=Math.max(0,width-sprite)*.82;s.target=s.x;}
  if(s.phase==='air'){
   if(reduced){recall(s,width,sprite);return s;}
   s.vy-=1700*dt;s.altitude+=s.vy*dt;s.x+=s.vx*dt;s.vx*=Math.exp(-dt*.45);
   const ceiling=Math.max(0,height-bodyHeight*.55);
   if(s.altitude>ceiling){s.altitude=ceiling;s.vy=-Math.abs(s.vy)*.25;}
   s.rotation+=clamp(s.vx/850,-2.6,2.6)*dt;
   if(s.x+sprite<0||s.x>width)s.outside+=dt;else s.outside=0;
   if(s.outside>1.5){recall(s,width,sprite);return s;}
   if(s.altitude<=0){
    s.altitude=0;s.rotation=0;s.landing=.45;
    if(s.vy< -210){s.vy=-s.vy*.23;s.vx*=.65;}
    else {s.phase='ground';s.vy=0;s.vx=0;s.speed=0;s.x=clamp(s.x,0,Math.max(0,width-sprite));s.target=s.x;s.nextTrip=s.time+1;}
   }
  }else if(s.phase==='ground'){
   s.altitude=0;s.rotation=0;s.x=clamp(s.x,0,Math.max(0,width-sprite));
  }
  return s;
 }
 root.BobBehavior={create,compare,greet,step,walk,feet,grab,release,recall,physics};if(typeof module!=='undefined')module.exports=root.BobBehavior;
})(typeof window!=='undefined'?window:globalThis);
