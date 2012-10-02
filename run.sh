#! /bin/bash

echo "Compiling templates..."
clientjade ./views/templates/*.jade > ./public/js/templates.js

echo "Compiling parsers..."
for f in peg/*.pegjs
do 
    base=`basename $f .pegjs;`
    pegjs --track-line-and-column -e $base $f "peg/$base.js"
    cp peg/*.js public/js/parsers
done
for f in peg/*.pegjs
do 
    base=`basename $f .pegjs;`
    pegjs --track-line-and-column $f "peg/$base.js"
done

echo "Running Server..."
node ./app.js


