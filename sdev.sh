#!/usr/bin/env fish

set ORIGINAL_DIR $PWD
echo $PWD
set -l options (fish_opt -s c -l compile) # compile?
set options $options (fish_opt -s t -l test) # test?

argparse $options -- $argv

cd ../express-openalpr-server
pm2 start processes.json
cd $ORIGINAL_DIR

if set -q _flag_compile
    npm run compile
end
if set -q _flag_test
    # tests use in-memory mongo
    npm test
else
    npm run dbStart
    npm run dev:watch
end
