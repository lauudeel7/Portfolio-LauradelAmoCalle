(() => {
  const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');

  // Proyectos desde js/projects-data.js
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  $('#projects-grid').innerHTML = (window.PROJECTS || []).map(p => `
    <article class="card spot tilt reveal">
      ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" width="400" height="225" style="width:100%;height:auto;border-radius:.6rem;margin-bottom:1rem">` : ''}
      ${p.context ? `<span class="mono muted">${esc(p.context)}</span>` : ''}
      <h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
      <ul class="chips mono">${(p.tags||[]).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      ${p.url ? `<p style="margin-top:1rem"><a href="${esc(p.url)}" target="_blank" rel="noopener">Ver proyecto</a></p>` : ''}
    </article>`).join('') + `<article class="card empty reveal"><h3>Siguiente proyecto</h3><p>Aquí irán los próximos que vaya construyendo.</p></article>`;

  // Menú a pantalla completa
  const btn = $('#menuBtn'), menu = $('#menu');
  const setMenu = open => { menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : ''; };
  btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  // Raíl lateral: sección activa y progreso
  const links = $$('.rail a'), fill = $('#railFill');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.dataset.s === e.target.id)); }), {rootMargin:'-45% 0px -50% 0px'});
  $$('main > section').forEach(s => io.observe(s));
  const prog = () => { fill.style.transform = `scaleY(${scrollY / (document.documentElement.scrollHeight - innerHeight)})`; };
  addEventListener('scroll', prog, {passive:true}); prog();

  // Iluminación dinámica en tarjetas
  $$('.spot').forEach(el => el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX-r.left+'px'); el.style.setProperty('--my', e.clientY-r.top+'px'); }));

  // Copiar email, formulario
  const toast = $('#toast'), say = m => { toast.textContent = m; toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 2200); };
  $('#copyMail').addEventListener('click', async () => { try { await navigator.clipboard.writeText('lauradelamocalle@gmail.com'); say('Email copiado'); } catch { say('lauradelamocalle@gmail.com'); } });
  $('#mailForm').addEventListener('submit', e => { e.preventDefault(); const f = e.target;
    location.href = `mailto:lauradelamocalle@gmail.com?subject=${encodeURIComponent('Contacto desde tu portfolio · ' + f.n.value)}&body=${encodeURIComponent(f.m.value)}`; });

  if (reduced || !window.gsap) { $$('.reveal').forEach(e => e.style.opacity = 1); $$('[data-n]').forEach(b => b.textContent = b.dataset.n); return; }
  gsap.registerPlugin(ScrollTrigger);

  // Entrada del hero (única secuencia orquestada)
  $$('.ln').forEach(l => l.innerHTML = `<span>${l.textContent}</span>`);
  gsap.timeline({defaults:{ease:'power4.out'}})
    .from('.ln span', {yPercent:110, duration:1.1, stagger:.12})
    .from('.status, .hero__lead, .hero .actions', {opacity:0, y:16, stagger:.1, duration:.7}, '-=.7');

  // Scroll reveal, contadores, barras de nivel
  gsap.utils.toArray('.reveal').forEach(el => gsap.fromTo(el, {opacity:0, y:28}, {opacity:1, y:0, duration:.8, ease:'power2.out', scrollTrigger:{trigger:el, start:'top 88%', once:true}}));
  $$('[data-n]').forEach(b => { const o = {v:0}; gsap.to(o, {v:+b.dataset.n, duration:1.4, ease:'power2.out', onUpdate:() => b.textContent = Math.round(o.v), scrollTrigger:{trigger:b, start:'top 90%', once:true}}); });
  $$('.lvl i').forEach(i => gsap.from(i, {scaleX:0, duration:1.2, ease:'power3.out', scrollTrigger:{trigger:i, start:'top 92%', once:true}}));

  // Parallax del hero con el scroll
  gsap.to('.hero__stage', {yPercent:-8, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}});

  // Hover 3D y botones magnéticos (solo puntero fino)
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.tilt').forEach(el => {
      const rx = gsap.quickTo(el, 'rotationX', {duration:.4}), ry = gsap.quickTo(el, 'rotationY', {duration:.4});
      gsap.set(el, {transformPerspective:800});
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); ry(((e.clientX-r.left)/r.width-.5)*9); rx(-((e.clientY-r.top)/r.height-.5)*9); });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    $$('.mag').forEach(el => {
      const mx = gsap.quickTo(el, 'x', {duration:.4, ease:'power3'}), my = gsap.quickTo(el, 'y', {duration:.4, ease:'power3'});
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mx((e.clientX-r.left-r.width/2)*.25); my((e.clientY-r.top-r.height/2)*.35); });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }
})();
