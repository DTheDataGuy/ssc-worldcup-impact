// Renders "The Impact Story": hero chapter strip, chapter nav, prologue, four chapters and epilogue.
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const S = KIT.sources, Q = KIT.quotes, CH = KIT.chapters;
  const byId = Object.fromEntries(KIT.stats.map(s => [s.id, s]));
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const chip = k => `<a class="schip" href="${S[k].url}" target="_blank" rel="noopener">${esc(S[k].short)} ↗</a>`;
  const withChips = t => esc(t).replace(/\{\{([A-Z]+)\}\}/g, (_, k) => S[k] ? chip(k) : '');
  const fig = (id, cls='sfig') => { const f = byId[id]; if (!f) return '';
    return `<div class="${cls}"><span class="${cls}__v">${esc(f.value)}</span><span class="${cls}__l">${esc(f.label)}</span>${f.sub?`<span class="${cls}__s">${esc(f.sub)}</span>`:''}<a class="${cls}__src" href="${S[f.src].url}" target="_blank" rel="noopener" aria-label="Source: ${esc(S[f.src].short)}">${esc(S[f.src].short)}</a></div>`; };
  const quote = i => { const q = Q[i]; return `<figure class="squote"><blockquote>\u201c${esc(q.text)}\u201d</blockquote><figcaption><b>${esc(q.who)}</b><span>${esc(q.role)}</span>${chip(q.src)}</figcaption></figure>`; };

  // hero strip + chapter nav
  $('#heroArc').innerHTML = CH.map(c => `<li><a href="#${c.id}"><b>${c.n}</b><span>${esc(c.name)}</span></a></li>`).join('');
  $('#arc').innerHTML = `<ol>${CH.map((c,i) => `<li class="arc__i arc__i--${i}"><a href="#${c.id}"><span class="arc__n">${c.n}</span><span class="arc__name">${esc(c.name)}</span><span class="arc__verb">${esc(c.verb)}</span></a></li>`).join('')}</ol>`;

  // prologue
  const P = KIT.prologue;
  $('#prologue').innerHTML = `<div class="wrap prologue__in">
    <div class="prologue__text"><p class="eyebrow eyebrow--inv">${esc(P.kicker)}</p>
      <p class="prologue__lead">\u201c${esc(P.lead)}\u201d <span class="prologue__by">Visit Seattle ${chip(P.leadSrc)}</span></p>
      <p class="prologue__body">${esc(P.body)}</p></div>
    <div class="prologue__figs">${P.figs.map(id => fig(id,'pfig')).join('')}</div></div>`;

  // chapter visuals
  const V = {
    trail(){
      const pts = [['fc2024','Dec. 2024','Preliminary forecast'],['fc2026','March 2026','March forecast'],['impact','Sept. 2026','Final estimate']];
      const max = 960;
      return `<figure class="viz viz--trail"><figcaption><b>The forecast trail</b><span>Estimated total economic impact, Seattle &amp; King County</span></figcaption>
        <div class="trailbars" role="img" aria-label="Visit Seattle forecasts: $929M in December 2024, $846M in March 2026, final estimate $889M in September 2026.">
        ${pts.map(([id,d,l],i) => { const v = parseFloat(byId[id].value.replace(/[^\d.]/g,'')); return `<div class="tb ${i===2?'tb--hi':''}"><span class="tb__v">${esc(byId[id].value)}</span><span class="tb__bar" style="height:${Math.round(v/max*190)}px"></span><span class="tb__d">${d}</span><span class="tb__l">${l}</span></div>`; }).join('')}
        </div><p class="viz__src">Visit Seattle calls the final figure a \u201cgreater-than-expected total.\u201d ${chip('PRE')} ${chip('VS')}</p></figure>`;
    },
    link(){
      const rows = [['stprev','Before the World Cup','Seahawks parade record'],['st297','June 19','USA vs. Australia'],['link','July 6','USA vs. Belgium · all-time record']];
      const n = id => parseFloat(byId[id].value.replace(/,/g,'')) * (/K$/.test(byId[id].value) ? 1000 : 1);
      const max = 320000;
      return `<figure class="viz viz--link"><figcaption><b>Link light rail, busiest single days</b><span>Riders and boardings in one day, as published</span></figcaption>
        <div class="hbars" role="img" aria-label="Link one-day records: 225,000 before the tournament, 297,000 on June 19, 309,000 on July 6.">
        ${rows.map(([id,d,l],i) => `<div class="hb ${i===2?'hb--hi':''}"><span class="hb__t"><b>${d}</b>${l}</span><span class="hb__track"><span class="hb__bar" style="width:${(n(id)/max*100).toFixed(1)}%"></span></span><span class="hb__v">${esc(byId[id].value)}</span></div>`).join('')}
        </div><p class="viz__src">${chip('STDEB')} ${chip('DSA')} ${chip('LOC')}</p></figure>`;
    },
    matches(){
      return `<figure class="viz viz--matches"><figcaption><b>Six matches at Seattle Stadium</b><span>Eight national teams, four confederations</span></figcaption>
        <ul class="mlist">${KIT.matches.map(m => `<li><span class="ml__d"><b>${esc(m.date.replace(/^\w+, /,''))}</b>${esc(m.stage.replace(/ · .*/,''))}</span><span class="ml__t">${esc(m.home)} vs. ${esc(m.away)}${/·/.test(m.stage)?`<em>${esc(m.stage.split(' · ')[1])}${/Juneteenth/.test(m.stage)?' Match Day':''}</em>`:''}</span><span class="ml__s">${esc(m.score)}</span></li>`).join('')}</ul>
        <p class="viz__src">${chip('MATCH')} ${chip('FIFA')} ${chip('LEG')}</p></figure>`;
    },
    legacy(){
      return `<figure class="viz viz--legacy"><figcaption><b>Explore Seattle's legacy</b><span>Programs, playbooks and partnerships across Washington</span></figcaption>
        <a class="legacy-cta" href="https://www.sea2026.org" target="_blank" rel="noopener"><span>sea2026.org</span><i aria-hidden="true">↗</i></a>
        <p class="viz__src">Seattle 2026 Legacy website and SeattleFWC26 Final Report ${chip('LEG')} ${chip('LOC')}</p></figure>`;
    }
  };

  // chapters
  $('#chapters').innerHTML = CH.map((c,i) => {
    const next = CH[i+1];
    return `<article class="chapter chapter--${i}" id="${c.id}" aria-labelledby="${c.id}-h">
      <div class="wrap">
        <header class="ch__head">
          <span class="ch__n" aria-hidden="true">${c.n}</span>
          <div><p class="ch__kick"><span>Chapter ${c.n}</span> ${esc(c.name)} · <em>${esc(c.verb)}</em></p>
            <h3 class="ch__h" id="${c.id}-h">${esc(c.head)}${c.headSrc?` <span class="ch__hsrc">${chip(c.headSrc)}</span>`:''}</h3></div>
        </header>
        ${c.hero ? `<div class="ch__hero">${fig(c.hero,'hfig')}</div>` : ''}
        <div class="ch__grid">
          <div class="ch__story">
            ${c.paras.map(p => `<p>${withChips(p)}</p>`).join('')}
            <div class="ch__means"><span>What it means for Seattle</span><p>${esc(c.means)}</p></div>
            ${c.quotes.map(quote).join('')}
          </div>
          <div class="ch__side">
            <div class="ch__figs" style="--n:${c.figs.length}">${c.figs.map(id => fig(id)).join('')}</div>
            ${V[c.visual] ? V[c.visual]() : ''}
          </div>
        </div>
        ${c.fun ? `<div class="ch__fun"><p class="ch__subh">Fun facts and records</p><div class="funrow">${c.fun.map(id => fig(id,'ffig')).join('')}</div></div>` : ''}
        ${c.honest ? `<aside class="ch__honest${c.honest.figs?"":" ch__honest--solo"}"><div><p class="ch__subh">${esc(c.honest.h)}</p><p>${esc(c.honest.t)} ${c.honest.srcs.map(chip).join(' ')}</p></div>${c.honest.figs?`<div class="honest__figs">${c.honest.figs.map(id => fig(id,'ffig')).join('')}</div>`:''}</aside>` : ''}
        ${next ? `<a class="ch__next" href="#${next.id}"><span>Next · Chapter ${next.n}</span><b>${esc(next.name)}: ${esc(next.verb.toLowerCase())}</b><i aria-hidden="true">↓</i></a>`
               : `<a class="ch__next" href="#epilogue"><span>Up next</span><b>Put the story together</b><i aria-hidden="true">↓</i></a>`}
      </div>
    </article>`;
  }).join('');

  // epilogue spine
  $('#spine').innerHTML = KIT.storyLines.map(l => `<li><b>${l.n}</b><span><strong>${esc(l.name)}.</strong> ${esc(l.line)}</span></li>`).join('');
  $('#spineCopy').addEventListener('click', () => {
    const t = KIT.storyLines.map(l => `${l.name}: ${l.line}`).join('\n') + '\n\nSources: Visit Seattle (Sept. 22, 2026; analysis by Tourism Economics, part of Oxford Economics); SeattleFWC26 Final Report (Sept. 2026).';
    navigator.clipboard ? navigator.clipboard.writeText(t).then(() => toast('Copied to clipboard'), () => toast('Select the text and copy it manually')) : toast('Select the text and copy it manually');
  });
  function toast(m){ const el = $('#toast'); el.textContent = m; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 1800); }
})();
