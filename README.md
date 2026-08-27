# Recipes

A public, read-only collection of clean and printable recipe pages.

The Recipe Builder and its save service remain private on the Mac and are not
included in this repository.

## Updating the collection

After adding and checking recipes on the Mac, run:

```bash
cd "/Users/ron/Documents/Codex/2026-08-26/wh/outputs"
./update-github-recipes.sh
```

Then review, commit, and push the changes in the `github-recipes` folder.

## GitHub Pages

In the repository settings, open **Pages**, choose **Deploy from a branch**, and
publish the root of the `main` branch.
