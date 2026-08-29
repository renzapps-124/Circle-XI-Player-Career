(() => {
  'use strict';

  const ICON_MAP = Object.freeze({
    '★':'star','☆':'star_border','⭐':'star','🌟':'star','✨':'flare','✦':'flare','🪄':'flare',
    '⚽':'sports_soccer','🏆':'emoji_events','🏅':'military_tech','👑':'emoji_events','🎯':'track_changes','🥅':'sports_soccer',
    '⚙':'settings','▶':'play_arrow','＋':'add','▰':'save','💾':'save','▦':'event','📅':'event','📩':'inbox','📂':'folder_open','🗑':'delete',
    '👤':'person','👥':'people','🧑':'person','🌍':'public','🌎':'public','🌏':'public','🌐':'public','✂':'content_cut','✅':'check_circle','✓':'check',
    '⚡':'flash_on','ϟ':'flash_on','🔥':'whatshot','🎮':'sports_esports','📊':'bar_chart','📈':'trending_up','💰':'account_balance_wallet',
    '🎬':'movie','🏠':'home','🏟':'location_city','🏋':'fitness_center','🏃':'directions_run','🚴':'directions_bike','🏊':'pool','🌊':'waves',
    '🧠':'psychology','🧤':'pan_tool','🛡':'security','🚩':'flag','⚑':'flag','📍':'room','👕':'checkroom','💪':'fitness_center','🧍':'accessibility_new',
    '⏱':'timer','🔋':'battery_full','🩹':'healing','🩺':'local_hospital','🔒':'lock','🔓':'lock_open','👀':'visibility','🚫':'block',
    '🎨':'palette','💤':'hotel','🌙':'nights_stay','📋':'assignment','📰':'chrome_reader_mode','🏫':'school','🎓':'school','🎵':'music_note',
    '📣':'campaign','🔀':'shuffle','🔄':'sync','🔁':'repeat','🏁':'flag','🦶':'directions_walk','👟':'directions_run','🥾':'directions_walk',
    '🙌':'pan_tool','❤':'favorite','💚':'favorite','💧':'opacity','♾':'all_inclusive','⚖':'account_balance','🚪':'exit_to_app',
    '🎲':'casino','🪜':'vertical_align_top','🧬':'science','🗣':'record_voice_over','💇':'face','🚧':'construction','🧱':'grid_on','📐':'architecture',
    '🌀':'sync','🧲':'track_changes','🎟':'confirmation_number','©':'copyright','💎':'grade','✈':'flight','🤝':'people','🚀':'flight_takeoff',
    '🌱':'eco','🧊':'ac_unit','🪽':'flight','〰':'waves','🔺':'change_history','⭕':'radio_button_unchecked','🔹':'fiber_manual_record','➖':'remove',
    '💯':'grade','🅰':'grade','🟨':'crop_square','🌋':'landscape','🎽':'checkroom','⚒':'build','🛠':'build','🏰':'account_balance','⛵':'directions_boat','🌹':'local_florist',
    '💣':'warning','🍒':'local_florist','🐝':'pets','🐎':'pets','🦊':'pets','👿':'mood_bad','🌲':'nature','🐓':'pets','🐺':'pets','🐉':'pets','🐘':'pets','🐏':'pets','🐯':'pets','🎩':'style','🐂':'pets','🐑':'pets','🦉':'pets','🏺':'account_balance','🐈':'pets','🦢':'flight','🦌':'pets','🦁':'pets','🦅':'flight','🐦':'flight',
    '→':'arrow_forward','←':'arrow_back','↑':'arrow_upward','↓':'arrow_downward','↗':'call_made','↘':'arrow_downward','↔':'swap_horiz','↕':'swap_vert',
    '↪':'redo','↩':'undo','↶':'undo','↷':'redo','↻':'replay','⟳':'replay','⇄':'swap_horiz','⇢':'arrow_forward','↠':'double_arrow','↟':'trending_up','➜':'arrow_forward',
    '⏮':'skip_previous','⏸':'pause','⏭':'skip_next','⏩':'fast_forward','⌄':'expand_more','✕':'close','✚':'healing',
    '●':'radio_button_checked','○':'radio_button_unchecked','◉':'gps_fixed','◎':'gps_fixed','⌖':'gps_fixed','⌒':'show_chart','⌁':'waves','▣':'view_module','▮':'battery_full','◖':'volume_up',
    '◆':'category','◇':'category','◈':'category','🎥':'videocam','⌨':'keyboard'
  });

  const materialSpan = (name, extraClass='') => {
    const el = document.createElement('span');
    el.className = `material-icons-sharp cxi-material-icon${extraClass ? ` ${extraClass}` : ''}`;
    el.setAttribute('aria-hidden','true');
    el.dataset.cxiMaterialIcon = name;
    el.textContent = name;
    return el;
  };

  const textContext = (el) => {
    if (!el || el.nodeType !== 1) return '';
    const anchor = el.closest?.('button,[aria-label],[title],.stat-tile,.creator-section-title,.tutorial-feature-card,.tutorial-control-card,.review-player-card,.journey-icon,.career-tabs,.training-drill-card') || el;
    return `${anchor.getAttribute?.('aria-label')||''} ${anchor.getAttribute?.('title')||''} ${anchor.id||''} ${anchor.className||''} ${anchor.textContent||''}`.toLowerCase();
  };

  function resolveIcon(symbol, parent) {
    const ctx = textContext(parent);
    if (symbol === '×') {
      const exact = (parent?.textContent||'').trim();
      return (parent?.closest?.('button') || /close|remove|delete/.test(ctx)) && exact === '×' ? 'close' : null;
    }
    if (symbol === '◆' || symbol === '◇' || symbol === '◈') {
      if (symbol === '◈' && /jockey|shield|protect|defen/.test(ctx)) return 'security';
      if (/tutorial|academy|learn/.test(ctx)) return 'school';
      if (/champions|europa|conference|league|cup|trophy|competition/.test(ctx)) return 'emoji_events';
      if (/create|identity|player/.test(ctx)) return 'person_add';
      return symbol === '◈' ? 'adjust' : 'category';
    }
    if (symbol === '★' && /trophy|honour|award|champion|cup/.test(ctx)) return 'emoji_events';
    if (symbol === '🎯' && /shoot|finish|penalt|free kick|target/.test(ctx)) return 'gps_fixed';
    if (symbol === '🛡' && /defen|tackle|protect|shield/.test(ctx)) return 'security';
    return ICON_MAP[symbol] || null;
  }

  window.CXI_MATERIAL_ICON_NAME = (symbol, context='') => {
    const fake = {nodeType:1, textContent:context, className:'', id:'', getAttribute:()=>'', closest:()=>null};
    return resolveIcon(String(symbol||'').replace(/\uFE0F/g,''), fake);
  };

  function replaceTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.parentElement) return;
    if (node.parentElement.closest('.material-icons-sharp,[data-cxi-no-icon-upgrade],script,style,textarea,pre,code,kbd')) return;
    const original = node.nodeValue || '';
    const clean = original.replace(/\uFE0F/g,'');
    let changed = clean !== original;
    const frag = document.createDocumentFragment();
    let buffer = '';
    const flush = () => { if (buffer) { frag.appendChild(document.createTextNode(buffer)); buffer=''; } };
    for (const ch of Array.from(clean)) {
      const icon = resolveIcon(ch, node.parentElement);
      if (icon) {
        flush();
        frag.appendChild(materialSpan(icon));
        changed = true;
      } else buffer += ch;
    }
    flush();
    if (changed) node.replaceWith(frag);
  }

  function resolveSvgIcon(svg) {
    if (!svg || svg.closest('.visual-club-crest,.result-line-chart,.form-line-chart,[data-cxi-no-icon-upgrade]')) return null;
    const owner = svg.closest('button,[aria-label],[title],.creator-section-title,.hud-stat,.hud-objective,.stat-tile,.touch-controls') || svg.parentElement;
    const ctx = textContext(owner);
    const rules = [
      [/match rating|rating/, 'star'], [/stamina|energy/, 'battery_full'], [/objective/, 'outlined_flag'], [/fullscreen/, 'fullscreen'], [/pause/, 'pause'],
      [/watch replay|replay/, 'replay'], [/continue match|simulate/, 'fast_forward'], [/start match|resume/, 'play_arrow'], [/restart/, 'replay'], [/quit|exit/, 'exit_to_app'],
      [/identity/, 'person'], [/career world|world/, 'public'], [/position.*style|role/, 'sports_soccer'], [/appearance/, 'face'], [/final review|review/, 'assessment'],
      [/through/, 'double_arrow'], [/cross/, 'call_made'], [/shoot|shot|goal/, 'gps_fixed'], [/press|tackle|defen|shield/, 'security'], [/sprint/, 'flash_on'], [/pass|assist/, 'arrow_forward'],
      [/expected goals|chart|form/, 'timeline'], [/dribble|carry/, 'directions_run'], [/key pass/, 'vpn_key'], [/interception|block/, 'block'], [/card/, 'style'], [/turnover|swap/, 'swap_horiz']
    ];
    for (const [rx,name] of rules) if (rx.test(ctx)) return name;
    if (svg.closest('.stat-icon')) return 'insert_chart';
    if (svg.classList.contains('btn-icon')) return 'arrow_forward';
    return null;
  }

  function replaceSvg(svg) {
    const icon = resolveSvgIcon(svg);
    if (!icon) return;
    const extra = svg.classList.contains('btn-icon') ? 'btn-icon' : '';
    svg.replaceWith(materialSpan(icon, extra));
  }

  function upgradeTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { replaceTextNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.matches('.material-icons-sharp,[data-cxi-no-icon-upgrade]')) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.tagName === 'SVG') replaceSvg(root);
    root.querySelectorAll?.('svg').forEach(replaceSvg);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[]; let n;
    while ((n=walker.nextNode())) nodes.push(n);
    nodes.forEach(replaceTextNode);
  }

  // v77.23: the semantic icon tints in styles.css are tuned for this app's dark
  // surfaces. A handful of icons sit on light chips - an unclassed span with a
  // near-white background - where a mid-brightness tone drops to about 1.7:1 and
  // effectively disappears. Those chips carry no class to exclude in CSS, so the
  // surface is measured here once and stamped on the icon; the stylesheet then
  // hands those back to the colour the chip already intends.
  const RGB = value => { const m = String(value||'').match(/[0-9.]+/g); return m ? m.map(Number) : null; };
  const onLightSurface = el => {
    let n = el, depth = 0;
    while (n && n !== document.documentElement && depth++ < 6) {
      const c = RGB(getComputedStyle(n).backgroundColor);
      // Only an essentially opaque layer decides the surface.
      if (c && (c[3] === undefined || c[3] > 0.55)) return (c[0]*0.2126 + c[1]*0.7152 + c[2]*0.0722) > 140;
      n = n.parentElement;
    }
    return false;
  };
  const markSurfaces = root => {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.cxi-material-icon[data-cxi-material-icon]').forEach(el => {
      if (onLightSurface(el)) el.dataset.cxiLightSurface = '1';
      else delete el.dataset.cxiLightSurface;
    });
  };
  window.__cxiMarkIconSurfaces = markSurfaces;

  const start = () => {
    upgradeTree(document.body);
    markSurfaces(document.body);
    let queued = false, settleTimer = 0;
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) upgradeTree(node);
      // Layout has to settle before a background can be read, and re-marking the
      // whole tree per mutation would thrash, so coalesce into one pass a frame.
      // One rAF is not enough: a panel injected by a tab switch has its element in
      // the tree before its class-driven background resolves, so the first pass reads
      // a transparent surface and leaves a pale icon on a light chip. Wait a full
      // style+layout cycle, then sweep again shortly after for anything applied late.
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          queued = false;
          markSurfaces(document.body);
          clearTimeout(settleTimer);
          settleTimer = setTimeout(() => markSurfaces(document.body), 220);
        }));
      }
    });
    // Deliberately childList-only. Watching class changes as well would catch panels
    // that are revealed rather than inserted, but it fires on every class toggle in
    // the app - including the match HUD, several times a second - for a full-document
    // rescan. The handful of pre-rendered light-chip panels are excluded by selector
    // in styles.css instead, which is both deterministic and free.
    observer.observe(document.body,{subtree:true,childList:true});
    window.__circleMaterialIconObserver = observer;
    document.documentElement.dataset.materialIcons = 'sharp';
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
