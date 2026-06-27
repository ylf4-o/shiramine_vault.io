# Supabase RLS確認手順

## 目的

Supabase同期を本格利用する前に、anon keyから他ユーザーのノートやDecision Logを読めないことを確認します。

## 確認1: SQL定義確認

1. Supabase Dashboardを開く。
2. SQL Editorで `supabase/schema.sql` を実行する。
3. 続けて `supabase/rls-inspection.sql` を実行する。
4. `notes`、`decision_logs`、`tags`、`note_tags`、`links`、`note_versions` の `rowsecurity` がすべて `true` であることを確認する。
5. `notes`、`decision_logs`、`tags`、`links`、`note_versions` は `auth.uid() = user_id` を含むことを確認する。
6. `note_tags` は親 `notes.user_id` と `tags.user_id` の両方を確認していることを確認する。

## 確認2: アプリ上の実ユーザーテスト

1. Supabase AuthでユーザーAとユーザーBを作る。
2. PCブラウザでユーザーAとしてログインし、ノートAとDecision Log Aを作成して同期する。
3. スマホ、別ブラウザ、またはシークレットウィンドウでユーザーBとしてログインする。
4. 同期してもノートAとDecision Log Aが表示されないことを確認する。
5. ユーザーBでノートBとDecision Log Bを作成して同期する。
6. ユーザーAへ戻り、ノートBとDecision Log Bが表示されないことを確認する。

## 判定

- 自分のノートとDecision Logだけ表示される: 合格。
- 他ユーザーのノートやDecision Logが見える: 不合格。Supabase同期を止め、RLSを修正する。
