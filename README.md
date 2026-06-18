# Shiramine Vault

Markdownベースの個人資料庫です。Obsidian風の `[[ノート名]]` リンク、タグ抽出、テンプレート、ローカル自動保存、Markdown/ZIPエクスポートに対応します。

## 起動

依存インストールは不要です。

1. `index.html` をブラウザで開く
2. ノートを作成・編集する
3. 内容はブラウザの `IndexedDB` に自動保存される

## 推奨公開方法

スマホとPCで同じアプリを開く用途では、まずGitHub Pagesを推奨します。

理由:

- 静的HTML/CSS/JSをそのまま公開できる。
- ビルド設定が不要。
- GitHubだけで管理できる。
- Supabaseの秘密情報をコードに置く必要がない。

注意:

- GitHub Pagesで公開するリポジトリは基本的に公開前提で扱ってください。
- Supabase service role key、DBパスワード、個人メモのエクスポートZIPは絶対にコミットしないでください。
- コードに直書きしてよいのはSupabase anon public keyまでです。この実装では、anon keyも画面入力で保存する設計です。

## GitHub Pages公開手順

1. GitHubで新しいリポジトリを作成する。
2. このフォルダの内容をリポジトリへアップロードする。
3. GitHubのリポジトリ画面で `Settings` → `Pages` を開く。
4. `Build and deployment` の `Source` を `Deploy from a branch` にする。
5. `Branch` を `main`、フォルダを `/root` にして保存する。
6. 数分後に表示される `https://<user>.github.io/<repo>/` をPCとスマホで開く。

このプロジェクトには `.nojekyll` を置いています。GitHub Pages側で不要なJekyll処理を挟ませないためです。

## 実装済み

- ノート作成
- Markdown編集
- 自動保存
- ノート一覧
- タイトル・本文・タグ検索
- PC三ペインUI
- スマホ向けタブ切り替えUI
- `[[ノート名]]` の検出
- 存在しないWikiリンクからノート作成
- 被リンク表示
- `#タグ` 自動抽出
- 最近更新、未整理、黒瀬共有、未作成リンクの抽出
- ノートテンプレート
- 単体Markdownエクスポート
- 全ノートMarkdown ZIPエクスポート
- IndexedDBによるローカル一次保存
- Supabase Authログイン
- Supabase `notes` テーブルへの任意同期
- `updated_at` 比較による簡易競合保護
- フォルダ追加
- ゴミ箱、復元
- 更新履歴からの復元
- ローカルAI支援: 要約、分類候補、関連ノート候補、Threads案、note見出し案

## 初期フォルダ

- `00_Inbox`
- `01_用語辞典`
- `02_思考ログ`
- `03_発信ネタ`
- `04_創作設定`
- `05_生活・制度`
- `06_AI運用`
- `99_Archive`

## Supabase同期

まずはローカル運用を推奨します。Supabase同期は、`supabase/schema.sql` 適用後にRLSポリシーが自分の `user_id` の行だけをselect/insert/update/deleteできる状態になっていることを確認してから有効化してください。

同期なしでもローカル資料庫として動きます。サーバー同期を使う場合は、Supabaseプロジェクトを作成し、`supabase/schema.sql` をSQL Editorで実行してください。

## Supabaseプロジェクト作成手順

1. Supabaseで新規プロジェクトを作成する。
2. `Project Settings` → `API` で以下を控える。
   - Project URL
   - anon public key
3. `Authentication` → `Users` で利用ユーザーを作成する。
4. メール確認を使う場合はユーザーの確認を完了する。個人利用の検証中だけなら、Auth設定でメール確認を一時的に無効化してもよい。
5. SQL Editorで `supabase/schema.sql` を実行する。
6. SQL Editorで `supabase/rls-inspection.sql` を実行する。
7. `notes`、`tags`、`note_tags`、`links`、`note_versions` のRLSが有効であることを確認する。

その後、左サイドバーの同期欄に以下を入力します。

1. Supabase URL
2. anon public key
3. メールアドレス
4. パスワード

`保存`、`ログイン`、`同期` の順に押すと、ローカルノートがSupabaseへ保存されます。

## PC・スマホ同期確認

1. PCでGitHub PagesのURLを開く。
2. 同期欄にSupabase URL、anon public key、メール、パスワードを入力する。
3. `保存` → `ログイン` → `同期` の順に押す。
4. PCでテストノートを作成し、同期状態が `同期済み` になることを確認する。
5. スマホで同じGitHub Pages URLを開く。
6. 同じSupabase情報でログインし、`同期` を押す。
7. PCで作成したノートがスマホ側に表示されることを確認する。
8. スマホ側でノートを編集し、PC側で再同期して変更が反映されることを確認する。

RLSの詳細確認は [docs/supabase-rls-test.md](docs/supabase-rls-test.md) を参照してください。

## 同期仕様

- 編集内容はまずIndexedDBへ保存
- Supabase設定がある場合は変更停止後に同期
- 削除済みノートも `deleted_at` 付きで同期
- サーバー側が新しい場合はサーバー版を優先
- ローカルにも未同期変更がある場合は競合ノートを複製保存
- 初期実装では自動マージしない

## ZIPエクスポート

日本語のフォルダ名・ファイル名をWindows標準展開で扱いやすくするため、同梱の `vendor/encoding.min.js` を使い、ZIP内パスをCP932で出力します。ライブラリが読み込めない場合はUTF-8 ZIPにフォールバックします。

## データを消す場合

ブラウザ開発者ツールでIndexedDBの `shiramine-vault` を削除してください。互換用バックアップとして `localStorage` の `shiramine-vault:v1` も残しています。
