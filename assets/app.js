/* ============ 极简 Markdown 渲染 ============
   支持：## 标题、- 列表、> 引用、**加粗**、`代码`、```代码块```
   ============================================ */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function renderMarkdown(src) {
  var lines = src.split('\n');
  var out = [];
  var i = 0;
  var inCode = false;
  var codeLines = [];

  while (i < lines.length) {
    var line = lines[i];

    if (line.trim().indexOf('```') === 0) {
      if (inCode) {
        out.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      i++;
      continue;
    }
    if (inCode) { codeLines.push(line); i++; continue; }

    if (line.indexOf('## ') === 0) {
      out.push('<h2>' + inlineFormat(line.slice(3)) + '</h2>');
    } else if (line.indexOf('> ') === 0) {
      out.push('<blockquote>' + inlineFormat(line.slice(2)) + '</blockquote>');
    } else if (line.indexOf('- ') === 0) {
      if (out.length && out[out.length - 1].indexOf('<ul>') === 0) {
        out[out.length - 1] += '<li>' + inlineFormat(line.slice(2)) + '</li>';
      } else {
        out.push('<ul><li>' + inlineFormat(line.slice(2)) + '</li>');
      }
    } else if (line.trim() === '') {
      if (out.length && out[out.length - 1].indexOf('<ul>') === 0) out[out.length - 1] += '</ul>';
    } else {
      if (out.length && out[out.length - 1].indexOf('<ul>') === 0) out[out.length - 1] += '</ul>';
      out.push('<p>' + inlineFormat(line) + '</p>');
    }
    i++;
  }
  if (out.length && out[out.length - 1].indexOf('<ul>') === 0) out[out.length - 1] += '</ul>';
  if (inCode) out.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
  return out.join('\n');
}

/* ============ 工具函数 ============ */
function sortPosts(posts) {
  return posts.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
}

function esc(str) { return escapeHtml(String(str)); }

function formatDate(date) {
  var parts = date.split('-');
  return parts[0] + ' 年 ' + Number(parts[1]) + ' 月 ' + Number(parts[2]) + ' 日';
}

function metaHtml(post) {
  var tags = (post.tags || []).map(function (t) { return '<span># ' + esc(t) + '</span>'; }).join(' ');
  return '<div class="post-meta"><span>' + esc(formatDate(post.date)) + '</span><span class="dot"></span><span>' + tags + '</span></div>';
}

/* ============ 页面渲染 ============ */
var app = document.getElementById('app');
var posts = window.POSTS || [];
var site = window.SITE || {};

function renderHome() {
  var list = sortPosts(posts).map(function (p) {
    return '<a class="post-item" href="#/post/' + encodeURIComponent(p.slug) + '" data-nav>' +
      metaHtml(p) +
      '<h2>' + esc(p.title) + '</h2>' +
      '<p>' + esc(p.summary) + '</p>' +
      '</a>';
  }).join('');

  app.innerHTML =
    '<section class="hero">' +
      '<h1>' + esc(site.description || '把想法写下来') + '</h1>' +
      '<p>' + esc(site.intro || '') + '</p>' +
    '</section>' +
    '<div class="section-label">最近的文章 · ' + posts.length + ' 篇</div>' +
    '<div class="post-list">' + (list || '<div class="empty">还没有文章，去 posts.js 里加第一篇吧。</div>') + '</div>';
}

function renderPost(slug) {
  var post = posts.find(function (p) { return p.slug === slug; });
  if (!post) {
    app.innerHTML = '<div class="empty">没找到这篇文章。<a href="#/" data-nav> 返回首页</a></div>';
    return;
  }
  app.innerHTML =
    '<a class="post-back" href="#/" data-nav>← 返回列表</a>' +
    '<header class="post-header">' +
      '<h1>' + esc(post.title) + '</h1>' +
      metaHtml(post) +
    '</header>' +
    '<article class="post-body">' + renderMarkdown(post.body) + '</article>';
}

function renderAbout() {
  app.innerHTML =
    '<div class="about-card">' +
      '<h1>关于</h1>' +
      '<p>' + esc(site.intro || '') + '</p>' +
      '<p>这个站点是我自己的一小块地方，用来记录、整理和回看。写得随意，但都是真话。</p>' +
      '<p>联系我：<a href="mailto:' + esc(site.email || '') + '">' + esc(site.email || '') + '</a></p>' +
    '</div>';
}

/* ============ 路由 ============ */
function route() {
  var hash = window.location.hash || '#/';
  var parts = hash.replace(/^#\/?/, '').split('/');

  if (parts[0] === 'post' && parts[1]) renderPost(decodeURIComponent(parts[1]));
  else if (parts[0] === 'about') renderAbout();
  else renderHome();

  window.scrollTo(0, 0);
}

/* ============ 主题 ============ */
var stored = localStorage.getItem('theme');
if (stored === 'dark' || stored === 'light') {
  document.documentElement.setAttribute('data-theme', stored);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

document.getElementById('themeToggle').addEventListener('click', function () {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

/* ============ 初始化 ============ */
document.getElementById('year').textContent = new Date().getFullYear();
document.title = site.title || '个人博客';
window.addEventListener('hashchange', route);
route();
