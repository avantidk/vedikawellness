(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // bilingual snippet: both languages in the DOM, CSS shows the active one
  function bi(en, hi) { return '<span class="en">' + esc(en) + '</span><span class="hi" lang="hi">' + esc(hi) + '</span>'; }
  function isHi() { return root.dataset.lang === 'hi'; }
  function tr(en, hi) { return isHi() ? hi : en; }

  var scriptEl = document.currentScript || $('script[src$="script.js"]');
  var BASE = scriptEl.src.replace(/script\.js.*$/, '');
  var WA_NUMBER = '918193989452';
  var COACH_EMAIL = 'vedikawellness01@gmail.com';

  /* ---------- Language + theme ---------- */
  $('#langBtn').addEventListener('click', function () {
    var l = isHi() ? 'en' : 'hi';
    root.dataset.lang = l; root.lang = l === 'hi' ? 'hi' : 'en';
    store.set('vw-lang', l);
  });
  $('#themeBtn').addEventListener('click', function () {
    var t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = t; store.set('vw-theme', t);
    var m = $('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#101c16' : '#2f7a35';
  });

  /* ---------- Menu ---------- */
  var btn = $('#menuBtn'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  btn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  var hdr = $('#siteHeader');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll reveal ---------- */
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .1 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- Hero carousel ---------- */
  var hs = $$('.hslide');
  if (hs.length) {
    var hd = $('#heroDots'), hcur = 0, htimer;
    var hgo = function (i) {
      hcur = i;
      hs.forEach(function (s, n) { s.classList.toggle('active', n === i); s.setAttribute('aria-hidden', n !== i); });
      $$('button', hd).forEach(function (b, n) { b.classList.toggle('on', n === i); });
    };
    var hstart = function () {
      clearInterval(htimer);
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      htimer = setInterval(function () { hgo((hcur + 1) % hs.length); }, 7000);
    };
    hs.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      b.addEventListener('click', function () { hgo(i); hstart(); });
      hd.appendChild(b);
    });
    hgo(0); hstart();
  }

  /* ---------- Lead forms -> WhatsApp / email ---------- */
  function submitLead(form) {
    var f = form.elements, msg = $('.form-msg', form);
    var phone = (f.phone && f.phone.value || '').replace(/[^\d+]/g, '');
    var email = (f.email && f.email.value || '').trim();
    var okPhone = phone.replace(/\D/g, '').length >= 10;
    var okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    msg.className = 'form-msg';
    if (!okPhone && !okEmail) {
      msg.textContent = tr('Please enter a valid phone number or email so our coach can reach you.', 'कृपया सही फोन नंबर या ईमेल दें ताकि हमारे कोच आपसे संपर्क कर सकें।');
      return;
    }
    var lines = ['Hello Vedika Wellness, I would like a free call.', ''];
    lines.push('Request: ' + (form.dataset.context || 'Website'));
    if (f.name && f.name.value.trim()) lines.push('Name: ' + f.name.value.trim());
    if (okPhone) lines.push('Phone: ' + phone);
    if (okEmail) lines.push('Email: ' + email);
    if (f.age && f.age.value) lines.push('Age: ' + f.age.value);
    if (f.mode) lines.push('Mode: ' + f.mode.value);
    if (f.plan) lines.push('Interested in: ' + f.plan.options[f.plan.selectedIndex].text.split(' / ')[0]);
    if (f.note && f.note.value.trim()) lines.push('Note: ' + f.note.value.trim());
    var text = lines.join('\n');
    if (okPhone || !okEmail) {
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    } else {
      location.href = 'mailto:' + COACH_EMAIL + '?subject=' + encodeURIComponent('Free call request') + '&body=' + encodeURIComponent(text);
    }
    msg.className = 'form-msg ok';
    msg.textContent = tr('Thank you! Please press Send in WhatsApp/email to complete. We will reach out soon.', 'धन्यवाद! पूरा करने के लिए व्हाट्सएप/ईमेल में Send दबाएं। हम जल्द संपर्क करेंगे।');
  }
  $$('form.lead').forEach(function (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); submitLead(form); });
  });
  var planSel = $('#planSel');
  if (planSel) {
    var q = new URLSearchParams(location.search).get('plan');
    if (q) {
      var map = { demo: '3-day free demo', '1-month': 'fat-loss' };
      var v = map[q] || q;
      $$('option', planSel).forEach(function (o) { if (o.value === v) planSel.value = v; });
    }
  }

  /* ---------- Blog interactive widgets ---------- */
  var widgets = {
    'myth-quiz': function (box) {
      var myths = [
        ['Myth: Eating roti or rice at night always causes weight gain.', 'Truth: Total daily calories and dinner portion size matter most. 1–2 rotis with dal, paneer and salad by 8 PM fits a healthy weight-loss plan.',
         'मिथक: रात में रोटी या चावल खाने से हमेशा मोटापा बढ़ता है।', 'सच्चाई: पूरे दिन की कुल कैलोरी और मात्रा मायने रखती है। शाम 8 बजे तक 1–2 रोटी के साथ दाल, पनीर और सलाद एक अच्छे प्लान में फिट होता है।'],
        ['Myth: Vegetarians cannot get enough protein without meat.', 'Truth: Dal, low-fat paneer, curd, soya chunks, roasted chana and sprouts together can easily reach 60–80 g a day.',
         'मिथक: शाकाहारी भोजन से पर्याप्त प्रोटीन नहीं मिलता।', 'सच्चाई: दाल, पनीर, दही, सोया चंक्स, भुना चना और अंकुरित मूंग मिलाकर आसानी से 60–80 g प्रोटीन मिल सकता है।'],
        ['Myth: Cutting all fat and ghee is the healthiest choice.', 'Truth: Your body needs a little good fat (1–2 tsp ghee or soaked almonds) for hormones and vitamins. Avoid deep-fried snacks instead.',
         'मिथक: घी और फैट पूरी तरह बंद कर देना सबसे अच्छा है।', 'सच्चाई: हार्मोन और विटामिन के लिए थोड़ा अच्छा फैट (1–2 छोटे चम्मच घी या भीगे बादाम) ज़रूरी है। तला-भुना कम करें।']
      ];
      var h = '<h3>' + bi('Interactive check: tap each myth to see the truth', 'इंटरैक्टिव जांच: सच्चाई देखने के लिए टैप करें') + '</h3>';
      myths.forEach(function (m, i) {
        h += '<button type="button" class="w-btn" data-i="' + i + '"><strong>' + bi(m[0], m[2]) + '</strong><span class="w-reveal">' + bi('Tap to reveal →', 'सच्चाई देखें →') + '</span><span class="w-truth" hidden>' + bi(m[1], m[3]) + '</span></button>';
      });
      box.innerHTML = h;
      $$('.w-btn', box).forEach(function (b) {
        b.addEventListener('click', function () {
          var t = $('.w-truth', b), r = $('.w-reveal', b);
          t.hidden = !t.hidden; r.hidden = !t.hidden; b.classList.toggle('on', !t.hidden);
        });
      });
    },
    'water-calc': function (box) {
      box.innerHTML = '<h3>' + bi('Daily water calculator', 'दैनिक पानी कैलकुलेटर') + '</h3><div class="w-row"><span>' + bi('Your weight', 'आपका वजन') + '</span><span id="wv">72 kg</span></div><input type="range" min="35" max="135" value="72" aria-label="Weight in kg">' +
        '<div class="w-stat"><div><b id="wl">2.5 L</b><span>' + bi('Water per day', 'रोज़ाना पानी') + '</span></div><div><b id="wg">~10</b><span>' + bi('Glasses of 250 ml', '250 ml के गिलास') + '</span></div></div>';
      var r = $('input', box);
      function up() { var w = +r.value, l = (w * 0.035).toFixed(1); $('#wv').textContent = w + ' kg'; $('#wl').textContent = l + ' L'; $('#wg').textContent = '~' + Math.round(l * 1000 / 250); }
      r.addEventListener('input', up); up();
    },
    'protein-calc': function (box) {
      var goal = 1.2;
      box.innerHTML = '<h3>' + bi('Daily protein target', 'दैनिक प्रोटीन लक्ष्य') + '</h3><div class="w-row"><span>' + bi('Your weight', 'आपका वजन') + '</span><span id="pv">70 kg</span></div><input type="range" min="40" max="125" value="70" aria-label="Weight in kg">' +
        '<div class="chips" id="pg"><button type="button" class="fchip" data-m="1">' + bi('Maintain', 'सामान्य') + '</button><button type="button" class="fchip on" data-m="1.2">' + bi('Fat loss', 'फैट लॉस') + '</button><button type="button" class="fchip" data-m="1.5">' + bi('Muscle gain', 'वजन/मसल') + '</button></div>' +
        '<div class="w-stat"><div style="grid-column:1/-1"><b id="pr">78–88 g</b><span>' + bi('Suggested protein per day', 'सुझाया गया प्रोटीन प्रतिदिन') + '</span></div></div>';
      var r = $('input', box);
      function up() { var w = +r.value, g = Math.round(w * goal); $('#pv').textContent = w + ' kg'; $('#pr').textContent = (g - 5) + '–' + (g + 5) + ' g'; }
      r.addEventListener('input', up);
      $$('#pg button', box).forEach(function (b) { b.addEventListener('click', function () { goal = +b.dataset.m; $$('#pg button', box).forEach(function (x) { x.classList.toggle('on', x === b); }); up(); }); });
      up();
    },
    'habit-check': function (box) {
      var hab = [
        ['I eat 1 bowl of salad or veggies with lunch and dinner.', 'मैं लंच और डिनर के साथ 1 प्लेट सलाद या हरी सब्जी खाता/खाती हूं।'],
        ['Every main meal includes a clear protein food (dal, paneer, curd, soya or eggs).', 'मेरे हर मुख्य भोजन में प्रोटीन (दाल, पनीर, दही, सोया या अंडा) शामिल होता है।'],
        ['I drink at least 2.5 litres of water through the day.', 'मैं दिन भर में कम से कम 2.5 लीटर पानी पीता/पीती हूं।'],
        ['I finish dinner at least 2 hours before sleeping.', 'मैं सोने से कम से कम 2 घंटे पहले डिनर कर लेता/लेती हूं।'],
        ['I avoid sugary tea/biscuits and fried namkeen in the evening.', 'मैं शाम को मीठी चाय-बिस्किट और तली नमकीन से बचता/बचती हूं।']
      ];
      var h = '<h3>' + bi('80/20 weight-loss habit check', '80/20 वेट लॉस आदत जांच') + ' — <span id="hs">0 / 5</span></h3>';
      hab.forEach(function (x, i) { h += '<button type="button" class="w-btn" data-i="' + i + '">☐ ' + bi(x[0], x[1]) + '</button>'; });
      h += '<p id="hm" class="tiny"></p>';
      box.innerHTML = h;
      function up() {
        var n = $$('.w-btn.on', box).length;
        $('#hs').textContent = n + ' / 5';
        $('#hm').innerHTML = n >= 4 ? bi('Great consistency! Fine-tuning portions with a coach will speed up your results.', 'बहुत बढ़िया! कोच के साथ मात्रा संतुलित करने से परिणाम और तेज़ होंगे।')
          : bi('Pick just 1 unchecked habit to improve this week — small wins build big results!', 'इस हफ्ते किसी 1 आदत को सुधारने से शुरुआत करें — छोटे बदलाव बड़े परिणाम लाते हैं!');
      }
      $$('.w-btn', box).forEach(function (b) {
        b.addEventListener('click', function () { b.classList.toggle('on'); b.firstChild.nodeValue = b.classList.contains('on') ? '☑ ' : '☐ '; up(); });
      });
      up();
    },
    'food-swap': function (box) {
      var d = {
        sugar: ['White bread + sugary chai, plain white rice alone, sweet biscuits', 'Cucumber salad first → moong dal chilla / paneer → 1 multigrain roti', 'व्हाइट ब्रेड + मीठी चाय, केवल सादा चावल, मीठे बिस्किट', 'पहले खीरा सलाद → मूंग दाल चीला / पनीर → 1 मल्टीग्रेन रोटी'],
        bp: ['Packaged bhujia/namkeen, extra pickles, instant noodles, salty restaurant gravies', 'Roasted chana, plain makhana, homemade lightly spiced dal, fresh fruits & coconut water', 'पैकेट वाली नमकीन/भुजिया, ज़्यादा अचार, इंस्टेंट नूडल्स, बाज़ार की ग्रेवी', 'भुना चना, सादा मखाना, घर की कम नमक वाली दाल, ताज़ा फल और नारियल पानी'],
        thyroid: ['Skipping breakfast, late-night dinners, ultra-processed sugary snacks', 'Warm protein-rich breakfast on time, soaked nuts/seeds, early light dinner + 7.5 h sleep', 'नाश्ता छोड़ना, देर रात खाना, पैकेट वाले मीठे स्नैक्स', 'समय पर प्रोटीन-युक्त गर्म नाश्ता, भीगे बादाम/सीड्स, जल्दी हल्का डिनर और 7.5 घंटे नींद']
      };
      box.innerHTML = '<h3>' + bi('Smart Indian food swaps', 'स्मार्ट भारतीय भोजन बदलाव') + '</h3><div class="chips" id="sw"><button type="button" class="fchip on" data-k="sugar">' + bi('Sugar care', 'शुगर के लिए') + '</button><button type="button" class="fchip" data-k="bp">' + bi('BP care', 'BP के लिए') + '</button><button type="button" class="fchip" data-k="thyroid">' + bi('Thyroid care', 'थायराइड के लिए') + '</button></div><div class="w-split" style="margin-top:.9rem" id="swo"></div>';
      function show(k) {
        var x = d[k];
        $('#swo').innerHTML = '<div class="w-avoid"><b>' + bi('Limit', 'कम करें') + '</b>' + bi(x[0], x[2]) + '</div><div class="w-pick"><b>' + bi('Smart everyday swap', 'बेहतर घर का विकल्प') + '</b>' + bi(x[1], x[3]) + '</div>';
        $$('#sw button', box).forEach(function (b) { b.classList.toggle('on', b.dataset.k === k); });
      }
      $$('#sw button', box).forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.k); }); });
      show('sugar');
    }
  };
  $$('.widget').forEach(function (w) { var f = widgets[w.dataset.widget]; if (f) f(w); });

  /* ---------- Wellness Studio ---------- */
  if ($('#studioTabs')) {
    var CAT_HI = { Meals: 'भोजन', Vegetables: 'सब्जियां', Dairy: 'डेयरी', 'Seeds & Nuts': 'बीज व मेवे', Drinks: 'पेय', Alcohol: 'शराब', Packaged: 'पैकेट वाला' };
    var FOODS = JSON.parse($('#foodData').textContent);
    var PREMADE = JSON.parse($('#premadeData').textContent);
    var byId = {}; FOODS.forEach(function (f) { byId[f.id] = f; });
    var cats = []; FOODS.forEach(function (f) { if (cats.indexOf(f.c) < 0) cats.push(f.c); });
    var lastHealth = null;
    function ico(n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
    function art(id, size) { return '<img src="' + BASE + 'img/foods/' + id + '.svg" width="' + size + '" height="' + size + '" alt="" loading="lazy" decoding="async">'; }
    function shortName(f) { return isHi() ? f.h.split('(')[0].trim() : f.n.split('(')[0].trim(); }
    function r1(x) { return Math.round(x * 10) / 10; }

    // tabs (supports #health / #plate / #sheet)
    function showTab(name) {
      $$('#studioTabs .st-tab').forEach(function (x) { var on = x.dataset.tab === name; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
      $$('.tabpane').forEach(function (p) { p.hidden = p.id !== 'pane-' + name; });
    }
    $$('#studioTabs .st-tab').forEach(function (t) { t.addEventListener('click', function () { showTab(t.dataset.tab); }); });
    var hashTab = location.hash.replace('#', '');
    if (['health', 'plate', 'sheet'].indexOf(hashTab) >= 0) showTab(hashTab);

    function chips(el, list, cur, on) {
      el.innerHTML = '';
      list.forEach(function (x) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'st-chip' + (x.v === cur ? ' on' : ''); b.innerHTML = x.l;
        b.addEventListener('click', function () { on(x.v); }); el.appendChild(b);
      });
    }
    function catList() { return [{ v: 'all', l: bi('All', 'सभी') }].concat(cats.map(function (c) { return { v: c, l: bi(c, CAT_HI[c] || c) }; })); }
    function kpi(en, hi, val, unit) { return '<div class="kpi"><small>' + bi(en, hi) + '</small><b>' + val + '</b>' + (unit ? '<span>' + unit + '</span>' : '') + '</div>'; }

    /* ----- 1. Health check ----- */
    $('#healthForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target.elements, msg = $('.form-msg', e.target);
      var w = +f.w.value, h = +f.h.value, a = +f.a.value, wc = +f.wc.value;
      if (!(w >= 25 && h >= 100 && a >= 10)) { msg.textContent = tr('Please fill weight, height and age correctly.', 'कृपया वजन, ऊंचाई और उम्र सही भरें।'); return; }
      msg.textContent = '';
      var hm = h / 100, bmi = +(w / (hm * hm)).toFixed(1), tone, sEn, sHi;
      if (bmi < 18.5) { tone = 'warn'; sEn = 'Underweight'; sHi = 'कम वजन'; }
      else if (bmi < 23) { tone = 'ok'; sEn = 'Healthy range'; sHi = 'सही वजन'; }
      else if (bmi < 27.5) { tone = 'warn'; sEn = 'Overweight (Indian standard)'; sHi = 'ज़्यादा वजन (भारतीय मानक)'; }
      else { tone = 'alert'; sEn = 'High weight – fat loss needed'; sHi = 'अधिक वजन — फैट लॉस ज़रूरी'; }
      var bmr = Math.round(f.g.value === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161);
      var maint = Math.round(bmr * +f.l.value), loss = Math.max(1200, maint - 450), gain = maint + 350;
      var iMin = Math.round(19.5 * hm * hm), iMax = Math.round(23.5 * hm * hm);
      var water = (w * 0.035).toFixed(1), prot = Math.round(w * (bmi >= 23 ? 1.1 : 1.0));
      var pos = Math.max(1, Math.min(99, (bmi - 15) / 20 * 100));
      var day = bi('kcal / day', 'kcal / दिन');

      var html = '<section class="st-card t-' + tone + '"><div class="bmi-top"><div class="bmi-val"><small>' + bi('Your BMI', 'आपका BMI') + '</small><b>' + bmi + '</b></div><span class="st-pill">' + bi(sEn, sHi) + '</span></div>' +
        '<div class="gauge" role="img" aria-label="BMI scale"><i style="width:17.5%;background:#f0b429"></i><i style="width:22.5%;background:#2f9e5b"></i><i style="width:22.5%;background:#f08a24"></i><i style="width:37.5%;background:#d64545"></i><span class="gmark" style="left:' + pos + '%"></span></div>' +
        '<div class="glabels"><span style="width:17.5%">&lt; 18.5<br>' + bi('Under', 'कम') + '</span><span style="width:22.5%">18.5 – 22.9<br>' + bi('Healthy', 'सही') + '</span><span style="width:22.5%">23 – 27.4<br>' + bi('Over', 'ज़्यादा') + '</span><span style="width:37.5%">27.5+<br>' + bi('High', 'अधिक') + '</span></div></section>' +
        '<section class="st-card"><div class="st-card-h"><h2>' + bi('Daily calories', 'रोज़ की कैलोरी') + '</h2><p>' + bi('Based on your BMR and activity level.', 'आपके BMR और गतिविधि के आधार पर।') + '</p></div><div class="kpis k3">' +
        kpi('Maintain weight', 'वजन बनाए रखें', maint, day) + kpi('Fat loss', 'फैट लॉस', loss, day) + kpi('Healthy gain', 'स्वस्थ वजन बढ़ाएं', gain, day) + '</div></section>' +
        '<section class="st-card"><div class="st-card-h"><h2>' + bi('Body & nutrition targets', 'शरीर और पोषण लक्ष्य') + '</h2></div><div class="kpis k2">' +
        kpi('BMR (rest burn)', 'BMR (आराम कैलोरी)', bmr, 'kcal') + kpi('Ideal weight', 'आदर्श वजन', iMin + '–' + iMax, 'kg') + kpi('Water', 'पानी', water, bi('litres / day', 'लीटर / दिन')) + kpi('Protein', 'प्रोटीन', prot, bi('g / day', 'g / दिन')) + '</div>';
      var waistLine = '';
      if (wc > 40) {
        var r = +(wc / h).toFixed(2), tn = r < .5 ? 'ok' : r < .58 ? 'warn' : 'alert';
        var nE = r < .5 ? 'Healthy waist-to-height ratio (under 0.50).' : r < .58 ? 'Slightly high belly fat (0.50–0.57). Focus on a lighter dinner and protein.' : 'High belly fat (0.58+). A structured fat-loss plan is recommended.';
        var nH = r < .5 ? 'स्वस्थ कमर-ऊंचाई अनुपात (0.50 से कम)।' : r < .58 ? 'पेट की चर्बी थोड़ी अधिक है (0.50–0.57)। डिनर हल्का और प्रोटीन-युक्त रखें।' : 'पेट की चर्बी काफी अधिक है (0.58+)। सही गाइडेंस के साथ फैट लॉस शुरू करें।';
        html += '<div class="whtr t-' + tn + '"><div class="bmi-val"><small>' + bi('Waist-to-height ratio', 'कमर-ऊंचाई अनुपात') + '</small><b>' + r + '</b></div><p>' + bi(nE, nH) + '</p></div>';
        waistLine = '\nWaist-to-height ratio: ' + r;
      }
      html += '</section><div class="st-note"><p>' + bi('Want a food plan for these numbers?', 'इन नंबरों के हिसाब से डाइट प्लान चाहिए?') + '<small>' + bi('For general awareness only. Not medical advice.', 'केवल सामान्य जानकारी के लिए। यह चिकित्सा सलाह नहीं है।') + '</small></p>' +
        '<a class="st-btn primary" href="' + BASE + 'book/">' + bi('Talk to a coach – free', 'कोच से बात करें – मुफ्त') + '</a></div>';
      $('#healthOut').innerHTML = html;
      lastHealth = 'HEALTH CHECK\nWeight ' + w + ' kg, height ' + h + ' cm, age ' + a + '\nBMI: ' + bmi + ' (' + sEn + ')\nBMR: ' + bmr + ' kcal\nIdeal weight: ' + iMin + '–' + iMax + ' kg\nMaintain: ' + maint + ' kcal/day | Fat loss: ' + loss + ' | Healthy gain: ' + gain +
        '\nWater: ' + water + ' L/day | Protein: ' + prot + ' g/day' + waistLine;
    });

    /* ----- 2. Thali plate ----- */
    var plate = {}, plateCat = 'all', plateQ = '';
    var saved = []; try { saved = JSON.parse(store.get('vw-plates') || '[]'); } catch (e) { saved = []; }
    function totals(entries) {
      var t = { k: 0, p: 0, cb: 0, f: 0, fi: 0, caution: 0, n: 0 };
      entries.forEach(function (en) {
        var f = byId[en.foodId]; if (!f) return;
        t.k += f.k * en.q; t.p += f.p * en.q; t.cb += f.cb * en.q; t.f += f.f * en.q; t.fi += f.fi * en.q; t.n += en.q;
        if (f.t.indexOf('caution') >= 0) t.caution++;
      });
      return t;
    }
    function entriesOf(obj) { return Object.keys(obj).map(function (k) { return { foodId: k, q: obj[k] }; }); }
    function addFood(id) { plate[id] = (plate[id] || 0) + 1; renderPlate(); }

    function renderFoods() {
      chips($('#plateCats'), catList(), plateCat, function (v) { plateCat = v; renderFoods(); });
      var list = $('#foodList'); list.innerHTML = '';
      var shown = FOODS.filter(function (f) {
        return (plateCat === 'all' || f.c === plateCat) && (!plateQ || (f.n + ' ' + f.h).toLowerCase().indexOf(plateQ) >= 0);
      });
      shown.forEach(function (f) {
        var d = document.createElement('div'); d.className = 'st-row'; d.draggable = true;
        d.innerHTML = art(f.id, 40) + '<div class="n"><b>' + bi(f.n, f.h) + '</b><span>' + bi(f.s, f.sh) + ' · ' + f.k + ' kcal · P ' + f.p + 'g</span></div>';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'st-add'; b.innerHTML = ico('plus') + bi('Add', 'जोड़ें');
        b.addEventListener('click', function () { addFood(f.id); });
        d.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', f.id); e.dataTransfer.effectAllowed = 'copy'; });
        d.appendChild(b); list.appendChild(d);
      });
      if (!shown.length) list.innerHTML = '<p class="st-none">' + bi('No foods found.', 'कोई भोजन नहीं मिला।') + '</p>';
      $('#foodCount').innerHTML = bi('Showing ' + shown.length + ' of ' + FOODS.length + ' foods', FOODS.length + ' में से ' + shown.length + ' भोजन दिख रहे हैं');
    }
    $('#plateSearch').addEventListener('input', function (e) { plateQ = e.target.value.trim().toLowerCase(); renderFoods(); });

    var drop = $('#dropCard');
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', function (e) { if (!drop.contains(e.relatedTarget)) drop.classList.remove('over'); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); var id = e.dataTransfer.getData('text/plain'); if (byId[id]) addFood(id); });

    function titem(f, q, size) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'st-titem';
      b.title = f.n + ' — ' + Math.round(f.k * q) + ' kcal (tap to add one more)';
      b.innerHTML = '<span class="st-tw">' + art(f.id, size) + '<b class="st-tb">' + q + '×</b></span><span class="st-tl">' + esc(shortName(f)) + '</span>';
      b.addEventListener('click', function () { addFood(f.id); });
      return b;
    }
    function row(list, size) {
      var d = document.createElement('div'); d.className = 'st-trow';
      list.forEach(function (x) { d.appendChild(titem(x.f, x.q, size)); }); return d;
    }
    function renderPlate() {
      var en = entriesOf(plate).filter(function (x) { return byId[x.foodId]; });
      var items = en.map(function (x) { return { f: byId[x.foodId], q: x.q }; });
      var katoris = items.filter(function (x) { return x.f.pl === 'katori' || x.f.pl === 'side'; });
      var mains = items.filter(function (x) { return x.f.pl === 'main'; });
      var drinks = items.filter(function (x) { return x.f.pl === 'drink'; });
      var inner = $('#thaliIn'); inner.innerHTML = '';
      var dr = $('#thaliDrinks'); dr.innerHTML = '';
      drinks.forEach(function (x) { dr.appendChild(titem(x.f, x.q, 52)); });
      if (!items.length) {
        inner.innerHTML = '<div class="st-thali-empty"><div class="ex">' + art('roti', 40) + art('moong-dal', 38) + art('steamed-rice', 40) + '</div>' + bi('Drop roti, rice, dal or sabzi here to build your thali.', 'अपनी थाली सजाने के लिए रोटी, चावल, दाल या सब्जी यहां डालें।') + '</div>';
      } else if (!katoris.length && !mains.length) {
        inner.innerHTML = '<p class="st-thali-empty">' + bi('Drink placed beside the thali — now add roti, rice, dal or salad!', 'पेय थाली के पास रखा है — अब रोटी, चावल, दाल या सलाद जोड़ें!') + '</p>';
      } else {
        if (katoris.length) inner.appendChild(row(katoris, katoris.length > 3 ? 52 : 60));
        if (mains.length) inner.appendChild(row(mains, mains.length > 3 ? 56 : 68));
      }
      var strip = $('#qtyStrip'); strip.innerHTML = '';
      en.forEach(function (x) {
        var f = byId[x.foodId], d = document.createElement('div'); d.className = 'st-qrow';
        d.innerHTML = '<span class="nm">' + bi(f.n, f.h) + '</span><span class="st-step"><button type="button" aria-label="Less">' + ico('minus') + '</button><b>' + x.q + '</b><button type="button" aria-label="More">' + ico('plus') + '</button></span>';
        var bs = $$('button', d);
        bs[0].addEventListener('click', function () { plate[x.foodId]--; if (plate[x.foodId] <= 0) delete plate[x.foodId]; renderPlate(); });
        bs[1].addEventListener('click', function () { plate[x.foodId]++; renderPlate(); });
        strip.appendChild(d);
      });
      var t = totals(en);
      $('#plateTotals').innerHTML = [['k', Math.round(t.k), 'kcal'], ['', r1(t.p) + 'g', tr('Protein', 'प्रोटीन')], ['', r1(t.cb) + 'g', tr('Carbs', 'कार्ब्स')], ['', r1(t.f) + 'g', tr('Fat', 'फैट')], ['', r1(t.fi) + 'g', tr('Fibre', 'फाइबर')]]
        .map(function (x) { return '<div class="st-tot ' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + '</span></div>'; }).join('');
      var v = $('#plateVerdict'), tips = [], cls = '', head;
      if (!en.length) { v.className = 'st-verdict'; v.innerHTML = bi('Empty plate — add some Indian foods to begin.', 'खाली थाली — शुरू करने के लिए भोजन जोड़ें।'); return; }
      if (t.p < 18) tips.push(bi('Protein is low. Add grilled paneer, soya chunks, moong dal, sprouts or boiled eggs.', 'प्रोटीन कम है। पनीर, सोया चंक्स, मूंग दाल, स्प्राउट्स या उबले अंडे जोड़ें।'));
      if (t.fi < 7) tips.push(bi('Fibre is low. Add a full plate of cucumber-tomato salad or green sabzi.', 'फाइबर कम है। खीरा-टमाटर सलाद या हरी सब्जी ज़रूर जोड़ें।'));
      if (t.caution > 0) tips.push(bi('Includes fried, sugary, packaged or alcohol items. Swap for roasted chana, chaas or sprouts.', 'इसमें तला-भुना, मीठा, पैकेट वाला या शराब है। इसकी जगह छाछ, भुना चना या स्प्राउट्स लें।'));
      if (t.k > 750) tips.push(bi('High-calorie meal (fine for weight gain, heavy for fat loss).', 'यह हाई-कैलोरी थाली है (वजन बढ़ाने के लिए ठीक, फैट लॉस के लिए भारी)।'));
      if (!tips.length) { cls = 'good'; head = bi('Well-balanced healthy Indian thali! Good protein, fibre and steady energy.', 'बहुत बढ़िया संतुलित भारतीय थाली! अच्छा प्रोटीन, फाइबर और सही कैलोरी।'); tips.push(bi('Drink a glass of water 25 minutes before this meal.', 'इस भोजन से 25 मिनट पहले 1 गिलास पानी पिएं।')); }
      else if (t.caution > 0 || t.k > 800) { cls = 'alert'; head = bi('Needs improvement — high empty calories or imbalance.', 'सुधार की ज़रूरत — कैलोरी या अनहेल्दी आइटम अधिक हैं।'); }
      else { cls = 'warn'; head = bi('Almost balanced — small tweaks will make it much healthier.', 'काफ़ी अच्छा — थोड़ा बदलाव इसे और सेहतमंद बना देगा।'); }
      v.className = 'st-verdict ' + cls;
      v.innerHTML = '<strong>' + head + '</strong><ul>' + tips.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    }
    function flash(btn, text) { var old = btn.innerHTML; btn.innerHTML = '<span>' + esc(text) + '</span>'; setTimeout(function () { btn.innerHTML = old; }, 1400); }
    $('#clearPlate').addEventListener('click', function () { plate = {}; renderPlate(); });
    $('#savePlate').addEventListener('click', function () {
      var en = entriesOf(plate); if (!en.length) { flash(this, tr('Add foods first', 'पहले भोजन जोड़ें')); return; }
      saved.push({ id: 's' + Date.now(), n: tr('My plate ', 'मेरी थाली ') + (saved.length + 1), e: en.map(function (x) { return { foodId: x.foodId, quantity: x.q }; }), saved: true });
      store.set('vw-plates', JSON.stringify(saved)); renderSaved(); flash(this, '✓ ' + tr('Saved', 'सेव हुआ'));
    });

    /* compare */
    var picked = [];
    function plateEntries(p) { return p.e.map(function (x) { return { foodId: x.foodId, q: x.quantity }; }); }
    function renderSaved() {
      chips($('#premadeList'), PREMADE.map(function (p) { return { v: p.id, l: ico('plus') + esc(p.n) }; }), '', function (id) {
        var p = PREMADE.filter(function (x) { return x.id === id; })[0]; plate = {};
        p.e.forEach(function (x) { plate[x.foodId] = x.quantity; }); renderPlate(); $('#dropCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      var all = PREMADE.concat(saved), box = $('#savedList'); box.innerHTML = '';
      all.forEach(function (p) {
        var l = document.createElement('label'); l.className = 'st-cmpi' + (picked.indexOf(p.id) >= 0 ? ' on' : '');
        l.innerHTML = '<input type="checkbox"' + (picked.indexOf(p.id) >= 0 ? ' checked' : '') + '><span class="nm">' + esc(p.n) + '</span>' + (p.saved ? '' : '<span class="st-tag">' + tr('Ready-made', 'तैयार') + '</span>');
        $('input', l).addEventListener('change', function (e) {
          if (e.target.checked) { picked.push(p.id); if (picked.length > 3) picked.shift(); } else picked = picked.filter(function (x) { return x !== p.id; });
          renderSaved();
        });
        if (p.saved) {
          var del = document.createElement('button'); del.type = 'button'; del.className = 'st-del'; del.title = tr('Delete', 'हटाएं'); del.setAttribute('aria-label', 'Delete'); del.innerHTML = ico('trash');
          del.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            saved = saved.filter(function (x) { return x.id !== p.id; }); picked = picked.filter(function (x) { return x !== p.id; });
            store.set('vw-plates', JSON.stringify(saved)); renderSaved();
          });
          l.appendChild(del);
        }
        box.appendChild(l);
      });
      renderCompare();
    }
    function renderCompare() {
      var wrap = $('#compareWrap'), tb = $('#compareTable'), all = PREMADE.concat(saved);
      var sel = picked.map(function (id) { return all.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
      if (sel.length < 2) { wrap.hidden = true; return; }
      wrap.hidden = false;
      var rows = [['kcal', 'k', 'min'], [tr('Protein (g)', 'प्रोटीन (g)'), 'p', 'max'], [tr('Carbs (g)', 'कार्ब्स (g)'), 'cb', 'min'], [tr('Fat (g)', 'फैट (g)'), 'f', 'min'], [tr('Fibre (g)', 'फाइबर (g)'), 'fi', 'max']];
      var tt = sel.map(function (p) { return totals(plateEntries(p)); });
      var h = '<thead><tr><th>' + bi('Per plate', 'प्रति थाली') + '</th>' + sel.map(function (p) { return '<th>' + esc(p.n) + '</th>'; }).join('') + '</tr></thead><tbody>';
      rows.forEach(function (r) {
        var vals = tt.map(function (t) { return r1(t[r[1]]); }), best = r[2] === 'max' ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
        h += '<tr><td>' + r[0] + '</td>' + vals.map(function (v) { return '<td' + (v === best ? ' class="best"' : '') + '>' + v + '</td>'; }).join('') + '</tr>';
      });
      tb.innerHTML = h + '</tbody>';
    }

    /* ----- 3. Food sheet ----- */
    var sCat = 'all', sTag = '', sQ = '', sSort = 'n', sDir = 1;
    function renderSheet() {
      chips($('#sheetCats'), catList(), sCat, function (v) { sCat = v; renderSheet(); });
      chips($('#sheetTags'), [{ v: '', l: bi('Any', 'कोई भी') }, { v: 'high-protein', l: bi('High protein', 'हाई प्रोटीन') }, { v: 'high-fibre', l: bi('High fibre', 'हाई फाइबर') }, { v: 'low-cal', l: bi('Low calorie', 'कम कैलोरी') }, { v: 'caution', l: bi('Limit', 'सीमित करें') }], sTag, function (v) { sTag = v; renderSheet(); });
      var list = FOODS.filter(function (f) {
        return (sCat === 'all' || f.c === sCat) && (!sTag || f.t.indexOf(sTag) >= 0) && (!sQ || (f.n + ' ' + f.h).toLowerCase().indexOf(sQ) >= 0);
      }).sort(function (a, b) { var x = a[sSort], y = b[sSort]; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sDir; });
      $('#sheetTable tbody').innerHTML = list.map(function (f) {
        return '<tr><td><div class="fcell">' + art(f.id, 36) + '<div><b>' + bi(f.n, f.h) + (f.t.indexOf('caution') >= 0 ? ' <span class="st-tag limit">' + tr('limit', 'सीमित') + '</span>' : '') + '</b><small>' + bi(f.s, f.sh) + '</small></div></div></td><td class="k">' + f.k + '</td><td class="p">' + f.p + '</td><td class="c">' + f.cb + '</td><td class="f">' + f.f + '</td><td class="fi">' + f.fi + '</td></tr>';
      }).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem">' + bi('No foods found.', 'कोई भोजन नहीं मिला।') + '</td></tr>';
      $$('#sheetTable th').forEach(function (th) { th.classList.remove('asc', 'desc'); if (th.dataset.sort === sSort) th.classList.add(sDir > 0 ? 'asc' : 'desc'); });
      $('#sheetCount').innerHTML = bi('Showing ' + list.length + ' of ' + FOODS.length + ' foods', FOODS.length + ' में से ' + list.length + ' भोजन दिख रहे हैं');
    }
    $$('#sheetTable th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () { if (sSort === th.dataset.sort) sDir = -sDir; else { sSort = th.dataset.sort; sDir = th.dataset.sort === 'n' ? 1 : -1; } renderSheet(); });
    });
    $('#sheetSearch').addEventListener('input', function (e) { sQ = e.target.value.trim().toLowerCase(); renderSheet(); });

    /* ----- top actions: print, download, copy, WhatsApp ----- */
    function summaryText() {
      var parts = ['VEDIKA WELLNESS STUDIO – SUMMARY'];
      if (lastHealth) parts.push(lastHealth);
      var en = entriesOf(plate).filter(function (x) { return byId[x.foodId]; });
      if (en.length) {
        var t = totals(en);
        parts.push('MY THALI\n' + en.map(function (x) { return '- ' + byId[x.foodId].n + ' x' + x.q; }).join('\n') +
          '\nTotal: ' + Math.round(t.k) + ' kcal | Protein ' + r1(t.p) + 'g | Carbs ' + r1(t.cb) + 'g | Fat ' + r1(t.f) + 'g | Fibre ' + r1(t.fi) + 'g');
      }
      if (parts.length === 1) parts.push('Nothing to summarise yet. Check your BMI or build a thali first.');
      parts.push('For general awareness only – not medical advice.\n' + location.href.split('#')[0]);
      return parts.join('\n\n');
    }
    $('#actPrint').addEventListener('click', function () { window.print(); });
    $('#actDownload').addEventListener('click', function () {
      var blob = new Blob([summaryText()], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'vedika-wellness-summary.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    });
    $('#actWa').addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent(summaryText()), '_blank', 'noopener'); });
    $('#actCopy').addEventListener('click', function () {
      var btn = this, txt = summaryText(), ok = function () { flash(btn, '✓ ' + tr('Copied', 'कॉपी हुआ')); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok);
      else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* ignore */ } ta.remove(); }
    });

    renderFoods(); renderPlate(); renderSaved(); renderSheet();
    $('#langBtn').addEventListener('click', function () { renderFoods(); renderPlate(); renderSaved(); renderSheet(); });
  }

  /* ---------- Posts & pages published from /admin/ ---------- */
  function loadJSON(path) {
    return fetch(BASE + path, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }
  loadJSON('content/pages.json').then(function (pages) {
    if (!Array.isArray(pages) || !pages.length) return;
    var cta = $('.mobile-cta', menu), foot = $('#footPages');
    pages.forEach(function (pg) {
      if (pg.menu) {
        var a = document.createElement('a'); a.href = BASE + pg.slug + '/'; a.textContent = pg.title;
        if (location.pathname.replace(/\/$/, '').split('/').pop() === pg.slug) a.className = 'active';
        menu.insertBefore(a, cta);
      }
      if (foot) { var f = document.createElement('a'); f.href = BASE + pg.slug + '/'; f.textContent = pg.title; foot.appendChild(f); }
    });
  });
  var postBox = $('[data-custom-posts]');
  if (postBox) loadJSON('content/posts.json').then(function (posts) {
    if (!Array.isArray(posts) || !posts.length) return;
    var limit = postBox.dataset.customPosts === 'all' ? posts.length : +postBox.dataset.customPosts;
    posts.slice(0, limit).reverse().forEach(function (p) {
      var a = document.createElement('a'); a.className = 'card blog-card reveal in'; a.href = BASE + 'blog/' + p.slug + '/';
      a.innerHTML = (p.image ? '<img class="blog-img" src="' + esc(BASE + p.image) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async">' : '<div class="blog-img ph" aria-hidden="true">🥗</div>') +
        '<div class="blog-body"><span class="tagline">' + esc(p.category || 'Health') + ' · ' + esc(p.date || '') + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.excerpt || '') + '</p><span class="more">' + bi('Read more →', 'और पढ़ें →') + '</span></div>';
      postBox.insertBefore(a, postBox.firstChild);
    });
    if (postBox.dataset.customPosts !== 'all') { while (postBox.children.length > limit) postBox.removeChild(postBox.lastChild); }
  });

  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
