/* Prepare supplied renders in memory. Source files are preserved. */
window.BobAssets=(()=>{
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 async function load(src,view='front'){
  const image=new Image();image.src=src;await image.decode();
  const raw=canvas(680,Math.round(image.height*680/image.width)),scale=raw.width/image.width;
  const ctx=raw.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,raw.width,raw.height);
  const eyeX=view==='front'?[1651,2064]:[2425],eyeY=1221;
  for(const x of eyeX){const w=view==='front'?160:100;ctx.drawImage(image,x-w/2,1080,w,88,(x-w/2)*scale,1172*scale,w*scale,88*scale);}
  const pixels=ctx.getImageData(0,0,raw.width,raw.height),d=pixels.data,w=raw.width,h=raw.height;
  const visited=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
  function add(i){if(i<0||i>=w*h||visited[i])return;visited[i]=1;const j=i*4;if(Math.min(d[j],d[j+1],d[j+2])>210)queue[tail++]=i;}
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
  while(head<tail){const i=queue[head++],j=i*4;d[j+3]=0;const x=i%w;if(x)add(i-1);if(x<w-1)add(i+1);add(i-w);add(i+w);}
  // Decontaminate the antialiased silhouette rather than leaving a white rim.
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const i=y*w+x,j=i*4;if(!d[j+3])continue;
   if(!d[(i-1)*4+3]||!d[(i+1)*4+3]||!d[(i-w)*4+3]||!d[(i+w)*4+3]){
    const a=clamp((255-Math.min(d[j],d[j+1],d[j+2]))/110,0,1);
    if(a>0&&a<1){for(let c=0;c<3;c++)d[j+c]=clamp((d[j+c]-255*(1-a))/a,0,255);d[j+3]=Math.round(a*255);}
   }
  }
  let left=w,top=h,right=0,bottom=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]>120&&Math.min(d[i],d[i+1],d[i+2])<185){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
  left=Math.max(0,left-3);top=Math.max(0,top-3);right=Math.min(w-1,right+3);bottom=Math.min(h-1,bottom+2);
  ctx.putImageData(pixels,0,0);const atlas=canvas(right-left+1,bottom-top+1);
  atlas.getContext('2d').drawImage(raw,left,top,atlas.width,atlas.height,0,0,atlas.width,atlas.height);
  const asset={atlas,view,eyes:eyeX.map(x=>x*scale-left),eyeY:eyeY*scale-top,soles:[],arms:[],noArm:[]};
  const ad=atlas.getContext('2d').getImageData(0,0,atlas.width,atlas.height).data;
  for(let side=0;side<2;side++){let lowest=0;for(let y=Math.floor(atlas.height*.84);y<atlas.height;y++)for(let x=Math.floor(side*atlas.width/2);x<Math.floor((side+1)*atlas.width/2);x++){const i=(y*atlas.width+x)*4;if(ad[i+3]>180&&Math.min(ad[i],ad[i+1],ad[i+2])<145)lowest=Math.max(lowest,y);}asset.soles.push(lowest);}
  if(view==='front'){
   const polygons=[[[970,2100],[700,2300],[330,3010],[300,3440],[490,3690],[700,3530],[740,3090],[890,2760]],[[2740,2100],[3030,2310],[3390,3050],[3390,3500],[3210,3710],[3000,3550],[3000,3160],[2810,2820]]];
   polygons.forEach((points,side)=>{
    const poly=points.map(([x,y])=>[x*scale-left,y*scale-top]);
    const path=c=>{c.beginPath();poly.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
    const arm=canvas(atlas.width,atlas.height),ac=arm.getContext('2d');path(ac);ac.clip();ac.drawImage(atlas,0,0);
    const body=canvas(atlas.width,atlas.height),bc=body.getContext('2d');bc.drawImage(atlas,0,0);bc.globalCompositeOperation='destination-out';path(bc);bc.fill();
    asset.arms.push({canvas:arm,pivot:{x:(side?2800:920)*scale-left,y:2200*scale-top},rest:side?1.2:1.94});asset.noArm.push(body);
   });
  }
  return asset;
 }
 return {load};
})();
