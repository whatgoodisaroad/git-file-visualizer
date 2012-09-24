
/**
 * Module dependencies.
 */

var 
  express = require('express'), 
  routes = require('./routes'),
  github = require("./github-api.js");

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.get("/commits/:username/:repository/*", function(req, res) {
  req.params.path = req.params[0];

  github.commitsOfFile(
    req.params.username,
    req.params.repository,
    req.params.path,
    res
  );
});

app.get("/commit/:username/:repository/:sha", function(req, res) {
  github.commit(
    req.params.username,
    req.params.repository,
    req.params.sha,
    res
  );
});

app.get("/contents/:username/:repository/*", function(req, res) {
  req.params.path = req.params[0];

  github.contents(
    req.params.username,
    req.params.repository,
    req.params.path,
    res
  );
});

app.get("/blob/:username/:repository/:sha/*", function(req, res) {
  req.params.path = req.params[0];
  
  github.getBlob(
    req.params.username,
    req.params.repository,
    req.params.sha,
    req.params.path,
    res
  );
});

app.get("/repos/:username", function(req, res) {
  github.userRepositories(
    req.params.username,
    res
  );
});

app.listen(3001, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
