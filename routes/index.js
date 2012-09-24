
/*
 * GET home page.
 */

code = "/**\n *  print_tainted - return a string to represent the kernel taint state.\n *\n *  'P' - Proprietary module has been loaded.\n *  'F' - Module has been forcibly loaded.\n *  'S' - SMP with CPUs not designed for SMP.\n *  'R' - User forced a module unload.\n *  'M' - System experienced a machine check exception.\n *  'B' - System has hit bad_page.\n *  'U' - Userspace-defined naughtiness.\n *  'D' - Kernel has oopsed before\n *  'A' - ACPI table overridden.\n *  'W' - Taint on warning.\n *  'C' - modules from drivers/staging are loaded.\n *  'I' - Working around severe firmware bug.\n *  'O' - Out-of-tree module has been loaded.\n *\n *  The string is overwritten by the next call to print_tainted().\n */\nconst char *print_tainted(void)\n{\n    static char buf[ARRAY_SIZE(tnts) + sizeof(\"Tainted: \") + 1];\n\n    if (tainted_mask) {\n        char *s;\n        int i;\n\n        s = buf + sprintf(buf, \"Tainted: \");\n        for (i = 0; i < ARRAY_SIZE(tnts); i++) {\n            const struct tnt *t = &tnts[i];\n            *s++ = test_bit(t->bit, &tainted_mask) ?\n                    t->true : t->false;\n        }\n        *s = 0;\n    } else\n        snprintf(buf, sizeof(buf), \"Not tainted\");\n\n    return buf;\n}\n";

exports.index = function(req, res) {
    res.render(
        'index', { 
        title:'File History', 
        lines:code
            //.replace("\t", "    ")
            //.replace(/[ ]/gm, "&nbsp;")
            .split("\n")
    })
};
