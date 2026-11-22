(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile menu
  var btn = $('#menuBtn'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  btn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Scroll reveal
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  // Diet goals
  var goals = {
    weight: { icon: '⚖️', name: 'Weight Loss',
      desc: 'Lose fat steadily without starving. We build a calorie-aware plan around roti, dal, sabzi and curd, with protein at every meal and a daily walk.',
      meals: [['Breakfast', 'Vegetable besan chilla + mint chutney'], ['Lunch', '1–2 roti, dal, big salad, sabzi'], ['Dinner', 'Moong khichdi or grilled paneer + soup']] },
    gut: { icon: '🫶', name: 'Gut Health',
      desc: 'Calm bloating and acidity with fibre-rich foods, natural probiotics and regular meal timing. Fewer triggers, more comfort.',
      meals: [['Morning', 'Warm water with jeera + soaked methi'], ['Lunch', 'Curd rice, lauki sabzi, cucumber salad'], ['Evening', 'Buttermilk + roasted makhana']] },
    energy: { icon: '⚡', name: 'Energy & Immunity',
      desc: 'Beat fatigue with balanced iron, vitamin C and healthy fats, plus better sleep and hydration habits.',
      meals: [['Breakfast', 'Ragi porridge with nuts and banana'], ['Lunch', 'Rajma, brown rice, amla chutney'], ['Snack', 'Fruit bowl + pumpkin seeds']] }
  };
  function showGoal(k) {
    var g = goals[k];
    $('#goalEmoji').textContent = g.icon;
    $('#goalName').textContent = g.name;
    $('#goalDesc').textContent = g.desc;
    var box = $('#goalMeals');
    box.innerHTML = '';
    g.meals.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'meal';
      var b = document.createElement('b'); b.textContent = m[0];
      d.appendChild(b); d.appendChild(document.createTextNode(m[1]));
      box.appendChild(d);
    });
    $$('.tab').forEach(function (t) {
      var on = t.dataset.goal === k;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
    });
  }
  if ($('#goalPanel')) {
    $$('.tab').forEach(function (t) { t.addEventListener('click', function () { showGoal(t.dataset.goal); }); });
    showGoal('weight');
  }

  // BMI calculator
  var bmi = $('#bmiForm');
  if (bmi) bmi.addEventListener('submit', function (e) {
    e.preventDefault();
    var h = parseFloat(bmi.h.value) / 100, w = parseFloat(bmi.w.value), out = $('#bmiResult');
    if (!(h > 1 && w > 20)) { out.className = 'bmi-result warn'; out.textContent = 'Please enter a valid height and weight.'; return; }
    var v = w / (h * h), cat, cls = 'ok';
    if (v < 18.5) { cat = 'Underweight'; cls = 'warn'; }
    else if (v < 23) cat = 'Healthy range';
    else if (v < 27.5) { cat = 'Overweight'; cls = 'warn'; }
    else { cat = 'Obese range'; cls = 'warn'; }
    out.className = 'bmi-result ' + cls;
    out.innerHTML = '<span class="num">' + v.toFixed(1) + '</span>' + cat + '<small>Based on Asian BMI cut-offs. Talk to our nutritionist for personal advice.</small>';
  });

  // Testimonial slider
  var slides = $$('.slide'), dots = $('#dots'), cur = 0, timer;
  if (slides.length && dots) {
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Show review ' + (i + 1));
      b.addEventListener('click', function () { go(i); start(); });
      dots.appendChild(b);
    });
    var go = function (i) {
      cur = i;
      slides.forEach(function (s, n) { s.classList.toggle('active', n === i); });
      $$('button', dots).forEach(function (b, n) { b.classList.toggle('on', n === i); });
    };
    var start = function () { clearInterval(timer); timer = setInterval(function () { go((cur + 1) % slides.length); }, 5500); };
    go(0); start();
  }

  // Booking form -> WhatsApp
  var WA = '910000000000'; // TODO: replace with the real WhatsApp number (country code + number)
  $('#waFloat').href = 'https://wa.me/' + WA;
  var form = $('#bookForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = $('#formMsg');
    if (!f.name.value.trim() || f.phone.value.replace(/\D/g, '').length < 10) {
      msg.textContent = 'Please enter your name and a valid phone number.';
      return;
    }
    msg.textContent = '';
    var text = 'Hello! I would like to book a consultation for *' + f.service.value + '*.\nName: ' + f.name.value.trim() +
      '\nPhone: ' + f.phone.value.trim() + (f.date.value ? '\nPreferred date: ' + f.date.value : '');
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  $('#yr').textContent = new Date().getFullYear();
})();
