# Update your package.json [Rücksichtslos](https://en.wiktionary.org/wiki/reckless)
Update your package.json (dev|peer)dependencies to the latest version.
Your dependencies won't be prefixed, your devDependencies and peerDependencies will be
prefixed with a caret. Add `--caret` (`^`) or `--tilde` (`~`) as an argument to prefix all your
(dev|peer)dependencies respectively. 

# Just run it
## Node
```shell
npx --yes update-ruecksichtslos@latest [--caret|--tilde]
```

## Deno
```shell
deno run -r --allow-read --allow-run --allow-write https://raw.githubusercontent.com/jerrevanveluw/update-ruecksichtslos/master/src/index.deno.ts [--caret|--tilde]
```
