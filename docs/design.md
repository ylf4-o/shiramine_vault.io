# Shiramine Vault 基本設計

## 目的

Shiramine Vaultは、思考・発信・創作・生活関連資料をMarkdownで蓄積し、あとから検索・リンク・タグで回収できる資料庫です。

## 初期実装の判断

現在の作業環境では通常の `node` / `npm` がPATHにないため、依存インストールなしで動く静的Webアプリとして構築しました。Next.js/Supabaseへの移行を前提に、機能単位は以下に分けています。

- `index.html`: 画面構造
- `styles.css`: レスポンシブUI
- `app.js`: ノート状態管理、Markdown表示、タグ・リンク抽出、エクスポート
- `supabase/schema.sql`: Supabase同期用DB設計

## MVP

- ローカル自動保存
- ノート作成
- Markdown編集
- ノート一覧
- 検索
- PC/スマホ対応UI
- Markdownとして取り出せるエクスポート
- Supabase Authログイン
- サーバー同期

## 資料庫運用

黒瀬の追加要件を初期実装に含めました。

- Inbox運用
- 7分類フォルダ
- テンプレート挿入
- 状態タグ
- `#黒瀬共有` 抽出
- 最近更新一覧
- 未整理一覧
- 未作成リンク一覧
- ゴミ箱
- 更新履歴
- ローカルAI支援

## 同期設計

サーバー同期では、ブラウザ側のIndexedDB保存を一次保存とし、停止後または数秒ごとにSupabaseへ保存します。

同期ルール:

1. ローカル編集時に `updated_at` を更新
2. サーバー保存前に対象ノートの `updated_at` を取得
3. ローカルが新しければ上書き
4. 削除済みノートも `deleted_at` 付きでupsertする
5. サーバーが新しければ競合としてローカル版を別ノート保存
6. 初期実装では自動マージしない

## Next.js移行時の推奨構成

```text
src/
  app/
    page.tsx
    login/page.tsx
  components/
    Sidebar.tsx
    NoteList.tsx
    Editor.tsx
    Inspector.tsx
  lib/
    markdown.ts
    note-parser.ts
    storage.ts
    supabase.ts
  types/
    note.ts
```

## 現行版の制約

- Supabase未設定時はローカル専用です。
- `tags`、`links`、`note_versions` テーブルはSQL定義済みですが、現行UIの同期対象は `notes` です。タグとリンクは本文から再抽出し、更新履歴は `notes.versions` に保持します。RLSは各テーブルの `user_id`、または親ノートの `user_id` を境界にします。
- フォルダ管理は追加・改名・削除に対応しています。削除時、所属ノートは `00_Inbox` に戻します。
- AI支援は外部LLM APIではなく、本文・タグ・キーワードを使うローカル生成です。
- Markdownパーサーは軽量実装です。完全なMarkdown互換が必要なら `remark` または `markdown-it` へ移行してください。
