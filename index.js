/**
 * koa2-browser-sync
 * 2016 Ændrew Rininsland, Financial Times
 *
 * Based on koa-browser-sync by SimonDegraeve.
 */

var browserSync    = require('browser-sync');
var StreamInjecter = require('stream-injecter');

module.exports = function(opts, bs) {
  var snippet;
  var opts       = opts || {};
  opts.init      = opts.init || false;
  opts.debugInfo = opts.debugInfo || false;

  return function(ctx, next) {
    return next.then(function(){
      if (opts.init) {
        if (!bs) bs = browserSync.create().init(opts);
        snippet = bs.getOption('snippet');
      } else {
        snippet = process.env.BROWSERSYNC_SNIPPET;
      }

      if (!snippet) return;

      if (!(ctx.response.type && ~ctx.response.type.indexOf("text/html"))) return;

      // Buffer
      if (Buffer.isBuffer(ctx.body)) {
        ctx.body = ctx.body.toString();
      }

      // String
      if (typeof ctx.body === 'string') {
        if (ctx.body.match(/client\/browser-sync-client/)) return;
        ctx.body = ctx.body.replace(/<\/body>/, snippet + '</body>');
      }

      // Stream
      if (ctx.body && typeof ctx.body.pipe === 'function') {
        var injecter = new StreamInjecter({
          matchRegExp: /(<\/body>)/,
          inject:      snippet,
          replace:     snippet + '$1',
          ignore:      /client\/browser-sync-client/
        });
        var size = +ctx.response.header['content-length'];
        if (size) ctx.set('Content-Length', size + snippet.length);
        ctx.body = ctx.body.pipe(injecter);
      }
    });
  };
};
