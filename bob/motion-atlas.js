/* Generated key poses, prepared in memory. The PNG remains unchanged. */
window.BobMotion=(()=>{
 function blank(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 async function load(url){
  const image=new Image();image.src=url;await image.decode();const data=window.BobMotionData;
  if(!data||data.frames.length!==12)throw new Error('Missing Bob motion manifest');
  const frames=data.frames.map(meta=>{
   const [x,y,w,h]=meta.cell,cell=blank(w,h),c=cell.getContext('2d');c.drawImage(image,x,y,w,h,0,0,w,h);
   for(const eye of meta.eyes){const [ex,ey,ew,eh]=eye.box;c.drawImage(cell,ex,ey-16,ew,eh,ex,ey,ew,eh);}
   return {canvas:cell,bounds:meta.bounds,eyes:meta.eyes};
  });
  const source=frames[0],points=[[[116,142],[95,170],[62,240],[57,279],[73,300],[95,282],[105,240],[123,188]],[[279,142],[306,171],[336,241],[340,280],[325,301],[305,283],[294,242],[276,188]]];
  source.arms=[];source.noArm=[];
  points.forEach((polygon,side)=>{
   const path=c=>{c.beginPath();polygon.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
   const arm=blank(source.canvas.width,source.canvas.height),ac=arm.getContext('2d');path(ac);ac.clip();ac.drawImage(source.canvas,0,0);
   const body=blank(source.canvas.width,source.canvas.height),bc=body.getContext('2d');bc.drawImage(source.canvas,0,0);bc.globalCompositeOperation='destination-out';path(bc);bc.fill();
   source.arms.push({canvas:arm,pivot:{x:side?282:116,y:157},rest:side?1.2:1.94});source.noArm.push(body);
  });
  return {frames};
 }
 async function loadDense(url,walkURL){
  const image=new Image();image.src=url;await image.decode();const data=window.BobDenseData;
  if(!data?.clips?.turn)throw new Error('Missing dense motion manifest');
  let walking=null;
  if(data.walk_file&&walkURL){walking=new Image();walking.src=walkURL;await walking.decode();}
  const frames=data.frames.map(meta=>{
   const [x,y,w,h]=walking&&meta.walk_cell?meta.walk_cell:meta.cell,canvas=blank(w,h),c=canvas.getContext('2d');c.drawImage(walking&&meta.walk_cell?walking:image,x,y,w,h,0,0,w,h);
   for(const eye of meta.eyes){const [ex,ey,ew,eh]=eye.box;c.drawImage(canvas,ex,ey-16,ew,eh,ex,ey,ew,eh);}
   return {canvas,eyes:meta.eyes};
  });
  return {...data,frames};
 }
 return {load,loadDense};
})();
