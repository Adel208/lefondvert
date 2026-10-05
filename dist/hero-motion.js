/* A single photographic source, animated directly by scroll. No video seek,
   frame downloads, scroll interception, or continuous rendering loop. */
(function () {
  const clamp = v => Math.min(1, Math.max(0, v));
  const smooth = (from, to, p) => { const x = clamp((p - from) / (to - from)); return x * x * (3 - 2 * x); };
  let dispose = () => {};
  window.destroyHeroMotion = () => dispose();
  window.mountHeroMotion = function () {
    dispose();
    const stage = document.querySelector('.hero');
    if (!stage) return;
    const copy = stage.querySelector('.hero-copy');
    const bottom = stage.querySelector('.hero-bottom');
    const selection = document.getElementById('selection');
    const sequence = document.createElement('div');
    sequence.className = 'hero-sequence';
    stage.before(sequence); sequence.append(stage);
    stage.insertAdjacentHTML('afterbegin', '<div class="hero-photograph" aria-hidden="true"></div><div class="hero-curtain" aria-hidden="true"></div>');
    stage.insertAdjacentHTML('beforeend', '<div class="hero-final" aria-hidden="true"><span>MAISON VERMEIL</span><p>La lumière<br>devient <em>bijou.</em></p></div><div class="hero-scroll-progress" aria-hidden="true"><span></span></div>');
    bottom.innerHTML = '<span class="scroll-invitation">DÉFILEZ POUR EXPLORER</span><span>La singularité, dans chaque facette.</span><a class="skip-sequence" href="#selection">Voir les pièces</a>';
    const photograph = stage.querySelector('.hero-photograph');
    const curtain = stage.querySelector('.hero-curtain');
    const finale = stage.querySelector('.hero-final');
    const bar = stage.querySelector('.hero-scroll-progress span');
    const skip = bottom.querySelector('.skip-sequence');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 600px)');
    const short = matchMedia('(max-height: 550px)');
    const controller = new AbortController();
    let frame = 0, start = 0, distance = 1, enabled = false;
    function render() {
      frame = 0;
      if (!enabled || !stage.isConnected) return;
      const p = clamp((window.scrollY - start) / distance);
      const camera = smooth(0, .88, p);
      const fade = 1 - smooth(.12, .43, p);
      const white = smooth(.76, 1, p);
      const isMobile = mobile.matches;
      photograph.style.transform = `translate3d(${camera * (isMobile ? -2 : -5)}%,${camera * (isMobile ? 4 : 2)}%,0) scale(${1 + camera * (isMobile ? .27 : .40)})`;
      copy.style.opacity = fade.toFixed(4);
      copy.style.transform = `translate3d(0,${-38 * (1 - fade)}px,0)`;
      const hidden = fade < .04;
      if (hidden && copy.contains(document.activeElement)) skip.focus({preventScroll:true});
      copy.inert = hidden;
      copy.setAttribute('aria-hidden', String(hidden));
      finale.style.opacity = (smooth(.4,.57,p) * (1-smooth(.78,.94,p))).toFixed(4);
      finale.style.transform = `translate3d(0,${22*(1-smooth(.4,.6,p))}px,0)`;
      curtain.style.opacity = white.toFixed(4);
      bar.style.transform = `scaleX(${p})`;
      bottom.classList.toggle('on-ivory', p > .9);
      stage.dataset.progress = p.toFixed(4);
    }
    function schedule() { if (!frame && enabled) frame = requestAnimationFrame(render); }
    function measure() {
      enabled = !reduce.matches && !short.matches;
      sequence.classList.toggle('motion-enabled', enabled);
      document.body.classList.toggle('motion-home', enabled);
      if (!enabled) {
        if(frame) cancelAnimationFrame(frame); frame=0;
        [photograph,copy,curtain,finale,bar].forEach(el=>el.removeAttribute('style'));
        copy.inert=false;copy.removeAttribute('aria-hidden');
        bottom.classList.remove('on-ivory');stage.dataset.progress='0';
        return;
      }
      start = sequence.getBoundingClientRect().top + window.scrollY - document.querySelector('header').getBoundingClientRect().height;
      distance = Math.max(1, sequence.offsetHeight - stage.offsetHeight);
      schedule();
    }
    skip.addEventListener('click', event => {
      event.preventDefault();
      selection.scrollIntoView({behavior: 'instant', block:'start'});
      selection.tabIndex = -1; selection.focus({preventScroll:true});
    }, {signal:controller.signal});
    window.addEventListener('scroll', schedule, {passive:true,signal:controller.signal});
    window.addEventListener('resize', measure, {passive:true,signal:controller.signal});
    window.addEventListener('pageshow', measure, {signal:controller.signal});
    [reduce,mobile,short].forEach(q=>q.addEventListener('change',measure));
    const observer = new ResizeObserver(measure);observer.observe(stage);
    measure();
    dispose = () => {
      controller.abort(); observer.disconnect();
      [reduce,mobile,short].forEach(q=>q.removeEventListener('change',measure));
      if(frame)cancelAnimationFrame(frame);
      document.body.classList.remove('motion-home');
      dispose=()=>{};
    };
  };
})();
