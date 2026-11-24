---
name: gist-html
description: Put one HTML file on an unlisted GitHub gist, replace that file on the same link, or delete the gist. Use when this lane needs a public link for one HTML page.
---

# gist-html

One HTML file on the signed-in GitHub account. Ask the human before the first gist. The raw link is `text/plain`.

## Put

Ran this. `gh` prints the gist link. Default is secret (unlisted). Anyone with the link can fetch it.

```sh
gh gist create <file.html> -d "<description>"
```

## Replace the same link

Flags from `gh gist edit --help`. Not run yet.

```sh
gh gist edit <id-or-url> --filename <filename> <local-file>
```

## Take down

Flags from `gh gist delete --help`. Not run yet. GitHub may keep serving a deleted gist's raw link from cache for a few minutes.

```sh
gh gist delete <id-or-url> --yes
```
