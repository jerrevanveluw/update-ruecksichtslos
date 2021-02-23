# Update your package.json Rücksichtslos

## Using deno?

Run:
```shell
deno run --allow-read --allow-run --allow-write https://raw.githubusercontent.com/jerrevanveluw/update-ruecksichtslos/master/src/index.deno.ts
```
to update your package.json (dev)dependencies to the latest version.
Your dependencies won't be prefixed and your devDependencies will be prefixed with a `^` (caret). 
