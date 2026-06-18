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
5. SQL EditorでGitHub上の `supabase/schema.sql` を貼り付けて実行する。
6. SQL EditorでGitHub上の `supabase/rls-inspection.sql` を貼り付けて実行する。
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

### スマホでログイン欄を開く

スマホ幅では左サイドバーを隠し、下部ナビで画面を切り替えます。

下部ナビの役割:

- `ノート`: スマホ向けの簡易入力欄
- `検索`: 検索欄
- `タグ`: フォルダ、タグ、抽出条件
- `設定`: Supabase同期パネル

1. 画面下の `設定` を押す。
2. 同期パネルが表示される。
3. Supabase URL、key、メール、パスワードを入力する。
4. `保存` → `接続確認` → `ログイン` → `同期` の順に押す。

ログイン後にノート一覧へ戻る場合は、下部ナビの `ノート` を押してください。

## Supabaseログイン失敗時の切り分け

同期欄の下に診断ログが表示されます。まず以下を確認してください。

1. Supabase URL
   - 正: `https://xxxxx.supabase.co`
   - 誤: `https://xxxxx.supabase.co/rest/v1`
   - `/rest/v1` が含まれている場合、現在のアプリは保存時と読み込み時に自動で削除します。
2. Key
   - `anon public key` または `publishable key` を使います。
   - `service_role` keyは絶対に入力しないでください。
   - 同じSupabaseプロジェクトのProject URLとkeyを組み合わせてください。
3. ユーザー
   - Supabase Dashboardの `Authentication` → `Users` に該当メールのユーザーが存在するか確認してください。
4. メール確認
   - メール確認が必須の設定なら、対象ユーザーがConfirm済みか確認してください。
   - 個人検証中だけなら、Auth設定でメール確認を一時的に無効化しても構いません。
5. エラーメッセージ
   - `Invalid login credentials`: ユーザー未作成、メール違い、パスワード違い、未Confirmの可能性があります。
   - `Failed to fetch`: ブラウザからSupabaseのAuth endpointへ到達できていません。URLのタイプミス、DNS未反映、プロジェクト停止、ブラウザ拡張、VPN、セキュリティソフト、ネットワーク遮断を確認してください。
   - `Supabase URL/key 未設定`: URLまたはkeyが空です。
   - `Supabaseライブラリ未読込`: CDN読込またはネットワークを確認してください。
   - `取得失敗` / `保存失敗`: `schema.sql` 未適用、RLS、またはテーブル定義を確認してください。
   - `Invalid path specified in request URL`: GitHub Pages側で古いJavaScriptがキャッシュされているか、保存済みURLに `/rest/v1` が残っている可能性があります。ページを強制再読み込みし、URL欄が `https://xxxxx.supabase.co` に補正されているか確認してください。

### `Failed to fetch` の追加確認

1. 同期欄の `接続確認` を押す。
2. `Auth endpointへ到達しました` と出れば、通信は通っています。次はUsers、Confirm、パスワードを確認してください。
3. `接続失敗` と出る場合は、Supabase Dashboardの `Project Settings` → `API` からProject URLを再コピーしてください。
4. URLが正しいのに失敗する場合は、別ブラウザ、スマホ回線、VPNオフ、広告ブロック/セキュリティ拡張オフで試してください。
5. プロジェクト作成直後はDNS反映に少し時間がかかることがあります。数分待って再試行してください。

### GitHub Pagesで古い設定が残る場合

1. GitHub Pagesを再読み込みする。
2. ブラウザで強制再読み込みする。
   - Windows: `Ctrl + F5`
   - スマホ: ブラウザの履歴/サイトデータを削除して再読み込み
3. 同期欄のURLが `https://xxxxx.supabase.co` になっているか確認する。
4. `/rest/v1` が表示欄に残る場合は、URL欄をProject URLだけにして `保存` を押す。

## 同期仕様

- 編集内容はまずIndexedDBへ保存
- Supabase設定がある場合は変更停止後に同期
- 削除済みノートも `deleted_at` 付きで同期
- 初期seedノートは端末ごとに別IDにならないよう、固定UUIDを使う
- Supabase側に既存ノートがあり、ローカルが未編集seedのみの場合は、ローカルseedを破棄してSupabase側を正とする
- 同期前に `title + folder + content` が完全一致するアクティブな重複ノートは削除済みとして同期する
- サーバー側が新しい場合はサーバー版を優先
- ローカルにも未同期変更がある場合は競合ノートを複製保存
- 初期実装では自動マージしない

### 初期同期時の重複対策

古い版では、初期seedノートのIDが端末ごとに `crypto.randomUUID()` で生成されていました。そのため、PCとスマホの初回同期時に同じ初期ノートが別ノートとして扱われ、`00_Inbox` などに複製されることがありました。

現在の対策:

1. 初期seedノートのIDを固定UUIDにする。
2. 別端末で初回同期したとき、Supabaseに既存ノートがあり、ローカル側が未編集seedのみならSupabase側を正として採用する。
3. 同期直前に `title + folder + content` が完全一致するアクティブな重複ノートを削除済みとして同期する。

この自動整理は完全一致だけが対象です。本文、タイトル、フォルダのどれかが違うノートは削除しません。削除済みとして同期するため、Supabase側に残った重複が次回同期でInboxへ戻ることを防ぎます。

### 重複が出た場合の整理手順

1. スマホ幅では下部ナビの `設定`、PCでは左サイドバーの同期欄を開く。
2. `重複検出` を押す。
3. 診断ログに `title + folder + content` が完全一致する候補が表示される。
4. 内容を確認し、必要なら通常のノート削除で整理する。
5. 整理後に `同期` を押す。

`重複検出` は候補を表示するだけで、自動削除はしません。同期時の自動整理もアクティブな完全一致のみです。

## ZIPエクスポート

日本語のフォルダ名・ファイル名をWindows標準展開で扱いやすくするため、同梱の `vendor/encoding.min.js` を使い、ZIP内パスをCP932で出力します。ライブラリが読み込めない場合はUTF-8 ZIPにフォールバックします。

## データを消す場合

ブラウザ開発者ツールでIndexedDBの `shiramine-vault` を削除してください。互換用バックアップとして `localStorage` の `shiramine-vault:v1` も残しています。
