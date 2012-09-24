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

        // App.forwardPort(
        //     commit, 
        //     history, 
        //     function(text) {

        //         // Display the text for this commit:

        //         $("#code").html("");

        //         var 
        //             lines = text.split("\n"),
        //             ol = $("<ol/>");

        //         for (var idx = 0; idx < lines.length; ++idx) {
        //             $("<li/>")
        //                 .text(lines[idx])
        //                 .appendTo(ol);
        //         }

        //         ol.appendTo("#code");

        //         document.title = oldTitle;

        //         if ($.isFunction(fn)) { fn(); }
        //     }
        // );

        history.getFileTextByIndex(
            history.commits.length - 1 - commit,
            function(text) {

                // Display the text for this commit:

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

                document.title = oldTitle;

                if ($.isFunction(fn)) { fn(); }
            }
        );
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
            fn(history.commits[idx].text);
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
                                dmp = new diff_match_patch(),
                                patches = dmp.patch_fromText(
                                    
                                    // GOTCHA: Git diffs sometimes have text 
                                    // following the line-number declarations.
                                    // Use a regex to clean those out, so that 
                                    // GDMP can understand the format.
                                    history.commits[idx].blob.patch
                                        .replace(/^(@@[^@]+@@)(.+)\n/gm, "$1\n$2\n")
                                
                                ),
                                patchResult = dmp.patch_apply(
                                    patches, 
                                    previousText
                                ),
                                patchedText = patchResult[0];

                            history.commits[idx].text = patchedText;

                            fn(patchedText);
                        }
                    )
                }
            );
        }
    }
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
});1