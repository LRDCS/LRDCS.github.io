/* Desktop behaviour lives here; personal content lives in content.js. */
(() => {
  'use strict';
  const data = window.portfolio;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const extensionInfo = {
    txt: 'Plain text file. Stores readable text without fonts or page formatting. Commonly used for notes, readme files and simple data.',
    bat: 'Windows batch file. Contains commands run by the Windows command interpreter. Used to automate tasks such as launching tools or copying files.',
    gd: 'GDScript file. Contains code for the Godot game engine. Used to control game behaviour such as movement, interactions and menus.',
    docx: 'Word document. Stores formatted text, images and page layouts. Commonly used for reports, coursework and CVs in Microsoft Word and compatible editors.',
    rar: 'RAR archive. Packages files and folders together, usually with compression to reduce their size. Used for storage and sharing; its contents need to be extracted.',
    md: 'Markdown file. Stores plain text with simple symbols for headings, lists and links. Used for documentation, readme files and technical notes.'
  };
  function fileLabel(filename, id) {
    const match = filename.match(/\.([a-z0-9]+)$/i);
    if (!match || !extensionInfo[match[1].toLowerCase()]) return escape(filename);
    const extension = match[0], description = extensionInfo[match[1].toLowerCase()];
    return `<span class="file-label">${escape(filename.slice(0,-extension.length))}<span class="extension-wrap"><button type="button" class="extension-help" aria-label="Explain ${extension} files" aria-describedby="extension-${id}">${extension}</button><span class="file-tooltip" id="extension-${id}" role="tooltip" hidden>${escape(description)}</span></span></span>`;
  }
  const safeUrl = value => {
    try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) || (url.protocol === 'file:' && !/^[a-z]+:/i.test(value)) ? url.href : ''; } catch { return ''; }
  };
  const link = (label, url) => { const href = safeUrl(url); const external = /^https?:\/\//i.test(url); return href ? `<a class="section-link" href="${escape(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(label)} ↗</a>` : ''; };
  const tags = values => values.map(value => `<span class="tag">${escape(value)}</span>`).join('');
  const empty = (title, body) => `<div class="empty"><strong>${escape(title)}</strong>${escape(body)}</div>`;
  const entries = items => items.map(item => `<article class="entry"><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p>${item.url ? link(item.linkLabel || 'Open', item.url) : ''}</article>`).join('');
  const cv = data.cvUrl ? link('View CV', data.cvUrl) : empty('CV coming soon', 'A CV has not been added yet. Qualifications and experience will appear here once supplied.');
  const sections = [
    {id:'about', file:'01 / about-me.txt', title:data.name ? `Hello, I’m ${data.name}.` : 'The person behind the screen.', label:'ABOUT & CV', tags:['Open-minded','Innovative','Fast learner'], body:`<p>${escape(data.introduction)}</p><p>${escape(data.aboutDescription)}</p>${cv}${data.links.map(item => link(item.label, item.url)).join('')}`, detail:'This is the place for a personal introduction, verified skills, experience, and contact links. Those details have not been added yet.'},
    {id:'security', file:'02 / security-lab.bat', title:'NMAP & other things.', label:'CYBERSECURITY & LINUX', tags:['Cybersecurity','Linux','Learning notes'], body:`<p>A home for cybersecurity and Linux learning: the ideas, commands, and experiments worth returning to.</p>${empty('The lab notebook is waiting', 'No completed labs, certifications, or security experience have been listed yet.')}`, detail:'Future entries can describe the question, the environment, the steps taken, and what was learned. Specific evidence will matter more than a long list of tools.'},
    {id:'games', file:'03 / game-dev.gd', title:'video games & development.', label:'GAME DEVELOPMENT', tags:['Game development','Experiments','Devlogs'], body:`<p>A workshop for game ideas, playable experiments, and the process behind them.</p>${entries(data.projects.filter(p => p.category === 'Games')) || empty('No games published here yet', 'When a real project is added, this folder will hold its screenshots, development notes, and playable or source links.')}`, detail:'A useful project page explains the idea, your contribution, the technical decisions, and what you would improve next.'},
    {id:'notes', file:'04 / learning.docx', title:'Note taking & tips.', label:'LEARNING', tags:['Programming','Reference','Things learned'], body:`<p>A growing reference shelf for explanations, useful discoveries, and technical rabbit holes.</p>${entries(data.notes) || empty('A fresh notebook', 'No articles have been added yet. Notes will be linked here as they are written.')}`, detail:'Notes do not need to be exhaustive tutorials. A clear explanation of one problem and its solution is a good place to start.'},
    {id:'archive', file:'05 / project-archive.rar', title:'Query any of my projects.', label:'PROJECT ARCHIVE', tags:['Programming','Games','Security'], body:`<p>Browse projects by area, or search for something specific.</p><div class="archive-widget"><label class="search-label">Search projects<input type="search" placeholder="Project name or keyword…" autocomplete="off"></label><div class="filter-row" aria-label="Filter projects">${['All','Programming','Games','Security'].map((v,i) => `<button type="button" data-filter="${v}" aria-pressed="${i===0}">${v}</button>`).join('')}</div><div class="project-results" aria-live="polite"></div></div>`, detail:'Only real projects are listed. There are no sample achievements or fabricated project statistics in this archive.'},
    {id:'now', file:'06 / currently.md', title:'Still figuring things out.', label:'ON MY DESK', tags:['In progress','Learning','Making time'], body:`<p>A quieter page for current work, learning goals, and whatever is getting my attention.</p>${entries(data.current) || empty('An update is on its way', 'Specific project updates and learning goals have not been added yet.')}`, detail:'This page can change as priorities change. It is a snapshot of the present, rather than a promise to finish everything at once.'}
  ];
  const container = document.querySelector('#sections');
  container.innerHTML = sections.map(s => `<section class="content-section" id="${s.id}" aria-labelledby="heading-${s.id}"><div class="section-bar"><span>${fileLabel(s.file,s.id)}</span><span aria-hidden="true">─ □ ×</span></div><div class="section-body"><span class="status">${s.label}</span><h2 id="heading-${s.id}">${escape(s.title)}</h2><div>${tags(s.tags)}</div>${s.body}<button class="section-link" data-open="${s.id}">Open folder ↗</button><p class="detail-note" hidden>${escape(s.detail)}</p></div></section>`).join('');
  const dialog = document.querySelector('#window');
  const dialogContent = document.querySelector('#window-content');
  let tooltipTimer, activeHelp;
  function hideHelp() {
    clearTimeout(tooltipTimer);
    if (activeHelp) document.getElementById(activeHelp.getAttribute('aria-describedby'))?.setAttribute('hidden','');
    activeHelp = null;
  }
  function showHelp(button) {
    hideHelp();
    if (!button.isConnected) return;
    const tooltip = document.getElementById(button.getAttribute('aria-describedby'));
    if (!tooltip) return;
    activeHelp = button;
    tooltip.hidden = false;
    const anchor = button.getBoundingClientRect(), box = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.max(12,Math.min(anchor.left,window.innerWidth-box.width-12))+'px';
    tooltip.style.top = Math.max(12,anchor.bottom+8+box.height > window.innerHeight-12 ? anchor.top-box.height-8 : anchor.bottom+8)+'px';
  }
  function scheduleHelp(button) {
    hideHelp();
    tooltipTimer = setTimeout(() => showHelp(button),300);
  }
  document.addEventListener('pointerover',event => {
    if (event.target.closest('.file-tooltip')) { clearTimeout(tooltipTimer);return; }
    const button = event.target.closest('.extension-help');
    if (button && !button.contains(event.relatedTarget) && event.pointerType !== 'touch') scheduleHelp(button);
  });
  document.addEventListener('pointerout',event => {
    const wrap = event.target.closest('.extension-wrap');
    if (wrap && !wrap.contains(event.relatedTarget)) { clearTimeout(tooltipTimer);tooltipTimer=setTimeout(hideHelp,120); }
  });
  document.addEventListener('focusin',event => { if (event.target.matches('.extension-help')) scheduleHelp(event.target); });
  document.addEventListener('focusout',event => { if (event.target.matches('.extension-help')) hideHelp(); });
  document.addEventListener('click',event => {
    const button = event.target.closest('.extension-help');
    if (button) showHelp(button);
    else if (!event.target.closest('.file-tooltip')) hideHelp();
  });
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && activeHelp) { hideHelp();event.preventDefault();event.stopImmediatePropagation(); }
  },true);
  window.addEventListener('resize',hideHelp);
  document.addEventListener('scroll',hideHelp,true);
  let previousFocus;
  function updateArchive(widget) {
    const query = widget.querySelector('input').value.trim().toLowerCase();
    const category = widget.querySelector('[aria-pressed="true"]').dataset.filter;
    const projects = data.projects.filter(p => (category === 'All' || p.category === category) && `${p.title} ${p.description}`.toLowerCase().includes(query));
    widget.querySelector('.project-results').innerHTML = projects.length ? entries(projects) : empty(data.projects.length ? 'No matching projects' : 'Nothing archived just yet', data.projects.length ? 'Try another keyword or choose All.' : 'Real projects will appear here once added. The search and category filters are ready.');
  }
  function bindArchives(root) {
    root.querySelectorAll('.archive-widget').forEach(widget => {
      widget.querySelector('input').addEventListener('input', () => updateArchive(widget));
      widget.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { widget.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); updateArchive(widget); }));
      updateArchive(widget);
    });
  }
  bindArchives(container);
  function openFolder(id) {
    const section = sections.find(s => s.id === id);
    if (!section || !dialog.showModal || document.body.classList.contains('simple')) return false;
    previousFocus = document.activeElement;
    hideHelp();
    document.querySelector('#window-title').innerHTML = fileLabel(section.file,'window-'+section.id);
    dialogContent.innerHTML = `<span class="status">${section.label}</span><h2>${escape(section.title)}</h2><div>${tags(section.tags)}</div>${section.body}<p class="detail-note">${escape(section.detail)}</p>`;
    bindArchives(dialogContent);
    dialog.showModal();
    document.querySelector('#close-window').focus();
    return true;
  }
  document.querySelectorAll('.desktop-icon,.sticky a').forEach(a => a.addEventListener('click', event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && openFolder(a.hash.slice(1))) event.preventDefault(); }));
  container.addEventListener('click', event => { const button = event.target.closest('[data-open]'); if (button && !openFolder(button.dataset.open)) button.closest('section').querySelector('.detail-note').hidden = false; });
  document.querySelector('#close-window').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close(); });
  dialog.addEventListener('close', () => { hideHelp();previousFocus?.focus(); });
  const viewButton = document.querySelector('#view-toggle');
  const themeButton = document.querySelector('#theme-toggle');
  function remember(key, value) { try { localStorage.setItem(key,value); } catch { /* Storage can be unavailable in private browsing. */ } }
  function recall(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function setView(simple) { document.body.classList.toggle('simple', simple); viewButton.textContent = simple ? 'Desktop view' : 'Simple view'; viewButton.setAttribute('aria-pressed', String(simple)); document.querySelectorAll('[data-open]').forEach(b => b.hidden = simple); container.querySelectorAll('.detail-note').forEach(p => p.hidden = !simple); }
  setView(recall('nightshift-view') === 'simple');
  viewButton.hidden = false;
  viewButton.addEventListener('click', () => { const simple = !document.body.classList.contains('simple'); setView(simple); remember('nightshift-view', simple ? 'simple' : 'desktop'); });
  function setTheme(dusk) { document.body.classList.toggle('dusk', dusk); themeButton.setAttribute('aria-label', dusk ? 'Switch to midnight colours' : 'Switch to dusk colours'); themeButton.setAttribute('aria-pressed', String(dusk)); }
  setTheme(recall('nightshift-palette') === 'dusk');
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => { const dusk = !document.body.classList.contains('dusk'); setTheme(dusk); remember('nightshift-palette', dusk ? 'dusk' : 'midnight'); });
  function tick() { const now = new Date(); const clock = document.querySelector('#clock'); clock.dateTime = now.toISOString(); clock.textContent = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}); }
  tick(); setInterval(tick, 30000);
})();
