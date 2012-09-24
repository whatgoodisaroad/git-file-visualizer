var 
    https = require('https'),
    linkParser = require("./peg/link-header.js").parse;

exports.commits = function(username, repository, response) {
    https
        .get({ 
            host:'api.github.com', 
            path:"/repos/" + username + "/" + repository + "/commits?perpage=100"
        }, function(res) {
            res.on('data', function(d) {
                response.write(d);
            });

            res.on("end", function() {
                response.end();
            });
        })
        .on('error', function(e) {
            callback(false);
        })
        .end();
};

exports.commitsOfFile = function(username, repository, path, response) {
    var url = {
        host:"api.github.com",
        path:"/repos/" + username + "/" + repository + "/commits?path=" + path + "&per_page=100"
    };

    var results = [];

    function nextLink(lh) {
        var ls = linkParser(lh);
        for (var idx = 0; idx < ls.length; ++idx) {
            if (ls[idx].rel == "next") {
                return ls[idx].url;
            }
        }
        return null;
    }

    function get_rec(u) {
        https.get(u, function(res) {
            var 
                lh = res.headers["link"],
                buff = "";

            res.on('data', function(d) {
                buff += d;
            });

            res.on("end", function() {
                var a = JSON.parse(buff);

                for (var idx = 0; idx < a.length; ++idx) {
                    results.push({
                        sha:a[idx].sha,
                        message:a[idx].commit.message,
                        committer:a[idx].commit.committer.name,
                        commit_date:a[idx].commit.committer.date
                    });
                }

                if (lh) {
                    var next = nextLink(lh);
                    if (next) {
                        get_rec(next);
                    }
                    else {
                        response.write(
                            JSON.stringify(results)
                        );
                        response.end();
                        console.log(
                            "Ratelimit remaining: " + 
                            res.headers["x-ratelimit-remaining"]
                        );
                    }
                }
                else {
                    response.write(
                        JSON.stringify(results)
                    );
                    response.end();
                    console.log(
                        "Ratelimit remaining: " + 
                        res.headers["x-ratelimit-remaining"]
                    );
                }
            });
        });
    };

    get_rec(url);
};

exports.commit = function(username, repository, sha, response) {
    https
        .get({ 
            host:'api.github.com', 
            path:"/repos/" + username + "/" + repository + "/commits/" + sha
        }, function(res) {
            res.on('data', function(d) {
                response.write(d);
            });

            res.on("end", function() {
                response.end();

                console.log(
                    "Ratelimit remaining: " + 
                    res.headers["x-ratelimit-remaining"]
                );
            });
        })
        .on('error', function(e) {
            callback(false);
        })
        .end();
};

exports.contents = function(username, repository, path, response) {
    https
        .get({
            host:"api.github.com",
            path:"/repos/" + username + "/" + repository + "/contents/" + path
        }, function(res) {
            res.on('data', function(d) {
                response.write(d);
            });

            res.on("end", function() {
                response.end();
            });
        })
        .on('error', function(e) {
            callback(false);
        })
        .end();
};

exports.getBlob = function(username, repository, sha, path, response) {
    https
        .get({
            host:"raw.github.com",
            path:"/" + username + "/" + repository + "/" + sha + "/" + path
        }, function(res) {
            res.on('data', function(d) {
                response.write(d);
            });

            res.on("end", function() {
                response.end();
            });
        })
        .on('error', function(e) {
            callback(false);
        })
        .end();
};

exports.userRepositories = function(username, response) {
    https
        .get({
            host:"api.github.com",
            path:"/users/" + username + "/repos"
        }, function(res) {
            res.on('data', function(d) {
                response.write(d);
            });

            res.on("end", function() {
                response.end();
            });
        })
        .on('error', function(e) {
            callback(false);
        })
        .end();
};




