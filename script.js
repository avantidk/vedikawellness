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

  // Doshas
  var doshas = {
    vata: { icon: '💨', name: 'Vata — Air & Space',
      desc: 'Creative, quick and energetic. When balanced you are lively and flexible; when out of balance you may feel anxious, dry, cold or have irregular sleep and digestion.',
      tip: 'warm cooked meals, sesame-oil abhyanga, fixed routine, gentle yoga and early bedtime.' },
    pitta: { icon: '🔥', name: 'Pitta — Fire & Water',
      desc: 'Sharp, focused and driven. In balance you are confident and a natural leader; out of balance you may experience irritability, acidity, inflammation or burnout.',
      tip: 'cooling foods like coconut and cucumber, moonlight walks, coconut-oil massage and calming pranayama.' },
    kapha: { icon: '🌊', name: 'Kapha — Earth & Water',
      desc: 'Calm, steady and nurturing. In balance you are loyal and strong; out of balance you may feel sluggish, heavy, or gain weight and congestion easily.',
      tip: 'light spicy food, ginger tea, vigorous exercise, dry-brush massage and waking early.' }
  };
  function showDosha(k) {
    var d = doshas[k];
    $('#doshaEl').textContent = d.icon;
    $('#doshaName').textContent = d.name;
    $('#doshaDesc').textContent = d.desc;
    $('#doshaTip').textContent = d.tip;
    $$('.tab').forEach(function (t) {
      var on = t.dataset.dosha === k;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
    });
  }
  if ($('#doshaPanel')) {
    $$('.tab').forEach(function (t) { t.addEventListener('click', function () { showDosha(t.dataset.dosha); }); });
    showDosha('vata');
  }

  // Testimonial slider
  var slides = $$('.slide'), dots = $('#dots'), cur = 0, timer;
  slides.forEach(function (_, i) {
    var b = document.createElement('button');
    b.setAttribute('aria-label', 'Show review ' + (i + 1));
    b.addEventListener('click', function () { go(i); start(); });
    dots.appendChild(b);
  });
  function go(i) {
    cur = i;
    slides.forEach(function (s, n) { s.classList.toggle('active', n === i); });
    $$('button', dots).forEach(function (b, n) { b.classList.toggle('on', n === i); });
  }
  function start() { clearInterval(timer); timer = setInterval(function () { go((cur + 1) % slides.length); }, 5500); }
  if (slides.length) { go(0); start(); }

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
    var text = 'Namaste! I would like to book *' + f.service.value + '*.\nName: ' + f.name.value.trim() +
      '\nPhone: ' + f.phone.value.trim() + (f.date.value ? '\nPreferred date: ' + f.date.value : '');
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  $('#yr').textContent = new Date().getFullYear();
})();
