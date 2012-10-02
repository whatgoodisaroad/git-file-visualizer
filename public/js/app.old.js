var
    username = "documentcloud",
    repository = "backbone",
    path = "backbone.js";

$.fn.highlight = function() {
    return this.each(function() {
        var $t = $(this);
        $t.html(
            $t.text()
                .replace(
                    /([\[\]\{\}*+-=;\(\),])/g,
                    "<span class=\"highlight\">$1</span>"
                )
        );
    });
};

$.fn.scrollTo = function() {
    window.scrollBy(
        0, 
        $(this).offset()
    );
};

var App = {
    fontSize:14,
    mutex:false,

    position:{
        commit:0,
        diff:0,
        state:"initial"
    },

    history:[],

    highlightLines:function() {
        $("ol#code li").highlight();
    },

    pushState:function() {
        App.history.push({
            lines:$("#code li").map(function() { return $(this).text(); }).get(),
            position:{ 
                commit:App.position.commit, 
                diff:App.position.diff,
                state:App.position.state
            }
        });
    },

    popState:function() {
        if (App.history.length) {
            var h = App.history.pop();
            App.position = h.position;
            $("ol#code").html(
                App.arrToLis(h.lines)
            );
            App.highlightLines();
            App.updateCommitMessage();
        }
    },

    commits:[{ 
            message:"Added logging feature",
            diffs:[{
                    start:22,
                    end:22,
                    replacement:"    log(\"OMG, I Can't believe we're running this function.\");\n"
                }, {
                    start:40,
                    end:40,
                    replacement:"    log(\"Finished the function, JSYK.\");\n"
                }
            ]
        }, {
            message:"Removed return value from function",
            diffs:[{
                    start:20,
                    end:21,
                    replacement:"void print_tainted(void)"
                }, {
                    start:42,
                    end:43,
                    replacement:"    return; // Now I have a machine gun. Ho ho ho."
                }
            ]
        }, {
            message:"Removed ugly comment",
            diffs:[{
                    start:3,
                    end:18,
                    replacement:false
                }
            ]
        }
    ],

    currentCommit:function() {
        return App.commits[App.position.commit];
    },

    currentDiff:function() {
        return App.currentCommit().diffs[App.position.diff];
    },

    updateCommitMessage:function() {
        if (App.position.state == "initial") {
            $("#current-commit").text("Initial commit");
        }
        if (App.position.state == "running") {
            $("#current-commit")
                .text(
                    App.currentCommit().message + 
                    " (Change #" + (App.position.diff + 1) + ")"
                );
        }
        else if (App.position.state == "done") {
            $("#current-commit").text("Done");
        }
    },

    advance:function() {
        if (App.mutex) { return; }

        App.mutex = true;

        App.pushState();

        if (App.position.state == "initial") {
            App.position.state = "running";
        }

        else if (App.position.state == "running") {
            ++App.position.diff;

            if (App.position.diff >= App.currentCommit().diffs.length) {
                ++App.position.commit;
                App.position.diff = 0;

                if (App.position.commit >= App.commits.length) {
                    App.position.state = "done"
                    App.mutex = false;
                }
            }
            
        }

        App.updateCommitMessage();

        if (App.position.state == "running") {
            App.apply(App.position.commit, App.position.diff);
        }
    },

    revert:function() {
        if (App.mutex) { return false; }

        App.popState();
    },

    apply:function(commit, diff) {
        var d = App.commits[commit].diffs[diff];
        App.replace(
            d.start,
            d.end,
            d.replacement
        );
    },


    replace:function(start, end, replacement) {
        var 
            replacements = replacement ? replacement.split("\n") : [],
            outLen = end - start,
            inLen = replacements.length,
            out = $("ol#code li").slice(start - 1, end - 1),
            rep = App.arrToLis(replacements);

        out.addClass("transition-out");

        rep.css({ opacity:0 });
        rep
            .addClass("transition-in")
            .highlight();

        if (outLen == 0) {
            rep
                .css({ display:"none" })
                .insertBefore($("ol#code li:eq(" + (end - 1) + ")"));
            
            rep.slideDown(function() {
                rep.animate({ opacity:1 }, function() { 
                    rep.removeClass("transition-in");
                    App.mutex = false;
                });
            });
        }

        else if (inLen == 0) {
            out.slideUp(function() { App.mutex = false; });

            // out.animate({ opacity:0 }, function() { 
            //     out.remove();
            //     App.mutex = false;
            // });
        }

        else if (outLen <= inLen) {
            out
                .filter(":last")
                .animate(
                    { marginBottom:((inLen - outLen) * App.fontSize) + "pt" },
                    function() { 
                        out.animate(
                            { opacity:0 }, 
                            function() { 
                                out.replaceWith(rep);

                                rep.animate({ opacity:1 }, function() { 
                                    rep.removeClass("transition-in");

                                    App.mutex = false;
                                })
                            }
                        );
                    }
                );
        }
        else {
            rep
                .filter(":last")
                .css({ marginBottom:((outLen - inLen) * App.fontSize) + "pt" });

            out.animate(
                { opacity:0 },
                function() {
                    out.replaceWith(rep);
                    rep
                        .animate({ opacity:1, marginBottom:"0" }, function() {
                            rep.removeClass("transition-in");

                            App.mutex = false;
                        })
                        
                }
            );
        }
    },

    arrToLis:function(a) {
        return $(
            $(a)
                .map(function() { 
                    return (
                        "<li>" + 
                            this
                                .replace("\t", "    ")
                                .replace(/[ ]/gm, "&nbsp;") + 
                            "</li>"
                    );
                })
                .get()
                .join("")
        );
    },

    getCommits:function(username, repository, path, fn) {
        $.getJSON(
            "/commits/" + username + "/" + repository + "/" + path,
            fn
        );
    },

    getCommit:function(username, repository, sha, fn) {
        $.getJSON(
            "/commit/" + username + "/" + repository + "/" + sha,
            fn
        );
    }
};

$(function() {
    $("#advance").click(App.advance);
    $("#revert").click(App.revert);

    App.highlightLines();
});


