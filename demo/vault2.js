/* The vault, second part (vault2-main.js): the two-factor codes, the check of the passwords, and a strong password offered on sign-up forms. */

// a sign-up form: offer a strong password (it is typed into the form by NeoDex, the page of NeoDex never sees it)
neo.onPwGenOffer(d => {
  const t = tabOfWc(d.wcId); if (!t) return;
  siteBar({ key: 'gen' + d.wcId, host: d.host, icon: '⚿', tab: t, timeout: 60e3, text: ': créer un mot de passe solide pour ce nouveau compte ?',
    actions: [{ label: 'Proposer un mot de passe solide', main: true, run: () => neo.pwFillNew({ wcId: d.wcId, host: d.host }).then(() => toast('Mot de passe solide rempli : valide le formulaire, NeoDex proposera de le garder dans le coffre'), e => toast(e.message.replace(/^.*Error: /, ''), true)) },
      { label: 'Non merci', run: () => {} }] });
});

/* ---------- the two-factor codes ---------- */
let totpTimer = 0;
async function totpRender() {
  const card = $('vtTotpCard'); if (!card) return;
  let list; try { list = await neo.totpList(); } catch { card.replaceChildren(); return; }
  const head = el('div', 'row'), add = el('button', 'btn px', 'Ajouter…');
  add.onclick = async () => {
    const text = await ask('Clé du site', '', 'le lien otpauth://… ou la clé affichée sous le QR code (« je ne peux pas scanner »)'); if (!text) return;
    const name = /^otpauth:/i.test(text.trim()) ? '' : await ask('Nom', '', 'par exemple GitHub'); if (name == null) return;
    try { await neo.totpAdd({ text, name }); toast('Code ajouté'); totpRender(); } catch (e) { toast(e.message.replace(/^.*Error: /, ''), true); }
  };
  head.append(el('span', 'label', 'Codes à deux facteurs · ' + list.length), add);
  const rows = list.map(c => {
    const r = el('div', 'txRow vtRow totpRow'), n = el('div', 'tn'), acts = el('div', 'dlInfo'), code = el('code', 'totpCode', c.code.replace(/^(\d{3})(\d+)$/, '$1 $2')), bar = el('i', 'totpBar');
    bar.style.width = Math.round(c.left / c.period * 100) + '%'; bar.setAttribute('aria-hidden', 'true');
    n.append(c.name, el('small', '', (c.account ? c.account + ' · ' : '') + 'change dans ' + c.left + ' s'), bar);
    const act = (label, f) => { const b = el('button', '', label); b.onclick = f; acts.append(b); };
    act('COPIER', () => { navigator.clipboard.writeText(c.code); toast('Code copié'); });
    act('RENOMMER', async () => { const v = await ask('Nom', c.name); if (v) { await neo.totpRename({ id: c.id, name: v }); totpRender(); } });
    act('SUPPRIMER', async () => { if (await nbConfirm('Supprimer le code de « ' + c.name + ' » ? Garde un autre moyen de te connecter (codes de secours), sinon tu ne pourras plus entrer sur ce compte.')) { await neo.totpRemove(c.id); totpRender(); } });
    r.append(n, code, acts); return r;
  });
  card.replaceChildren(head, ...(rows.length ? rows : [el('div', 'hint', 'Aucun code. Sur un site, active la « double authentification » (2FA) avec une appli : colle ici la clé qu\'il te donne, NeoDex affiche le code à 6 chiffres.')]));
  clearTimeout(totpTimer);
  if (list.length && active?.app === APPS['neodex:vault'] && !document.hidden) totpTimer = setTimeout(totpRender, 1000);  // the codes change every 30 s
}

/* ---------- the check of the passwords ---------- */
let pwIssues = null;  // id -> what is wrong (null: not checked yet)
async function pwCheck(leaks) {
  try { pwIssues = await neo.pwAudit(leaks); } catch (e) { return toast(e.message.replace(/^.*Error: /, ''), true); }
  const bad = Object.values(pwIssues).filter(w => w.length).length;
  toast(bad ? bad + ' mot' + (bad > 1 ? 's' : '') + ' de passe à changer' : 'Tous tes mots de passe vont bien' + (leaks ? ', aucun dans les fuites connues' : ''));
  pwRender();
}
