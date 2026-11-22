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
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
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

    // tabs
    $$('#studioTabs .tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('#studioTabs .tab').forEach(function (x) { x.classList.toggle('active', x === t); x.setAttribute('aria-selected', x === t); });
        $$('.tabpane').forEach(function (p) { p.hidden = p.id !== 'pane-' + t.dataset.tab; });
      });
    });
    function chips(el, list, cur, on) {
      el.innerHTML = '';
      list.forEach(function (x) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'fchip' + (x.v === cur ? ' on' : ''); b.innerHTML = x.l;
        b.addEventListener('click', function () { on(x.v); }); el.appendChild(b);
      });
    }
    function catList() { return [{ v: 'all', l: bi('All', 'सभी') }].concat(cats.map(function (c) { return { v: c, l: bi(c, CAT_HI[c] || c) }; })); }

    /* Health check */
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
      var html = '<div class="res-grid">' +
        '<div class="res ' + tone + ' wide"><small>BMI</small><b>' + bmi + '</b><span>' + bi(sEn, sHi) + '</span></div>' +
        '<div class="res"><small>' + bi('BMR (rest burn)', 'BMR (आराम कैलोरी)') + '</small><b>' + bmr + '</b><span>kcal</span></div>' +
        '<div class="res"><small>' + bi('Ideal weight', 'आदर्श वजन') + '</small><b>' + iMin + '–' + iMax + '</b><span>kg</span></div>' +
        '<div class="res"><small>' + bi('Maintain weight', 'वजन बनाए रखने के लिए') + '</small><b>' + maint + '</b><span>kcal/' + tr('day', 'दिन') + '</span></div>' +
        '<div class="res"><small>' + bi('Fat loss', 'फैट लॉस') + '</small><b>' + loss + '</b><span>kcal/' + tr('day', 'दिन') + '</span></div>' +
        '<div class="res"><small>' + bi('Healthy gain', 'स्वस्थ वजन बढ़ाने के लिए') + '</small><b>' + gain + '</b><span>kcal/' + tr('day', 'दिन') + '</span></div>' +
        '<div class="res"><small>' + bi('Water', 'पानी') + '</small><b>' + water + ' L</b><span>' + bi('per day', 'प्रति दिन') + '</span></div>' +
        '<div class="res"><small>' + bi('Protein', 'प्रोटीन') + '</small><b>' + prot + ' g</b><span>' + bi('per day', 'प्रति दिन') + '</span></div>';
      if (wc > 40) {
        var r = +(wc / h).toFixed(2), tn = r < .5 ? 'ok' : r < .58 ? 'warn' : 'alert';
        var nE = r < .5 ? 'Healthy waist-to-height ratio (under 0.50).' : r < .58 ? 'Slightly high belly fat (0.50–0.57). Focus on lighter dinner and protein.' : 'High belly fat (0.58+). Starting a structured fat-loss plan is recommended.';
        var nH = r < .5 ? 'स्वस्थ कमर-ऊंचाई अनुपात (0.50 से कम)।' : r < .58 ? 'पेट की चर्बी थोड़ी अधिक है (0.50–0.57)। डिनर हल्का और प्रोटीन-युक्त रखें।' : 'पेट की चर्बी काफी अधिक है (0.58+)। सही गाइडेंस के साथ फैट लॉस शुरू करें।';
        html += '<div class="res ' + tn + ' wide"><small>' + bi('Waist-to-height ratio', 'कमर-ऊंचाई अनुपात') + '</small><b>' + r + '</b><span>' + bi(nE, nH) + '</span></div>';
      }
      html += '</div><div class="note-box">' + bi('Want a food plan for these numbers? Talk to our coach for free.', 'इन नंबरों के हिसाब से डाइट प्लान चाहिए? हमारे कोच से मुफ्त बात करें।') +
        ' <a class="more" href="../book/">' + bi('Book Free Call →', 'फ्री कॉल बुक करें →') + '</a><p class="tiny">' + bi('For general awareness only. Not medical advice.', 'केवल सामान्य जानकारी के लिए। यह चिकित्सा सलाह नहीं है।') + '</p></div>';
      $('#healthOut').innerHTML = html;
    });

    /* Plate calculator */
    var plate = {}, plateCat = 'all';
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
    function r1(x) { return Math.round(x * 10) / 10; }
    function renderFoods() {
      chips($('#plateCats'), catList(), plateCat, function (v) { plateCat = v; renderFoods(); });
      var list = $('#foodList'); list.innerHTML = '';
      FOODS.filter(function (f) { return plateCat === 'all' || f.c === plateCat; }).forEach(function (f) {
        var d = document.createElement('div'); d.className = 'fitem';
        d.innerHTML = '<div class="fn"><b>' + bi(f.n, f.h) + '</b><span>' + bi(f.s, f.sh) + '</span></div><span class="kc">' + f.k + ' kcal</span>';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'add'; b.textContent = '+'; b.setAttribute('aria-label', 'Add ' + f.n);
        b.addEventListener('click', function () { plate[f.id] = (plate[f.id] || 0) + 1; renderPlate(); });
        d.appendChild(b); list.appendChild(d);
      });
    }
    function renderPlate() {
      var box = $('#plateBox'), en = entriesOf(plate);
      if (!en.length) box.innerHTML = '<p class="muted">' + bi('Tap + on any food to add it.', 'किसी भी भोजन पर + दबाकर जोड़ें।') + '</p>';
      else {
        box.innerHTML = '';
        en.forEach(function (x) {
          var f = byId[x.foodId], d = document.createElement('div'); d.className = 'pitem';
          d.innerHTML = '<span class="fn">' + bi(f.n, f.h) + '</span><span class="qty"><button type="button" aria-label="Less">−</button><b>' + x.q + '</b><button type="button" aria-label="More">+</button></span>';
          var bs = $$('button', d);
          bs[0].addEventListener('click', function () { plate[x.foodId]--; if (plate[x.foodId] <= 0) delete plate[x.foodId]; renderPlate(); });
          bs[1].addEventListener('click', function () { plate[x.foodId]++; renderPlate(); });
          box.appendChild(d);
        });
      }
      var t = totals(en);
      $('#plateTotals').innerHTML = [['kcal', Math.round(t.k)], [tr('Protein', 'प्रोटीन'), r1(t.p) + 'g'], [tr('Carbs', 'कार्ब्स'), r1(t.cb) + 'g'], [tr('Fat', 'फैट'), r1(t.f) + 'g'], [tr('Fibre', 'फाइबर'), r1(t.fi) + 'g']]
        .map(function (x) { return '<div><b>' + x[1] + '</b><small>' + x[0] + '</small></div>'; }).join('');
      var v = $('#plateVerdict'), tips = [], cls = '', head;
      if (!en.length) { v.className = 'verdict'; v.innerHTML = bi('Empty plate — add some Indian foods to begin.', 'खाली थाली — शुरू करने के लिए भोजन जोड़ें।'); return; }
      if (t.p < 18) tips.push(bi('Protein is low. Add grilled paneer, soya chunks, moong dal, sprouts or boiled eggs.', 'प्रोटीन कम है। पनीर, सोया चंक्स, मूंग दाल, स्प्राउट्स या उबले अंडे जोड़ें।'));
      if (t.fi < 7) tips.push(bi('Fibre is low. Add a full plate of cucumber-tomato salad or green sabzi.', 'फाइबर कम है। खीरा-टमाटर सलाद या हरी सब्जी ज़रूर जोड़ें।'));
      if (t.caution > 0) tips.push(bi('Includes fried, sugary, packaged or alcohol items. Swap for roasted chana, chaas or sprouts.', 'इसमें तला-भुना, मीठा, पैकेट वाला या शराब है। इसकी जगह छाछ, भुना चना या स्प्राउट्स लें।'));
      if (t.k > 750) tips.push(bi('High-calorie meal (fine for weight gain, heavy for fat loss).', 'यह हाई-कैलोरी थाली है (वजन बढ़ाने के लिए ठीक, फैट लॉस के लिए भारी)।'));
      if (!tips.length) { cls = 'good'; head = bi('Well-balanced healthy Indian thali! Good protein, fibre and steady energy.', 'बहुत बढ़िया संतुलित भारतीय थाली! अच्छा प्रोटीन, फाइबर और सही कैलोरी।'); tips.push(bi('Drink a glass of water 25 minutes before this meal.', 'इस भोजन से 25 मिनट पहले 1 गिलास पानी पिएं।')); }
      else if (t.caution > 0 || t.k > 800) { cls = 'alert'; head = bi('Needs improvement — high empty calories or imbalance.', 'सुधार की ज़रूरत — कैलोरी या अनहेल्दी आइटम अधिक हैं।'); }
      else { cls = 'warn'; head = bi('Almost balanced — small tweaks will make it much healthier.', 'काफ़ी अच्छा — थोड़ा बदलाव इसे और सेहतमंद बना देगा।'); }
      v.className = 'verdict ' + cls;
      v.innerHTML = '<strong>' + head + '</strong><ul>' + tips.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    }
    $('#clearPlate').addEventListener('click', function () { plate = {}; renderPlate(); });
    $('#savePlate').addEventListener('click', function () {
      var en = entriesOf(plate); if (!en.length) return;
      saved.push({ id: 's' + Date.now(), n: tr('My plate ', 'मेरी थाली ') + (saved.length + 1), e: en.map(function (x) { return { foodId: x.foodId, quantity: x.q }; }), saved: true });
      store.set('vw-plates', JSON.stringify(saved)); renderSaved();
    });
    var picked = [];
    function plateEntries(p) { return p.e.map(function (x) { return { foodId: x.foodId, q: x.quantity }; }); }
    function renderSaved() {
      chips($('#premadeList'), PREMADE.map(function (p) { return { v: p.id, l: '⬇ ' + esc(p.n) }; }), '', function (id) {
        var p = PREMADE.filter(function (x) { return x.id === id; })[0]; plate = {};
        p.e.forEach(function (x) { plate[x.foodId] = x.quantity; }); renderPlate(); window.scrollTo({ top: $('#pane-plate').offsetTop - 80, behavior: 'smooth' });
      });
      var all = PREMADE.concat(saved), box = $('#savedList'); box.innerHTML = '';
      all.forEach(function (p) {
        var l = document.createElement('label');
        l.innerHTML = '<input type="checkbox" value="' + p.id + '"' + (picked.indexOf(p.id) >= 0 ? ' checked' : '') + '> <span>' + esc(p.n) + (p.saved ? '' : ' <span class="badge-t">' + tr('Ready-made', 'तैयार') + '</span>') + '</span>';
        $('input', l).addEventListener('change', function (e) {
          if (e.target.checked) { picked.push(p.id); if (picked.length > 3) picked.shift(); } else picked = picked.filter(function (x) { return x !== p.id; });
          renderSaved(); renderCompare();
        });
        box.appendChild(l);
      });
      renderCompare();
    }
    function renderCompare() {
      var tb = $('#compareTable'), all = PREMADE.concat(saved), sel = picked.map(function (id) { return all.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
      if (sel.length < 2) { tb.hidden = true; return; }
      tb.hidden = false;
      var rows = [['kcal', 'k'], [tr('Protein (g)', 'प्रोटीन (g)'), 'p'], [tr('Carbs (g)', 'कार्ब्स (g)'), 'cb'], [tr('Fat (g)', 'फैट (g)'), 'f'], [tr('Fibre (g)', 'फाइबर (g)'), 'fi']];
      var tt = sel.map(function (p) { return totals(plateEntries(p)); });
      var h = '<thead><tr><th></th>' + sel.map(function (p) { return '<th>' + esc(p.n) + '</th>'; }).join('') + '</tr></thead><tbody>';
      rows.forEach(function (r) { h += '<tr><td><b>' + r[0] + '</b></td>' + tt.map(function (t) { return '<td>' + r1(t[r[1]]) + '</td>'; }).join('') + '</tr>'; });
      tb.innerHTML = h + '</tbody>';
    }

    /* Food sheet */
    var sCat = 'all', sTag = '', sQ = '', sSort = 'n', sDir = 1;
    function renderSheet() {
      chips($('#sheetCats'), catList(), sCat, function (v) { sCat = v; renderSheet(); });
      chips($('#sheetTags'), [{ v: '', l: bi('Any', 'कोई भी') }, { v: 'high-protein', l: bi('High protein', 'हाई प्रोटीन') }, { v: 'high-fibre', l: bi('High fibre', 'हाई फाइबर') }, { v: 'low-cal', l: bi('Low calorie', 'कम कैलोरी') }, { v: 'caution', l: bi('Limit', 'सीमित करें') }], sTag, function (v) { sTag = v; renderSheet(); });
      var list = FOODS.filter(function (f) {
        return (sCat === 'all' || f.c === sCat) && (!sTag || f.t.indexOf(sTag) >= 0) &&
          (!sQ || (f.n + ' ' + f.h).toLowerCase().indexOf(sQ) >= 0);
      }).sort(function (a, b) { var x = a[sSort], y = b[sSort]; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sDir; });
      $('#sheetTable tbody').innerHTML = list.map(function (f) {
        return '<tr><td><b>' + bi(f.n, f.h) + '</b>' + (f.t.indexOf('caution') >= 0 ? '<span class="badge-t caution">' + tr('limit', 'सीमित') + '</span>' : '') + '<br><small class="muted">' + bi(f.s, f.sh) + '</small></td><td class="v-k">' + f.k + '</td><td class="v-p">' + f.p + '</td><td class="v-c">' + f.cb + '</td><td class="v-f">' + f.f + '</td><td class="v-fi">' + f.fi + '</td></tr>';
      }).join('') || '<tr><td colspan="6">' + bi('No foods found.', 'कोई भोजन नहीं मिला।') + '</td></tr>';
      $$('#sheetTable th').forEach(function (th) { th.classList.remove('asc', 'desc'); if (th.dataset.sort === sSort) th.classList.add(sDir > 0 ? 'asc' : 'desc'); });
    }
    $$('#sheetTable th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () { if (sSort === th.dataset.sort) sDir = -sDir; else { sSort = th.dataset.sort; sDir = th.dataset.sort === 'n' ? 1 : -1; } renderSheet(); });
    });
    $('#sheetSearch').addEventListener('input', function (e) { sQ = e.target.value.trim().toLowerCase(); renderSheet(); });
    $('#printSheet').addEventListener('click', function () { window.print(); });
    $('#shareSheet').addEventListener('click', function () {
      var data = { title: 'Vedika Wellness – Food Nutrition Sheet', text: 'Calories & protein of popular Indian foods', url: location.href };
      if (navigator.share) navigator.share(data).catch(function () { });
      else window.open('https://wa.me/?text=' + encodeURIComponent(data.text + ' ' + data.url), '_blank', 'noopener');
    });

    renderFoods(); renderPlate(); renderSaved(); renderSheet();
    // keep dynamic numbers' labels fresh when language flips
    $('#langBtn').addEventListener('click', function () { renderPlate(); renderSaved(); renderSheet(); });
  }

  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
