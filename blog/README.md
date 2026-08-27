# Blog Source Files

`doc/blog` 配下に `.md` を追加してから、以下を実行するとブログページが生成されます。

```bash
npx --yes tsx scripts/generate-blog-pages.ts
```

TypeScript ソースは `scripts/generate-blog-pages.ts` です。

## git push 時の自動生成

このリポジトリでは `pre-push` フックで `scripts/generate-blog-pages.ts` を実行する想定です。

- フック本体: `.githooks/pre-push`
- 現在の作業環境では `.git/hooks/pre-push` にも配置済みです。
- 生成結果に差分が出た場合、push は停止します。生成物を commit 後に再 push してください。

## md の書式（推奨）

```md
---
title: 記事タイトル
date: 2026-03-07
summary: 一覧に表示する短い説明（任意）
---

# 本文見出し

ここから本文です。
複数行で自由に書けます。
- 箇条書き
- コードブロック
```

## 最小フォーマット（本文だけでも可）

```md
# 本文の先頭見出しをタイトルとして利用

本文です。
```

- `title` を省略した場合は、本文の最初の `# 見出し` をタイトルとして使います。
- `date` を省略した場合はファイルの更新日時を使います。
- `summary` は任意です。
- 生成対象は `doc/blog/*.md` ですが、`_` で始まるファイル（例: `_template.md`）と `README.md` は生成対象外です。
- 生成先は `blog/articles/*.md` と `blog/blog-index.json` です。
