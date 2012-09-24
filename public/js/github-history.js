var GithubHistory;

(function() {

    var G = GithubHistory = function(user, repo, path) {
        this.user = user;
        this.repo = repo;
        this.path = path;

        this.commits = [];

        this.state = "init";
    };

    G.prototype.loadCommits = function(fn) {
        var self = this;
        $.getJSON(
            "/commits/" + this.user + "/" + this.repo + "/" + this.path,
            function(cs) {
                self.commits = cs;
                self.state = "commits";
                if ($.isFunction(fn)) { fn(); }
            }
        );
    };

    G.prototype.loadCommitByIndex = function(cidx, fn) {
        if (this.state != "commits" || 
            cidx < 0 || 
            cidx >= this.commits.length) { 
            return; 
        }

        var 
            self = this,
            sha = this.commits[cidx].sha;

        if (this.commits[cidx].blob) {
            if ($.isFunction(fn)) { fn(); }
        }
        else {
            $.getJSON(
                "/commit/" + this.user + "/" + this.repo + "/" + sha,
                function(c) {
                    for (var fidx = 0; fidx < c.files.length; ++fidx) {
                        if (c.files[fidx].filename == self.path) {
                            self.commits[cidx].blob = c.files[fidx];
                            if ($.isFunction(fn)) { fn(); }
                            break;
                        }
                    }
                }
            );
        }
    };

    G.prototype.getFileTextByIndex = function(idx, fn) {
        var self = this;

        if (this.commits[idx].text) {
            fn(this.commits[idx].text);
        }
        else {
            this.loadCommitByIndex(
                idx, 
                function() {
                    var 
                        url = self.commits[idx].blob.blob_url,
                        match = url.match(new RegExp("^https://github\.com/[^/]+/[^/]+/blob/([^/]+)/(.+)$"))
                        sha = match[1],
                        path = match[2],

                    $.get(
                        "/blob/" + self.user + "/" + self.repo + "/" + sha + "/" + path,
                        function(text) {
                            self.commits[idx].text = text;
                            fn(text);
                        }
                    );
                }
            );
        }
    };


})();
