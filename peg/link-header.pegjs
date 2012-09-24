start = rule+
rule = u:loc r:rel { return { url:u, rel:r }; }
loc = "<" u:url ">; " { return u; }
url = s:scheme "://" u:uri p:path { return { host:u, path:p }; }
scheme = "https" / "http"
uri = u:[^/]+ { return u.join(""); }
path = p:[^>]+ { return p.join(""); }
rel = "rel=\"" r:[^"]+ "\"" [^<]* { return r.join(""); }