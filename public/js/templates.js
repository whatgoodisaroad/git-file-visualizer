
jade = (function(exports){
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function nulls(val) {
  return val != null;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;

  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

  return exports;

})({});

jade.templates = {};
jade.render = function(node, template, data) {
  var tmp = jade.templates[template](data);
  node.innerHTML = tmp;
};

jade.templates["history_view"] = function(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div id="code-view"><div id="controls"></div><div id="commits"><ul>');
 var idx = commits.length - 1;
// iterate commits
;(function(){
  if ('number' == typeof commits.length) {
    for (var $index = 0, $$l = commits.length; $index < $$l; $index++) {
      var commit = commits[$index];

buf.push('<li');
buf.push(attrs({ 'data-index':(idx--) }, {"data-index":true}));
buf.push('><span class="committer">');
var __val__ = commit.committer
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span><text>');
var __val__ = " @ "
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</text><span class="commit_date">');
var __val__ = commit.commit_date
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span><text>');
var __val__ = " "
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</text><span class="message">');
var __val__ = commit.message.replace(/\S{10,15}/g, "$&<wbr/>")
buf.push(null == __val__ ? "" : __val__);
buf.push('</span></li>');
    }
  } else {
    for (var $index in commits) {
      var commit = commits[$index];

buf.push('<li');
buf.push(attrs({ 'data-index':(idx--) }, {"data-index":true}));
buf.push('><span class="committer">');
var __val__ = commit.committer
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span><text>');
var __val__ = " @ "
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</text><span class="commit_date">');
var __val__ = commit.commit_date
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span><text>');
var __val__ = " "
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</text><span class="message">');
var __val__ = commit.message.replace(/\S{10,15}/g, "$&<wbr/>")
buf.push(null == __val__ ? "" : __val__);
buf.push('</span></li>');
   }
  }
}).call(this);

buf.push('</ul></div><div id="code"><div>Loading code...</div><div><img src="/img/spinner.gif"/></div></div></div>');
}
return buf.join("");
}
jade.templates["loading_commits"] = function(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div id="loading-commits" class="row-fluid"><div class="span4 offset4"><div> <text>Loading commits for </text><text>');
var __val__ = path
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</text><text>...</text></div><div><img src="/img/spinner.gif"/></div></div></div>');
}
return buf.join("");
}
jade.templates["repo_dir"] = function(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<ul class="repo-dir">');
// iterate files
;(function(){
  if ('number' == typeof files.length) {
    for (var $index = 0, $$l = files.length; $index < $$l; $index++) {
      var file = files[$index];

if ( file.type == "dir")
{
buf.push('<li class="dir"><span');
buf.push(attrs({ 'data-path':(file.path), "class": ('dirname') }, {"data-path":true}));
buf.push('>');
var __val__ = file.name
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span><div class="children"></div></li>');
}
    }
  } else {
    for (var $index in files) {
      var file = files[$index];

if ( file.type == "dir")
{
buf.push('<li class="dir"><span');
buf.push(attrs({ 'data-path':(file.path), "class": ('dirname') }, {"data-path":true}));
buf.push('>');
var __val__ = file.name
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span><div class="children"></div></li>');
}
   }
  }
}).call(this);

// iterate files
;(function(){
  if ('number' == typeof files.length) {
    for (var $index = 0, $$l = files.length; $index < $$l; $index++) {
      var file = files[$index];

if ( file.type == "file")
{
buf.push('<li class="file"><span');
buf.push(attrs({ 'data-path':(file.path), "class": ('filename') }, {"data-path":true}));
buf.push('>');
var __val__ = file.name
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></li>');
}
    }
  } else {
    for (var $index in files) {
      var file = files[$index];

if ( file.type == "file")
{
buf.push('<li class="file"><span');
buf.push(attrs({ 'data-path':(file.path), "class": ('filename') }, {"data-path":true}));
buf.push('>');
var __val__ = file.name
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></li>');
}
   }
  }
}).call(this);

buf.push('</ul>');
}
return buf.join("");
}
jade.templates["repo_entry"] = function(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
if ( repos.length)
{
buf.push('<ol>');
// iterate repos
;(function(){
  if ('number' == typeof repos.length) {
    for (var $index = 0, $$l = repos.length; $index < $$l; $index++) {
      var repo = repos[$index];

buf.push('<li class="repo-entry"><div class="repo-name">');
var __val__ = repo.name
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</div><div class="repo-desc">');
var __val__ = repo.description
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</div></li>');
    }
  } else {
    for (var $index in repos) {
      var repo = repos[$index];

buf.push('<li class="repo-entry"><div class="repo-name">');
var __val__ = repo.name
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</div><div class="repo-desc">');
var __val__ = repo.description
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</div></li>');
   }
  }
}).call(this);

buf.push('</ol>');
}
else
{
buf.push('<span>User not found.</span>');
}
}
return buf.join("");
}
jade.templates["splash"] = function(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div id="splash" class="row-fluid"><div class="span4 offset4"><div id="enter-username"><input id="username" type="text" placeholder="GitHub Username" autocomplete="off"/></div><div id="select-repository"></div><div id="select-file"></div></div></div>');
}
return buf.join("");
}