(function(){
  var ASSETS=(document.currentScript&&document.currentScript.src||'').replace(/site\.js(\?.*)?$/,'');
  // Scale the saved gallery layout to the current width
  function fit(){
    document.querySelectorAll('.pro-gallery-margin-container').forEach(function(m){
      var outer=m.parentElement, items=m.querySelectorAll('.gallery-item-container'), w=0, h=0;
      items.forEach(function(it){
        w=Math.max(w,(parseFloat(it.style.left)||0)+(parseFloat(it.style.width)||0));
        h=Math.max(h,(parseFloat(it.style.top)||0)+(parseFloat(it.style.height)||0));
      });
      if(!w)return;
      m.style.transform='none'; m.style.width=w+'px';
      var avail=outer.parentElement.clientWidth||outer.clientWidth, s=avail/w;
      m.style.transform='scale('+s+')';
      m.style.height=h+'px'; outer.style.height=(h*s)+'px';
    });
  }
  // Lightbox
  var imgs=[],idx=0,lb,lbImg,lbCap;
  function show(i){idx=(i+imgs.length)%imgs.length;lbImg.src=imgs[idx];lbCap.textContent=(idx+1)+' / '+imgs.length;lb.classList.add('open');}
  function close(){lb.classList.remove('open');}
  function initLb(){
    var els=[].slice.call(document.querySelectorAll('img[data-full]'));
    if(!els.length)return;
    imgs=els.map(function(e){return e.getAttribute('data-full');});
    lb=document.createElement('div');lb.className='lb';
    lb.innerHTML='<img alt=""><button class="lb-x" aria-label="Close">&times;</button><button class="lb-p" aria-label="Previous">&#8249;</button><button class="lb-n" aria-label="Next">&#8250;</button><div class="lb-c"></div>';
    document.body.appendChild(lb);lbImg=lb.querySelector('img');lbCap=lb.querySelector('.lb-c');
    lb.addEventListener('click',function(e){
      if(e.target.classList.contains('lb-p'))show(idx-1);
      else if(e.target.classList.contains('lb-n'))show(idx+1);
      else if(e.target!==lbImg)close();
    });
    document.addEventListener('keydown',function(e){
      if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(idx-1);if(e.key==='ArrowRight')show(idx+1);
    });
    var tx=null;lb.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;});
    lb.addEventListener('touchend',function(e){if(tx===null)return;var d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)show(idx+(d<0?1:-1));tx=null;});
    document.querySelectorAll('.gallery-item-container,.wp-item,.wg-item').forEach(function(c){
      var im=c.querySelector('img[data-full]');if(!im)return;
      c.addEventListener('click',function(e){e.preventDefault();show(els.indexOf(im));});
    });
  }
  function initLang(){
    document.addEventListener('click',function(e){document.querySelectorAll('details.lsd[open]').forEach(function(d){if(!d.contains(e.target))d.removeAttribute('open');});});
  }
  function goAnchor(id,smooth){
    var t=document.querySelector('[data-anchor-target~="'+id+'"]')||document.getElementById(id);if(!t)return false;
    var h=document.getElementById('SITE_HEADER');var off=h?h.getBoundingClientRect().height:0;
    window.scrollTo({top:t.getBoundingClientRect().top+window.pageYOffset-off,behavior:smooth?'smooth':'auto'});return true;
  }
  function initAnchors(){
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href*="#anchors-"]');if(!a)return;
      var u=new URL(a.href,location.href);
      if(u.pathname===location.pathname&&goAnchor(u.hash.slice(1),true)){e.preventDefault();history.replaceState(null,'',u.hash);}
    });
    if(location.hash.indexOf('#anchors-')===0){setTimeout(function(){goAnchor(location.hash.slice(1),false);},50);}
  }
  function initVideos(){
    document.querySelectorAll('video[data-local-video]').forEach(function(v){
      v.muted=true;v.setAttribute('muted','');v.playsInline=true;
      var hide=function(){var par=v.parentElement;if(!par)return;[].forEach.call(par.children,function(c){if(c!==v&&(c.tagName==='WOW-IMAGE'||c.tagName==='IMG'||/poster/i.test(c.className)))c.classList.add('video-playing-poster');});};
      v.addEventListener('playing',hide);
      var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});
    });
  }
  function initMusic(){
    // Home page: play once, then repeat the ending with a responsive loop length.
    // The song plays alongside; the button only mutes/unmutes it and never restarts the video.
    var v=document.getElementById('comp-mfm9dnps1_video');if(!v)return;
    var title=document.getElementById('comp-mgmgm4de');
    var lang=(document.documentElement.lang||'en').slice(0,2);
    var HINT={en:'♪ Play music',hr:'♪ Pusti glazbu',vi:'♪ Bật nhạc'}[lang]||'♪ Play music';
    var KEY_M='wedding-music-muted';
    function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
    function set(k,val){try{localStorage.setItem(k,val);}catch(e){}}
    var a=new Audio(ASSETS+'audio/unicorns-rest.mp3');a.loop=false;a.preload='auto';a.volume=0.4;
    var muted=get(KEY_M)==='1',started=false;
    var btn=document.createElement('button');btn.className='music-btn';btn.type='button';
    var hint=document.createElement('button');hint.className='music-hint';hint.type='button';hint.textContent=HINT;hint.hidden=true;
    var ON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    var OFF='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    function render(){var on=started&&!muted&&!a.paused;btn.innerHTML=on?ON:OFF;btn.setAttribute('aria-label',on?'Mute music':'Play music');btn.title=btn.getAttribute('aria-label');btn.classList.toggle('is-off',!on);hint.hidden=started||muted||a.ended;}
    // Phones repeat the last 10 seconds; keep the existing desktop loop unchanged.
    var loopMedia=window.matchMedia('(max-width: 767px)'),FADE=1.2,TITLE_AT=5;
    v.loop=false;v.removeAttribute('loop');
    var c=v.cloneNode(false);c.removeAttribute('id');c.removeAttribute('autoplay');c.removeAttribute('data-local-video');c.classList.add('tk-vclone');c.muted=true;c.preload='auto';
    v.parentNode.insertBefore(c,v.nextSibling);
    var front=v,back=c,swapping=false;
    function loopStart(x){var seconds=loopMedia.matches?10:25;return Math.max(0,(x.duration||seconds)-seconds);}
    function tick(){
      var d=front.duration;
      if(d&&!swapping&&front.currentTime>=d-FADE-0.15){
        swapping=true;try{back.currentTime=loopStart(back);}catch(e){}
        var pr=back.play();if(pr&&pr.catch)pr.catch(function(){});
        if(back===c)c.classList.add('on');else c.classList.remove('on');
        setTimeout(function(){front.pause();var t=front;front=back;back=t;swapping=false;},FADE*1000+100);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    v.addEventListener('ended',function(){if(front===v&&!swapping){try{v.currentTime=loopStart(v);}catch(e){}v.play();}});
    // the title appears as a whole right after the kiss
    function showTitle(){if(title)title.classList.add('tk-shown');}
    v.addEventListener('timeupdate',function(){if(v.currentTime>=TITLE_AT)showTitle();});
    if(!v.paused&&v.currentTime>=TITLE_AT)showTitle();
    setTimeout(function(){if(v.paused||v.readyState<2)showTitle();},TITLE_AT*1000+1500);
    function startSong(){ // join the video where it is now; never restarts the video
      if(started||a.ended)return;
      var p=a.play();
      if(p&&p.then)p.then(function(){started=true;render();}).catch(render);else{started=true;render();}
    }
    btn.addEventListener('click',function(e){e.stopPropagation();
      if(!started){muted=false;set(KEY_M,'0');a.muted=false;startSong();render();return;}
      muted=!muted;set(KEY_M,muted?'1':'0');a.muted=muted;render();});
    hint.addEventListener('click',function(e){e.stopPropagation();muted=false;set(KEY_M,'0');a.muted=false;startSong();});
    var hero=document.getElementById('comp-mfm9dnps1')||document.body;
    var box=document.createElement('div');box.className='music-box';box.appendChild(hint);box.appendChild(btn);
    if(getComputedStyle(hero).position==='static')hero.style.position='relative';
    hero.appendChild(box);
    a.muted=muted;
    if(!muted)startSong();      // works when the browser allows autoplay with sound
    render();
    // browsers often block sound until the first interaction: start the song on the first click/tap/key
    function leavingLink(t){var l=t&&t.closest&&t.closest('a[href]');if(!l)return false;return (l.getAttribute('href')||'').charAt(0)!=='#';}
    var kick=function(e){if(started||muted)return;var t=e.target;
      if(t&&t.closest&&(t.closest('.music-btn')||t.closest('.music-hint')))return;
      if(leavingLink(t))return;startSong();};
    ['pointerdown','keydown'].forEach(function(ev){document.addEventListener(ev,kick,true);});
    document.addEventListener('click',function(e){if(leavingLink(e.target))a.pause();},true);
    window.addEventListener('pagehide',function(){a.pause();});
    a.addEventListener('play',render);a.addEventListener('pause',render);a.addEventListener('ended',render);
  }
  function initSlideshows(){
    document.querySelectorAll('.wixui-slideshow').forEach(function(ss){
      var wrap=ss.querySelector('[data-testid="slidesWrapper"]');if(!wrap)return;
      var slides=[].slice.call(wrap.children);if(slides.length<2){[].forEach.call(ss.querySelectorAll('[data-testid="prevButton"],[data-testid="nextButton"],nav'),function(x){x.style.display='none';});return;}
      var dots=[].slice.call(ss.querySelectorAll('nav li')),i=0,timer;
      function show(n){i=(n+slides.length)%slides.length;
        slides.forEach(function(sl,k){sl.style.display=k===i?'':'none';sl.style.opacity=k===i?'1':'';});
        dots.forEach(function(d,k){if(k===i)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current');var a=d.querySelector('a');if(a)a.classList.toggle('ss-active',k===i);});}
      function auto(){clearInterval(timer);timer=setInterval(function(){show(i+1);},7000);}
      var pv=ss.querySelector('[data-testid="prevButton"]'),nx=ss.querySelector('[data-testid="nextButton"]');
      if(pv)pv.addEventListener('click',function(e){e.preventDefault();show(i-1);auto();});
      if(nx)nx.addEventListener('click',function(e){e.preventDefault();show(i+1);auto();});
      dots.forEach(function(d,k){d.addEventListener('click',function(e){e.preventDefault();show(k);auto();});});
      show(0);auto();
    });
  }
  function initFilms(){
    var stage=document.querySelector('.yt-stage');var cards=[].slice.call(document.querySelectorAll('.yt-card'));if(!stage||!cards.length)return;
    var local=location.protocol==='file:';
    function embed(id,title){
      if(local){window.open('https://www.youtube.com/watch?v='+id,'_blank','noopener');return;}
      stage.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="'+title+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    }
    function mark(id){cards.forEach(function(c){c.classList.toggle('is-playing',c.getAttribute('data-yt')===id);});}
    stage.addEventListener('click',function(e){var b=e.target.closest('.yt-feature');if(!b)return;var id=stage.getAttribute('data-yt');embed(id,stage.querySelector('.yt-feature-title').textContent);mark(id);});
    cards.forEach(function(c){c.addEventListener('click',function(){
      var id=c.getAttribute('data-yt'),title=c.querySelector('.yt-title').textContent;
      stage.setAttribute('data-yt',id);mark(id);
      if(local){embed(id,title);return;}
      embed(id,title);stage.scrollIntoView({behavior:'smooth',block:'center'});});});
    mark(stage.getAttribute('data-yt'));
  }
  function initWeddingGrid(){
    var items=[].slice.call(document.querySelectorAll('#wedding-photos .wg-item'));if(!items.length)return;
    var STEP=36,shown=STEP,btn=document.querySelector('.wg-more');
    function apply(){items.forEach(function(it,k){it.classList.toggle('wg-hidden',k>=shown);});if(btn)btn.style.display=shown>=items.length?'none':'';}
    if(btn)btn.addEventListener('click',function(){shown+=STEP;apply();});
    apply();
  }
  function initCat(){
    var trig=document.querySelectorAll('[data-cat-surprise]');if(!trig.length)return;
    var lang=(document.documentElement.lang||'en').slice(0,2);
    var C={
      en:{close:'Close',more:'More cat',cards:[
        ['You’re toast-ally welcome!','Our chief of snuggles approves this message.'],
        ['Me after all the wedding dancing','Do not disturb. Recharging.'],
        ['Waiting for the cake to be served','I was promised a slice.'],
        ['Did someone say leftovers?','I can be very convincing.'],
        ['Officially retired from the dance floor','Snorlax and I need a minute.'],
        ['Thank you for coming!','I’ll be napping now. Goodnight.']]},
      hr:{close:'Zatvori',more:'Još mace',cards:[
        ['Nema na čemu – od srca i od tosta!','Naš glavni mazilica odobrava ovu poruku.'],
        ['Ja nakon cijele večeri plesa','Ne smetaj. Punim baterije.'],
        ['Čekam da posluže tortu','Obećan mi je komad.'],
        ['Je li netko spomenuo ostatke?','Znam biti vrlo uvjerljiv.'],
        ['Službeno u mirovini s plesnog podija','Snorlax i ja trebamo pauzu.'],
        ['Hvala što ste došli!','Sad idem drijemati. Laku noć.']]},
      vi:{close:'Đóng',more:'Thêm mèo',cards:[
        ['Không có chi!','Boss mèo nhà mình đã duyệt tin nhắn này.'],
        ['Tui sau một đêm nhảy múa','Đừng làm phiền. Đang sạc pin.'],
        ['Đang chờ được chia bánh cưới','Đã hứa cho tui một miếng rồi đó.'],
        ['Có ai nói đồ ăn thừa không?','Tui thuyết phục giỏi lắm nha.'],
        ['Chính thức nghỉ hưu khỏi sàn nhảy','Snorlax và tui cần nghỉ chút.'],
        ['Cảm ơn mọi người đã đến!','Giờ tui đi ngủ đây. Chúc ngủ ngon.']]}
    };
    var t=C[lang]||C.en;C.en.more='More Maruko';C.hr.more='Jo\u0161 Maruko';C.vi.more='Th\u00eam Maruko';var imgs=['cat-toast.jpg','cat-2.jpg','cat-3.jpg','cat-4.jpg','cat-5.jpg','cat-6.jpg'];
    var m=document.createElement('div');m.className='cat-modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
    m.innerHTML='<div class="cat-card"><button class="cat-x" type="button" aria-label="'+t.close+'">&times;</button><img alt=""><p class="cat-h"></p><p class="cat-s"></p><div class="cat-foot"><span class="cat-n"></span><button type="button" class="cat-more">'+t.more+' &#8594;</button></div></div><div class="cat-confetti" aria-hidden="true"></div>';
    document.body.appendChild(m);var cf=m.querySelector('.cat-confetti'),card=m.querySelector('.cat-card'),img=card.querySelector('img'),i=0;
    imgs.forEach(function(f){var pre=new Image();pre.src=ASSETS+f;});
    function show(n){i=(n+imgs.length)%imgs.length;img.src=ASSETS+imgs[i];card.querySelector('.cat-h').textContent=t.cards[i][0];card.querySelector('.cat-s').textContent=t.cards[i][1];card.querySelector('.cat-n').textContent=(i+1)+' / '+imgs.length;
      card.style.setProperty('--tilt',(i%2?1.6:-2)+'deg');card.classList.remove('flip');void card.offsetWidth;card.classList.add('flip');}
    function rain(){cf.innerHTML='';var em=['🍞','❤️','🐾','🍞','✨'];
      for(var k=0;k<34;k++){var sp=document.createElement('span');sp.textContent=em[k%em.length];sp.style.left=(Math.random()*100)+'%';sp.style.animationDelay=(Math.random()*1.4)+'s';sp.style.animationDuration=(2.6+Math.random()*2.2)+'s';sp.style.fontSize=(18+Math.random()*20)+'px';cf.appendChild(sp);}}
    function open(e){if(e)e.preventDefault();show(Math.floor(Math.random()*imgs.length));m.classList.add('open');rain();m.querySelector('.cat-more').focus();}
    function close(){m.classList.remove('open');}
    trig.forEach(function(a){a.addEventListener('click',open);});
    function next(){var n;do{n=Math.floor(Math.random()*imgs.length);}while(n===i&&imgs.length>1);show(n);}
    m.querySelector('.cat-more').addEventListener('click',next);
    img.addEventListener('click',next);
    m.addEventListener('click',function(e){if(e.target===m||e.target.classList.contains('cat-x'))close();});
    document.addEventListener('keydown',function(e){if(!m.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1);});
  }
  function init(){initWeddingGrid();initCat();fit();initLb();initLang();initAnchors();initVideos();initSlideshows();initFilms();initMusic();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('resize',fit);
})();
