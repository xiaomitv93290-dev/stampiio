const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const toast = (m) => {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
};

const state = JSON.parse(localStorage.getItem('stampiioDemo') || 'null') || {
  points: 250,
  customers: [
    ['Yasine B.', 'yasine@email.com', '250', 'Actif'],
    ['Emma L.', 'emma@email.com', '180', 'Actif'],
    ['Lucas D.', 'lucas@email.com', '80', 'Actif'],
    ['Sophie M.', 'sophie@email.com', '320', 'VIP']
  ],
  rewards: [
    ['Boisson offerte', 300, 12, true],
    ['Dessert offert', 500, 8, true],
    ['-10 % sur l’addition', 750, 5, true]
  ],
  transactions: [
    ['Yasine B.', '+50', 'Gain', 'Aujourd’hui 10:24'],
    ['Emma L.', '+20', 'Gain', 'Aujourd’hui 10:15'],
    ['Lucas D.', '-100', 'Récompense', 'Hier 18:42'],
    ['Sophie M.', '+30', 'Gain', 'Hier 16:09']
  ]
};

const save = () => localStorage.setItem('stampiioDemo', JSON.stringify(state));
let scannerStream = null;

const comparisonItems = [
  ['Carte perdue', false, true], ['Apple Wallet', false, true], ['Google Wallet', false, true],
  ['QR Code', false, true], ['Tampons numériques', false, true], ['Récompenses automatiques', false, true],
  ['Statistiques', false, true], ['Notifications', false, true], ['Mises à jour instantanées', false, true],
  ['Écologique', false, true], ['Aucune impression', false, true], ['Compatible plusieurs établissements', false, true],
  ['Support', false, true]
];

const trustItems = [
  ['credit-card', 'Paiement sécurisé Stripe', 'Paiement sécurisé via Stripe.'],
  ['apple', 'Compatible Apple Wallet', 'Ajout en un clic.'],
  ['wallet-cards', 'Compatible Google Wallet', 'Fonctionne sur Android.'],
  ['server', 'Hébergement européen', 'Infrastructure hébergée en Europe.'],
  ['rocket', 'Mise en place rapide', 'Votre programme prêt en quelques minutes.'],
  ['headphones', 'Support réactif', 'Une équipe disponible pour vous accompagner.']
];

const faqItems = [
  ["Est-ce que mes clients doivent télécharger une application ?", "Non. Les cartes sont ajoutées directement dans Apple Wallet ou Google Wallet sans installer une application Stampiio."],
  ["Est-ce compatible avec iPhone et Android ?", "Oui. Stampiio fonctionne avec Apple Wallet sur iPhone et Google Wallet sur les appareils Android compatibles."],
  ["Combien de temps faut-il pour démarrer ?", "Quelques minutes suffisent pour créer votre compte, personnaliser votre carte et commencer à fidéliser vos clients."],
  ["Puis-je utiliser mon propre logo ?", "Oui. Vous pouvez personnaliser votre carte avec votre logo, vos couleurs et votre identité visuelle."],
  ["Puis-je résilier à tout moment ?", "Oui. Aucun engagement de durée. Vous pouvez résilier votre abonnement depuis votre espace client."],
  ["Mes données sont-elles sécurisées ?", "Oui. Les données sont protégées selon les bonnes pratiques de sécurité et les paiements sont traités par Stripe."],
  ["Les clients doivent-ils créer un compte ?", "Non. Ils peuvent ajouter leur carte très rapidement avec un simple scan du QR Code."],
  ["Combien de cartes puis-je créer ?", "Cela dépend de votre formule d'abonnement."],
  ["À quoi correspondent les frais d'inscription de 100 € ?", "Ils sont facturés une seule fois lors de l'activation de votre compte. Ils couvrent la configuration de votre espace Stampiio, la personnalisation initiale de votre programme de fidélité et l'accompagnement à la mise en service. Ils ne sont pas refacturés lors des renouvellements mensuels."]
];

function renderMarketingComponents() {
  const comparison = $('#comparisonRows');
  if (comparison) comparison.innerHTML = comparisonItems.map(([label, paper, stampiio]) => `
    <tr><th scope="row">${label}</th>${[paper, stampiio].map(value => `<td><span class="comparison-status ${value ? 'yes' : 'no'}" aria-label="${value ? 'Inclus' : 'Non inclus'}"><i data-lucide="${value ? 'check' : 'x'}"></i></span></td>`).join('')}</tr>
  `).join('');

  const trust = $('#trustGrid');
  if (trust) trust.innerHTML = trustItems.map(([icon, title, copy]) => `
    <article class="trust-card reveal"><div class="trust-card-icon"><i data-lucide="${icon}"></i></div><div><h3>${title}</h3><p>${copy}</p></div></article>
  `).join('');

  const faq = $('#premiumFaq');
  if (faq) faq.innerHTML = faqItems.map(([question, answer]) => `
    <details class="reveal"><summary>${question}<i data-lucide="plus" aria-hidden="true"></i></summary><p>${answer}</p></details>
  `).join('');
}

function initRoiCalculator() {
  const form = $('#roiForm');
  if (!form) return;
  const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const update = () => {
    const clients = Math.max(0, Number($('#roiClients').value) || 0);
    const basket = Math.max(0, Number($('#roiBasket').value) || 0);
    const visits = Math.max(0, Number($('#roiVisits').value) || 0);
    const rate = Number($('#roiRate').value) / 100;
    const extraClients = Math.round(clients * rate);
    const extraVisits = Math.round(extraClients * visits);
    const revenue = extraVisits * basket;
    $('#roiRateOutput').textContent = `${Math.round(rate * 100)} %`;
    $('#roiExtraClients').textContent = integer.format(extraClients);
    $('#roiExtraVisits').textContent = integer.format(extraVisits);
    $('#roiRevenue').textContent = money.format(revenue);
    $('#roiAnnualGain').textContent = money.format(revenue);
    $('.roi-result').classList.remove('updated');
    requestAnimationFrame(() => $('.roi-result').classList.add('updated'));
  };
  form.addEventListener('input', update);
  update();
}

function initScrollReveal() {
  const items = $$('.reveal');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  items.forEach(item => observer.observe(item));
}

renderMarketingComponents();
initRoiCalculator();
initScrollReveal();

function stopScanner() {
  if (!scannerStream) return;
  scannerStream.getTracks().forEach(track => track.stop());
  scannerStream = null;
}

// Initialize Icons for static HTML
if (window.lucide) window.lucide.createIcons();

// UI Interactions
$$('[data-open]').forEach(b => b.onclick = () => $('#' + b.dataset.open).classList.add('open'));
$$('.modal-close').forEach(b => b.onclick = () => b.closest('.modal').classList.remove('open'));
$$('.modal').forEach(m => m.onclick = e => { if (e.target === m) m.classList.remove('open') });
$('#menuBtn').onclick = () => $('.site-header').classList.toggle('open');
$('#loginForm').onsubmit = e => { e.preventDefault(); openApp('dashboard') };
$('#contactForm').onsubmit = e => { e.preventDefault(); e.target.closest('.modal').classList.remove('open'); e.target.reset(); toast('Votre demande a bien été envoyée.') };
$$('[data-demo]').forEach(b => b.onclick = () => openApp(b.dataset.demo));

const euro = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
$$('.pricing-cta').forEach(button => button.onclick = () => {
  const monthlyPrice = Number(button.dataset.price);
  const nextPayment = new Date();
  nextPayment.setDate(nextPayment.getDate() + 14);
  $('#checkoutPlan').textContent = button.dataset.plan;
  $('#checkoutMonthly').textContent = `${euro(monthlyPrice)}/mois`;
  $('#checkoutNextAmount').textContent = euro(monthlyPrice);
  $('#checkoutNextDate').textContent = nextPayment.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#checkoutModal').classList.add('open');
});

$('#confirmCheckout').onclick = () => toast("Le paiement Stripe nécessite l'intégration serveur de production.");

function openApp(view = 'dashboard') {
  $$('.modal').forEach(m => m.classList.remove('open'));
  $('#publicSite').classList.add('hidden');
  $('#publicHeader').classList.add('hidden');
  $('#publicFooter').classList.add('hidden');
  $('#appShell').classList.remove('hidden');
  render(view);
  window.scrollTo(0, 0);
}

$('#logoutBtn').onclick = () => {
  stopScanner();
  $('#appShell').classList.add('hidden');
  $('#publicSite').classList.remove('hidden');
  $('#publicHeader').classList.remove('hidden');
  $('#publicFooter').classList.remove('hidden');
  window.scrollTo(0, 0);
};

$('#mobileSide').onclick = () => $('.sidebar').classList.toggle('open');
$$('#appNav button').forEach(b => b.onclick = () => { render(b.dataset.view); $('.sidebar').classList.remove('open') });

function setNav(view) {
  $$('#appNav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const b = $(`#appNav button[data-view="${view}"]`);
  $('#appCrumb').textContent = b ? b.textContent.trim() : 'Stampiio';
}

function render(view) {
  stopScanner();
  setNav(view);
  const f = views[view] || views.dashboard;
  $('#viewContainer').innerHTML = f();
  bindView(view);
  if (window.lucide) window.lucide.createIcons();
}

const kpi = (label, value, delta = '', icon = '') => 
  `<div class="kpi">
    <div class="kpi-header"><small>${label}</small>${icon ? `<i data-lucide="${icon}"></i>` : ''}</div>
    <strong>${value}</strong>
    ${delta ? `<span class="delta">${delta}</span>` : ''}
  </div>`;

const views = {
  dashboard: () => `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Bonjour Yasine 👋</h1>
          <p>Voici un aperçu de l’activité de votre programme.</p>
        </div>
        <button class="btn btn-primary" data-go="scanner"><i data-lucide="scan-line"></i> Scanner un client</button>
      </div>
      <div class="kpi-grid">
        ${kpi('Clients actifs', '248', '+12 ce mois', 'users')}
        ${kpi('Points distribués', '3 750', '+8 % ce mois', 'star')}
        ${kpi('Récompenses utilisées', '32', '+4 ce mois', 'gift')}
        ${kpi('Cartes Wallet', '221', '89 % des clients', 'wallet')}
      </div>
      <div class="dash-grid">
        <section class="panel">
          <h3><i data-lucide="trending-up"></i> Évolution des inscriptions</h3>
          <div class="chart">
            ${[28, 40, 55, 48, 70, 62, 82, 95, 88, 115, 132, 148].map(v => `<div class="chart-bar"><span style="height:${v}px"></span></div>`).join('')}
          </div>
        </section>
        <section class="panel">
          <h3><i data-lucide="activity"></i> Dernières transactions</h3>
          <table class="data-table">
            ${state.transactions.slice(0, 5).map(x => `
              <tr>
                <td><b>${x[0]}</b><br><small>${x[3]}</small></td>
                <td><span class="badge ${x[2] === 'Gain' ? 'green' : 'red'}">${x[1]} pts</span></td>
              </tr>
            `).join('')}
          </table>
        </section>
      </div>
    </div>`,
    
  customers: () => `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Clients</h1>
          <p>Gérez les membres de votre programme.</p>
        </div>
        <div class="toolbar">
          <input class="search" id="customerSearch" placeholder="Rechercher...">
          <button class="btn btn-primary" id="addCustomer"><i data-lucide="plus"></i> Ajouter</button>
        </div>
      </div>
      <section class="panel">
        <table class="data-table">
          <thead><tr><th>Client</th><th>E-mail</th><th>Points</th><th>Statut</th><th></th></tr></thead>
          <tbody id="customerRows">${customerRows(state.customers)}</tbody>
        </table>
      </section>
    </div>`,
    
  transactions: () => `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Transactions</h1>
          <p>Historique complet des gains et récompenses.</p>
        </div>
        <button class="btn btn-secondary" id="exportBtn"><i data-lucide="download"></i> Exporter CSV</button>
      </div>
      <section class="panel">
        <table class="data-table">
          <thead><tr><th>Client</th><th>Mouvement</th><th>Type</th><th>Date</th></tr></thead>
          <tbody>
            ${state.transactions.map(x => `
              <tr>
                <td>${x[0]}</td>
                <td><b>${x[1]} pts</b></td>
                <td><span class="badge ${x[2] === 'Gain' ? 'green' : 'red'}">${x[2]}</span></td>
                <td>${x[3]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    </div>`,
    
  rewards: () => `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Récompenses</h1>
          <p>Créez les avantages proposés à vos clients.</p>
        </div>
        <button class="btn btn-primary" id="addReward"><i data-lucide="plus"></i> Créer une récompense</button>
      </div>
      <section class="panel">
        <table class="data-table">
          <thead><tr><th>Nom</th><th>Coût</th><th>Utilisations</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            ${state.rewards.map((r, i) => `
              <tr>
                <td><b>${r[0]}</b></td>
                <td>${r[1]} points</td>
                <td>${r[2]}</td>
                <td><span class="badge ${r[3] ? 'green' : 'red'}">${r[3] ? 'Active' : 'Inactive'}</span></td>
                <td><button class="btn btn-ghost reward-toggle" data-i="${i}">${r[3] ? 'Désactiver' : 'Activer'}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    </div>`,
    
  program: () => `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Personnalisation de la carte</h1>
          <p>Modifiez le contenu et l’apparence de votre carte Wallet.</p>
        </div>
        <button class="btn btn-primary" id="saveProgram"><i data-lucide="save"></i> Enregistrer</button>
      </div>
      <div class="editor-grid">
        <div>
          <section class="panel" style="padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-color: transparent;">
            <h3 style="font-size: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 24px;"><i data-lucide="palette"></i> Apparence de la carte</h3>
            <div class="form-grid" style="gap: 20px;">
              <label>Nom du commerce<input id="businessName" value="LE PETIT CAFÉ"></label>
              <label>Nom du programme<input id="programName" value="CARTE DE FIDÉLITÉ"></label>
              
              <div style="display:flex; gap:16px;">
                <label style="flex:1;">Couleur principale
                  <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                    <input id="colorA" type="color" value="#0500FF" style="padding:0; width:36px; height:36px; border-radius:8px; cursor:pointer;">
                    <span style="font-size:12px; color:var(--ink-soft); font-family:monospace;">#0500FF</span>
                  </div>
                </label>
                <label style="flex:1;">Couleur secondaire
                  <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                    <input id="colorB" type="color" value="#0018A8" style="padding:0; width:36px; height:36px; border-radius:8px; cursor:pointer;">
                    <span style="font-size:12px; color:var(--ink-soft); font-family:monospace;">#0018A8</span>
                  </div>
                </label>
              </div>

              <label>Couleur du texte
                <select id="textColor" style="margin-top:6px;">
                  <option value="#ffffff">Clair (Recommandé)</option>
                  <option value="#111111">Sombre</option>
                </select>
              </label>

              <label style="grid-column: 1 / -1;">Logo du commerce
                <div style="border: 2px dashed var(--border); border-radius: var(--radius-lg); padding: 20px; text-align: center; margin-top: 6px; cursor: pointer; position: relative; background: var(--bg-alt); transition: border .2s;">
                  <input type="file" id="logoUpload" accept="image/*" style="opacity: 0; position: absolute; inset: 0; cursor: pointer; z-index: 2;">
                  <i data-lucide="upload-cloud" style="color: var(--brand); margin-bottom: 8px;"></i>
                  <div style="font-size: 13px; font-weight: 500;">Cliquez ou glissez votre logo personnel</div>
                </div>
              </label>

              <div style="grid-column: 1 / -1; margin-top: 8px;">
                <label style="margin-bottom: 12px; display:block;">Banques gratuites à disposition</label>
                
                <div style="margin-bottom: 16px;">
                  <span style="font-size: 12px; color: var(--ink-soft); display:block; margin-bottom:8px;">Logos génériques prêts à l'emploi</span>
                  <div style="display:flex; gap: 10px; flex-wrap:wrap;">
                    <button class="preset-btn" data-type="logo" data-val="coffee" style="width:50px; height:50px; border-radius:12px; border:1px solid var(--border); background:#fff; display:grid; place-items:center; cursor:pointer;"><i data-lucide="coffee"></i></button>
                    <button class="preset-btn" data-type="logo" data-val="scissors" style="width:50px; height:50px; border-radius:12px; border:1px solid var(--border); background:#fff; display:grid; place-items:center; cursor:pointer;"><i data-lucide="scissors"></i></button>
                    <button class="preset-btn" data-type="logo" data-val="pizza" style="width:50px; height:50px; border-radius:12px; border:1px solid var(--border); background:#fff; display:grid; place-items:center; cursor:pointer;"><i data-lucide="pizza"></i></button>
                    <button class="preset-btn" data-type="logo" data-val="shopping-bag" style="width:50px; height:50px; border-radius:12px; border:1px solid var(--border); background:#fff; display:grid; place-items:center; cursor:pointer;"><i data-lucide="shopping-bag"></i></button>
                  </div>
                </div>

                <div>
                  <span style="font-size: 12px; color: var(--ink-soft); display:block; margin-bottom:8px;">Arrière-plans haute qualité (Unsplash)</span>
                  <div style="display:flex; gap: 10px; flex-wrap:wrap;">
                    <button class="preset-btn" data-type="bg" data-val="" style="width:70px; height:50px; border-radius:8px; border:1px solid var(--border); background:#fff; font-size:11px; cursor:pointer;">Aucun</button>
                    <button class="preset-btn" data-type="bg" data-val="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80" style="width:70px; height:50px; border-radius:8px; border:0; background:url(https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200) center/cover; cursor:pointer;"></button>
                    <button class="preset-btn" data-type="bg" data-val="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" style="width:70px; height:50px; border-radius:8px; border:0; background:url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200) center/cover; cursor:pointer;"></button>
                    <button class="preset-btn" data-type="bg" data-val="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" style="width:70px; height:50px; border-radius:8px; border:0; background:url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200) center/cover; cursor:pointer;"></button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="panel" style="padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-color: transparent;">
            <h3 style="font-size: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 24px;"><i data-lucide="gift"></i> Règles de fidélité</h3>
            <div class="form-grid" style="gap: 20px;">
              <label>Points requis pour la récompense<input id="rewardThreshold" type="number" value="300"></label>
              <label>Nom de la récompense<input id="rewardName" value="1 boisson offerte"></label>
              <label>Mécanique de gain
                <select style="margin-top:6px;">
                  <option>Points</option>
                  <option>Tampons</option>
                  <option>Visites</option>
                </select>
              </label>
              <label>Valeur par achat<input value="1 € = 1 point"></label>
            </div>
          </section>
        </div>
        <aside class="wallet-preview wallet-editor-preview">
          <div class="preview-heading">
            <span>Aperçu en direct</span>
            <small>Les modifications apparaissent instantanément</small>
          </div>
          <div class="phone-frame editor-phone-frame">
            <img src="assets/iphone-frame.png" class="phone-img" alt="iPhone">
            <div class="phone-screen editor-phone-screen">
              <div class="wallet-phone-bar">
                <strong>Terminé</strong>
                <span>•••</span>
              </div>
              <div class="preview-card editor-pass" id="previewCard">
                <div class="editor-pass-head">
                  <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    <div id="previewLogo" class="editor-pass-logo"><i data-lucide="coffee"></i></div>
                    <span class="title" id="pBusiness">LE PETIT CAFÉ</span>
                  </div>
                  <div style="text-align:right;">
                    <div class="sub" id="pProgram">CARTE DE FIDÉLITÉ</div>
                    <div class="editor-pass-points">${state.points} PTS</div>
                  </div>
                </div>
                <div class="editor-pass-content">
                  <span>Prochaine récompense</span>
                  <strong id="pRewardTitle">1 boisson offerte</strong>
                  <small id="pRewardSub">dès 300 points</small>
                </div>
                <div class="editor-pass-code">
                  <div>
                    <i data-lucide="qr-code"></i>
                  </div>
                  <small>Présentez ce code en caisse</small>
                </div>
              </div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px; align-items:center;">
            <button class="wallet-brand-button wallet-add" aria-label="Ajouter à Apple Wallet"><img src="assets/applewallet.png" alt="Ajouter à Apple Wallet"></button>
            <button class="wallet-brand-button wallet-add" aria-label="Payer avec Google Pay"><img src="assets/gpay.png" alt="Google Pay"></button>
          </div>
        </aside>
      </div>
    </div>`,
    
  scanner: () => `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Scanner</h1>
          <p>Scannez la carte d'un client pour lui attribuer des points ou valider une récompense.</p>
        </div>
        <button class="btn btn-primary" id="openScanner"><i data-lucide="camera"></i> Ouvrir le scanner</button>
      </div>
      <div class="scanner-layout scanner-layout-clean">
        
        <!-- Left: Camera View -->
        <div class="scanner-box scanner-camera-panel">
          <video id="scannerVideo" playsinline muted style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none;"></video>
          
          <!-- Animated Tech Background Grid -->
          <div class="scanner-grid-bg" style="position:absolute; inset:0; background-image: 
            linear-gradient(rgba(74, 222, 128, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 222, 128, 0.1) 1px, transparent 1px);
            background-size: 30px 30px; animation: gridMove 20s linear infinite; opacity: 0.5;">
          </div>
          <style>@keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 300px 300px; } }</style>
          
          <!-- Camera Background Simulation -->
          <div class="scanner-camera-shade"></div>
          
          <!-- Viewfinder UI -->
          <div class="scanner-viewfinder">
            
            <!-- Glowing Corners -->
            <div style="position:absolute; top:0; left:0; width:40px; height:40px; border-top: 3px solid #4ADE80; border-left: 3px solid #4ADE80; border-radius: 8px 0 0 0; box-shadow: -4px -4px 15px rgba(74,222,128,0.3);"></div>
            <div style="position:absolute; top:0; right:0; width:40px; height:40px; border-top: 3px solid #4ADE80; border-right: 3px solid #4ADE80; border-radius: 0 8px 0 0; box-shadow: 4px -4px 15px rgba(74,222,128,0.3);"></div>
            <div style="position:absolute; bottom:0; left:0; width:40px; height:40px; border-bottom: 3px solid #4ADE80; border-left: 3px solid #4ADE80; border-radius: 0 0 0 8px; box-shadow: -4px 4px 15px rgba(74,222,128,0.3);"></div>
            <div style="position:absolute; bottom:0; right:0; width:40px; height:40px; border-bottom: 3px solid #4ADE80; border-right: 3px solid #4ADE80; border-radius: 0 0 8px 0; box-shadow: 4px 4px 15px rgba(74,222,128,0.3);"></div>
            
            <!-- Scanning Line -->
            <div class="scan-line" style="width: 100%; height: 3px; background: #4ADE80; box-shadow: 0 0 15px #4ADE80, 0 0 30px #4ADE80, 0 0 50px #4ADE80; position: absolute; left:0; right:0; top: 10%; animation: scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate; z-index: 5;"></div>
            
            <!-- QR code target with pulsing opacity -->
            <div style="animation: pulseOpacity 2s infinite alternate;">
              <i data-lucide="qr-code" style="color: rgba(74,222,128,0.4); width: 100px; height: 100px; filter: drop-shadow(0 0 10px rgba(74,222,128,0.5));"></i>
            </div>
            <style>@keyframes pulseOpacity { 0% { opacity: 0.3; transform: scale(0.95); } 100% { opacity: 0.8; transform: scale(1.05); } }</style>
          </div>
          
          <!-- Status Badge -->
          <div class="scanner-status-badge">
            <div class="scanner-status-dot"></div>
            <span id="scannerStatus" style="color:#4ADE80; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Prêt à scanner</span>
          </div>
        </div>

        <!-- Right: Client Profile -->
        <section class="panel customer-card scanner-customer-panel">
          <div style="width: 80px; height: 80px; background: var(--brand-bg); color: var(--brand); border-radius: 50%; display:flex; align-items:center; justify-content:center; margin-bottom: 16px; border: 4px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <i data-lucide="user" style="width: 32px; height: 32px;"></i>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; margin:0 0 8px; color: var(--ink);">Client Anonyme</h2>
          <div style="display:inline-flex; align-items:center; gap:6px; padding: 6px 12px; background: var(--bg-alt); border-radius: 20px; font-size: 12px; color: var(--ink-soft); margin-bottom: 24px;">
            <i data-lucide="clock" style="width:14px; height:14px;"></i> Dernier passage : hier
          </div>
          
          <div class="scanner-balance-card">
            <div style="font-size: 13px; color: var(--ink-soft); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Solde actuel</div>
            <div style="font-family: var(--mono); font-size: 42px; font-weight: 800; color: var(--brand); line-height: 1;" id="scanBalance">${state.points} <span style="font-size:20px;">PTS</span></div>
            <div style="margin-top: 12px; height: 4px; background: var(--border); border-radius: 2px; overflow:hidden;">
              <div style="width: 80%; height: 100%; background: var(--brand);"></div>
            </div>
            <p style="color:var(--ink-soft); font-size:12px; margin-top:12px;">Plus que <strong>50 pts</strong> avant la prochaine récompense.</p>
          </div>
          
          <div style="display:flex; gap:12px; width:100%;">
            <button class="btn btn-primary" style="flex:1; padding: 14px; font-size: 15px;" id="addPoints"><i data-lucide="plus-circle"></i> Ajouter 10 Pts</button>
            <button class="btn btn-secondary" style="flex:1; padding: 14px; font-size: 15px;" id="useReward"><i data-lucide="gift"></i> Utiliser</button>
          </div>
        </section>
      </div>
    </div>`,
    
  employees: () => `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Employés</h1>
          <p>Gérez les accès de votre équipe.</p>
        </div>
        <button class="btn btn-primary" id="inviteEmployee"><i data-lucide="user-plus"></i> Inviter</button>
      </div>
      <section class="panel">
        <table class="data-table">
          <tr><th>Nom</th><th>Rôle</th><th>Dernière activité</th><th>Statut</th></tr>
          <tr><td>Yasine Souayah</td><td>Administrateur</td><td>Maintenant</td><td><span class="badge green">Actif</span></td></tr>
          <tr><td>Léa Girard</td><td>Employée</td><td>Aujourd’hui 10:24</td><td><span class="badge green">Actif</span></td></tr>
          <tr><td>Karim B.</td><td>Employé</td><td>Hier 18:42</td><td><span class="badge green">Actif</span></td></tr>
        </table>
      </section>
    </div>`,
    
  settings: () => {
    const tab = state.settingsTab || 'commerce';
    let content = '';
    if (tab === 'commerce') {
      content = `
      <section class="panel">
        <div class="form-grid">
          <label>Nom commercial<input value="Le Petit Café"></label>
          <label>SIRET<input value="123 456 789 00012"></label>
          <label>E-mail<input value="contact@lepetitcafe.fr"></label>
          <label>Téléphone<input value="01 23 45 67 89"></label>
          <label>Adresse<input value="12 rue du Marché, Paris"></label>
        </div>
        <button class="btn btn-primary" style="margin-top:20px;" id="saveSettings"><i data-lucide="save"></i> Enregistrer les modifications</button>
      </section>`;
    } else if (tab === 'abonnement') {
      content = `
      <section class="panel" style="padding: 32px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px;">
          <div>
            <h3 style="font-size:18px; margin-bottom:4px;">Votre formule actuelle</h3>
            <p style="color:var(--ink-soft); font-size:14px;">Vous êtes actuellement sur le plan Pro.</p>
          </div>
          <div style="background:var(--brand-bg); color:var(--brand); padding:6px 12px; border-radius:20px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px;">
            <i data-lucide="zap" style="width:16px; height:16px;"></i> Plan Pro Actif
          </div>
        </div>
        
        <div style="display:flex; gap: 24px; flex-wrap: wrap;">
          <div style="flex:1; min-width: 250px; background: var(--bg-alt); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
            <div style="font-size:32px; font-weight:800; color:var(--ink); margin-bottom:4px;">39,90 € <span style="font-size:14px; font-weight:500; color:var(--ink-soft);">/ mois</span></div>
            <div style="font-size:13px; color:var(--ink-soft); margin-bottom:16px;">Prochain prélèvement le 12 août 2026</div>
            <div style="font-size:13px; font-weight:600; color:var(--ink); margin-bottom:8px;">Méthode de paiement :</div>
            <div style="padding:12px; background:#fff; border:1px solid var(--border); border-radius:var(--radius); display:flex; align-items:center; gap:10px;">
              <i data-lucide="credit-card" style="color:var(--ink-soft);"></i> **** **** **** 4242
            </div>
            <div class="toolbar" style="margin-top: 16px;">
              <button class="btn btn-secondary" style="flex:1;">Modifier</button>
              <button class="btn btn-ghost" style="color:var(--red);">Résilier</button>
            </div>
          </div>
          
          <div style="flex:1; min-width: 250px; background: linear-gradient(145deg, #111, #222); color:#fff; padding: 24px; border-radius: var(--radius-lg); position:relative; overflow:hidden;">
            <div style="position:absolute; top:-20px; right:-20px; opacity:0.1;"><i data-lucide="trending-up" style="width:120px; height:120px;"></i></div>
            <div style="position:relative; z-index:2;">
              <div style="display:inline-block; background:rgba(255,255,255,0.2); padding:4px 10px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:12px;">Recommandé</div>
              <h4 style="font-size:20px; font-weight:700; margin-bottom:8px;">Passez au Plan Premium</h4>
              <p style="font-size:13px; opacity:0.8; margin-bottom:16px; line-height:1.5;">Débloquez des campagnes SMS, des cartes Apple Wallet illimitées et des statistiques poussées.</p>
              <div style="font-size:24px; font-weight:800; margin-bottom:6px;">79,90 € <span style="font-size:14px; font-weight:500; opacity:0.7;">/ mois</span></div>
              <div style="font-size:13px; opacity:0.8; margin-bottom:20px;">Frais de mise en service de 99 €, payés une seule fois.</div>
              <button class="btn btn-primary" style="width:100%; background:#fff; color:#000; border:none; padding:12px;"><i data-lucide="arrow-up-circle"></i> Upgrader maintenant</button>
            </div>
          </div>
        </div>
      </section>`;
    } else if (tab === 'securite') {
      content = `
      <section class="panel">
        <h3>Mot de passe</h3>
        <div class="form-grid" style="margin-top: 16px;">
          <label>Ancien mot de passe<input type="password"></label>
          <div></div>
          <label>Nouveau mot de passe<input type="password"></label>
          <label>Confirmer le mot de passe<input type="password"></label>
        </div>
        <button class="btn btn-primary" style="margin-top:20px;">Mettre à jour le mot de passe</button>
        
        <hr style="border:0; border-top:1px solid var(--border-light); margin: 30px 0;">
        
        <h3>Authentification à deux facteurs (2FA)</h3>
        <p style="font-size:13px; color:var(--ink-soft); margin-bottom:16px;">Sécurisez votre compte avec une étape supplémentaire lors de la connexion.</p>
        <button class="btn btn-secondary"><i data-lucide="shield"></i> Activer la 2FA</button>
      </section>`;
    }
    
    return `
    <div class="view">
      <div class="view-head">
        <div>
          <h1>Paramètres</h1>
          <p>Gérez votre commerce et votre abonnement.</p>
        </div>
      </div>
      <div class="settings-tabs">
        <button class="${tab === 'commerce' ? 'active' : ''}" data-tab="commerce">Commerce</button>
        <button class="${tab === 'abonnement' ? 'active' : ''}" data-tab="abonnement">Abonnement</button>
        <button class="${tab === 'securite' ? 'active' : ''}" data-tab="securite">Sécurité</button>
      </div>
      ${content}
    </div>`;
  }
};

function customerRows(rows) {
  return rows.map((c, i) => `
    <tr>
      <td><b>${c[0]}</b></td>
      <td>${c[1]}</td>
      <td>${c[2]}</td>
      <td><span class="badge green">${c[3]}</span></td>
      <td><button class="btn btn-ghost delete-customer" data-i="${i}"><i data-lucide="trash-2"></i></button></td>
    </tr>
  `).join('');
}

function bindView(view) {
  $$('[data-go]').forEach(b => b.onclick = () => render(b.dataset.go));
  
  if (view === 'customers') {
    const input = $('#customerSearch');
    input.oninput = () => {
      $('#customerRows').innerHTML = customerRows(state.customers.filter(c => c.join(' ').toLowerCase().includes(input.value.toLowerCase())));
      bindDeletes();
      if (window.lucide) window.lucide.createIcons();
    };
    $('#addCustomer').onclick = () => {
      const n = prompt('Nom du client :');
      if (!n) return;
      state.customers.unshift([n, 'nouveau@client.fr', '0', 'Actif']);
      save();
      render('customers');
      toast('Client ajouté.');
    };
    bindDeletes();
  }
  
  if (view === 'transactions') {
    $('#exportBtn').onclick = exportCSV;
  }
  
  if (view === 'rewards') {
    $('#addReward').onclick = () => {
      const n = prompt('Nom de la récompense :');
      if (!n) return;
      state.rewards.push([n, 300, 0, true]);
      save();
      render('rewards');
    };
    $$('.reward-toggle').forEach(b => b.onclick = () => {
      state.rewards[b.dataset.i][3] = !state.rewards[b.dataset.i][3];
      save();
      render('rewards');
    });
  }
  
  if (view === 'program') {
    ['businessName', 'programName', 'rewardThreshold', 'rewardName', 'colorA', 'colorB', 'textColor'].forEach(id => {
      const el = $('#' + id);
      if (el) el.oninput = updatePreview;
    });
    if ($('#logoUpload')) $('#logoUpload').onchange = (e) => {
      state.presetLogo = null;
      updatePreview();
    };
    
    $$('.preset-btn').forEach(btn => {
      btn.onclick = () => {
        if (btn.dataset.type === 'logo') {
          state.presetLogo = btn.dataset.val;
          if ($('#logoUpload')) $('#logoUpload').value = '';
        } else if (btn.dataset.type === 'bg') {
          state.presetBg = btn.dataset.val;
        }
        updatePreview();
      };
    });

    $('#saveProgram').onclick = () => toast('Programme enregistré.');
    $$('.wallet-add').forEach(b => b.onclick = () => toast('Mode démo : ajoutez vos certificats Wallet pour générer une vraie carte.'));
    updatePreview();
  }
  
  if (view === 'scanner') {
    $('#openScanner').onclick = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        return toast("Votre navigateur ne permet pas d'ouvrir la caméra.");
      }

      try {
        scannerStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        const video = $('#scannerVideo');
        video.srcObject = scannerStream;
        video.style.display = 'block';
        await video.play();
        $('#scannerStatus').textContent = 'Scan en cours...';
        $('#openScanner').innerHTML = '<i data-lucide="camera"></i> Scanner ouvert';
        $('#openScanner').disabled = true;
        if (window.lucide) window.lucide.createIcons();
        toast('Scanner ouvert. Placez le QR code dans le cadre.');
      } catch (error) {
        stopScanner();
        toast("Impossible d'ouvrir la caméra. Vérifiez son autorisation.");
      }
    };
    $('#addPoints').onclick = () => {
      state.points += 10;
      state.transactions.unshift(['Yasine B.', '+10', 'Gain', 'À l’instant']);
      save();
      $('#scanBalance').textContent = state.points + ' pts';
      toast('10 points ajoutés.');
    };
    $('#useReward').onclick = () => {
      if (state.points < 300) return toast('Solde insuffisant pour cette récompense.');
      state.points -= 300;
      state.transactions.unshift(['Yasine B.', '-300', 'Récompense', 'À l’instant']);
      save();
      $('#scanBalance').textContent = state.points + ' pts';
      toast('Récompense utilisée.');
    };
  }
  
  if (view === 'employees') {
    $('#inviteEmployee').onclick = () => toast('Invitation employé envoyée en mode démo.');
  }
  
  if (view === 'settings') {
    $$('.settings-tabs button').forEach(b => b.onclick = () => {
      state.settingsTab = b.dataset.tab;
      save();
      render('settings');
    });
    if ($('#saveSettings')) $('#saveSettings').onclick = () => toast('Paramètres enregistrés.');
  }
}

function bindDeletes() {
  $$('.delete-customer').forEach(b => b.onclick = () => {
    state.customers.splice(+b.dataset.i, 1);
    save();
    render('customers');
    toast('Client supprimé.');
  });
}

function updatePreview() {
  const a = $('#colorA').value, b = $('#colorB').value;
  
  if (state.presetBg) {
    $('#previewCard').style.background = `url(${state.presetBg}) center/cover`;
  } else {
    $('#previewCard').style.background = `linear-gradient(150deg, ${a}, ${b})`;
  }
  
  $('#previewCard').style.color = $('#textColor').value;
  
  const logoFile = $('#logoUpload') && $('#logoUpload').files[0];
  if (logoFile) {
    $('#previewLogo').innerHTML = `<img src="${URL.createObjectURL(logoFile)}" style="max-height:100%; max-width:100%; object-fit:contain;">`;
  } else if (state.presetLogo) {
    $('#previewLogo').innerHTML = `<i data-lucide="${state.presetLogo}"></i>`;
  } else {
    $('#previewLogo').innerHTML = '<i data-lucide="coffee"></i>';
  }

  $('#pBusiness').textContent = $('#businessName').value;
  $('#pProgram').textContent = $('#programName').value;
  $('#pRewardTitle').textContent = $('#rewardName').value;
  $('#pRewardSub').textContent = `dès ${$('#rewardThreshold').value} points`;
  
  if (window.lucide) window.lucide.createIcons();
}

function exportCSV() {
  const rows = [['Client', 'Mouvement', 'Type', 'Date'], ...state.transactions];
  const csv = rows.map(r => r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = 'transactions-stampiio.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Export CSV téléchargé.');
}
