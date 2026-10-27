(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const S = KIT.sources;
  const byId = Object.fromEntries(KIT.stats.map(s => [s.id, s]));
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // ---------- toast + copy ----------
  const toast = $('#toast'); let tt;
  function say(msg){ toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(()=>toast.classList.remove('show'), 1800); }
  async function copy(text){
    try { await navigator.clipboard.writeText(text); say('Copied to clipboard'); }
    catch(e){
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); say('Copied to clipboard'); } catch(_) { say('Select the text and copy it manually'); }
      ta.remove();
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy]'); if(!b) return;
    const v = b.getAttribute('data-copy');
    const el = v.startsWith('#') ? $(v) : null;
    copy(el ? el.innerText.trim() : b.getAttribute('data-text'));
  });

  $('#statCount').textContent = KIT.stats.length;

  // ---------- POSTER + LAYOUT ENGINE ----------
  // Every figure in the data bank can go on the graphic. The engine places each one in the zone
  // that fits it best for the chosen format; the user can pin, reorder, drag, edit labels, or remove.
  const ZONES = ['top','left','right','bottom'];
  const ZONE_NAME = { auto:'Auto', top:'Top row', left:'Left side', right:'Right side', bottom:'Bottom band' };
  const CAPS = { // max figures per zone, by format
    feed:   { top:4, left:3, right:3, bottom:4 },
    square: { top:4, left:2, right:2, bottom:4 },
    story:  { top:4, left:3, right:3, bottom:4 },
    banner: { top:5, left:3, right:3, bottom:5 }
  };
  const DEFAULT_IDS = ['matches','fans','teams','fansites','offsite','ops','tax','jobs','legacy','pitches','youth','nocar'];
  const HERO_TEXT = { impact:{ eyebrow:'Estimated total impact', label:'Economic impact', sub:'for Seattle & King County' } };
  const DEFAULT_STATE = () => ({
    hero:'impact', heroEyebrow:null, heroLabel:null, heroSub:null,
    title:"Seattle's World Cup, by the numbers", kicker:'SSC Business Data Report · No. 01',
    size:100,
    items: DEFAULT_IDS.map(id => ({ id, zone:'auto', label:null, sub:null }))
  });
  let state = DEFAULT_STATE();
  state.items = (state.items||[]).filter(it => byId[it.id]);
  if (!byId[state.hero]) state.hero = 'impact';
  const save = () => {};

  let photo = null;
  const poster = $('#poster');
  const DIMS = { feed:[1080,1350], square:[1080,1080], story:[1080,1920], banner:[1920,1080] };
  const lab = it => it.label ?? byId[it.id].label;
  const sub = it => it.sub ?? byId[it.id].sub;

  // ---- the engine ----
  function layout(fmt){
    const cap = CAPS[fmt];
    const maxTotal = ZONES.reduce((a,z) => a + cap[z], 0);
    const used = state.items.slice(0, maxTotal);
    const hidden = state.items.slice(maxTotal).map(it => it.id);
    const out = { top:[], left:[], right:[], bottom:[] };
    const pinned = { top:[], left:[], right:[], bottom:[] };
    const auto = [];
    used.forEach(it => (it.zone !== 'auto' && pinned[it.zone].length < cap[it.zone]) ? pinned[it.zone].push(it) : auto.push(it));

    // target counts for a balanced composition
    const N = used.length;
    let sides = N === 1 ? 0 : N === 2 ? 2 : Math.round(N / 3);
    if (N > 2 && sides % 2) sides += (sides + 1 <= cap.left + cap.right && N - sides - 1 >= 2) ? 1 : -1;
    sides = Math.max(0, Math.min(sides, cap.left + cap.right));
    const T = { left:Math.ceil(sides/2), right:Math.floor(sides/2) };
    let rest = N - sides;
    T.top = Math.min(cap.top, Math.ceil(rest / 2));
    T.bottom = Math.min(cap.bottom, rest - T.top);
    let spill = rest - T.top - T.bottom; // anything left over goes wherever there's room
    for (const z of ['top','bottom','left','right']) while (spill > 0 && T[z] < cap[z]) { T[z]++; spill--; }
    // pinned figures count toward their zone; free room shrinks elsewhere
    ZONES.forEach(z => { T[z] = Math.max(T[z], pinned[z].length); });
    let over = ZONES.reduce((a,z) => a + T[z], 0) - N;
    for (const z of ['bottom','top','right','left']) while (over > 0 && T[z] > pinned[z].length) { T[z]--; over--; }
    const room = z => T[z] - pinned[z].length;

    // fit scores: side callouts suit figures with a detail line or long label; rows suit short values
    const sideScore = it => (sub(it)||'').length + lab(it).length*0.6 + (/^\$/.test(byId[it.id].value) ? 25 : 0);
    const pool = [...auto];
    const take = (n, scoreFn) => { pool.sort((a,b) => scoreFn(b) - scoreFn(a)); return pool.splice(0, Math.max(0,n)); };
    const sideIt = take(room('left') + room('right'), sideScore).sort((a,b) => state.items.indexOf(a) - state.items.indexOf(b));
    const sL = [], sR = [];
    sideIt.forEach(it => ((sL.length < room('left') && (sL.length <= sR.length || sR.length >= room('right'))) ? sL : sR).push(it));
    const topIt = take(room('top'), it => -byId[it.id].value.length);
    const botIt = pool.splice(0);
    const order = arr => arr.sort((a,b) => state.items.indexOf(a) - state.items.indexOf(b));
    out.left = order([...pinned.left, ...sL]); out.right = order([...pinned.right, ...sR]);
    out.top = order([...pinned.top, ...topIt]); out.bottom = order([...pinned.bottom, ...botIt]);
    return { out, hidden, cap };
  }

  const pitchSVG = (w,h) => {
    const cx = w/2, cy = h*0.53, r = Math.min(w,h)*0.27;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="2" opacity=".16">
        <circle cx="${cx}" cy="${cy}" r="${r}"/>
        <line x1="0" y1="${cy}" x2="${w}" y2="${cy}"/>
        <circle cx="${cx}" cy="${cy}" r="5" fill="currentColor"/>
      </g></svg>`;
  };

  const SRC_FULL = { VS:'Visit Seattle (Sept. 22, 2026; analysis by Tourism Economics, part of Oxford Economics)', LOC:'SeattleFWC26 Final Report (Sept. 2026)' };
  function sourceLine(ids){
    const keys = [...new Set(ids.map(id => byId[id].src))];
    return 'Sources: ' + keys.map(k => SRC_FULL[k] || `${S[k].short} (${S[k].date})`).join('; ') + '.';
  }
  function heroHTML(v){
    const m = /^([^\d]*)([\d][\d.,]*)(.*)$/.exec(v);
    if (!m) return `<span>${esc(v)}</span>`;
    return `${m[1]?`<span class="p-hero__u">${esc(m[1])}</span>`:''}${esc(m[2])}${m[3]?`<span class="p-hero__u">${esc(m[3].trim())}</span>`:''}`;
  }
  const heroBits = () => {
    const h = byId[state.hero], d = HERO_TEXT[state.hero] || { eyebrow: (KIT.cats.find(c=>c.id===h.cat)||{}).label || 'By the numbers', label:h.label, sub:h.sub };
    return { eyebrow: state.heroEyebrow ?? d.eyebrow, label: state.heroLabel ?? d.label, sub: state.heroSub ?? d.sub };
  };

  let lastLayout = null;
  function renderPoster(quiet){
    poster.dataset.type = state.type || 'hub';
    if (poster.dataset.type === 'hub') renderHub(); else renderOther();
    fitStage();
    snapCurrent();
    if (quiet) return;
    updateThumb();
    if (poster.dataset.type === 'hub') renderSlotEditor(); else renderOtherEditor();
    if (window.__syncCards) window.__syncCards();
  }
  function renderHub(){
    const fmt = poster.dataset.format;
    const [w,h] = DIMS[fmt];
    const L = lastLayout = layout(fmt);
    const z = L.out;
    const attrs = it => `data-id="${it.id}" draggable="true" title="Drag to move"`;
    const topHTML = z.top.map(it => `<div class="p-stat" ${attrs(it)}><div class="p-stat__v">${esc(byId[it.id].value)}</div><div class="p-stat__l">${esc(lab(it))}</div></div>`).join('');
    const side = arr => arr.map(it => `<div class="p-call" ${attrs(it)}><div class="p-call__rule"></div><div class="p-call__v">${esc(byId[it.id].value)}</div><div class="p-call__l">${esc(lab(it))}</div>${sub(it)?`<div class="p-call__s">${esc(sub(it))}</div>`:''}</div>`).join('');
    const botHTML = z.bottom.map(it => `<div class="p-mini" ${attrs(it)}><div class="p-mini__v">${esc(byId[it.id].value)}</div><div class="p-mini__l">${esc(lab(it))}</div></div>`).join('');
    const hb = heroBits();
    const allIds = [state.hero, ...ZONES.flatMap(k => z[k].map(it => it.id))];
    const topCols = fmt === 'story' ? Math.min(2, Math.max(1, z.top.length)) : Math.max(1, z.top.length);
    const botCols = fmt === 'story' ? Math.min(2, Math.max(1, z.bottom.length)) : Math.max(1, z.bottom.length);
    poster.dataset.top = z.top.length; poster.dataset.bottom = z.bottom.length;
    poster.innerHTML = `
      ${state.photo ? `<div class="poster__bgimg" style="background-image:url('${state.photo}')"></div>` : ''}
      <div class="poster__pitch" style="color:var(--a2)">${pitchSVG(w,h)}</div><div class="poster__stripe" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="p-head">
        <div class="p-head__brand"><img src="assets/ssc-logo.svg" alt="">
          <div><div class="p-head__kicker">${esc(state.kicker)}</div><div class="p-head__title">${esc(state.title)}</div></div>
        </div>
        ${tagHTML()}
      </div>
      <div class="p-top p-zone" data-zone="top" style="grid-template-columns:repeat(${topCols},minmax(0,1fr))${z.top.length?'':';padding:0'}">${topHTML}</div>
      <div class="p-side p-left p-zone" data-zone="left">${side(z.left)}</div>
      <div class="p-center">
        <div class="p-hero__eyebrow">${esc(hb.eyebrow)}</div>
        <div class="p-hero__v">${heroHTML(byId[state.hero].value)}</div>
        <div class="p-hero__l">${esc(hb.label)}</div>
        ${hb.sub?`<div class="p-hero__s">${esc(hb.sub)}</div>`:''}
      </div>
      <div class="p-side p-right p-zone" data-zone="right">${side(z.right)}</div>
      <div class="p-bottom p-zone" data-zone="bottom" style="grid-template-columns:repeat(${botCols},minmax(0,1fr))${z.bottom.length?'':';background:none;margin:0'}">${botHTML}</div>
      ${state.quote != null ? `<figure class="p-quote" data-edit-hub="ge-pq"><blockquote class="p-quote__t">\u201c${esc(QQ[state.quote].text)}\u201d</blockquote><figcaption class="p-quote__by"><b>${esc(QQ[state.quote].who)}</b> · ${esc(QQ[state.quote].role)}</figcaption></figure>` : ''}
      <div class="p-foot">
        <div class="p-foot__src">${esc(srcText(slideKeys(state)))}</div>
        <div class="p-foot__by">seattlesports.org</div>
      </div>`;
    fitText();
  }

  // Auto-fit: user size setting, then shrink numbers to their column, then shrink everything until the layout fits the canvas.
  function fitText(){
    const k = (state.size || 100) / 100;
    const txt = $$('#poster .p-zone *, #poster .p-center *, #poster .p-quote *, #poster .p-foot__src, #poster .p-head__title');
    txt.forEach(el => { el.style.fontSize = ''; });
    txt.forEach(el => { if (!el.children.length || el.classList.contains('p-hero__v')) el.dataset.fs = parseFloat(getComputedStyle(el).fontSize); });
    const apply = f => txt.forEach(el => { if (el.dataset.fs) el.style.fontSize = (el.dataset.fs * f * (el.closest('.p-zone') || el.closest('.p-center') || el.closest('.p-quote') ? k : 1)) + 'px'; });
    apply(1);
    const fitWidth = () => $$('#poster .p-hero__v, #poster .p-call__v, #poster .p-stat__v, #poster .p-mini__v, #poster .p-head__title').forEach(el => {
      const box = el.parentElement;
      const avail = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) - parseFloat(getComputedStyle(box).paddingRight);
      let size = parseFloat(el.style.fontSize || getComputedStyle(el).fontSize), g = 0;
      while (el.scrollWidth > avail + 1 && size > 16 && g++ < 60){ size *= 0.95; el.style.fontSize = size + 'px'; }
    });
    fitWidth();
    const foot = $('#poster .p-foot');
    const limit = () => poster.clientHeight - parseFloat(getComputedStyle(poster).paddingBottom) + 1;
    const overflowing = () => foot.offsetTop + foot.offsetHeight > limit() || $$('#poster .p-side').some(s => s.scrollHeight > s.clientHeight + 2);
    let f = 1, g = 0;
    while (overflowing() && f > 0.7 && g++ < 20){ f *= 0.94; apply(f); fitWidth(); }
    poster.classList.toggle('is-tight', overflowing());
  }

  function fitStage(){
    const stage = $('#stage'), scaler = $('#scaler');
    const [w,h] = DIMS[poster.dataset.format];
    const pad = window.innerWidth < 600 ? 16 : 48;
    const availW = stage.clientWidth - pad;
    const availH = window.innerWidth > 1100 ? Math.max(480, window.innerHeight - 140) : Infinity;
    const s = Math.min(availW / w, availH / h, 1);
    scaler.style.transform = `scale(${s})`;
    scaler.style.width = w + 'px';
    scaler.style.height = h + 'px';
    stage.style.height = (h * s + pad) + 'px';
    scaler.parentElement.style.alignItems = 'flex-start';
    scaler.style.marginRight = (-(w - w*s)) + 'px';
    scaler.style.marginBottom = (-(h - h*s)) + 'px';
  }
  window.addEventListener('resize', fitStage);

  function segBind(id, attr, fn){
    $$(`#${id} button`).forEach(b => b.addEventListener('click', () => {
      $$(`#${id} button`).forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
      fn(b.dataset[attr]);
    }));
  }
  segBind('fmtSeg', 'fmt', v => { poster.dataset.format = v; window.__snapAll ? window.__snapAll() : renderPoster(); });
  segBind('themeSeg', 'theme', v => { poster.dataset.theme = v; $$('#deckStrip .th__canvas').forEach(c => c.dataset.theme = v); });

  // ---- drag on the poster: drop on a zone (or on a figure) to pin it there ----
  let dragId = null;
  poster.addEventListener('dragstart', e => {
    const el = e.target.closest('[data-id]'); if (!el) return;
    dragId = el.dataset.id; e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch(_){}
    poster.classList.add('is-dragging');
  });
  poster.addEventListener('dragend', () => { poster.classList.remove('is-dragging'); $$('#poster .p-zone').forEach(z => z.classList.remove('is-over')); dragId = null; });
  poster.addEventListener('dragover', e => {
    const zn = e.target.closest('.p-zone'); if (!zn || !dragId) return;
    e.preventDefault(); $$('#poster .p-zone').forEach(z => z.classList.toggle('is-over', z === zn));
  });
  poster.addEventListener('drop', e => {
    const zn = e.target.closest('.p-zone'); if (!zn || !dragId || state.type !== 'hub') return;
    e.preventDefault();
    const it = state.items.find(x => x.id === dragId); if (!it) return;
    const zone = zn.dataset.zone, cap = CAPS[poster.dataset.format][zone];
    const target = e.target.closest('[data-id]');
    // make room: if the zone is full, push its last auto-placed figure back to Auto
    const inZone = lastLayout.out[zone].filter(x => x.id !== it.id);
    if (inZone.length >= cap) { const bump = [...inZone].reverse().find(x => x !== target) ; if (bump) bump.zone = 'auto'; }
    it.zone = zone;
    state.items.splice(state.items.indexOf(it), 1);
    const ti = target && target.dataset.id !== it.id ? state.items.findIndex(x => x.id === target.dataset.id) : -1;
    if (ti >= 0) state.items.splice(ti, 0, it); else {
      const lastInZone = inZone.length ? state.items.indexOf(inZone[inZone.length-1]) : -1;
      state.items.splice(lastInZone >= 0 ? lastInZone + 1 : state.items.length, 0, it);
    }
    renderPoster(); say(`Moved to ${ZONE_NAME[zone]}`);
  });
  poster.addEventListener('click', e => {
    if (state.type && state.type !== 'hub') return;
    const pq = e.target.closest('[data-edit-hub]'); if (pq) { const c = document.getElementById(pq.dataset.editHub); if (c) { c.scrollIntoView({block:'nearest',behavior:'smooth'}); c.focus({preventScroll:true}); } return; }
    const el = e.target.closest('[data-id]'); if (!el) return;
    const row = $(`#slotEditor .gitem[data-id="${el.dataset.id}"]`);
    if (row) { row.open = true; row.scrollIntoView({ block:'nearest', behavior:'smooth' }); row.classList.add('flash'); setTimeout(()=>row.classList.remove('flash'), 900); }
  });

  // ---- editor panel ----
  function figOptions(selected, exclude){
    return KIT.cats.filter(c => c.id !== 'all').map(c => {
      const list = KIT.stats.filter(s => s.cat === c.id);
      if (!list.length) return '';
      return `<optgroup label="${esc(c.label)}">${list.map(o => `<option value="${o.id}" ${o.id===selected?'selected':''} ${exclude.has(o.id)&&o.id!==selected?'disabled':''}>${esc(o.value)} · ${esc(o.label)}</option>`).join('')}</optgroup>`;
    }).join('');
  }
  function renderSlotEditor(){
    const L = lastLayout; if (!L) return;
    const placed = {}; ZONES.forEach(zz => L.out[zz].forEach(it => placed[it.id] = zz));
    const inUse = new Set([state.hero, ...state.items.map(i => i.id)]);
    const fmtName = { feed:'Feed 4:5', square:'Square', story:'Story 9:16', banner:'Web 16:9' }[poster.dataset.format];
    const max = ZONES.reduce((a,z) => a + L.cap[z], 0);
    const hb = heroBits();
    const open = new Set($$('#slotEditor details.gitem[open]').map(d => d.dataset.id));
    $('#slotEditor').innerHTML = `
      <div class="ge-block">
        <label class="ge-lab" for="ge-hero">Center figure</label>
        <select id="ge-hero">${figOptions(state.hero, new Set(state.items.map(i=>i.id)))}</select>
        <div class="ge-row2">
          <input id="ge-hEy" value="${esc(hb.eyebrow)}" aria-label="Center label above the number">
          <input id="ge-hL" value="${esc(hb.label)}" aria-label="Center label below the number">
        </div>
        <input id="ge-hS" value="${esc(hb.sub||'')}" aria-label="Center detail line" placeholder="Detail line (optional)">
      </div>
      <div class="ge-block">
        <label class="ge-lab" for="ge-title">Headline</label>
        <input id="ge-title" value="${esc(state.title)}">
        <label class="ge-lab" for="ge-kick">Kicker</label>
        <input id="ge-kick" value="${esc(state.kicker)}">
        <label class="ge-lab" for="ge-size">Text size <output id="ge-sizeOut">${state.size}%</output></label>
        <input type="range" id="ge-size" min="80" max="120" step="5" value="${state.size}">
      </div>
      <div class="ge-block">
        <label class="ge-lab" for="ge-pq">Pull quote <em>(optional, word for word)</em></label>
        <select id="ge-pq"><option value="">None</option>${QQ.map((q,i) => `<option value="${i}" ${state.quote===i?'selected':''}>${esc(q.who)}: \u201c${esc(q.text.slice(0,54))}\u2026\u201d</option>`).join('')}</select>
        ${state.quote!=null?`<p class="hint">Source: <a href="${S[QQ[state.quote].src].url}" target="_blank" rel="noopener">${esc(S[QQ[state.quote].src].short)} ↗</a>. Shorter quotes leave more room for figures.</p>`:''}
      </div>
      <div class="ge-block">
        <div class="ge-head"><span class="ge-lab">Figures on the graphic <b>${Math.min(state.items.length,max)} / ${max}</b></span>
          <button class="btn btn--text btn--sm" id="ge-auto" type="button">Auto-arrange</button></div>
        ${poster.classList.contains('is-tight') ? '<p class="ge-warn" role="status">This format is crowded. Remove a figure or lower the text size so everything reads clearly.</p>' : ''}
        <p class="hint">The layout engine places each figure for the ${fmtName} format. Drag figures on the graphic, or pick a spot below to pin one. Numbers are locked to their source; labels can be edited.</p>
        <ol class="ge-list">
        ${state.items.map((it,i) => {
          const s = byId[it.id], where = placed[it.id];
          return `<li><details class="gitem ${where?'':'is-hidden'}" data-id="${it.id}" ${open.has(it.id)?'open':''}>
            <summary><span class="gi-v">${esc(s.value)}</span><span class="gi-l">${esc(lab(it))}</span>
              <span class="gi-z ${it.zone==='auto'?'':'is-pin'}">${where ? (it.zone==='auto' ? 'Auto · ' : '') + ZONE_NAME[where] : 'Won\u2019t fit in ' + fmtName}</span></summary>
            <div class="gi-body">
              <div class="gi-ctrls">
                <label class="sr-only" for="gz-${i}">Placement</label>
                <select id="gz-${i}" data-act="zone" data-i="${i}">${['auto',...ZONES].map(zz => `<option value="${zz}" ${it.zone===zz?'selected':''}>${zz==='auto'?'Auto (engine picks)':'Pin: '+ZONE_NAME[zz]}</option>`).join('')}</select>
                <button type="button" class="gi-btn" data-act="up" data-i="${i}" ${i===0?'disabled':''} aria-label="Move up">↑</button>
                <button type="button" class="gi-btn" data-act="down" data-i="${i}" ${i===state.items.length-1?'disabled':''} aria-label="Move down">↓</button>
                <button type="button" class="gi-btn gi-btn--x" data-act="rm" data-i="${i}" aria-label="Remove">Remove</button>
              </div>
              <label class="ge-lab" for="gl-${i}">Label</label>
              <input id="gl-${i}" data-act="label" data-i="${i}" value="${esc(lab(it))}">
              <label class="ge-lab" for="gs-${i}">Detail line <em>(side callouts)</em></label>
              <input id="gs-${i}" data-act="sub" data-i="${i}" value="${esc(sub(it)||'')}">
              <p class="hint gi-src">Source: <a href="${S[s.src].url}" target="_blank" rel="noopener">${esc(S[s.src].short)} ↗</a>${(it.label!==null||it.sub!==null)?` · <button type="button" class="btn--text gi-restore" data-act="restore" data-i="${i}">Restore original wording</button>`:''}</p>
            </div></details></li>`; }).join('')}
        </ol>
        <label class="ge-lab" for="ge-add">Add a figure</label>
        <select id="ge-add"><option value="">Choose from all ${KIT.stats.length} figures…</option>${figOptions('', inUse)}</select>
      </div>`;
    bindEditor();
  }
  const rerender = () => renderPoster();
  let typing;
  function bindEditor(){
    $('#ge-hero').onchange = e => { state.hero = e.target.value; state.heroEyebrow = state.heroLabel = state.heroSub = null; rerender(); };
    const live = (sel, fn) => { $(sel).oninput = e => { fn(e.target.value); clearTimeout(typing); typing = setTimeout(() => { const id = document.activeElement && document.activeElement.id; const pos = document.activeElement.selectionStart; rerender(); const el = id && document.getElementById(id); if (el){ el.focus(); try{ el.setSelectionRange(pos,pos);}catch(_){} } }, 250); }; };
    live('#ge-hEy', v => state.heroEyebrow = v);
    live('#ge-hL', v => state.heroLabel = v);
    live('#ge-hS', v => state.heroSub = v);
    live('#ge-title', v => state.title = v);
    live('#ge-kick', v => state.kicker = v);
    $('#ge-size').oninput = e => { state.size = +e.target.value; $('#ge-sizeOut').textContent = state.size + '%'; fitText(); snapCurrent(); updateThumb(); };
    $('#ge-pq').onchange = e => { state.quote = e.target.value === '' ? null : +e.target.value; rerender(); };
    $('#ge-auto').onclick = () => { state.items.forEach(it => it.zone = 'auto'); rerender(); say('Auto-arranged for this format'); };
    $('#ge-add').onchange = e => { if (!e.target.value) return; state.items.push({ id:e.target.value, zone:'auto', label:null, sub:null }); rerender(); say('Added. The engine placed it.'); };
    $$('#slotEditor [data-act]').forEach(el => {
      const i = +el.dataset.i, act = el.dataset.act;
      if (act === 'zone') el.onchange = () => { state.items[i].zone = el.value; rerender(); };
      else if (act === 'label') live(`#${el.id}`, v => state.items[i].label = v);
      else if (act === 'sub') live(`#${el.id}`, v => state.items[i].sub = v);
      else el.onclick = () => {
        const a = state.items;
        if (act === 'up' && i > 0) [a[i-1], a[i]] = [a[i], a[i-1]];
        if (act === 'down' && i < a.length-1) [a[i+1], a[i]] = [a[i], a[i+1]];
        if (act === 'rm') a.splice(i,1);
        if (act === 'restore') { a[i].label = null; a[i].sub = null; }
        rerender();
      };
    });
  }
  // ================= SLIDES & CAROUSEL =================
  // A deck holds one or more slides. Every slide shares the format and theme so a carousel stays consistent.
  const TYPE_NAME = { cover:'Cover', hub:'Impact graphic', spot:'Figure spotlight', quote:'Quote', story:'Story takeaway', trail:'Timeline', close:'Closing' };
  const TYPE_DESC = {
    hub:'A center figure with supporting figures placed around it.',
    spot:'One figure, its caption in source wording and up to three supporting figures.',
    quote:'An approved quote, word for word, with an optional figure.',
    story:'One of the five takeaways, with the figures that back it up.',
    trail:'Two to four figures in order, like the forecast trail.',
    cover:'An opening slide that sets up the carousel.',
    close:'A final slide that lists the source of every figure in the carousel.'
  };
  const TYPE_ORDER = ['hub','spot','quote','story','trail','cover','close'];
  const QQ = KIT.quotes, TK = KIT.takeaways;
  const base = () => ({ kicker:'SSC Business Data Report · No. 01', title:"Seattle's World Cup, by the numbers", size:100, photo:null });
  const MAKE = {
    hub:   () => ({ ...DEFAULT_STATE(), type:'hub', photo:null, quote:null }),
    cover: () => ({ ...base(), type:'cover', cover:"Seattle's World Cup, by the numbers", sub:'FIFA World Cup 2026™ · Seattle · King County', fig:'impact', figLabel:'Estimated total economic impact', cue:'Swipe for the numbers →' }),
    spot:  (o={}) => ({ ...base(), type:'spot', fig:'tax', label:null, sub:null, caption:null, support:['offsite','ops','jobs'], quote:null, ...o }),
    quote: (o={}) => ({ ...base(), type:'quote', q:0, fig:null, ...o }),
    story: (o={}) => { const t = o.tk ?? 2; return { ...base(), type:'story', tk:t, head:null, body:null, figs:[...TK[t].figs], ...o }; },
    trail: () => ({ ...base(), type:'trail', head:'The forecast trail', figs:['fc2024','fc2026','impact'], note:'Visit Seattle says the March forecast was lowered because fewer international visitors and less capital project spending were expected.', noteSrc:'VS' }),
    close: () => ({ ...base(), type:'close', head:'Read the reports behind the numbers', body:'Every figure in this carousel comes from these published sources.', cta:'seattlesports.org' })
  };
  const RECO = () => [
    MAKE.cover(), MAKE.hub(), MAKE.spot(),
    MAKE.story({ tk:2 }), MAKE.quote({ q:6, fig:'link' }),
    MAKE.story({ tk:3 }), MAKE.trail(), MAKE.story({ tk:4 }),
    MAKE.quote({ q:0 }), MAKE.close()
  ];
  const deck = { slides:[state], cur:0, nums:true };
  state.type = 'hub'; state.quote = null; state.photo = null;
  const snaps = new WeakMap();
  const clone = o => JSON.parse(JSON.stringify(o));

  // ids of figures and source keys used on a slide
  function slideIds(s){
    if (s.type === 'hub') return [s.hero, ...s.items.map(i => i.id)];
    if (s.type === 'cover') return s.fig ? [s.fig] : [];
    if (s.type === 'spot') return [s.fig, ...s.support];
    if (s.type === 'quote') return s.fig ? [s.fig] : [];
    if (s.type === 'story' || s.type === 'trail') return [...s.figs];
    return [];
  }
  function slideKeys(s){
    const k = slideIds(s).filter(id => byId[id]).map(id => byId[id].src);
    if (s.type === 'hub' && s.quote != null) k.push(QQ[s.quote].src);
    if (s.type === 'spot' && s.quote != null) k.push(QQ[s.quote].src);
    if (s.type === 'quote') k.push(QQ[s.q].src);
    if (s.type === 'story') k.push(...TK[s.tk].srcs);
    if (s.type === 'trail' && s.note && s.noteSrc) k.push(s.noteSrc);
    return [...new Set(k)];
  }
  const deckKeys = () => [...new Set(deck.slides.filter(s => s.type !== 'close').flatMap(slideKeys))];
  const srcText = keys => 'Sources: ' + keys.map(k => SRC_FULL[k] || `${S[k].short} (${S[k].date})`).join('; ') + '.';
  const shortUrl = u => { const x = u.replace(/^https?:\/\/(www\.)?/,''); return x.length <= 34 ? x.replace(/\/$/,'') : x.split('/')[0]; };

  // ---- shared poster pieces ----
  const tagHTML = () => `<div class="p-head__tag">FIFA World Cup 2026™<br>Seattle · King County${deck.nums && deck.slides.length > 1 ? `<span class="p-count">${deck.cur+1} / ${deck.slides.length}</span>` : ''}</div>`;
  const headHTML = (title=true) => `<div class="p-head"><div class="p-head__brand"><img src="assets/ssc-logo.svg" alt=""><div><div class="p-head__kicker" data-edit="ge-kick">${esc(state.kicker)}</div>${title?`<div class="p-head__title" data-edit="ge-title">${esc(state.title)}</div>`:''}</div></div>${tagHTML()}</div>`;
  const bgHTML = (w,h,pitch) => `${state.photo ? `<div class="poster__bgimg" style="background-image:url('${state.photo}')"></div>` : ''}${pitch?`<div class="poster__pitch" style="color:var(--a2)">${pitchSVG(w,h)}</div>`:''}<div class="poster__stripe" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;
  const footHTML = txt => `<div class="p-foot"><div class="p-foot__src">${esc(txt)}</div><div class="p-foot__by">seattlesports.org</div></div>`;
  const figBlock = (id, cls, edit) => { const f = byId[id]; return `<div class="${cls}" data-fig="${id}" ${edit?`data-edit="${edit}"`:''}><div class="${cls}__v">${heroHTML(f.value)}</div><div class="${cls}__l">${esc(f.label)}</div>${f.sub?`<div class="${cls}__s">${esc(f.sub)}</div>`:''}</div>`; };
  const quoteHTML = (q, cls) => `<figure class="${cls}" data-edit="ge-q"><blockquote class="${cls}__t">\u201c${esc(q.text)}\u201d</blockquote><figcaption class="${cls}__by"><b>${esc(q.who)}</b><span>${esc(q.role)}</span></figcaption></figure>`;

  function renderOther(){
    const s = state, fmt = poster.dataset.format, [w,h] = DIMS[fmt];
    let body = '', foot = srcText(slideKeys(s)), head = headHTML(true), pitch = false;
    if (s.type === 'cover'){
      head = headHTML(false); pitch = true;
      body = `<h1 class="c-title" data-edit="ge-cover">${esc(s.cover)}</h1>${s.sub?`<div class="c-sub" data-edit="ge-sub">${esc(s.sub)}</div>`:''}
        ${s.fig?`<div class="c-fig" data-edit="ge-fig"><div class="c-fig__v">${heroHTML(byId[s.fig].value)}</div><div class="c-fig__l">${esc(s.figLabel ?? byId[s.fig].label)}</div></div>`:''}
        ${s.cue?`<div class="c-cue" data-edit="ge-cue">${esc(s.cue)}</div>`:''}`;
      if (!s.fig) foot = '';
    } else if (s.type === 'spot'){
      const f = byId[s.fig];
      body = `<div class="s-main" data-edit="ge-fig"><div class="s-eyebrow">${esc((KIT.cats.find(c=>c.id===f.cat)||{}).label || 'By the numbers')}</div>
          <div class="s-v">${heroHTML(f.value)}</div><div class="s-l">${esc(s.label ?? f.label)}</div>${(s.sub ?? f.sub)?`<div class="s-sub">${esc(s.sub ?? f.sub)}</div>`:''}</div>
        <div class="s-side"><p class="s-cap" data-edit="ge-cap">${esc(s.caption ?? f.caption)}</p>
          ${s.quote!=null ? quoteHTML(QQ[s.quote], 's-q') : ''}
          ${s.support.length ? `<div class="s-row" style="--n:${s.support.length}">${s.support.map(id => figBlock(id,'s-sup')).join('')}</div>` : ''}</div>`;
    } else if (s.type === 'quote'){
      const q = QQ[s.q];
      body = `<div class="q-mark" aria-hidden="true">\u201c</div><blockquote class="q-text" data-edit="ge-q">${esc(q.text)}</blockquote>
        <div class="q-by"><div class="q-who">${esc(q.who)}</div><div class="q-role">${esc(q.role)}</div></div>
        ${s.fig ? figBlock(s.fig,'q-fig','ge-fig') : ''}`;
    } else if (s.type === 'story'){
      const T = TK[s.tk];
      body = `<div class="t-main"><div class="t-eyebrow">What the numbers say</div><h2 class="t-h" data-edit="ge-head">${esc(s.head ?? T.t)}</h2><p class="t-b" data-edit="ge-body">${esc(s.body ?? T.text)}</p></div>
        ${s.figs.length ? `<div class="t-figs" style="--n:${s.figs.length}">${s.figs.map(id => figBlock(id,'t-fig')).join('')}</div>` : ''}`;
    } else if (s.type === 'trail'){
      body = `<h2 class="r-h" data-edit="ge-head">${esc(s.head)}</h2>
        <div class="r-row" style="--n:${s.figs.length}">${s.figs.map((id,i) => `${i?'<div class="r-arrow" aria-hidden="true">→</div>':''}${figBlock(id,'r-fig')}`).join('')}</div>
        ${s.note?`<p class="r-note" data-edit="ge-note">${esc(s.note)}</p>`:''}`;
    } else if (s.type === 'close'){
      pitch = true; head = headHTML(false);
      const keys = deckKeys();
      body = `<img class="z-logo" src="assets/ssc-logo.svg" alt=""><h2 class="z-h" data-edit="ge-head">${esc(s.head)}</h2>${s.body?`<p class="z-b" data-edit="ge-body">${esc(s.body)}</p>`:''}
        ${keys.length?`<ul class="z-src">${keys.map(k => `<li><b>${esc(S[k].short)}</b><span>${esc(shortUrl(S[k].url))}</span></li>`).join('')}</ul>`:''}
        ${s.cta?`<div class="z-cta" data-edit="ge-cta">${esc(s.cta)}</div>`:''}`;
      foot = '';
    }
    poster.innerHTML = `${bgHTML(w,h,pitch)}${head}<div class="p-body p-body--${s.type}">${body}</div>${footHTML(foot)}`;
    fitOther();
  }

  // Auto-fit for every non-hub layout: apply the size setting, fit big numbers to their width, then shrink until it fits.
  function scaleTree(el, r){ [el, ...el.querySelectorAll('*')].forEach(n => { const v = parseFloat(n.style.fontSize || getComputedStyle(n).fontSize); n.style.fontSize = (v*r) + 'px'; }); }
  function fitOther(){
    const k = (state.size || 100) / 100;
    const body = $('#poster .p-body'), foot = $('#poster .p-foot');
    const txt = $$('#poster .p-body *, #poster .p-foot__src, #poster .p-head__title');
    txt.forEach(el => { el.style.fontSize = ''; });
    txt.forEach(el => { el.dataset.fs = parseFloat(getComputedStyle(el).fontSize); });
    const apply = f => txt.forEach(el => { el.style.fontSize = (el.dataset.fs * f * (el.closest('.p-body') ? k : 1)) + 'px'; });
    const fitWidth = () => $$('#poster .p-body [class$="__v"], #poster .p-body .s-v, #poster .c-title, #poster .p-head__title').forEach(el => {
      const box = el.parentElement, cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      let g = 0;
      while (el.scrollWidth > avail + 1 && parseFloat(getComputedStyle(el).fontSize) > 14 && g++ < 60) scaleTree(el, 0.95);
    });
    apply(1); fitWidth();
    const limit = () => poster.clientHeight - parseFloat(getComputedStyle(poster).paddingBottom) + 1;
    const over = () => body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1 || foot.offsetTop + foot.offsetHeight > limit();
    let f = 1, g = 0;
    while (over() && f > 0.42 && g++ < 30){ f *= 0.94; apply(f); fitWidth(); }
    poster.classList.toggle('is-tight', over());
  }

  // ---- deck strip ----
  const strip = $('#deckStrip');
  function snapCurrent(){ snaps.set(state, poster.innerHTML); }
  function thumbHTML(s, i){
    const [w,h] = DIMS[poster.dataset.format], tw = 116, sc = tw / w;
    return `<li class="th ${i===deck.cur?'is-cur':''}" data-i="${i}" draggable="true">
      <button type="button" class="th__pick" data-pick="${i}" aria-label="Slide ${i+1}: ${TYPE_NAME[s.type]}" aria-current="${i===deck.cur}">
        <span class="th__frame" style="width:${tw}px;height:${Math.round(h*sc)}px"><span class="th__canvas poster" data-format="${poster.dataset.format}" data-theme="${poster.dataset.theme}" data-type="${s.type}" style="transform:scale(${sc})">${snaps.get(s) || ''}</span></span>
        <span class="th__meta"><b>${i+1}</b> ${TYPE_NAME[s.type]}</span>
      </button></li>`;
  }
  function renderDeck(){
    strip.innerHTML = deck.slides.map(thumbHTML).join('') +
      `<li class="th th--add"><button type="button" class="th__new" data-open-add aria-label="Add a slide"><span>+</span>Add slide</button></li>`;
    const n = deck.slides.length;
    $('#deckCount').textContent = n === 1 ? 'Single graphic' : `${n}-slide carousel`;
    $('#deckTools').innerHTML = `<span class="dt-name">Slide ${deck.cur+1} of ${n} · <b>${TYPE_NAME[state.type]}</b></span>
      <span class="dt-btns">
        <button type="button" class="gi-btn" data-deck="left" ${deck.cur===0?'disabled':''} aria-label="Move slide left">← Move</button>
        <button type="button" class="gi-btn" data-deck="right" ${deck.cur===n-1?'disabled':''} aria-label="Move slide right">Move →</button>
        <button type="button" class="gi-btn" data-deck="dup">Duplicate</button>
        <button type="button" class="gi-btn gi-btn--x" data-deck="del" ${n===1?'disabled':''}>Delete</button>
      </span>`;
    $('#zipBtn').textContent = n > 1 ? `All ${n} slides · ZIP` : 'Slide · ZIP with caption & alt text';
    $('#pdfBtn').textContent = n > 1 ? `LinkedIn carousel · PDF (${n} pages)` : 'PDF';
    const cur = strip.querySelector('.th.is-cur'); if (cur && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = Math.max(0, cur.offsetLeft - strip.clientWidth/2 + cur.offsetWidth/2);
  }
  function updateThumb(){
    const li = strip.querySelector(`.th[data-i="${deck.cur}"] .th__canvas`); if (li) { li.innerHTML = snaps.get(state) || ''; li.dataset.type = state.type; }
  }
  function select(i){
    deck.cur = Math.max(0, Math.min(i, deck.slides.length-1)); state = deck.slides[deck.cur];
    $('#photoClear').hidden = !state.photo;
    renderPoster(); renderDeck();
  }
  function snapAll(){
    const keep = deck.cur;
    deck.slides.forEach((s,i) => { deck.cur = i; state = s; renderPoster(true); });
    deck.cur = keep; state = deck.slides[keep]; renderPoster(); renderDeck();
  }
  window.__snapAll = snapAll;
  strip.addEventListener('click', e => {
    const p = e.target.closest('[data-pick]'); if (p) { select(+p.dataset.pick); return; }
    if (e.target.closest('[data-open-add]')) openAdd(e.target.closest('[data-open-add]'));
  });
  let dragSlide = null;
  strip.addEventListener('dragstart', e => { const li = e.target.closest('.th[data-i]'); if (!li) return; dragSlide = +li.dataset.i; e.dataTransfer.effectAllowed = 'move'; try{ e.dataTransfer.setData('text/plain','s'+dragSlide); }catch(_){} li.classList.add('is-drag'); });
  strip.addEventListener('dragover', e => { if (dragSlide === null) return; const li = e.target.closest('.th[data-i]'); if (!li) return; e.preventDefault(); $$('.th', strip).forEach(x => x.classList.toggle('is-over', x === li)); });
  strip.addEventListener('dragend', () => { dragSlide = null; $$('.th', strip).forEach(x => x.classList.remove('is-over','is-drag')); });
  strip.addEventListener('drop', e => {
    const li = e.target.closest('.th[data-i]'); if (!li || dragSlide === null) return; e.preventDefault();
    const to = +li.dataset.i, s = deck.slides.splice(dragSlide,1)[0]; deck.slides.splice(to,0,s);
    deck.cur = deck.slides.indexOf(state); dragSlide = null; snapAll(); say(`Moved to slide ${to+1}`);
  });
  $('#deckTools').addEventListener('click', e => {
    const b = e.target.closest('[data-deck]'); if (!b) return;
    const a = deck.slides, i = deck.cur, act = b.dataset.deck;
    if (act === 'left' && i > 0) { [a[i-1],a[i]] = [a[i],a[i-1]]; deck.cur--; }
    if (act === 'right' && i < a.length-1) { [a[i+1],a[i]] = [a[i],a[i+1]]; deck.cur++; }
    if (act === 'dup') { a.splice(i+1, 0, clone(state)); deck.cur++; say('Slide duplicated'); }
    if (act === 'del' && a.length > 1) { a.splice(i,1); deck.cur = Math.min(i, a.length-1); say('Slide deleted'); }
    state = a[deck.cur]; snapAll();
  });
  // add-slide menu
  const menu = $('#addMenu');
  menu.innerHTML = TYPE_ORDER.map(t => `<button type="button" role="menuitem" data-add="${t}"><b>${TYPE_NAME[t]}</b><span>${TYPE_DESC[t]}</span></button>`).join('');
  function openAdd(anchor){
    const open = menu.hidden; menu.hidden = !open; $('#addSlideBtn').setAttribute('aria-expanded', open);
    if (open) { const first = menu.querySelector('button'); first && first.focus(); }
  }
  $('#addSlideBtn').addEventListener('click', e => { e.stopPropagation(); openAdd(); });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#addMenu') && !e.target.closest('#addSlideBtn') && !e.target.closest('[data-open-add]')) { menu.hidden = true; $('#addSlideBtn').setAttribute('aria-expanded','false'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; $('#addSlideBtn').focus(); } });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const t = b.dataset.add, used = new Set(deck.slides.filter(s => s.type==='quote').map(s => s.q)), usedT = new Set(deck.slides.filter(s => s.type==='story').map(s => s.tk));
    const s = t === 'quote' ? MAKE.quote({ q: Math.max(0, QQ.findIndex((_,i) => !used.has(i))) })
            : t === 'story' ? MAKE.story({ tk: Math.max(0, TK.findIndex((_,i) => !usedT.has(i))) })
            : MAKE[t]();
    if (t !== 'hub') { s.kicker = state.kicker; s.title = state.title; }
    deck.slides.splice(deck.cur+1, 0, s); deck.cur++; state = s;
    menu.hidden = true; $('#addSlideBtn').setAttribute('aria-expanded','false');
    snapAll(); say(`${TYPE_NAME[t]} slide added`);
    $('#studio').scrollIntoView({ behavior:'smooth', block:'start' });
  });
  $('#deckReco').addEventListener('click', () => {
    if (deck.slides.length > 1 && !confirm('Replace the current slides with the recommended 10-slide carousel?')) return;
    const keep = poster.dataset.format;
    deck.slides = RECO(); deck.cur = 0; state = deck.slides[0];
    if (keep === 'banner') { poster.dataset.format = 'feed'; $$('#fmtSeg button').forEach(x => x.setAttribute('aria-checked', x.dataset.fmt==='feed')); }
    snapAll(); say('Recommended carousel ready: 10 slides');
  });
  $('#deckSingle').addEventListener('click', () => {
    if (deck.slides.length > 1 && !confirm('Go back to a single impact graphic? Your other slides will be removed.')) return;
    deck.slides = [MAKE.hub()]; deck.cur = 0; state = deck.slides[0]; snapAll(); say('Back to a single graphic');
  });
  $('#deckNums').addEventListener('change', e => { deck.nums = e.target.checked; snapAll(); });

  // ---- editor for non-hub slides ----
  const field = (id, label, val, k, opts={}) => `<label class="ge-lab" for="${id}">${label}${opts.note?` <em>${opts.note}</em>`:''}</label>${opts.area
    ? `<textarea id="${id}" data-k="${k}" rows="${opts.rows||3}">${esc(val ?? '')}</textarea>`
    : `<input id="${id}" data-k="${k}" value="${esc(val ?? '')}" ${opts.ph?`placeholder="${esc(opts.ph)}"`:''}>`}`;
  const figSel = (id, label, sel, k, none) => `<label class="ge-lab" for="${id}">${label}</label><select id="${id}" data-k="${k}">${none?`<option value="" ${!sel?'selected':''}>None</option>`:''}${figOptions(sel||'', new Set())}</select>`;
  const quoteSel = (id, label, sel, k, none) => `<label class="ge-lab" for="${id}">${label}</label><select id="${id}" data-k="${k}" data-num>${none?`<option value="" ${sel==null?'selected':''}>None</option>`:''}${QQ.map((q,i) => `<option value="${i}" ${sel===i?'selected':''}>${esc(q.who)}: \u201c${esc(q.text.slice(0,54))}\u2026\u201d</option>`).join('')}</select>`;
  function listEd(key, label, max, min=0){
    const arr = state[key], inUse = new Set(arr);
    return `<div class="ge-head"><span class="ge-lab">${label} <b>${arr.length} / ${max}</b></span></div>
      <ol class="ge-list">${arr.map((id,i) => `<li class="gl-row"><span class="gi-v">${esc(byId[id].value)}</span><span class="gi-l">${esc(byId[id].label)}</span>
        <span class="gl-btns"><button type="button" class="gi-btn" data-list="${key}" data-op="up" data-i="${i}" ${i===0?'disabled':''} aria-label="Move up">↑</button><button type="button" class="gi-btn" data-list="${key}" data-op="down" data-i="${i}" ${i===arr.length-1?'disabled':''} aria-label="Move down">↓</button><button type="button" class="gi-btn gi-btn--x" data-list="${key}" data-op="rm" data-i="${i}" ${arr.length<=min?'disabled':''} aria-label="Remove ${esc(byId[id].label)}">×</button></span></li>`).join('')}</ol>
      ${arr.length < max ? `<label class="sr-only" for="add-${key}">Add a figure</label><select id="add-${key}" data-list-add="${key}"><option value="">+ Add a figure (all ${KIT.stats.length})…</option>${figOptions('', inUse)}</select>` : `<p class="hint">This layout holds up to ${max}. Remove one to add another.</p>`}`;
  }
  function renderOtherEditor(){
    const s = state, T = s.type, blk = x => `<div class="ge-block">${x}</div>`;
    let h = blk(`<p class="ge-type"><b>${TYPE_NAME[T]}</b> ${TYPE_DESC[T]}</p>`);
    if (T === 'cover') h += blk(field('ge-cover','Cover headline',s.cover,'cover') + field('ge-sub','Subhead',s.sub,'sub') + figSel('ge-fig','Featured figure',s.fig,'fig',true) + (s.fig ? field('ge-figLabel','Figure label',s.figLabel ?? byId[s.fig].label,'figLabel') : '') + field('ge-cue','Swipe cue',s.cue,'cue',{ph:'Leave blank to hide'}));
    if (T === 'spot') { const f = byId[s.fig];
      h += blk(figSel('ge-fig','Spotlight figure',s.fig,'fig') + field('ge-label','Label',s.label ?? f.label,'label') + field('ge-subl','Detail line',s.sub ?? f.sub,'sub') + field('ge-cap','Caption',s.caption ?? f.caption,'caption',{area:true,note:'source wording'}) +
        `<p class="hint gi-src">Source: <a href="${S[f.src].url}" target="_blank" rel="noopener">${esc(S[f.src].short)} ↗</a>${(s.label!==null||s.sub!==null||s.caption!==null)?` · <button type="button" class="btn--text gi-restore" data-restore="label,sub,caption">Restore original wording</button>`:''}</p>`);
      h += blk(listEd('support','Supporting figures',3)); h += blk(quoteSel('ge-q','Add a quote (optional)',s.quote,'quote',true)); }
    if (T === 'quote') { const q = QQ[s.q];
      h += blk(quoteSel('ge-q','Quote',s.q,'q',false) + `<p class="hint">Quotes appear word for word and can't be edited. Source: <a href="${S[q.src].url}" target="_blank" rel="noopener">${esc(S[q.src].short)} ↗</a></p>` + figSel('ge-fig','Pair with a figure (optional)',s.fig,'fig',true)); }
    if (T === 'story') { const t = TK[s.tk];
      h += blk(`<label class="ge-lab" for="ge-tk">Takeaway</label><select id="ge-tk" data-k="tk" data-num>${TK.map((x,i) => `<option value="${i}" ${i===s.tk?'selected':''}>${i+1}. ${esc(x.t)}</option>`).join('')}</select>` +
        field('ge-head','Headline',s.head ?? t.t,'head') + field('ge-body','Story text',s.body ?? t.text,'body',{area:true,rows:4}) +
        `<p class="hint gi-src">Source: ${t.srcs.map(k => `<a href="${S[k].url}" target="_blank" rel="noopener">${esc(S[k].short)} ↗</a>`).join(' ')}${(s.head!==null||s.body!==null)?` · <button type="button" class="btn--text gi-restore" data-restore="head,body">Restore original wording</button>`:''}</p>`);
      h += blk(listEd('figs','Figures that back it up',4)); }
    if (T === 'trail') h += blk(field('ge-head','Headline',s.head,'head') + listEd('figs','Figures, in order',4,2) + field('ge-note','Note under the figures',s.note,'note',{area:true,note:'optional'}) + `<p class="hint">Keep the note in the source's words. The default comes from <a href="${S.VS.url}" target="_blank" rel="noopener">Visit Seattle ↗</a>.</p>`);
    if (T === 'close') h += blk(field('ge-head','Headline',s.head,'head') + field('ge-body','Text',s.body,'body',{area:true}) + field('ge-cta','Call to action',s.cta,'cta') + `<p class="hint">The source list updates automatically from every slide in the carousel.</p>`);
    h += blk(field('ge-kick','Kicker',s.kicker,'kicker') + (T==='cover'||T==='close' ? '' : field('ge-title','Header title',s.title,'title')) +
      `<label class="ge-lab" for="ge-size">Text size <output id="ge-sizeOut">${s.size}%</output></label><input type="range" id="ge-size" min="80" max="120" step="5" value="${s.size}">`);
    if (poster.classList.contains('is-tight')) h = `<p class="ge-warn" role="status">This slide is crowded. Remove a figure, shorten the text or lower the text size.</p>` + h;
    $('#slotEditor').innerHTML = h;
    bindOther();
  }
  let typing2;
  function liveRerender(){
    clearTimeout(typing2);
    typing2 = setTimeout(() => { const a = document.activeElement, id = a && a.id, pos = a && a.selectionStart; renderPoster(); const el = id && document.getElementById(id); if (el){ el.focus(); try{ el.setSelectionRange(pos,pos);}catch(_){} } }, 250);
  }
  function bindOther(){
    const s = state;
    $$('#slotEditor [data-k]').forEach(el => {
      const k = el.dataset.k;
      if (el.tagName === 'SELECT') el.onchange = () => {
        const v = el.value === '' ? null : (el.hasAttribute('data-num') ? +el.value : el.value);
        s[k] = v;
        if (k === 'tk') { s.head = null; s.body = null; s.figs = [...TK[v].figs]; }
        if (k === 'fig' && s.type === 'spot') { s.label = s.sub = s.caption = null; s.support = s.support.filter(x => x !== v); }
        if (k === 'fig' && s.type === 'cover') s.figLabel = null;
        renderPoster();
      };
      else el.oninput = () => { s[k] = el.value; liveRerender(); };
    });
    $$('#slotEditor [data-list]').forEach(b => b.onclick = () => {
      const a = s[b.dataset.list], i = +b.dataset.i, op = b.dataset.op;
      if (op === 'up' && i > 0) [a[i-1],a[i]] = [a[i],a[i-1]];
      if (op === 'down' && i < a.length-1) [a[i+1],a[i]] = [a[i],a[i+1]];
      if (op === 'rm') a.splice(i,1);
      renderPoster();
    });
    $$('#slotEditor [data-list-add]').forEach(sel => sel.onchange = () => { if (!sel.value) return; s[sel.dataset.listAdd].push(sel.value); renderPoster(); say('Added. The layout adjusted to fit.'); });
    $$('#slotEditor [data-restore]').forEach(b => b.onclick = () => { b.dataset.restore.split(',').forEach(k => s[k] = null); renderPoster(); });
    const sz = $('#ge-size'); if (sz) sz.oninput = e => { s.size = +e.target.value; $('#ge-sizeOut').textContent = s.size + '%'; fitOther(); snapCurrent(); updateThumb(); };
  }
  // click any element on a slide to jump to its control
  poster.addEventListener('click', e => {
    if (state.type === 'hub') return;
    const el = e.target.closest('[data-edit]'); if (!el) return;
    const c = document.getElementById(el.dataset.edit); if (c) { c.scrollIntoView({ block:'nearest', behavior:'smooth' }); c.focus({ preventScroll:true }); c.classList.add('flash'); setTimeout(()=>c.classList.remove('flash'), 900); }
  });

  $('#slotReset').addEventListener('click', () => {
    const fresh = state.type === 'quote' ? MAKE.quote({ q:state.q }) : state.type === 'story' ? MAKE.story({ tk:state.tk }) : MAKE[state.type]();
    deck.slides[deck.cur] = state = fresh; renderPoster(); renderDeck(); say('Slide reset to the recommended setup');
  });

  // ---- data bank cards: show where each figure is and add it to the current slide ----
  const FMT_NAME = { feed:'Feed', square:'Square', story:'Story', banner:'Web banner' };
  const multi = () => deck.slides.length > 1;
  window.__graphicStatus = id => {
    const hits = [];
    deck.slides.forEach((s,i) => {
      const n = multi() ? `Slide ${i+1}` : '';
      if (s.type === 'hub') {
        if (s.hero === id) return hits.push({ i, primary:true, where: n ? `${n} · Center` : 'Center' });
        if (!s.items.some(x => x.id === id)) return;
        if (s === state && lastLayout) { const z = ZONES.find(k => lastLayout.out[k].some(it => it.id === id)); if (!z) return hits.push({ i, hidden:true, where:`${n?n+' · ':''}Won't fit in ${FMT_NAME[poster.dataset.format]}` }); return hits.push({ i, where: n ? `${n} · ${ZONE_NAME[z]}` : ZONE_NAME[z] }); }
        return hits.push({ i, where: n || 'On the graphic' });
      }
      if ((s.type === 'spot' || s.type === 'cover') && s.fig === id) return hits.push({ i, primary:true, where: n ? `${n} · Main figure` : 'Main figure' });
      if (slideIds(s).includes(id)) hits.push({ i, where: n || TYPE_NAME[s.type] });
    });
    if (!hits.length) return { on:false };
    const here = hits.find(h => h.i === deck.cur) || hits[0];
    return { on:true, hidden:!!here.hidden, primary:hits.every(h => h.primary), where: hits.length > 1 ? hits.map(h => h.where.replace(/ · .*/,'')).join(', ') : here.where };
  };
  window.__addToGraphic = id => {
    const s = state;
    // remove from every slide where it is a supporting figure
    const removable = deck.slides.filter(x => (x.type==='hub' && x.items.some(i => i.id===id)) || (x.type==='spot' && x.support.includes(id)) || ((x.type==='story'||x.type==='trail') && x.figs.includes(id)) || (x.type==='quote' && x.fig===id));
    if (removable.length) {
      removable.forEach(x => {
        if (x.type==='hub') x.items = x.items.filter(i => i.id !== id);
        if (x.type==='spot') x.support = x.support.filter(i => i !== id);
        if (x.type==='story'||x.type==='trail') { if (x.type==='trail' && x.figs.length <= 2) return; x.figs = x.figs.filter(i => i !== id); }
        if (x.type==='quote') x.fig = null;
      });
      renderPoster(); if (multi()) snapAll(); say('Removed from the graphic'); return;
    }
    if (s.type === 'hub') { if (s.hero === id) return say('This is the center figure. Change it in the editor first.'); s.items.push({ id, zone:'auto', label:null, sub:null }); }
    else if (s.type === 'spot') { if (s.fig === id) return; if (s.support.length >= 3) return say('This spotlight holds three supporting figures. Remove one first.'); s.support.push(id); }
    else if (s.type === 'story') { if (s.figs.length >= 4) return say('This slide holds four figures. Remove one first.'); s.figs.push(id); }
    else if (s.type === 'trail') { if (s.figs.length >= 4) return say('The timeline holds four figures. Remove one first.'); s.figs.push(id); }
    else if (s.type === 'quote' || s.type === 'cover') { s.fig = id; if (s.type==='cover') s.figLabel = null; }
    else return say('Pick a slide with figures to add this one.');
    renderPoster();
    const st = window.__graphicStatus(id);
    say(st.hidden ? `Added, but it won't fit in this format. Remove a figure to make room.` : `Added to slide ${deck.cur+1}, ${TYPE_NAME[s.type].toLowerCase()}`);
  };

  // photo (per slide)
  $('#photoIn').addEventListener('change', e => {
    const f = e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = () => { state.photo = rd.result; $('#photoClear').hidden = false; renderPoster(); };
    rd.readAsDataURL(f);
  });
  $('#photoClear').addEventListener('click', () => { state.photo = null; $('#photoIn').value=''; $('#photoClear').hidden = true; renderPoster(); });

  // ---- alt text & post caption ----
  function altFor(s){
    const t = `Graphic from the Seattle Sports Commission`;
    const lc = x => /^[A-Z][a-z]/.test(x) ? x[0].toLowerCase()+x.slice(1) : x;
    const figs = ids => ids.map(id => `${byId[id].value} ${lc(byId[id].label)}`).join('; ');
    if (s.type === 'hub') {
      const keep = state; state = s; const L = layout(poster.dataset.format), hb = heroBits(); state = keep;
      const ids = ZONES.flatMap(k => L.out[k].map(it => it.id));
      return `${t} titled "${s.title}." In the center: ${byId[s.hero].value}, ${lc(hb.label)}${hb.sub?' '+hb.sub:''}. Around it: ${figs(ids)}.${s.quote!=null?` Quote from ${QQ[s.quote].who}: "${QQ[s.quote].text}"`:''} ${srcText(slideKeys(s))}`;
    }
    if (s.type === 'cover') return `${t}: cover slide reading "${s.cover}."${s.sub?' '+s.sub+'.':''}${s.fig?` Featured figure: ${byId[s.fig].value}, ${lc((s.figLabel ?? byId[s.fig].label))}.`:''}`;
    if (s.type === 'spot') { const f = byId[s.fig]; return `${t}: ${f.value}, ${lc((s.label ?? f.label))}. ${s.caption ?? f.caption}${s.support.length?` Also shown: ${figs(s.support)}.`:''}${s.quote!=null?` Quote from ${QQ[s.quote].who}: "${QQ[s.quote].text}"`:''} ${srcText(slideKeys(s))}`; }
    if (s.type === 'quote') { const q = QQ[s.q]; return `${t}: quote from ${q.who}, ${q.role}: "${q.text}"${s.fig?` Paired figure: ${byId[s.fig].value} ${lc(byId[s.fig].label)}.`:''} ${srcText(slideKeys(s))}`; }
    if (s.type === 'story') { const T = TK[s.tk]; return `${t}: "${s.head ?? T.t}" ${s.body ?? T.text}${s.figs.length?` Figures: ${figs(s.figs)}.`:''} ${srcText(slideKeys(s))}`; }
    if (s.type === 'trail') return `${t}: ${s.head}. ${s.figs.map(id => `${byId[id].value} (${byId[id].label}${byId[id].sub?', '+byId[id].sub:''})`).join(', then ')}.${s.note?' '+s.note:''} ${srcText(slideKeys(s))}`;
    if (s.type === 'close') return `${t}: closing slide, "${s.head}." Sources listed: ${deckKeys().map(k => S[k].short).join(', ')}. ${s.cta||''}`;
    return t;
  }
  function altAll(){ return deck.slides.length === 1 ? altFor(deck.slides[0]) : deck.slides.map((s,i) => `Slide ${i+1}: ${altFor(s)}`).join('\n\n'); }
  function postCaption(){
    const lines = [];
    deck.slides.forEach(s => {
      if (s.type === 'hub') lines.push(byId[s.hero].caption);
      if (s.type === 'spot') lines.push(s.caption ?? byId[s.fig].caption);
      if (s.type === 'story') lines.push(s.head ?? TK[s.tk].t);
      if (s.type === 'quote') lines.push(`\u201c${QQ[s.q].text}\u201d \u2014 ${QQ[s.q].who}`);
      if (s.type === 'trail') lines.push(`${s.head}: ${s.figs.map(id => `${byId[id].value} (${byId[id].sub || byId[id].label})`).join(' \u2192 ')}`);
    });
    const head = deck.slides[0].type === 'cover' ? deck.slides[0].cover : (deck.slides[0].title || "Seattle's World Cup, by the numbers");
    return [head, '', ...[...new Set(lines)], '', srcText(deckKeys()), '', 'seattlesports.org'].join('\n');
  }
  $('#altBtn').addEventListener('click', () => copy(deck.slides.length > 1 ? altAll() : altFor(state)));
  $('#capBtn').addEventListener('click', () => copy(postCaption()));

  // ---- export: PNG, ZIP, PDF, share ----
  const msg = $('#exportMsg');
  const fileName = (i, ext) => { const s = deck.slides[i], tag = s.type === 'hub' ? byId[s.hero].value : s.type === 'spot' ? byId[s.fig].value : s.type === 'quote' ? QQ[s.q].who : TYPE_NAME[s.type]; return `SSC-World-Cup-${String(i+1).padStart(2,'0')}-${tag.replace(/[^\w.]+/g,'-').replace(/^-|-$/g,'')}-${poster.dataset.format}.${ext}`; };
  async function capture(kind){
    const [w,h] = DIMS[poster.dataset.format];
    await document.fonts.ready;
    const opts = { width:w, height:h, pixelRatio:1, cacheBust:true };
    if (!window.__pngWarm){ await htmlToImage.toPng(poster, opts); await htmlToImage.toPng(poster, opts); window.__pngWarm = true; }
    return kind === 'jpg' ? htmlToImage.toJpeg(poster, { ...opts, quality:0.94, backgroundColor:getComputedStyle(poster).backgroundColor }) : htmlToImage.toPng(poster, opts);
  }
  const bytes = url => { const b = atob(url.split(',')[1]), u = new Uint8Array(b.length); for (let i=0;i<b.length;i++) u[i] = b.charCodeAt(i); return u; };
  const tick = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
  async function eachSlide(fn){
    const keep = deck.cur;
    try { for (let i=0;i<deck.slides.length;i++){ deck.cur = i; state = deck.slides[i]; renderPoster(true); await tick(); msg.textContent = `Rendering slide ${i+1} of ${deck.slides.length}…`; await fn(i); } }
    finally { deck.cur = keep; state = deck.slides[keep]; renderPoster(); renderDeck(); }
  }
  function download(blobOrUrl, name){
    const a = document.createElement('a'); const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  // minimal ZIP (stored, no compression)
  const CRC = (() => { const t = new Uint32Array(256); for (let n=0;n<256;n++){ let c=n; for (let k=0;k<8;k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1; t[n]=c>>>0; } return t; })();
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i=0;i<u.length;i++) c = CRC[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; };
  function zip(files){
    const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
    files.forEach(f => {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x0800,true); h.setUint16(8,0,true); h.setUint16(10,0,true); h.setUint16(12,0x5021,true);
      h.setUint32(14,crc,true); h.setUint32(18,data.length,true); h.setUint32(22,data.length,true); h.setUint16(26,name.length,true); h.setUint16(28,0,true);
      parts.push(h.buffer, name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint16(8,0x0800,true); c.setUint16(10,0,true); c.setUint16(12,0,true); c.setUint16(14,0x5021,true);
      c.setUint32(16,crc,true); c.setUint32(20,data.length,true); c.setUint32(24,data.length,true); c.setUint16(28,name.length,true); c.setUint32(42,off,true);
      cen.push(c.buffer, name);
      off += 30 + name.length + data.length;
    });
    const cenSize = cen.reduce((a,b) => a + (b.byteLength ?? b.length), 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true); e.setUint32(12,cenSize,true); e.setUint32(16,off,true);
    return new Blob([...parts, ...cen, e.buffer], { type:'application/zip' });
  }
  // minimal PDF: one full-bleed JPEG per page
  function pdf(jpegs, w, h, title){
    const enc = new TextEncoder(), chunks = [], offs = []; let len = 0;
    const push = x => { const u = typeof x === 'string' ? enc.encode(x) : x; chunks.push(u); len += u.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    const W = (w*0.75).toFixed(2), H = (h*0.75).toFixed(2), N = jpegs.length;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Count ${N} /Kids [${jpegs.map((_,i) => `${4+i*3} 0 R`).join(' ')}] >>`));
    obj(3, () => push(`<< /Title (${title.replace(/[()\\]/g,'')}) /Producer (SSC World Cup Impact Kit) >>`));
    jpegs.forEach((j,i) => {
      const p = 4+i*3;
      obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${i} ${p+1} 0 R >> >> /Contents ${p+2} 0 R >>`));
      obj(p+1, () => { push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.length} >>\nstream\n`); push(j); push('\nendstream'); });
      const cs = `q ${W} 0 0 ${H} 0 0 cm /Im${i} Do Q`;
      obj(p+2, () => push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
    });
    const xref = len, total = 4 + N*3;
    push(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let n=1;n<total;n++) push(String(offs[n]).padStart(10,'0') + ' 00000 n \n');
    push(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks, { type:'application/pdf' });
  }
  const busy = (on) => $$('#exportBtn,#zipBtn,#pdfBtn,#shareBtn').forEach(b => b.disabled = on);
  const fail = err => { console.error(err); msg.textContent = 'Export was blocked in this view. Open the kit in its own browser tab and try again.'; };
  $('#exportBtn').addEventListener('click', async () => {
    busy(true); msg.textContent = 'Rendering full-resolution PNG…';
    try { const url = await capture('png'); download(url, fileName(deck.cur,'png')); const [w,h] = DIMS[poster.dataset.format]; msg.textContent = `Downloaded slide ${deck.cur+1} as a ${w}×${h}px PNG.`; }
    catch(err){ fail(err); } finally { busy(false); }
  });
  $('#zipBtn').addEventListener('click', async () => {
    busy(true);
    try {
      const files = [];
      await eachSlide(async i => { files.push({ name:fileName(i,'png'), data:bytes(await capture('png')) }); });
      files.push({ name:'post-caption.txt', data:postCaption() }, { name:'alt-text.txt', data:altAll() });
      download(zip(files), `SSC-World-Cup-carousel-${poster.dataset.format}.zip`);
      msg.textContent = `Downloaded ${deck.slides.length} PNG${deck.slides.length>1?'s':''} in order, plus the post caption and alt text, in one ZIP.`;
    } catch(err){ fail(err); } finally { busy(false); }
  });
  $('#pdfBtn').addEventListener('click', async () => {
    busy(true);
    try {
      const jp = []; const [w,h] = DIMS[poster.dataset.format];
      await eachSlide(async () => { jp.push(bytes(await capture('jpg'))); });
      download(pdf(jp, w, h, "Seattle's World Cup, by the numbers"), `SSC-World-Cup-carousel-${poster.dataset.format}.pdf`);
      msg.textContent = `Downloaded a ${jp.length}-page PDF. On LinkedIn, start a post and add it as a document.`;
    } catch(err){ fail(err); } finally { busy(false); }
  });
  // Share sheet (phones and some desktops): prepare files first, then share on the next tap so the browser allows it
  let shareFiles = null;
  const canShareFiles = (() => { try { return !!(navigator.canShare && navigator.canShare({ files:[new File([new Uint8Array(1)], 't.png', { type:'image/png' })] })); } catch(_) { return false; } })();
  const shareBtn = $('#shareBtn');
  if (canShareFiles) { shareBtn.hidden = false; $('#shareHint').hidden = false; }
  shareBtn.addEventListener('click', async () => {
    if (shareFiles) {
      try { await navigator.share({ files:shareFiles, title:"Seattle's World Cup, by the numbers", text:postCaption() }); msg.textContent = 'Shared.'; }
      catch(err){ if (err && err.name !== 'AbortError') fail(err); }
      shareFiles = null; shareBtn.textContent = 'Share to Instagram, Facebook & more'; return;
    }
    busy(true);
    try {
      const files = [];
      await eachSlide(async i => { files.push(new File([bytes(await capture('png'))], fileName(i,'png'), { type:'image/png' })); });
      shareFiles = files; shareBtn.textContent = `Tap to share ${files.length} image${files.length>1?'s':''}`;
      msg.textContent = 'Ready. Tap the share button again, then pick Instagram, Facebook or another app.';
    } catch(err){ fail(err); } finally { busy(false); }
  });

  // ---- save / open a project file ----
  $('#saveBtn').addEventListener('click', () => {
    const data = { app:'ssc-wc-kit', v:1, format:poster.dataset.format, theme:poster.dataset.theme, nums:deck.nums, cur:deck.cur, slides:deck.slides };
    download(new Blob([JSON.stringify(data)], { type:'application/json' }), 'SSC-World-Cup-graphics-project.json');
    say('Project saved. Open it later to keep editing.');
  });
  $('#openIn').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (d.app !== 'ssc-wc-kit' || !Array.isArray(d.slides) || !d.slides.length) throw new Error('bad file');
        const ok = id => !!byId[id];
        const slides = d.slides.filter(s => MAKE[s.type]).map(s => {
          const x = { ...(s.type==='quote' ? MAKE.quote({ q:s.q }) : s.type==='story' ? MAKE.story({ tk:s.tk }) : MAKE[s.type]()), ...s };
          if (x.type==='hub') { if (!ok(x.hero)) x.hero = 'impact'; x.items = (x.items||[]).filter(i => ok(i.id)); }
          if (x.fig && !ok(x.fig)) x.fig = x.type==='spot' ? 'tax' : null;
          ['support','figs'].forEach(k => { if (x[k]) x[k] = x[k].filter(ok); });
          if (x.q != null && !QQ[x.q]) x.q = 0; if (x.quote != null && !QQ[x.quote]) x.quote = null; if (x.tk != null && !TK[x.tk]) x.tk = 0;
          return x;
        });
        if (!slides.length) throw new Error('no slides');
        deck.slides = slides; deck.nums = d.nums !== false; $('#deckNums').checked = deck.nums;
        if (DIMS[d.format]) { poster.dataset.format = d.format; $$('#fmtSeg button').forEach(x => x.setAttribute('aria-checked', x.dataset.fmt===d.format)); }
        if (['night','bay','light'].includes(d.theme)) { poster.dataset.theme = d.theme; $$('#themeSeg button').forEach(x => x.setAttribute('aria-checked', x.dataset.theme===d.theme)); }
        deck.cur = Math.min(d.cur||0, slides.length-1); state = slides[deck.cur];
        snapAll(); say(`Opened ${slides.length} slide${slides.length>1?'s':''}`);
      } catch(_) { say("That file isn't a saved project from this kit."); }
      e.target.value = '';
    };
    rd.readAsText(f);
  });

  // ---------- DATA BANK ----------
  let cat = 'all', picksOnly = false, q = '';
  $('#chips').innerHTML = KIT.cats.map(c => `<button class="chip" role="tab" aria-selected="${c.id==='all'}" data-c="${c.id}">${c.label}</button>`).join('');
  $$('#chips .chip').forEach(b => b.addEventListener('click', () => {
    cat = b.dataset.c; $$('#chips .chip').forEach(x => x.setAttribute('aria-selected', x===b)); renderCards();
  }));
  $('#picksOnly').addEventListener('change', e => { picksOnly = e.target.checked; renderCards(); });
  $('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); renderCards(); });

  function cardBadge(s){
    const st = window.__graphicStatus ? window.__graphicStatus(s.id) : { on:false };
    if (st.on) return `<span class="card__star ${st.hidden?'card__star--warn':''}" data-badge>${st.hidden?'':'★ '}On the infographic · ${esc(st.where)}</span>`;
    return s.pick ? `<span class="card__star card__star--sug" data-badge>Suggested pick</span>` : `<span data-badge hidden></span>`;
  }
  function cardBtn(s){
    const st = window.__graphicStatus ? window.__graphicStatus(s.id) : { on:false };
    const center = st.on && st.primary;
    return st.on
      ? `<button class="copybtn copybtn--add is-on" type="button" data-addbtn onclick="__addToGraphic('${s.id}')" ${center?'disabled title="Main figure of a slide. Change it in the editor."':''} aria-label="Remove ${esc(s.label)} from the infographic">${center?'Main figure':'✓ On graphic · Remove'}</button>`
      : `<button class="copybtn copybtn--add" type="button" data-addbtn onclick="__addToGraphic('${s.id}')" aria-label="Add ${esc(s.label)} to the current slide">+ Graphic</button>`;
  }
  window.__syncCards = () => {
    $$('#cards .card[data-id]').forEach(c => {
      const s = byId[c.dataset.id]; if (!s) return;
      const b = c.querySelector('[data-badge]'); if (b) b.outerHTML = cardBadge(s);
      const k = c.querySelector('[data-addbtn]'); if (k) k.outerHTML = cardBtn(s);
    });
    if (picksOnly) renderCards();
  };
  function renderCards(){
    const list = KIT.stats.filter(s =>
      (cat==='all' || s.cat===cat) && (!picksOnly || (window.__graphicStatus && window.__graphicStatus(s.id).on)) &&
      (!q || [s.value,s.label,s.sub,s.caption,s.note].join(' ').toLowerCase().includes(q)));
    $('#resultCount').textContent = `${list.length} of ${KIT.stats.length} figures`;
    $('#cards').innerHTML = list.length ? list.map(s => `
      <article class="card" data-cat="${s.cat}" data-id="${s.id}">
        <div class="card__top"><div class="card__v">${esc(s.value)}</div>${cardBadge(s)}</div>
        <div class="card__l">${esc(s.label)}</div>
        <div class="card__s">${esc(s.sub)}</div>
        <p class="card__cap">${esc(s.caption)}</p>
        ${s.note?`<p class="card__note"><b>Use note:</b> ${esc(s.note)}</p>`:''}
        <div class="card__foot">
          <a class="srcchip" href="${S[s.src].url}" target="_blank" rel="noopener">${esc(S[s.src].short)} ↗</a>
          ${cardBtn(s)}
          <button class="copybtn" data-copy="text" data-text="${esc(s.caption + ' (' + S[s.src].short + ')')}">Copy caption</button>
        </div>
      </article>`).join('') : `<p>No figures match that search. <button class="btn--text btn" id="clearQ">Clear filters</button></p>`;
    const c = $('#clearQ'); if(c) c.onclick = () => { q=''; $('#q').value=''; picksOnly=false; $('#picksOnly').checked=false; cat='all'; $$('#chips .chip').forEach(x=>x.setAttribute('aria-selected', x.dataset.c==='all')); renderCards(); };
  }

  // ---------- STORY ----------
  (function trail(){
    const pts = [
      { l:'Dec 2024', s:'Preliminary forecast', v:929 },
      { l:'Mar 2026', s:'March forecast', v:846 },
      { l:'Sept 2026', s:'Final estimate', v:889, hi:true }
    ];
    const W=560, H=260, base=0, top=960, x0=40, bw=120, gap=(W-x0*2-bw*3)/2;
    const y = v => H-34 - (v-base)/(top-base)*(H-80);
    const bars = pts.map((p,i) => {
      const x = x0 + i*(bw+gap), yy = y(p.v);
      return `<g>
        <rect x="${x}" y="${yy}" width="${bw}" height="${H-34-yy}" rx="8" fill="${p.hi?'#fce012':'rgba(128,214,214,.35)'}"/>
        <text x="${x+bw/2}" y="${yy-12}" text-anchor="middle" font-family="Clash Display, sans-serif" font-weight="700" font-size="28" fill="${p.hi?'#fce012':'#ffffff'}">$${p.v}M</text>
        <text x="${x+bw/2}" y="${H-12}" text-anchor="middle" font-family="Satoshi, sans-serif" font-weight="700" font-size="14" fill="#cfd9dd">${p.l}</text>
      </g>`;
    }).join('');
    $('#trail').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="presentation">
      <line x1="20" y1="${H-34}" x2="${W-20}" y2="${H-34}" stroke="rgba(182,197,203,.35)" stroke-width="1.5"/>
      ${bars}
      
    </svg>
    <p class="fine" style="margin-top:8px;color:#cfd9dd">Forecasts and final estimate as published by Visit Seattle. Visit Seattle calls the final figure a "greater-than-expected total."</p>`;
  })();

  $('#matches').innerHTML = KIT.matches.map(m => `
    <li class="match"><span class="match__d"><b>Match ${m.n}</b>${m.date}</span>
      <span class="match__t">${esc(m.home)} vs. ${esc(m.away)}<span class="match__st">${esc(m.stage)}</span></span>
      <span class="match__s">${m.score}</span></li>`).join('');

  $('#quotes').innerHTML = KIT.quotes.map((x,i) => `
    <figure class="quote" style="margin:0">
      <p id="qt${i}">${esc(x.text)}</p>
      <div class="quote__foot">
        <figcaption class="quote__who">${esc(x.who)}<span>${esc(x.role)}</span></figcaption>
        <button class="copybtn" data-copy="text" data-text="${esc('“' + x.text + '” — ' + x.who + ', ' + x.role)}">Copy</button>
      </div>
      <a class="srcchip" href="${S[x.src].url}" target="_blank" rel="noopener">${esc(S[x.src].short)} ↗</a>
    </figure>`).join('');

  // ---------- COPY KIT ----------
  let tab = 'ig';
  $('#copyTabs').innerHTML = KIT.copy.map(c => `<button class="tab" role="tab" aria-selected="${c.id===tab}" data-t="${c.id}">${c.label}</button>`).join('');
  $$('#copyTabs .tab').forEach(b => b.addEventListener('click', () => { tab=b.dataset.t; $$('#copyTabs .tab').forEach(x=>x.setAttribute('aria-selected', x===b)); renderCopy(); }));
  function renderCopy(){
    const c = KIT.copy.find(x => x.id===tab);
    const blocks = c.dynamic ? [{ h:'Alt text for the current infographic (updates with your slot choices)', body: altText() }] : c.blocks;
    $('#copyPanel').innerHTML = blocks.map((b,i) => `
      <div class="copyblock">
        <div class="copyblock__h"><h3>${esc(b.h)}</h3><span class="meta">${b.body.length.toLocaleString()} characters</span><button class="copybtn" data-copy="#cb${i}">Copy</button></div>
        <pre id="cb${i}">${esc(b.body)}</pre>
      </div>`).join('');
  }

  // ---------- MEDIA ----------
  $('#angles').innerHTML = KIT.angles.map((a,i) => `
    <article class="angle">
      <span class="angle__n">Angle ${String(i+1).padStart(2,'0')}</span>
      <h3>${esc(a.t)}</h3>
      <p class="angle__hook">${esc(a.hook)}</p>
      <p class="angle__data">${esc(a.data)}</p>
      <dl><dt>Format</dt><dd>${esc(a.fmt)}</dd><dt>Voice</dt><dd>${esc(a.who)}</dd></dl>
      <p class="angle__src">${(a.srcs||[]).map(k=>`<a href="${S[k].url}" target="_blank" rel="noopener">${esc(S[k].short)} ↗</a>`).join(' · ')}</p>
    </article>`).join('');

  // ---------- PRESS ----------
  $('#qa').innerHTML = KIT.qa.map((x,i) => `
    <details ${i===0?'open':''}>
      <summary>${esc(x.q)}</summary>
      <div class="ans"><p id="qa${i}">${esc(x.a)}</p>
        <div class="row"><a class="srcchip" href="${S[x.src].url}" target="_blank" rel="noopener">${esc(S[x.src].short)} ↗</a><button class="copybtn" data-copy="#qa${i}">Copy answer</button></div>
      </div>
    </details>`).join('');
  $('#sayAvoid').innerHTML = KIT.sayAvoid.map(([a,b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('');

  // ---------- SOURCES ----------
  const counts = {};
  KIT.stats.forEach(s => counts[s.src] = (counts[s.src]||0)+1);
  $('#srcs').innerHTML = Object.entries(S).map(([k,s]) => `
    <div class="src">
      <span class="src__type ${k==='KUOW'||k==='ST'?'prep':''}">${esc(s.type)}</span>
      <a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>
      <span class="src__meta">${esc(s.org)} · ${esc(s.date)}</span>
      ${counts[k]?`<span class="src__count">${counts[k]} figure${counts[k]>1?'s':''} in the data bank</span>`:''}
    </div>`).join('');

  // ---------- AGENDA ----------
  $('#agenda').innerHTML = KIT.agenda.map((a,i) => `
    <li><input type="checkbox" id="ag${i}" aria-label="Mark ${esc(a.d)} decided"><span class="t">${a.t}</span><span class="d">${esc(a.d)}</span><span class="o">${esc(a.out)}</span></li>`).join('');
  $$('#agenda input').forEach(cb => cb.addEventListener('change', () => cb.closest('li').classList.toggle('done', cb.checked)));

  // ---------- nav highlight ----------
  const links = $$('.nav a');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting){ links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#'+e.target.id)); }
  }), { rootMargin:'-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => io.observe(s));

  renderCards(); renderCopy(); snapAll();
  document.fonts && document.fonts.ready.then(() => { fitText(); fitStage(); });
})();
