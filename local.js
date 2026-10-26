(()=>{'use strict';
 // The copied page's carousels get a small local adapter. No Next runtime,
 // background route requests, analytics, or production endpoints are required.
 document.querySelectorAll('.swiper').forEach(swiper=>{
  const wrapper=swiper.querySelector('.swiper-wrapper');if(!wrapper)return;
  const slides=Array.from(wrapper.children);let index=0;
  swiper.classList.add('swiper-initialized','swiper-horizontal');
  function show(next){index=(next+slides.length)%slides.length;wrapper.style.transform='translate3d('+(-index*100)+'%,0,0)';wrapper.style.transition='transform .55s ease';slides.forEach((slide,i)=>{slide.style.width='100%';slide.classList.toggle('swiper-slide-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));slide.querySelectorAll('video').forEach(video=>{video.muted=true;if(i===index&&!matchMedia('(prefers-reduced-motion: reduce)').matches)video.play().catch(()=>{});else video.pause();});});}
  function bind(button,delta){if(!button)return;button.setAttribute('role','button');button.setAttribute('tabindex','0');button.setAttribute('aria-label',delta>0?'Следующий слайд':'Предыдущий слайд');button.addEventListener('click',()=>show(index+delta));button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.code==='Space'){e.preventDefault();show(index+delta);}});}
  bind(swiper.querySelector('.swiper-button-next'),1);bind(swiper.querySelector('.swiper-button-prev'),-1);
  swiper.querySelectorAll('[class*="WhatWeDoSlider_arrowBtn"]').forEach((b,i)=>bind(b,i%2?1:-1));
  let startX=0;swiper.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true});swiper.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>60)show(index+(dx<0?1:-1));},{passive:true});
  let mouseStart=null,dragged=false;
  swiper.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&!e.target.closest('[role=button],button')){mouseStart=e.clientX;dragged=false;}});
  swiper.addEventListener('pointermove',e=>{if(mouseStart!==null&&Math.abs(e.clientX-mouseStart)>20){dragged=true;swiper.setPointerCapture(e.pointerId);}});
  swiper.addEventListener('pointerup',e=>{if(mouseStart!==null){const dx=e.clientX-mouseStart;if(dragged&&Math.abs(dx)>60)show(index+(dx<0?1:-1));mouseStart=null;}});
  swiper.addEventListener('pointercancel',()=>{mouseStart=null;dragged=false;});
  swiper.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false;}},true);
  swiper.addEventListener('dragstart',e=>e.preventDefault());
  show(0);
 });
 const burger=document.querySelector('[class*="Header_burger__"]'),menu=document.querySelector('[class*="Header_mobileMenu___"]');
 if(burger&&menu){burger.setAttribute('role','button');burger.setAttribute('tabindex','0');burger.setAttribute('aria-label','Меню');burger.setAttribute('aria-expanded','false');const toggle=()=>{const open=menu.classList.toggle('Header_mobileMenuOpen__xIkH1');burger.classList.toggle('Header_burgerOpen__Ts1JK',open);burger.setAttribute('aria-expanded',String(open));};burger.addEventListener('click',toggle);burger.addEventListener('keydown',e=>{if(e.key==='Enter'||e.code==='Space'){e.preventDefault();toggle();}});}
 const walk=document.querySelector('#bob-walk'),stand=document.querySelector('#bob-stand');
 function mode(enabled){document.dispatchEvent(new CustomEvent('bob:walking',{detail:{enabled}}));walk.setAttribute('aria-pressed',String(enabled));stand.setAttribute('aria-pressed',String(!enabled));}
 walk.addEventListener('click',()=>mode(true));stand.addEventListener('click',()=>mode(false));
 document.querySelector('#bob-reset-local').addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('bob:reset'));mode(true);});
})();
