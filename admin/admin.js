(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var RESERVED = ['about', 'services', 'programs', 'studio', 'blog', 'faq', 'contact', 'book', 'admin', 'img', 'content', 'packages', 'nutrition', 'reviews', 'doshas', 'assets', 'index', '404', 'style', 'script'];
  var SHELL_POST = '../blog/carbs-protein-fat-fibre-myths/index.html'; // existing page used as the header/footer template
  var SHELL_PAGE = '../about/index.html';
  var SITE = location.origin + location.pathname.replace(/admin\/(index\.html)?$/, '');

  var cfg = null;
  try { cfg = JSON.parse(localStorage.getItem('vw-admin') || 'null'); } catch (e) { cfg = null; }
  var posts = [], pages = [];
  var editing = { post: null, page: null };       // slug being edited (null = new)
  var postImage = { blob: null, existing: '', remove: false };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function slugify(s) {
    return String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function toast(msg, err) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'toast'; }, 3800);
  }
  function setMsg(id, text, cls) { var m = $(id); m.textContent = text || ''; m.className = 'msg' + (cls ? ' ' + cls : ''); }
  function utf8b64(str) {
    var bytes = new TextEncoder().encode(str), s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function b64utf8(b64) {
    var bin = atob(b64.replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function blobToB64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1]); };
      r.onerror = rej; r.readAsDataURL(blob);
    });
  }

  /* ---------- GitHub API ---------- */
  function api(path, opts) {
    opts = opts || {};
    return fetch('https://api.github.com/repos/' + cfg.repo + path, {
      method: opts.method || 'GET',
      headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + cfg.token, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store'
    }).then(function (r) {
      if (r.status === 404 && opts.allow404) return null;
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          var m = (j && j.message) || ('GitHub error ' + r.status);
          if (r.status === 401) m = 'Token is invalid or expired. Please log in again.';
          if (r.status === 403 || r.status === 404) m += ' (check the token has Contents: Read and write for this repository)';
          throw new Error(m);
        });
      }
      return r.status === 204 ? null : r.json();
    });
  }
  function enc(p) { return p.split('/').map(encodeURIComponent).join('/'); }
  function getFile(path) { return api('/contents/' + enc(path) + '?ref=' + encodeURIComponent(cfg.branch), { allow404: true }); }
  function putFile(path, b64, message) {
    return getFile(path).then(function (cur) {
      var body = { message: message, content: b64, branch: cfg.branch };
      if (cur && cur.sha) body.sha = cur.sha;
      return api('/contents/' + enc(path), { method: 'PUT', body: body });
    });
  }
  function delFile(path, message) {
    return getFile(path).then(function (cur) {
      if (!cur) return null;
      return api('/contents/' + enc(path), { method: 'DELETE', body: { message: message, sha: cur.sha, branch: cfg.branch } });
    });
  }
  function readJSON(path) {
    return getFile(path).then(function (f) {
      if (!f) return [];
      try { return JSON.parse(b64utf8(f.content)); } catch (e) { return []; }
    });
  }
  function writeJSON(path, data, msg) { return putFile(path, utf8b64(JSON.stringify(data, null, 2) + '\n'), msg); }
  function updateSitemap(url, add) {
    return getFile('sitemap.xml').then(function (f) {
      if (!f) return null;
      var xml = b64utf8(f.content), line = '<url><loc>' + url + '</loc></url>\n';
      if (add && xml.indexOf('<loc>' + url + '</loc>') < 0) xml = xml.replace('</urlset>', line + '</urlset>');
      else if (!add) xml = xml.replace(line, '');
      else return null;
      return api('/contents/sitemap.xml', { method: 'PUT', body: { message: 'Update sitemap', content: utf8b64(xml), branch: cfg.branch, sha: f.sha } });
    });
  }

  /* ---------- tiny markdown -> HTML ---------- */
  function inline(s, prefix) {
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, url) { return '<img src="' + (/^img\//.test(url) ? prefix + url : url) + '" alt="' + alt + '" loading="lazy">'; });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, url) {
      var ext = /^https?:/.test(url);
      return '<a href="' + url + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s;
  }
  function md(text, prefix) {
    prefix = prefix || '';
    var out = [], blocks = String(text).replace(/\r/g, '').split(/\n{2,}/);
    blocks.forEach(function (b) {
      b = b.trim(); if (!b) return;
      var lines = b.split('\n');
      if (/^###\s/.test(b)) out.push('<h3>' + inline(b.replace(/^###\s+/, ''), prefix) + '</h3>');
      else if (/^##\s/.test(b)) out.push('<h2>' + inline(b.replace(/^##\s+/, ''), prefix) + '</h2>');
      else if (/^#\s/.test(b)) out.push('<h2>' + inline(b.replace(/^#\s+/, ''), prefix) + '</h2>');
      else if (lines.every(function (l) { return /^[-*]\s+/.test(l); })) out.push('<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^[-*]\s+/, ''), prefix) + '</li>'; }).join('') + '</ul>');
      else if (lines.every(function (l) { return /^>\s?/.test(l); })) out.push('<blockquote>' + inline(lines.map(function (l) { return l.replace(/^>\s?/, ''); }).join(' '), prefix) + '</blockquote>');
      else if (/^!\[[^\]]*\]\([^)]+\)$/.test(b)) out.push('<p>' + inline(b, prefix) + '</p>');
      else out.push('<p>' + inline(lines.join('\n'), prefix).replace(/\n/g, '<br>') + '</p>');
    });
    return out.join('\n');
  }

  /* ---------- page templates (reuse the site's own header/footer) ---------- */
  function fillHead(html, o) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, function () { return '<title>' + esc(o.title) + '</title>'; });
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, function (_, a, b) { return a + esc(o.desc) + b; });
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, function (_, a, b) { return a + o.url + b; });
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, function (_, a, b) { return a + esc(o.title) + b; });
    html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, function (_, a, b) { return a + esc(o.desc) + b; });
    html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, function (_, a, b) { return a + o.url + b; });
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, function (_, a, b) { return a + o.image + b; });
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');
    if (o.ld) html = html.replace('</head>', function () { return '<script type="application/ld+json">' + JSON.stringify(o.ld) + '</script>\n</head>'; });
    return html;
  }
  function fillMain(html, inner) { return html.replace(/<main id="main">[\s\S]*?<\/main>/, function () { return '<main id="main">\n' + inner + '\n</main>'; }); }
  function ctaBand(rel) {
    return '<section class="cta-band"><div class="container"><h2>Ready to feel lighter and more energetic?</h2><p>Book a free call. A coach will guide you on a simple starting plan — zero pressure.</p><div class="cta-row center-row"><a href="' + rel + 'book/" class="btn btn-orange">Book Free Call</a></div></div></section>';
  }
  // keep <title> within ~60 characters and descriptions within 160 so Google does not cut them off
  function seoTitle(t) {
    var full = t + ' | Vedika Wellness';
    if (full.length <= 60) return full;
    full = t + ' | Vedika';
    if (full.length <= 60) return full;
    return t.length <= 60 ? t : t.slice(0, 57).replace(/\s+\S*$/, '') + '…';
  }
  function seoDesc(d) { d = String(d || '').trim(); return d.length <= 160 ? d : d.slice(0, 157).replace(/\s+\S*$/, '') + '…'; }
  function buildPost(shell, p) {
    var rel = '../../', url = SITE + 'blog/' + p.slug + '/';
    var img = p.image ? '<img src="' + rel + p.image + '" alt="' + esc(p.title) + '" class="post-img round shadow" width="900" height="600">' : '';
    var main = '<nav class="crumbs container" aria-label="Breadcrumb"><a href="' + rel + '">Home</a> › <a href="' + rel + 'blog/">Blog</a> › <span>' + esc(p.title) + '</span></nav>\n' +
      '<article class="container post"><span class="tagline">' + esc(p.category) + ' · ' + esc(p.date) + '</span><h1>' + esc(p.title) + '</h1>' +
      (p.excerpt ? '<p class="lead">' + esc(p.excerpt) + '</p>' : '') + img +
      '<div class="post-body">' + md(p.md, rel) + '</div>' +
      '<div class="post-cta"><h3>Want a plan made for you?</h3><p>Talk to our coaches for a simple plan that fits your body, food and routine.</p><div class="cta-row"><a href="' + rel + 'book/" class="btn btn-orange">Book Free Call</a><a href="' + rel + 'studio/" class="btn btn-light">Try Wellness Studio</a></div></div></article>';
    var html = fillHead(shell, { title: seoTitle(p.title), desc: seoDesc(p.excerpt || p.title), url: url, image: p.image ? SITE + p.image : SITE + 'img/logo-badge.webp',
      ld: { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.excerpt || '', datePublished: p.iso, author: { '@type': 'Organization', name: 'Vedika Health and Wellness' } } });
    return fillMain(html, main);
  }
  function buildPage(shell, p) {
    var rel = '../', url = SITE + p.slug + '/';
    var main = '<section class="page-hero"><div class="blob b1"></div><div class="blob b2"></div><div class="container"><h1>' + esc(p.title) + '</h1></div></section>\n' +
      '<section class="section"><div class="container narrow post-body">' + md(p.md, rel) + '</div></section>\n' + ctaBand(rel);
    var html = fillHead(shell, { title: seoTitle(p.title), desc: seoDesc(p.title + ' – Vedika Health and Wellness'), url: url, image: SITE + 'img/logo-badge.webp' });
    html = html.replace(/ class=active aria-current=page/g, '');
    return fillMain(html, main);
  }
  function fetchText(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('Could not load the site template (' + url + ')'); return r.text(); }); }

  /* ---------- image processing ---------- */
  function processImage(file, maxW) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var w = Math.min(maxW, im.width), h = Math.round(im.height * w / im.width);
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h); URL.revokeObjectURL(url);
        c.toBlob(function (blob) {
          if (!blob) return reject(new Error('Could not process this image'));
          resolve({ blob: blob, ext: blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg' });
        }, 'image/webp', 0.8);
      };
      im.onerror = function () { reject(new Error('This file is not a valid image')); };
      im.src = url;
    });
  }

  /* ---------- views ---------- */
  function show(view) {
    $$('.view').forEach(function (v) { v.hidden = v.id !== 'view' + view.charAt(0).toUpperCase() + view.slice(1); });
    $$('#adNav button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === view); });
    window.scrollTo(0, 0);
  }
  function showApp(on) { $('#viewConnect').hidden = on; $('#app').hidden = !on; }

  function renderLists() {
    $('#postCount').textContent = posts.length; $('#pageCount').textContent = pages.length;
    var pl = $('#postList'); pl.innerHTML = posts.length ? '' : '<p class="empty">No posts yet. Click “New post” to write your first one.</p>';
    posts.forEach(function (p) {
      var d = document.createElement('div'); d.className = 'item';
      d.innerHTML = (p.image ? '<img src="../' + esc(p.image) + '" alt="">' : '<span class="ph">📝</span>') +
        '<div class="t"><b>' + esc(p.title) + '</b><span>' + esc(p.category || '') + ' · ' + esc(p.date || '') + ' · /blog/' + esc(p.slug) + '/</span></div>' +
        '<div class="acts"><a class="btn sm" href="../blog/' + esc(p.slug) + '/" target="_blank" rel="noopener">View</a><button class="btn sm" data-a="edit">Edit</button><button class="btn sm danger" data-a="del">Delete</button></div>';
      $('[data-a=edit]', d).onclick = function () { editPost(p.slug); };
      $('[data-a=del]', d).onclick = function () { deletePost(p.slug); };
      pl.appendChild(d);
    });
    var gl = $('#pageList'); gl.innerHTML = pages.length ? '' : '<p class="empty">No custom pages yet. Click “New page” to add one (e.g. Privacy Policy).</p>';
    pages.forEach(function (p) {
      var d = document.createElement('div'); d.className = 'item';
      d.innerHTML = '<span class="ph">📄</span><div class="t"><b>' + esc(p.title) + (p.menu ? '<span class="badge">in menu</span>' : '') + '</b><span>/' + esc(p.slug) + '/</span></div>' +
        '<div class="acts"><a class="btn sm" href="../' + esc(p.slug) + '/" target="_blank" rel="noopener">View</a><button class="btn sm" data-a="edit">Edit</button><button class="btn sm danger" data-a="del">Delete</button></div>';
      $('[data-a=edit]', d).onclick = function () { editPage(p.slug); };
      $('[data-a=del]', d).onclick = function () { deletePage(p.slug); };
      gl.appendChild(d);
    });
  }
  function refresh() {
    return Promise.all([readJSON('content/posts.json'), readJSON('content/pages.json')]).then(function (r) {
      posts = Array.isArray(r[0]) ? r[0] : []; pages = Array.isArray(r[1]) ? r[1] : []; renderLists();
    });
  }

  /* ---------- editors ---------- */
  function toolbar(el) {
    var ta = $('#' + el.dataset.for);
    var defs = [['H2', '## ', ''], ['H3', '### ', ''], ['B', '**', '**'], ['I', '*', '*'], ['• List', '- ', ''], ['❝', '> ', ''], ['🔗 Link', 'link'], ['🖼 Image', 'img']];
    defs.forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = d[0]; b.title = d[0];
      b.onclick = function () {
        var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e), ins;
        if (d[1] === 'link') { var u = prompt('Link address (https://…)'); if (!u) return; ins = '[' + (sel || 'link text') + '](' + u + ')'; }
        else if (d[1] === 'img') { inlineTarget = ta; $('#inlineImg').click(); return; }
        else if (d[2] === '' ) { ins = (s > 0 && v[s - 1] !== '\n' ? '\n\n' : '') + d[1] + (sel || 'text'); }
        else ins = d[1] + (sel || 'text') + d[2];
        ta.value = v.slice(0, s) + ins + v.slice(e); ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length;
      };
      el.appendChild(b);
    });
  }
  var inlineTarget = null;
  $('#inlineImg').addEventListener('change', function (e) {
    var f = e.target.files[0]; e.target.value = ''; if (!f || !inlineTarget) return;
    var ta = inlineTarget, alt = prompt('Short description of the image (alt text)', '') || '';
    toast('Uploading image…');
    processImage(f, 1000).then(function (r) {
      var name = 'img/posts/' + Date.now() + '.' + r.ext;
      return blobToB64(r.blob).then(function (b64) { return putFile(name, b64, 'Upload image'); }).then(function () {
        var s = ta.selectionStart, v = ta.value, ins = '\n\n![' + alt + '](' + name + ')\n\n';
        ta.value = v.slice(0, s) + ins + v.slice(s); toast('Image added to your content');
      });
    }).catch(function (err) { toast(err.message, true); });
  });
  $$('.toolbar').forEach(toolbar);

  function previewHTML(kind) {
    var f = $(kind === 'post' ? '#formPost' : '#formPage'), box = $(kind === 'post' ? '#postPreview' : '#pagePreview');
    var rel = '../';
    var h = '<h1>' + esc(f.title.value || 'Untitled') + '</h1>';
    if (kind === 'post' && f.excerpt.value) h += '<p class="muted">' + esc(f.excerpt.value) + '</p>';
    if (kind === 'post') { var src = postImage.blob ? $('#postImgEl').src : (postImage.existing && !postImage.remove ? rel + postImage.existing : ''); if (src) h += '<img src="' + src + '" alt="" style="max-width:100%;border-radius:12px">'; }
    box.innerHTML = h + '<div class="rendered">' + md(f.body.value, rel) + '</div>'; box.hidden = false;
  }
  $$('[data-preview]').forEach(function (b) { b.onclick = function () { previewHTML(b.dataset.preview); }; });

  // auto slug + URL hint
  function bindSlug(form, urlEl, prefix, key) {
    var touched = false;
    form.slug.addEventListener('input', function () { touched = !!form.slug.value; hint(); });
    form.title.addEventListener('input', function () { if (!touched && !editing[key]) form.slug.value = slugify(form.title.value); hint(); });
    function hint() { $(urlEl).textContent = SITE + prefix + (form.slug.value || 'your-title') + '/'; }
    form._hint = hint;
  }
  var fPost = $('#formPost'), fPage = $('#formPage');
  bindSlug(fPost, '#postUrl', 'blog/', 'post'); bindSlug(fPage, '#pageUrl', '', 'page');

  fPost.image.addEventListener('change', function () {
    var f = fPost.image.files[0]; if (!f) return;
    processImage(f, 1000).then(function (r) {
      postImage.blob = r.blob; postImage.ext = r.ext; postImage.remove = false;
      $('#postImgEl').src = URL.createObjectURL(r.blob); $('#postImgPrev').hidden = false;
    }).catch(function (err) { toast(err.message, true); });
  });
  $('#postImgRemove').onclick = function () { postImage = { blob: null, existing: '', remove: true }; fPost.image.value = ''; $('#postImgPrev').hidden = true; };

  function resetPost() {
    editing.post = null; fPost.reset(); fPost.category.value = 'Health Tips'; postImage = { blob: null, existing: '', remove: false };
    $('#postImgPrev').hidden = true; $('#postPreview').hidden = true; setMsg('#postMsg', ''); $('#postHeading').textContent = 'New post'; fPost.slug.disabled = false; fPost._hint();
  }
  function resetPage() {
    editing.page = null; fPage.reset(); $('#pagePreview').hidden = true; setMsg('#pageMsg', ''); $('#pageHeading').textContent = 'New page'; fPage.slug.disabled = false; fPage._hint();
  }
  function editPost(slug) {
    var p = posts.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
    resetPost(); editing.post = slug; $('#postHeading').textContent = 'Edit post';
    fPost.title.value = p.title; fPost.slug.value = p.slug; fPost.slug.disabled = true; fPost.category.value = p.category || ''; fPost.excerpt.value = p.excerpt || ''; fPost.body.value = p.md || '';
    if (p.image) { postImage.existing = p.image; $('#postImgEl').src = '../' + p.image; $('#postImgPrev').hidden = false; }
    fPost._hint(); show('post');
  }
  function editPage(slug) {
    var p = pages.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
    resetPage(); editing.page = slug; $('#pageHeading').textContent = 'Edit page';
    fPage.title.value = p.title; fPage.slug.value = p.slug; fPage.slug.disabled = true; fPage.menu.checked = !!p.menu; fPage.body.value = p.md || '';
    fPage._hint(); show('page');
  }

  /* ---------- publish / delete ---------- */
  function busy(form, on, label) { var b = $('button[type=submit]', form); b.disabled = on; b.textContent = on ? 'Publishing…' : label; }

  fPost.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = fPost, isNew = !editing.post, slug = slugify(f.slug.value || f.title.value);
    if (!f.title.value.trim() || !f.body.value.trim()) return setMsg('#postMsg', 'Please add a title and some content.', 'err');
    if (!slug) return setMsg('#postMsg', 'Please enter a URL name using English letters or numbers.', 'err');
    if (isNew && posts.some(function (p) { return p.slug === slug; })) return setMsg('#postMsg', 'A post with this URL name already exists. Change the URL name.', 'err');
    busy(f, true, 'Publish post'); setMsg('#postMsg', 'Publishing… please wait', '');
    var now = new Date(), old = posts.filter(function (p) { return p.slug === slug; })[0];
    var entry = { slug: slug, title: f.title.value.trim(), excerpt: f.excerpt.value.trim(), category: f.category.value.trim() || 'Health Tips',
      date: old ? old.date : now.toLocaleString('en-US', { month: 'long', year: 'numeric' }), iso: old ? old.iso : now.toISOString().slice(0, 10), md: f.body.value, image: postImage.remove ? '' : postImage.existing };
    var chain = Promise.resolve();
    if (isNew) chain = chain.then(function () { return getFile('blog/' + slug + '/index.html'); }).then(function (ex) { if (ex) throw new Error('This URL name is used by a built-in post. Choose another.'); });
    chain = chain.then(function () {
      if (postImage.blob) {
        entry.image = 'img/posts/' + slug + '.' + (postImage.ext || 'webp');
        return blobToB64(postImage.blob).then(function (b64) { return putFile(entry.image, b64, 'Add image for ' + slug); });
      }
      if (postImage.remove && old && old.image) return delFile(old.image, 'Remove image');
    });
    chain.then(function () { return fetchText(SHELL_POST); })
      .then(function (shell) { return putFile('blog/' + slug + '/index.html', utf8b64(buildPost(shell, entry)), (isNew ? 'Publish post: ' : 'Update post: ') + entry.title); })
      .then(function () { return readJSON('content/posts.json'); })
      .then(function (list) {
        list = list.filter(function (p) { return p.slug !== slug; });
        var i = old ? posts.findIndex(function (p) { return p.slug === slug; }) : 0;
        list.splice(Math.min(i, list.length), 0, entry);
        return writeJSON('content/posts.json', list, 'Update posts list');
      })
      .then(function () { return updateSitemap(SITE + 'blog/' + slug + '/', true); })
      .then(function () { return refresh(); })
      .then(function () {
        toast('✅ Published! It will be live in 1–2 minutes.'); resetPost(); show('dash');
      })
      .catch(function (err) { setMsg('#postMsg', err.message, 'err'); toast(err.message, true); })
      .then(function () { busy(f, false, 'Publish post'); });
  });

  fPage.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = fPage, isNew = !editing.page, slug = slugify(f.slug.value || f.title.value);
    if (!f.title.value.trim() || !f.body.value.trim()) return setMsg('#pageMsg', 'Please add a title and some content.', 'err');
    if (!slug) return setMsg('#pageMsg', 'Please enter a URL name using English letters or numbers.', 'err');
    if (isNew && (RESERVED.indexOf(slug) >= 0 || pages.some(function (p) { return p.slug === slug; }))) return setMsg('#pageMsg', 'This URL name is not available. Choose a different one.', 'err');
    busy(f, true, 'Publish page'); setMsg('#pageMsg', 'Publishing… please wait', '');
    var entry = { slug: slug, title: f.title.value.trim(), menu: f.menu.checked, md: f.body.value };
    var chain = Promise.resolve();
    if (isNew) chain = chain.then(function () { return getFile(slug + '/index.html'); }).then(function (ex) { if (ex) throw new Error('A page already exists at this address. Choose another URL name.'); });
    chain.then(function () { return fetchText(SHELL_PAGE); })
      .then(function (shell) { return putFile(slug + '/index.html', utf8b64(buildPage(shell, entry)), (isNew ? 'Publish page: ' : 'Update page: ') + entry.title); })
      .then(function () { return readJSON('content/pages.json'); })
      .then(function (list) {
        var i = list.findIndex(function (p) { return p.slug === slug; });
        if (i >= 0) list[i] = entry; else list.push(entry);
        return writeJSON('content/pages.json', list, 'Update pages list');
      })
      .then(function () { return updateSitemap(SITE + slug + '/', true); })
      .then(function () { return refresh(); })
      .then(function () { toast('✅ Page published! It will be live in 1–2 minutes.'); resetPage(); show('dash'); })
      .catch(function (err) { setMsg('#pageMsg', err.message, 'err'); toast(err.message, true); })
      .then(function () { busy(f, false, 'Publish page'); });
  });

  function deletePost(slug) {
    var p = posts.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
    if (!confirm('Delete the post “' + p.title + '”? This cannot be undone.')) return;
    toast('Deleting…');
    delFile('blog/' + slug + '/index.html', 'Delete post: ' + p.title)
      .then(function () { return p.image ? delFile(p.image, 'Delete image') : null; })
      .then(function () { return readJSON('content/posts.json'); })
      .then(function (list) { return writeJSON('content/posts.json', list.filter(function (x) { return x.slug !== slug; }), 'Update posts list'); })
      .then(function () { return updateSitemap(SITE + 'blog/' + slug + '/', false); })
      .then(refresh).then(function () { toast('🗑 Post deleted. The site updates in 1–2 minutes.'); })
      .catch(function (err) { toast(err.message, true); });
  }
  function deletePage(slug) {
    var p = pages.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
    if (!confirm('Delete the page “' + p.title + '”? This cannot be undone.')) return;
    toast('Deleting…');
    delFile(slug + '/index.html', 'Delete page: ' + p.title)
      .then(function () { return readJSON('content/pages.json'); })
      .then(function (list) { return writeJSON('content/pages.json', list.filter(function (x) { return x.slug !== slug; }), 'Update pages list'); })
      .then(function () { return updateSitemap(SITE + slug + '/', false); })
      .then(refresh).then(function () { toast('🗑 Page deleted. The site updates in 1–2 minutes.'); })
      .catch(function (err) { toast(err.message, true); });
  }

  /* ---------- navigation / auth ---------- */
  $$('#adNav button').forEach(function (b) {
    b.onclick = function () { if (b.dataset.view === 'post') resetPost(); if (b.dataset.view === 'page') resetPage(); show(b.dataset.view); };
  });
  $$('[data-go]').forEach(function (b) {
    b.onclick = function () { var v = b.dataset.go; if (v === 'post') resetPost(); if (v === 'page') resetPage(); show(v); };
  });
  $('#logout').onclick = function () { localStorage.removeItem('vw-admin'); cfg = null; location.reload(); };

  $('#connectForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = { token: $('#cToken').value.trim(), repo: $('#cRepo').value.trim().replace(/^https?:\/\/github\.com\//, ''), branch: $('#cBranch').value.trim() || 'main' };
    setMsg('#connectMsg', 'Checking…', ''); var old = cfg; cfg = c;
    api('').then(function (r) {
      if (r.permissions && r.permissions.push === false) throw new Error('This token can read but not write. Give it “Contents: Read and write”.');
      localStorage.setItem('vw-admin', JSON.stringify(c)); return start();
    }).catch(function (err) { cfg = old; setMsg('#connectMsg', err.message, 'err'); });
  });

  function start() {
    $('#repoLabel').textContent = cfg.repo + ' · ' + cfg.branch;
    showApp(true); show('dash');
    return refresh().catch(function (err) { toast(err.message, true); });
  }
  if (cfg && cfg.token) start(); else showApp(false);
})();
