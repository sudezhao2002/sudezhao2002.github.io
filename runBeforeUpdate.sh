#!/usr/bin/env bash
set -euo pipefail

# Resolve paths relative to this script, even when invoked from another directory.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if command -v sha256sum >/dev/null 2>&1; then
    digest=$(sha256sum styles.css)
elif command -v shasum >/dev/null 2>&1; then
    digest=$(shasum -a 256 styles.css)
else
    printf '%s\n' 'Error: sha256sum or shasum is required.' >&2
    exit 1
fi
version=${digest:0:12}
pattern="href=[\"']styles\\.css(\\?v=[^\"']*)?[\"']"

# Validate both pages before changing either one.
for page in index.html en.html; do
    count=$( { grep -Eo "$pattern" "$page" || true; } | wc -l)
    if [[ $count -ne 1 ]]; then
        printf 'Error: %s must contain exactly one styles.css reference.\n' "$page" >&2
        exit 1
    fi
done

temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT
for page in index.html en.html; do
    sed -E "s|href=([\"'])styles\\.css(\\?v=[^\"']*)?([\"'])|href=\\1styles.css?v=$version\\3|g" "$page" > "$temp_dir/$page"
done
for page in index.html en.html; do
    if ! cmp -s "$page" "$temp_dir/$page"; then
        cat "$temp_dir/$page" > "$page"
    fi
done
printf 'CSS version: %s\n' "$version"
printf '%s\n' 'css同步成功'
