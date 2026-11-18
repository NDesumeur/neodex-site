/* Accessibility, for the keyboard and the screen readers (Narrator, NVDA): every button says what it does, the windows say they are
   windows, the tabs and tiles can be reached with Tab and opened with Enter, the messages are read aloud, and the focus is always visible.
   The visual options (bigger text, contrast, readable font, less motion, big cursor) are in Paramètres › Accessibilité (look.js). */
// a button with only an icon (or « X ») gets its title as its name: a screen reader says « Fermer », not « bouton »
function a11yName(root = document) {
  for (const b of root.querySelectorAll('button:not([aria-label]), [role=button]:not([aria-label])')) {
    const txt = b.textContent.trim();
    if ((!txt || txt.length <= 1 || /^[✕×X+<>▶◀★☆…⋮]$/.test(txt)) && b.title) b.setAttribute('aria-label', b.title);
    else if (txt === 'X' || txt === '✕') b.setAttribute('aria-label', 'Fermer');
  }
  for (const i of root.querySelectorAll('input:not([aria-label]):not([id]), select:not([aria-label]):not([id])')) if (i.placeholder || i.title) i.setAttribute('aria-label', i.placeholder || i.title);
  for (const img of root.querySelectorAll('img:not([alt])')) img.alt = '';  // decorative: the text next to it says what it is
}
// the windows of NeoDex (settings, history, questions…): a dialog, named by its title
for (const id of ['modal', 'evModal', 'setModal', 'histModal', 'quitModal', 'askModal']) {
  const m = $(id); if (!m) continue;
  const w = m.querySelector('.win') || m, h = m.querySelector('h2');
  w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
  if (h) { h.id ||= id + 'Title'; w.setAttribute('aria-labelledby', h.id); }
}
// the messages at the bottom right are read aloud without moving the focus
$('toast')?.setAttribute('role', 'status'); $('toast')?.setAttribute('aria-live', 'polite');
// tabs and home tiles are divs with a click: reachable with Tab, opened with Enter or Space
const a11yKeys = sel => { for (const e of document.querySelectorAll(sel)) if (!e.hasAttribute('tabindex')) { e.tabIndex = 0; if (!e.getAttribute('role')) e.setAttribute('role', 'button'); } };
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role=button]:not(button), [role=tab]:not(button)') && !e.target.closest('input,textarea,[contenteditable]')) { e.preventDefault(); e.target.click(); }
});
$('bTabs')?.setAttribute('role', 'tablist');
function a11yTabs() { for (const b of document.querySelectorAll('#bTabs .btab')) { if (!b.hasAttribute('tabindex')) { b.tabIndex = 0; b.setAttribute('role', 'tab'); } b.setAttribute('aria-selected', b.classList.contains('on')); } }
// everything added later (tabs, tiles, plugins' menus…) gets the same treatment, a moment after it appears
let a11yT = 0;
new MutationObserver(() => { clearTimeout(a11yT); a11yT = setTimeout(() => { a11yName(); a11yTabs(); a11yKeys('.tile:not(button), .nbWidget:not(button), .dlRow[onclick]'); }, 200); })
  .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
a11yName(); a11yTabs();
// Windows' own « reduce animations » counts as the NeoDex option when it was never set
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => typeof applyA11y === 'function' && applyA11y());
