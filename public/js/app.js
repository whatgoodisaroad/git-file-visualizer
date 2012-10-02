/**
 *  Main object for client code.
 */
var App = {

    animLock:false,

    typingPause:400,
    
    /**
     *  Get one level of the files in a repository.
     *
     *  @param  username    The string of the username under which the 
     *                      repository exists. (e.g. "torvalds")
     *  @param  repository  The string of the repository name. (e.g. "linux")
     *  @param  path        The string of the path to the level of repository 
     *                      files to retrieve. (e.g. "" for the root, or 
     *                      "fs/ext4" for a deeper directory.)
     *  @param  fn          The callback to handle the results. Will be passed
     *                      a list of files and directories at the given level.
     */
    getContents:function(username, repository, path, fn) {
        $.getJSON(
            "/contents/" + username + "/" + repository + "/" + path,
            fn
        );
    },

    /**
     *  Render the contents of a repository at the given level and wireup click 
     *  event handlers to files and folders. When clicked, folders recursively
     *  render their contents, and files will switch to the history view mode.
     *  
     *  @param  $target     A jQuery object of the rendering site. (e.g. the 
     *                      children DIV inside an existing folder entry.)
     *  @param  username    The username under which the repository exists.
     *  @param  repository  The name of the repository which contents are being
     *                      rendered.
     *  @param  path        The path of the directory being rendered.
     *  @param  fn          An optional callback to be invoked when the 
     *                      rendering is complete.
     */
    renderContents:function($target, username, repository, path, fn) {
        App.getContents(
            username, 
            repository, 
            path, 
            function(contents) {
                jade.render(
                    $target[0],
                    "repo_dir",
                    { files:contents }
                );

                $target.find("li.dir").click(function(evt) {
                    var 
                        $this = $(this),
                        path = $this.find(".dirname").data("path"),
                        children = $this.find(".children");

                    if (!children.find("*").length) {
                        $this.addClass("loading");
                        App.renderContents(
                            children,
                            username,
                            repository,
                            path,
                            function() {
                                $this.removeClass("loading")
                            }
                        );
                    }
                });

                $target.find("li.file").click(function() {
                    router.navigate([
                            username,
                            repository,
                            0,
                            $(this).find(".filename").data("path")
                        ].join("/"),
                        { trigger:true }
                    );
                });

                if ($.isFunction(fn)) { fn(); }
            }
        );
    },

    /**
     *  Render the initial view for the application. This view allows the user 
     *  to select the file the history of which to view. This is done with a 
     *  progression of inputs. First the user types the GitHub username. The 
     *  repositories of that username are automatically retrieved. The user 
     *  selects a repository, and the contents of that repository are 
     *  automatically retrieved. The user selects a file and this view is over.
     */
    renderIndex:function() { 
        jade.render(
            $("#main")[0],
            "splash", 
            { }
        );

        var 
            pid, 
            last = $("#username").val();

        $("#username")
            .focus()
            .on("keyup change", function() {
                pid = setTimeout(
                    function() {
                        var 
                            username = $("#username").val(),
                            list = $("#select-repository");

                        if (!username || username == last) { return; }

                        last = username;

                        if (username.length) {
                            list.html("Loading...");

                            $.getJSON(
                                "/repos/" + username,
                                function(repos) {
                                    jade.render(
                                        list[0],
                                        "repo_entry",
                                        { repos:repos }
                                    );

                                    $(".repo-entry")
                                        .on("click", function(evt) {
                                            $("#enter-username")
                                                .text(username);

                                            var 
                                                target = $(evt.target)
                                                    .parents(".repo-entry"),
                                                repository = target
                                                    .find(".repo-name").text();

                                            if (!repository) { return; }

                                            list.html(
                                                $("<div><div/><div/></div>")
                                                    .addClass("repo-entry")
                                                    .find("div:first")
                                                        .addClass("repo-name")
                                                        .text(repository)
                                                        .end()
                                                    .find("div:last")
                                                        .addClass("repo-desc")
                                                        .text(
                                                            target
                                                                .find(".repo-desc")
                                                                .text()
                                                        )
                                                        .end()
                                            );

                                            $("#select-file")
                                                .html("Loading...")

                                            App.renderContents(
                                                $("#select-file"),
                                                username,
                                                repository,
                                                ""
                                            );
                                        });
                                }
                            );

                        }
                        else {
                            list.html("");
                        }
                    },
                    App.typingPause
                );
            })
            .on("keydown", function() {
                clearTimeout(pid);
            });
    },

    /**
     *  Render the history exploration view. In this view, the commits for the 
     *  specified file are retrieved and the specified version of the file is 
     *  displayed. The user can then move forward and backward across the 
     *  commits and see the effect on the file.
     *
     *  @param  username    The string of the username.
     *  @param  repository  The string of the repository name.
     *  @param  commit      The integer of the zero-based index of the commit 
     *                      to display. This is not the same as commit number.
     *                      The index 0 refers to the earliest relevant commit,
     *                      and so on.
     *  @param  path        The string path to the file being examined. (e.g. 
     *                      "fs/ext4/ioctl.c")
     */
    viewHistory:function(username, repository, commit, path) {
        document.title = path;

        App.animLock = true;

        commit = parseInt(commit, 10);

        $("#main").animate({ opacity:0 }, function() {
            jade.render(
                $("#main")[0],
                "loading_commits", { 
                    username:username, 
                    repository:repository, 
                    path:path 
                }
            );

            $("#main").css({ opacity:1 });

            var history = new GithubHistory(
                username,
                repository,
                path
            );

            window.history = history;

            history.loadCommits(function() {
                jade.render(
                    $("#main")[0],
                    "history_view",
                    { commits:history.commits }
                );

                $("#commits")
                    .animate({ 
                        scrollTop:$("#commits li:last").offset().top 
                    });

                $("#commits li").click(function() {
                    if (App.animLock) { return; }
                    App.animLock = true;

                    var 
                        $t = $(this)
                        idx = $t.data("index");

                    router.navigate([
                            username,
                            repository,
                            idx,
                            path
                        ].join("/"),
                        { trigger:false }
                    );

                    App.updateCurrentCommit(
                        idx,
                        history,
                        function() {
                            App.animLock = false;
                        }
                    );
                });

                if (history.commits.length) {
                    App.updateCurrentCommit(
                        commit,
                        history,
                        function() {
                            App.animLock = false;
                        }
                    );
                }
            });
        })
    },

    /**
     *  Update the history view to reflect the given commit index. This will 
     *  change display features like the highlighted commit in the commit list,
     *  and it will update the code to reflect that version.
     *
     *  @param  commit  The commit to display. Zero being the earliest commit.
     *  @param  history The history object to use in retrieving the commit 
     *                  data.
     *  @param  fn      An optional callback to be invoked when rendering is 
     *                  complete.
     */
    updateCurrentCommit:function(commit, history, fn) {
        
        var oldTitle = document.title;
        document.title = "(Loading...)"

        // Update commit list display:

        $("#commits li")
            .removeClass("current-commit");
        var currentLi = $("#commits li[data-index='" + commit + "']")
            .addClass("current-commit");
        
        // Update code display:

        // Callback, given the next text, do the work to display it.:
        function applyText(text, lastPatch) { 
            $("#code").html("");

            var 
                lines = text.split("\n"),
                ol = $("<ol/>");

            for (var idx = 0; idx < lines.length; ++idx) {
                $("<li/>")
                    .text(lines[idx])
                    .appendTo(ol);
            }

            ol.appendTo("#code");

            if (lastPatch) {
                var lines = App.relevantLines(lastPatch);

                $("#code ol li.new")
                    .removeClass("new");

                for (var idx = 0; idx < lines.post.length; ++idx) {
                    $("#code ol li:eq(" + lines.post[idx] + ")")
                        .addClass("new");
                }
            }

            document.title = oldTitle;

            if ($.isFunction(fn)) { fn(); }
        }

        // Display the next version via patch application:
        App.forwardPort(
            commit, 
            history, 
            applyText
        );

        // Display the next version via downloading:
        // NOTE: This is cheating and lame.
        // history.getFileTextByIndex(
        //     history.commits.length - 1 - commit,
        //     applyText
        // );
    },

    /**
     *  Evaluate the text of the specified commit version of the file. This is 
     *  done by recursively applying patches to the preceding commits until an
     *  already-evaluated version is met, or the initial commit, in which case
     *  the file is downloaded directly.
     *
     *  @param  commit  The commit to display. Zero being the earliest commit.
     *  @param  history The history object to use in retrieving the commit 
     *                  data.
     *  @param  fn      An optional callback to be invoked complete.
     */
    forwardPort:function(commit, history, fn) {
        
        // Compute the array index for the commit (0 being latest):
        var idx = history.commits.length - 1 - commit;

        // If this commit is already evaluated:
        if (history.commits[idx].text) {
            fn(
                history.commits[idx].text,
                history.commits[idx].blob.patch
            );
            return;
        }

        // If this is the initial commit:
        else if (commit == 0) {
            history.getFileTextByIndex(
                idx,
                fn
            );
        }

        // Else, download the preceding version and the patches related to this 
        // version, apply the patches to the preceding text, cache and return.
        else {
            
            // Recurse:
            App.forwardPort(
                commit - 1,
                history,
                function(previousText) {
                    
                    // Get patches:
                    history.loadCommitByIndex(
                        idx,
                        function() { 

                            // Apply:
                            var 
                                rawPatch = history.commits[idx].blob.patch,

                                patchedText = App.applyUnifiedPatch(
                                    previousText, 
                                    rawPatch
                                );

                            history.commits[idx].text = patchedText;

                            fn(
                                patchedText, 
                                rawPatch
                            );
                        }
                    )
                }
            );
        }
    },

    /**
     *  Apply a unified patch to the text.
     *
     *  @param  text    The text upon which the patch is to be applied. Should 
     *                  be several lines, most likely.
     *  @param  patch   The patch code in unified diff format.
     */
    applyUnifiedPatch:function(text, patch) {
        var 
            hunk, line, lineIdx,

            // Parse the patch into a list of hunk objects:
            hunks = unified_patch.parse(patch + "\n"),
            
            // Split text by lines. We will progressively push things into a
            // similar result list.
            pre = text.split("\n"),
            post = [],

            // Algorithm starts at line 1 (1-offset).
            loc = 1,

            // Track drift of applied hunks. Once a hunk is applied, the 
            // location of subsequent hunks must be translated. Start with zero
            // drift.
            delta = 0;
        
        // For each parsed hunk:
        for (var hunkIdx = 0; hunkIdx < hunks.length; ++hunkIdx) {
            hunk = hunks[hunkIdx];

            if (hunk.range.preStart < loc - delta) {
                throw "Hunk starting position precedes last hunk.";
            }
            
            // Copy in the preceding text, converting to 0-offset indices:
            post = post.concat(
                pre.slice(
                    loc - delta - 1,
                    hunk.range.preStart - 1
                )
            );

            // The position is now the start of the hunk.
            loc = hunk.range.preStart;

            // For every line in the hunk:
            for (lineIdx = 0; lineIdx < hunk.lines.length; ++lineIdx) {
                line = hunk.lines[lineIdx];

                // If it is a context line or an addition, copy it in directly.
                // We just ignore removals. (This assumes that the data in the
                // context line is accurate, which appears to be safe enough.)
                if (line.type == 0 || line.type == 1) {
                    post.push(
                        line.data
                    );

                    ++loc;
                }
            }

            // Accumulate drift (if any):
            delta += hunk.range.postLen - hunk.range.preLen;
        }

        // Copy in any remaining code up to EOF. This starts by computing where 
        // the remaining file starts without the drift.
        post = post.concat(
            pre.slice(
                loc - delta - 1
            )
        );

        return post.join("\n");
    },

    /**
     *  Calculate the lines touched by a patch file. Returns an object with a 
     *  "pre" property which is a list of line numbers to lines which are 
     *  removed or overwritten **based on the pre-patch-application 
     *  numbering**, and a "post" property which is a list of line numbers 
     *  which are added or new **based on the post-patch-application 
     *  numbering**.
     *
     *  @param  patch   The patch code in unified diff format.
     */
    relevantLines:function(patch) {
        var 
            hunk, line, lineIdx, postPos, prePos,

            hunks = unified_patch.parse(patch + "\n"),

            added = [],
            removed = [],

            delta = 0;

        for (var hunkIdx = 0; hunkIdx < hunks.length; ++hunkIdx) {
            hunk = hunks[hunkIdx];
            postPos = 0;
            prePos = 0;

            for (lineIdx = 0; lineIdx < hunk.lines.length; ++lineIdx) {
                line = hunk.lines[lineIdx];
                
                if (line.type == 1) {
                    added.push(
                        hunk.range.preStart + postPos
                    );
                    ++postPos;
                    ++prePos;
                }
                else if (line.type == -1) {
                    removed.push(
                        hunk.range.preStart + prePos
                    );
                    ++prePos;
                }
                else if (line.type == 0) {
                    ++postPos;
                    ++prePos;
                }
            }
        }

        return {
            post:added,
            pre:removed
        };
    },

};

/**
 *  The central router for the application. Connects URL fragment events to 
 *  rendering functions in the App object.
 */
var Workspace = Backbone.Router.extend({
    routes:{
        "":"index",
        ":username/:repository/:commit/*path":"viewHistory"
    },
    index:App.renderIndex,
    viewHistory:App.viewHistory
});

/**
 *  Initialize the app.
 */
var router;
$(function(){
    router = new Workspace();
    Backbone.history.start({ 
        pushState:false 
    });
});
