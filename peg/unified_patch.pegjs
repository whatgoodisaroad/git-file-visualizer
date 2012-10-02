start = 
    hunk+

hunk =
    range:range 
    lines:line+ {
        return {
            range:range,
            lines:lines
        };
    }

range = 
    "@@ -" 
    preStart:int 
    "," 
    preLen:int 
    " +" 
    postStart:int 
    "," 
    postLen:int 
    " @@"
    heading:heading? "\n" {
        return {
            preStart:preStart,
            preLen:preLen,
            postStart:postStart,
            postLen:postLen
        }
    }

line = 
    removal /
    addition /
    context

removal = 
    "-"
    data:[^\n]*
    "\n" {
        return {
            type:-1,
            data:data.join("")
        }
    }

addition = 
    "+"
    data:[^\n]* 
    "\n" {
        return {
            type:1,
            data:data.join("")
        }
    }

context = 
    " "
    data:[^\n]* 
    "\n" {
        return {
            type:0,
            data:data.join("")
        }
    }

heading = [^\n]+

int = ds:[0-9]+ { 
        return parseInt(ds.join(""), 10); 
    }