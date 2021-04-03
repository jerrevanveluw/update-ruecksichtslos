# Update your package.json Rücksichtslos
Update your package.json (dev|peer)dependencies to the latest version.
Your dependencies won't be prefixed, your devDependencies will be prefixed with
a `^` (caret), and your peerDependencies will be prefixed with `~`.

## Install
```shell
npm install --save-dev update-ruecksichtslos
```

## Using deno?
Run:
```shell
deno run -r --allow-read --allow-run --allow-write https://raw.githubusercontent.com/jerrevanveluw/update-ruecksichtslos/master/src/index.deno.ts
```
