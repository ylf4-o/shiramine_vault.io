const STORAGE_KEY = "shiramine-vault:v1";
const DB_NAME = "shiramine-vault";
const DB_VERSION = 1;
const STORE_NAME = "vault";
const STATE_ID = "state";
const SYNC_SETTINGS_KEY = "shiramine-vault:sync";
const AUTO_SAVE_MS = 700;
const SEED_CREATED_AT = "2026-06-18T00:00:00.000Z";

const defaultFolders = [
  "00_Inbox",
  "01_用語辞典",
  "02_思考ログ",
  "03_発信ネタ",
  "04_創作設定",
  "05_生活・制度",
  "06_AI運用",
  "99_Archive",
];

const templates = {
  "用語辞典": `# 用語名
## 一言でいうと
ここに短く書く。
## 定義
一般的な意味。
## 澪の解釈
自分の言葉でどう捉えているか。
## 関連する考え
- [[関連ノート]]
## 使えそうな場面
- Threads
- note
- 創作
- 生活整理
## 最終更新
${today()}`,
  "思考ログ": `# テーマ名
## 今日考えたこと
ここに雑に書く。
## 以前も考えた形跡
- [[関連ノート]]
## 今回の結論
現時点の結論を書く。
## まだ保留の問い
- 
## 発信に使えそうな切り口
- Threads:
- note:
- 商品:`,
  "発信ネタ": `# ネタ名
## 種
最初に思いついたこと。
## 誰に向けるか
どんな人に刺さるか。
## 読後に残したい感覚
何を感じてほしいか。
## 投稿案
短文案を書く。
## note化するなら
見出し案を書く。
## 関連ノート
- [[用語]]
- [[思考ログ]]`,
  "創作設定": `# 設定名
## 概要
## キャラクター・世界観
## 使える場面
## 関連ノート
- [[関連設定]]
#創作`,
  "生活・制度メモ": `# メモ名
## 要点
## 手続き・期限
## 確認先
## 次にやること
- 
#生活再建 #要整理`,
  "AI運用メモ": `# AI運用メモ
## 目的
## プロンプト・設定
## うまくいった点
## 修正点
## 関連ノート
- [[黒瀬]]
- [[白峰]]
#AI`,
  "黒瀬共有用まとめ": `# 黒瀬共有用まとめ
## 今回見てほしいこと
何について相談したいか。
## 前提
これまでの経緯。
## いまの結論
自分ではこう考えている。
## 迷っている点
判断に困っていること。
## 参考ノート
- [[関連ノート1]]
## 黒瀬にしてほしいこと
- 整理
- 反論
- 企画化
- 文章化
- 設計
#黒瀬共有 #要整理`,
};

const seedNotes = [
  noteSeed("11111111-1111-4111-8111-111111111111", "資料庫の使い方", "00_Inbox", `# 資料庫の使い方
ここは、一度考えたことを二度目から資産として使うための場所。

## 基本運用
1. まずは 00_Inbox に雑に入れる。
2. PCで整理するときにフォルダとタグを付ける。
3. 関連する言葉は [[ノート名]] で繋ぐ。
4. 月末に #要整理 #発信ネタ #黒瀬共有 を棚卸しする。

## 重要
完璧に分類しようとしない。あとから検索・タグ・リンクで回収できればよい。
#要整理`),
  noteSeed("22222222-2222-4222-8222-222222222222", "用語辞典テンプレ", "01_用語辞典", templates["用語辞典"]),
  noteSeed("33333333-3333-4333-8333-333333333333", "思考ログテンプレ", "02_思考ログ", templates["思考ログ"]),
  noteSeed("44444444-4444-4444-8444-444444444444", "発信ネタテンプレ", "03_発信ネタ", templates["発信ネタ"]),
  noteSeed("55555555-5555-4555-8555-555555555555", "黒瀬共有テンプレ", "06_AI運用", templates["黒瀬共有用まとめ"]),
  noteSeed("66666666-6666-4666-8666-666666666666", "タグ一覧", "00_Inbox", `# タグ一覧
- #用語
- #思考ログ
- #発信ネタ
- #note
- #Threads
- #創作
- #生活再建
- #AI
- #黒瀬共有
- #要整理
- #保留
- #完成`),
  noteSeed("77777777-7777-4777-8777-777777777777", "今月の棚卸し", "00_Inbox", `# 今月の棚卸し
## 見るもの
- #要整理
- #発信ネタ
- #黒瀬共有
- 最近更新したノート
- 未作成リンク

## 回収したいもの
- 

## 次に作るノート
- [[完璧主義]]
- [[AIにキャラロールを与える]]
- [[自由じゃないフリーランス]]`),
  noteSeed("88888888-8888-4888-8888-888888888888", "白峰", "06_AI運用", `# 白峰
## 一言でいうと
黒瀬の方針を実装・設計・検証・手順化する実務副官。

## 関連
- [[黒瀬]]
- [[AIにキャラロールを与える]]
#AI #用語`),
  noteSeed("99999999-9999-4999-8999-999999999999", "黒瀬", "06_AI運用", `# 黒瀬
## 一言でいうと
戦略・判断・方向修正を担う相棒。

## 関連
- [[白峰]]
- [[黒瀬共有テンプレ]]
#AI #黒瀬共有`),
];

let state = { notes: seedNotes, folders: defaultFolders, activeNoteId: seedNotes[0]?.id };
let activeNoteId = state.activeNoteId || state.notes[0]?.id;
let activeFolder = "all";
let activeTag = "";
let activeSpecialFilter = "";
let saveTimer = null;
let syncTimer = null;

const els = {
  search: document.querySelector("#searchInput"),
  folders: document.querySelector("#folderList"),
  tags: document.querySelector("#tagList"),
  noteList: document.querySelector("#noteList"),
  label: document.querySelector("#activeFilterLabel"),
  newNote: document.querySelector("#newNoteButton"),
  quickCapture: document.querySelector("#quickCaptureButton"),
  newFolder: document.querySelector("#newFolderInput"),
  addFolder: document.querySelector("#addFolderButton"),
  renameFolder: document.querySelector("#renameFolderButton"),
  deleteFolder: document.querySelector("#deleteFolderButton"),
  title: document.querySelector("#titleInput"),
  folder: document.querySelector("#folderSelect"),
  template: document.querySelector("#templateSelect"),
  applyTemplate: document.querySelector("#applyTemplateButton"),
  localAi: document.querySelector("#localAiButton"),
  deleteNote: document.querySelector("#deleteNoteButton"),
  restoreNote: document.querySelector("#restoreNoteButton"),
  content: document.querySelector("#contentInput"),
  preview: document.querySelector("#preview"),
  currentTags: document.querySelector("#currentTags"),
  links: document.querySelector("#linkList"),
  backlinks: document.querySelector("#backlinkList"),
  saveStatus: document.querySelector("#saveStatus"),
  syncStatus: document.querySelector("#syncStatus"),
  syncDiagnostics: document.querySelector("#syncDiagnostics"),
  supabaseUrl: document.querySelector("#supabaseUrlInput"),
  supabaseKey: document.querySelector("#supabaseKeyInput"),
  email: document.querySelector("#emailInput"),
  password: document.querySelector("#passwordInput"),
  saveSyncSettings: document.querySelector("#saveSyncSettingsButton"),
  testConnection: document.querySelector("#testConnectionButton"),
  signIn: document.querySelector("#signInButton"),
  syncNow: document.querySelector("#syncNowButton"),
  detectDuplicates: document.querySelector("#detectDuplicatesButton"),
  exportCurrent: document.querySelector("#exportCurrentButton"),
  exportAll: document.querySelector("#exportAllButton"),
  historyList: document.querySelector("#historyList"),
  aiPanel: document.querySelector("#aiPanel"),
  editorPanel: document.querySelector(".editor-panel"),
};

initialize();

async function initialize() {
  state = await loadState();
  activeNoteId = state.activeNoteId || state.notes[0]?.id;
  loadSyncSettingsIntoForm();
  document.body.dataset.mobileSection = "notes";
  els.editorPanel.dataset.mobileView = "edit";
  Object.keys(templates).forEach((name) => els.template.append(new Option(name, name)));

  els.search.addEventListener("input", render);
  els.newNote.addEventListener("click", () => createNote({ folder: activeFolder === "all" ? "00_Inbox" : activeFolder }));
  els.quickCapture.addEventListener("click", () => createNote({ folder: "00_Inbox", title: "無題のInboxメモ" }));
  els.addFolder.addEventListener("click", addFolder);
  els.renameFolder.addEventListener("click", renameActiveFolder);
  els.deleteFolder.addEventListener("click", deleteActiveFolder);
  els.title.addEventListener("input", updateActiveNote);
  els.folder.addEventListener("change", updateActiveNote);
  els.content.addEventListener("input", updateActiveNote);
  els.applyTemplate.addEventListener("click", applyTemplate);
  els.localAi.addEventListener("click", runLocalAi);
  els.deleteNote.addEventListener("click", deleteActiveNote);
  els.restoreNote.addEventListener("click", restoreActiveNote);
  els.exportCurrent.addEventListener("click", exportCurrentMarkdown);
  els.exportAll.addEventListener("click", exportAllZip);
  els.saveSyncSettings.addEventListener("click", saveSyncSettingsFromForm);
  els.testConnection.addEventListener("click", testSupabaseConnection);
  els.signIn.addEventListener("click", signIn);
  els.syncNow.addEventListener("click", syncNow);
  els.detectDuplicates.addEventListener("click", reportDuplicateNotes);

  document.querySelectorAll(".nav-action").forEach((button) => {
    button.addEventListener("click", () => {
      activeSpecialFilter = button.dataset.filter;
      activeFolder = "all";
      activeTag = "";
      render();
    });
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      els.editorPanel.dataset.mobileView = button.dataset.view;
    });
  });

  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".bottom-nav button").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      const section = button.dataset.mobileSection;
      document.body.dataset.mobileSection = section;
      if (section === "search") {
        activeSpecialFilter = "";
        window.setTimeout(() => els.search.focus(), 0);
      }
      if (section === "settings") activeSpecialFilter = "";
      render();
    });
  });

  render();
}

async function loadState() {
  const saved = await idbGet(STATE_ID);
  if (saved?.notes?.length) {
    return {
      notes: normalizeNotes(saved.notes),
      folders: normalizeFolders(saved.folders),
      activeNoteId: saved.activeNoteId,
    };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = { notes: seedNotes, folders: defaultFolders, activeNoteId: seedNotes[0].id };
    await idbSet(STATE_ID, initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    const migrated = {
      notes: normalizeNotes(Array.isArray(parsed.notes) && parsed.notes.length ? parsed.notes : seedNotes),
      folders: normalizeFolders(parsed.folders),
      activeNoteId: parsed.activeNoteId,
    };
    await idbSet(STATE_ID, migrated);
    return migrated;
  } catch {
    const fallback = { notes: seedNotes, folders: defaultFolders, activeNoteId: seedNotes[0].id };
    await idbSet(STATE_ID, fallback);
    return fallback;
  }
}

function persist(immediate = false) {
  clearTimeout(saveTimer);
  els.saveStatus.textContent = "保存待機中";
  const run = async () => {
    const snapshot = { notes: state.notes, folders: allFolders(), activeNoteId };
    await idbSet(STATE_ID, snapshot);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: state.notes, folders: allFolders(), activeNoteId }));
    els.saveStatus.textContent = `IndexedDB保存済み ${new Date().toLocaleTimeString("ja-JP")}`;
    scheduleSync();
  };
  if (immediate) run();
  else saveTimer = setTimeout(run, AUTO_SAVE_MS);
}

function activeNote() {
  return state.notes.find((note) => note.id === activeNoteId) || state.notes[0];
}

function createNote({ folder = "00_Inbox", title = "無題ノート", content = "# 無題ノート\n#要整理" } = {}) {
  const note = {
    id: crypto.randomUUID(),
    title,
    slug: slugify(title),
    folder,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    syncStatus: "local",
    versions: [],
  };
  state.notes.unshift(note);
  activeNoteId = note.id;
  persist(true);
  render();
}

function updateActiveNote() {
  const note = activeNote();
  if (!note) return;
  const nextTitle = els.title.value.trim() || "無題ノート";
  const nextContent = els.content.value;
  if (note.content !== nextContent || note.title !== nextTitle || note.folder !== els.folder.value) recordVersion(note);
  note.title = nextTitle;
  note.slug = slugify(note.title);
  note.folder = els.folder.value;
  note.content = nextContent;
  note.updatedAt = new Date().toISOString();
  note.syncStatus = "local";
  persist();
  renderSecondary(note);
  renderNoteList();
}

function applyTemplate() {
  const name = els.template.value;
  if (!name) return;
  const note = activeNote();
  const insert = templates[name];
  recordVersion(note, true);
  note.content = note.content.trim() ? `${note.content}\n\n---\n\n${insert}` : insert;
  note.updatedAt = new Date().toISOString();
  note.syncStatus = "local";
  persist();
  render();
}

function render() {
  renderFolders();
  renderFolderSelect();
  renderTags();
  renderNoteList();
  renderEditor();
}

function renderFolders() {
  els.folders.innerHTML = "";
  const all = button("すべて", "folder-button", () => {
    activeFolder = "all";
    activeTag = "";
    activeSpecialFilter = "";
    render();
  });
  all.classList.toggle("active", activeFolder === "all" && !activeTag && !activeSpecialFilter);
  els.folders.append(all);
  allFolders().forEach((folder) => {
    const count = state.notes.filter((note) => note.folder === folder && !note.deletedAt).length;
    const item = button(`${folder} (${count})`, "folder-button", () => {
      activeFolder = folder;
      activeTag = "";
      activeSpecialFilter = "";
      render();
    });
    item.classList.toggle("active", activeFolder === folder);
    els.folders.append(item);
  });
}

function renderTags() {
  els.tags.innerHTML = "";
  const tags = collectTags(state.notes.filter((note) => !note.deletedAt));
  tags.forEach((tag) => {
    const item = button(`#${tag}`, "tag-chip", () => {
      activeTag = tag;
      activeFolder = "all";
      activeSpecialFilter = "";
      render();
    });
    item.classList.toggle("active", activeTag === tag);
    els.tags.append(item);
  });
}

function renderNoteList() {
  els.noteList.innerHTML = "";
  const notes = filteredNotes();
  els.label.textContent = filterLabel(notes.length);
  notes.forEach((note) => {
    const card = document.createElement("button");
    card.className = "note-card";
    card.classList.toggle("active", note.id === activeNoteId);
    card.innerHTML = `<h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.folder)} ・ ${formatDate(note.updatedAt)}</p><p>${escapeHtml(summary(note.content))}</p>`;
    card.addEventListener("click", () => {
      activeNoteId = note.id;
      state.activeNoteId = activeNoteId;
      persist(true);
      renderEditor();
      renderNoteList();
    });
    els.noteList.append(card);
  });
  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "status-text";
    empty.textContent = "該当するノートはありません。";
    els.noteList.append(empty);
  }
}

function renderEditor() {
  const note = activeNote();
  if (!note) return;
  els.title.value = note.title;
  els.folder.value = note.folder;
  els.content.value = note.content;
  renderSecondary(note);
}

function renderSecondary(note) {
  const allTitles = new Set(state.notes.map((item) => item.title));
  els.preview.innerHTML = markdownToHtml(note.content, allTitles);
  els.currentTags.innerHTML = chips(extractTags(note.content).map((tag) => `#${tag}`));
  const links = extractWikiLinks(note.content);
  els.links.innerHTML = "";
  links.forEach((title) => {
    const exists = state.notes.find((item) => item.title === title);
    const chip = button(exists ? title : `${title} を作成`, exists ? "link-chip" : "link-chip missing-link", () => {
      if (exists) activeNoteId = exists.id;
      else createNote({ title, content: `# ${title}\n#要整理` });
      render();
    });
    els.links.append(chip);
  });
  if (!links.length) els.links.innerHTML = `<p class="status-text">リンクなし</p>`;

  const backlinks = state.notes.filter((item) => item.id !== note.id && extractWikiLinks(item.content).includes(note.title));
  els.backlinks.innerHTML = "";
  backlinks.forEach((item) => {
    els.backlinks.append(button(item.title, "link-chip", () => {
      activeNoteId = item.id;
      render();
    }));
  });
  if (!backlinks.length) els.backlinks.innerHTML = `<p class="status-text">被リンクなし</p>`;
  renderHistory(note);
  renderAiPanel(note);
  els.deleteNote.style.display = note.deletedAt ? "none" : "";
  els.restoreNote.style.display = note.deletedAt ? "" : "none";
}

function filteredNotes() {
  const query = els.search.value.trim().toLowerCase();
  let notes = activeSpecialFilter === "trash" ? state.notes.filter((note) => note.deletedAt) : state.notes.filter((note) => !note.deletedAt);
  if (activeFolder !== "all") notes = notes.filter((note) => note.folder === activeFolder);
  if (activeTag) notes = notes.filter((note) => extractTags(note.content).includes(activeTag));
  if (activeSpecialFilter === "recent") {
    notes = notes.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20);
  }
  if (activeSpecialFilter === "unorganized") {
    notes = notes.filter((note) => note.folder === "00_Inbox" || extractTags(note.content).includes("要整理"));
  }
  if (activeSpecialFilter === "kurosese") {
    notes = notes.filter((note) => extractTags(note.content).includes("黒瀬共有"));
  }
  if (activeSpecialFilter === "missing-links") {
    const titles = new Set(state.notes.map((note) => note.title));
    notes = notes.filter((note) => extractWikiLinks(note.content).some((link) => !titles.has(link)));
  }
  if (activeSpecialFilter === "trash") {
    notes = state.notes.filter((note) => note.deletedAt);
  }
  if (query) {
    notes = notes.filter((note) => {
      const haystack = `${note.title}\n${note.folder}\n${note.content}`.toLowerCase();
      return haystack.includes(query);
    });
  }
  return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function filterLabel(count) {
  if (activeTag) return `#${activeTag} ・ ${count}件`;
  if (activeSpecialFilter === "recent") return `最近更新 ・ ${count}件`;
  if (activeSpecialFilter === "unorganized") return `未整理 ・ ${count}件`;
  if (activeSpecialFilter === "kurosese") return `#黒瀬共有 ・ ${count}件`;
  if (activeSpecialFilter === "missing-links") return `未作成リンク ・ ${count}件`;
  if (activeSpecialFilter === "trash") return `ゴミ箱 ・ ${count}件`;
  return `${activeFolder === "all" ? "すべて" : activeFolder} ・ ${count}件`;
}

function extractTags(text) {
  return Array.from(new Set((text.match(/(^|\s)#([A-Za-z0-9_\-\u3040-\u30ff\u3400-\u9fff]+)/g) || []).map((tag) => tag.trim().slice(1))));
}

function collectTags(notes) {
  return Array.from(new Set(notes.flatMap((note) => extractTags(note.content)))).sort((a, b) => a.localeCompare(b, "ja"));
}

function extractWikiLinks(text) {
  return Array.from(new Set(Array.from(text.matchAll(/\[\[([^\]]+)\]\]/g)).map((match) => match[1].trim()).filter(Boolean)));
}

function markdownToHtml(markdown, allTitles) {
  const escaped = escapeHtml(markdown);
  const lines = escaped.split("\n");
  const html = [];
  let inList = false;
  lines.forEach((line) => {
    if (/^- /.test(line)) {
      if (!inList) html.push("<ul>");
      inList = true;
      html.push(`<li>${inlineFormat(line.slice(2), allTitles)}</li>`);
      return;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (/^### /.test(line)) html.push(`<h3>${inlineFormat(line.slice(4), allTitles)}</h3>`);
    else if (/^## /.test(line)) html.push(`<h2>${inlineFormat(line.slice(3), allTitles)}</h2>`);
    else if (/^# /.test(line)) html.push(`<h1>${inlineFormat(line.slice(2), allTitles)}</h1>`);
    else if (!line.trim()) html.push("<br>");
    else html.push(`<p>${inlineFormat(line, allTitles)}</p>`);
  });
  if (inList) html.push("</ul>");
  return html.join("");
}

function inlineFormat(text, allTitles) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const exists = allTitles.has(title.trim());
      return `<span class="${exists ? "link-chip" : "missing-link"}">[[${title}]]</span>`;
    });
}

function exportCurrentMarkdown() {
  const note = activeNote();
  download(`${safeFileName(note.title)}.md`, note.content, "text/markdown;charset=utf-8");
}

function exportAllZip() {
  const files = state.notes.filter((note) => !note.deletedAt).map((note) => ({
    name: `${note.folder}/${safeFileName(note.title)}.md`,
    content: note.content,
  }));
  const zip = buildZip(files);
  downloadBlob("shiramine-vault-export.zip", zip, "application/zip");
}

function allFolders() {
  return Array.from(new Set([...(state.folders || []), ...defaultFolders, ...state.notes.map((note) => note.folder).filter(Boolean)]));
}

function normalizeFolders(folders) {
  return Array.from(new Set([...(Array.isArray(folders) ? folders : []), ...defaultFolders]));
}

function normalizeNotes(notes) {
  return notes.map((note) => ({
    ...note,
    folder: note.folder || note.folder_id || "00_Inbox",
    createdAt: note.createdAt || note.created_at || new Date().toISOString(),
    updatedAt: note.updatedAt || note.updated_at || new Date().toISOString(),
    deletedAt: note.deletedAt || note.deleted_at || null,
    versions: Array.isArray(note.versions) ? note.versions : [],
  }));
}

function renderFolderSelect() {
  const current = els.folder.value;
  els.folder.innerHTML = "";
  allFolders().forEach((folder) => els.folder.append(new Option(folder, folder)));
  els.folder.value = allFolders().includes(current) ? current : activeNote()?.folder || "00_Inbox";
}

function addFolder() {
  const folder = els.newFolder.value.trim();
  if (!folder) return;
  state.folders = normalizeFolders([...(state.folders || []), folder]);
  els.newFolder.value = "";
  persist(true);
  render();
}

function renameActiveFolder() {
  if (activeFolder === "all") return;
  if (defaultFolders.includes(activeFolder)) {
    alert("初期フォルダは改名しません。追加フォルダを選択してください。");
    return;
  }
  const next = prompt("新しいフォルダ名", activeFolder)?.trim();
  if (!next || next === activeFolder) return;
  state.notes.forEach((note) => {
    if (note.folder === activeFolder) {
      note.folder = next;
      note.updatedAt = new Date().toISOString();
      note.syncStatus = "local";
    }
  });
  state.folders = allFolders().map((folder) => (folder === activeFolder ? next : folder));
  activeFolder = next;
  persist(true);
  render();
}

function deleteActiveFolder() {
  if (activeFolder === "all" || activeFolder === "00_Inbox") return;
  if (defaultFolders.includes(activeFolder)) {
    alert("初期フォルダは削除しません。追加フォルダを選択してください。");
    return;
  }
  const ok = confirm(`${activeFolder} を削除し、ノートを 00_Inbox に戻します。`);
  if (!ok) return;
  state.notes.forEach((note) => {
    if (note.folder === activeFolder) {
      note.folder = "00_Inbox";
      note.updatedAt = new Date().toISOString();
      note.syncStatus = "local";
    }
  });
  state.folders = allFolders().filter((folder) => folder !== activeFolder);
  activeFolder = "00_Inbox";
  persist(true);
  render();
}

function deleteActiveNote() {
  const note = activeNote();
  if (!note || note.deletedAt) return;
  recordVersion(note, true);
  note.deletedAt = new Date().toISOString();
  note.updatedAt = new Date().toISOString();
  note.syncStatus = "local";
  activeNoteId = note.id;
  activeSpecialFilter = "trash";
  persist(true);
  render();
}

function restoreActiveNote() {
  const note = activeNote();
  if (!note || !note.deletedAt) return;
  note.deletedAt = null;
  note.updatedAt = new Date().toISOString();
  note.syncStatus = "local";
  activeSpecialFilter = "";
  persist(true);
  render();
}

function recordVersion(note, force = false) {
  note.versions = Array.isArray(note.versions) ? note.versions : [];
  const last = note.versions[0];
  const now = Date.now();
  const lastAt = note.lastVersionAt ? new Date(note.lastVersionAt).getTime() : 0;
  if (!force && now - lastAt < 60000) return;
  if (last?.content === note.content && last?.title === note.title && last?.folder === note.folder) return;
  note.versions.unshift({
    id: crypto.randomUUID(),
    title: note.title,
    folder: note.folder,
    content: note.content,
    createdAt: new Date().toISOString(),
  });
  note.versions = note.versions.slice(0, 30);
  note.lastVersionAt = new Date().toISOString();
}

function renderHistory(note) {
  els.historyList.innerHTML = "";
  const versions = Array.isArray(note.versions) ? note.versions : [];
  versions.slice(0, 8).forEach((version) => {
    els.historyList.append(button(formatDate(version.createdAt), "link-chip", () => {
      recordVersion(note, true);
      note.title = version.title;
      note.folder = version.folder;
      note.content = version.content;
      note.updatedAt = new Date().toISOString();
      note.syncStatus = "local";
      persist(true);
      render();
    }));
  });
  if (!versions.length) els.historyList.innerHTML = `<p class="status-text">履歴なし</p>`;
}

function renderAiPanel(note) {
  const ai = buildLocalAiResult(note);
  els.aiPanel.innerHTML = `
    <div><h4>要約</h4><p>${escapeHtml(ai.summary)}</p></div>
    <div><h4>分類候補</h4><p>${escapeHtml(ai.folder)} / ${escapeHtml(ai.tags.join(" "))}</p></div>
    <div><h4>関連候補</h4><p>${escapeHtml(ai.related.join("、") || "なし")}</p></div>
  `;
}

function runLocalAi() {
  const note = activeNote();
  if (!note) return;
  const ai = buildLocalAiResult(note);
  const content = `# AI支援結果 - ${note.title}
## 要約
${ai.summary}

## 分類候補
- フォルダ: ${ai.folder}
- タグ: ${ai.tags.join(" ")}

## 関連ノート候補
${ai.related.map((title) => `- [[${title}]]`).join("\n") || "- なし"}

## Threads投稿案
${ai.threads}

## note記事化するなら
${ai.noteOutline.map((line) => `- ${line}`).join("\n")}

## 元ノート
- [[${note.title}]]
#AI #要整理`;
  createNote({ title: `AI支援結果 - ${note.title}`, folder: "06_AI運用", content });
}

function buildLocalAiResult(note) {
  const plain = note.content.replace(/[#*`\[\]]/g, "").replace(/\s+/g, " ").trim();
  const sentences = plain.split(/[。.!?！？]/).map((item) => item.trim()).filter(Boolean);
  const summary = sentences.slice(0, 2).join("。") + (sentences.length ? "。" : "本文が短いため要約できません。");
  const tags = extractTags(note.content).map((tag) => `#${tag}`);
  const folder = suggestFolder(note);
  const related = suggestRelatedNotes(note);
  const key = note.title.replace(/^AI支援結果 - /, "");
  return {
    summary,
    folder,
    tags: tags.length ? tags : ["#要整理"],
    related,
    threads: `${key}について、今の結論だけ残す。あとで使うためのメモは、きれいにまとめるより先に失わない形にする。`,
    noteOutline: [`${key}とは何か`, "なぜ今それを考えたか", "現時点の結論", "発信・創作・生活への使い道"],
  };
}

function suggestFolder(note) {
  const text = `${note.title}\n${note.content}`;
  if (/#発信ネタ|Threads|note|投稿|記事/.test(text)) return "03_発信ネタ";
  if (/#創作|FF14|キャラ|世界観|プロット/.test(text)) return "04_創作設定";
  if (/#生活再建|生活保護|自己破産|役所|制度/.test(text)) return "05_生活・制度";
  if (/#AI|黒瀬|白峰|プロンプト|ChatGPT/.test(text)) return "06_AI運用";
  if (/#用語|定義|一言でいうと/.test(text)) return "01_用語辞典";
  if (/#思考ログ|結論|仮説|問い/.test(text)) return "02_思考ログ";
  return "00_Inbox";
}

function suggestRelatedNotes(note) {
  const currentTags = new Set(extractTags(note.content));
  const currentWords = keywords(`${note.title} ${note.content}`);
  return state.notes
    .filter((item) => item.id !== note.id && !item.deletedAt)
    .map((item) => {
      const itemTags = extractTags(item.content);
      const tagScore = itemTags.filter((tag) => currentTags.has(tag)).length * 3;
      const wordScore = keywords(`${item.title} ${item.content}`).filter((word) => currentWords.includes(word)).length;
      return { title: item.title, score: tagScore + wordScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.title);
}

function keywords(text) {
  return Array.from(new Set(text.replace(/[^\p{Letter}\p{Number}ー一-龯ぁ-んァ-ヶA-Za-z0-9]/gu, " ").split(/\s+/).filter((word) => word.length >= 2))).slice(0, 80);
}

function buildZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const entries = withDirectoryEntries(files);
  const useUtf8Names = !canEncodeCp932Names();
  const flags = useUtf8Names ? 0x0800 : 0;
  entries.forEach((file) => {
    const name = encodeZipName(file.name, encoder);
    const data = file.directory ? new Uint8Array() : encoder.encode(file.content);
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50), u16(20), u16(flags), u16(0), u16(0), u16(0), u32(crc),
      u32(data.length), u32(data.length), u16(name.length), u16(0), name, data,
    ]);
    localParts.push(local);
    const central = concatBytes([
      u32(0x02014b50), u16(20), u16(20), u16(flags), u16(0), u16(0), u16(0), u32(crc),
      u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0),
      u16(0), u32(file.directory ? 0x10 : 0), u32(offset), name,
    ]);
    centralParts.push(central);
    offset += local.length;
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = concatBytes([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(centralSize), u32(offset), u16(0),
  ]);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function withDirectoryEntries(files) {
  const dirs = new Set();
  files.forEach((file) => {
    const parts = file.name.split("/");
    parts.pop();
    let path = "";
    parts.forEach((part) => {
      path += `${part}/`;
      dirs.add(path);
    });
  });
  return [
    ...Array.from(dirs).sort((a, b) => a.localeCompare(b)).map((name) => ({ name, content: "", directory: true })),
    ...files.map((file) => ({ ...file, directory: false })),
  ];
}

function canEncodeCp932Names() {
  return Boolean(window.Encoding?.stringToCode && window.Encoding?.convert);
}

function encodeZipName(name, fallbackEncoder) {
  if (!canEncodeCp932Names()) return fallbackEncoder.encode(name);
  const unicodeCodes = window.Encoding.stringToCode(name);
  const sjisCodes = window.Encoding.convert(unicodeCodes, {
    from: "UNICODE",
    to: "SJIS",
    type: "array",
  });
  return new Uint8Array(sjisCodes);
}

function crc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function u16(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}

function u32(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
}

function concatBytes(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function button(text, className, onClick) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = className;
  el.textContent = text;
  el.addEventListener("click", onClick);
  return el;
}

function chips(items) {
  return items.length ? items.map((item) => `<span class="tag-chip">${escapeHtml(item)}</span>`).join("") : `<p class="status-text">なし</p>`;
}

function noteSeed(id, title, folder, content) {
  return { id, title, slug: slugify(title), folder, content, createdAt: SEED_CREATED_AT, updatedAt: SEED_CREATED_AT, deletedAt: null, versions: [] };
}

function noteContentKey(note) {
  return JSON.stringify([note.title || "", note.folder || "00_Inbox", note.content || ""]);
}

function seedContentKeys() {
  return new Set(seedNotes.map(noteContentKey));
}

function isOnlyUneditedSeedVault(notes) {
  if (!Array.isArray(notes) || notes.length !== seedNotes.length) return false;
  const seeds = seedContentKeys();
  const seen = new Set();
  return notes.every((note) => {
    if (note.deletedAt) return false;
    if (Array.isArray(note.versions) && note.versions.length) return false;
    const key = noteContentKey(note);
    if (!seeds.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function duplicateNoteGroups(notes, { includeDeleted = false } = {}) {
  const groups = new Map();
  notes.filter((note) => includeDeleted || !note.deletedAt).forEach((note) => {
    const key = noteContentKey(note);
    const group = groups.get(key) || [];
    group.push(note);
    groups.set(key, group);
  });
  return Array.from(groups.values()).filter((group) => group.length > 1);
}

function rankDuplicateKeeper(note) {
  let score = 0;
  if (!note.deletedAt) score += 1000;
  if (note.syncStatus === "synced") score += 100;
  if (seedNotes.some((seed) => seed.id === note.id)) score += 10;
  return score;
}

function removeExactDuplicateNotes(notes) {
  const removed = [];
  const deletedAt = new Date().toISOString();
  const removedIds = new Set();
  duplicateNoteGroups(notes).forEach((group) => {
    group.sort((a, b) => {
      const scoreDiff = rankDuplicateKeeper(b) - rankDuplicateKeeper(a);
      if (scoreDiff) return scoreDiff;
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
    group.slice(1).forEach((note) => {
      removedIds.add(note.id);
      removed.push(note);
    });
  });
  return {
    notes: notes.map((note) => (removedIds.has(note.id) ? { ...note, deletedAt, updatedAt: deletedAt, syncStatus: "local" } : note)),
    removed,
  };
}

function reportDuplicateNotes() {
  const groups = duplicateNoteGroups(state.notes);
  if (!groups.length) {
    renderSyncDiagnostics("重複ノート検出", {
      ok: ["title + folder + content が完全一致する重複ノートはありません。"],
      warnings: [],
      blockers: [],
    });
    return;
  }
  const warnings = [`完全一致の重複候補: ${groups.length}組。自動削除はしていません。`];
  groups.slice(0, 12).forEach((group, index) => {
    const head = group[0];
    warnings.push(`${index + 1}. ${head.title} / ${head.folder} / ${group.length}件`);
    group.forEach((note) => warnings.push(`   id=${note.id} updated=${note.updatedAt || "-"} deleted=${note.deletedAt || "-"}`));
  });
  if (groups.length > 12) warnings.push(`ほか ${groups.length - 12} 組`);
  renderSyncDiagnostics("重複ノート検出", { ok: [], warnings, blockers: [] });
}

function slugify(title) {
  return title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[\\/:*?"<>|]/g, "");
}

function safeFileName(title) {
  return title.replace(/[\\/:*?"<>|]/g, "_");
}

function summary(text) {
  return text.replace(/^#+\s*/gm, "").replace(/[#*\[\]`]/g, "").replace(/\s+/g, " ").trim().slice(0, 78) || "本文なし";
}

function formatDate(value) {
  return new Date(value).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function download(name, content, type) {
  downloadBlob(name, new Blob([content], { type }), type);
}

function downloadBlob(name, blob, type) {
  const url = URL.createObjectURL(new Blob([blob], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(id, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function loadSyncSettingsIntoForm() {
  const settings = getSyncSettings();
  els.supabaseUrl.value = settings.url || "";
  els.supabaseKey.value = settings.key || "";
  els.email.value = settings.email || "";
  els.syncStatus.textContent = settings.url && settings.key ? "同期設定あり" : "ローカル保存";
  renderSyncDiagnostics("同期設定", validateSyncInputs({ ...settings, password: "" }));
}

function getSyncSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(SYNC_SETTINGS_KEY)) || {};
    const normalizedUrl = normalizeSupabaseUrl(settings.url || "");
    if (settings.url && settings.url !== normalizedUrl) {
      settings.url = normalizedUrl;
      localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
    }
    return { ...settings, url: normalizedUrl };
  } catch {
    return {};
  }
}

function saveSyncSettingsFromForm() {
  const settings = {
    url: normalizeSupabaseUrl(els.supabaseUrl.value),
    key: els.supabaseKey.value.trim(),
    email: els.email.value.trim(),
  };
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
  els.supabaseUrl.value = settings.url;
  els.syncStatus.textContent = settings.url && settings.key ? "同期設定を保存しました" : "ローカル保存";
  renderSyncDiagnostics("保存時チェック", validateSyncInputs({ ...settings, password: els.password.value }));
}

function getSupabaseClient() {
  const settings = getSyncSettings();
  const diagnostics = validateSyncInputs({ ...settings, password: els.password.value });
  if (diagnostics.blockers.length) {
    els.syncStatus.textContent = "Supabase設定エラー";
    renderSyncDiagnostics("接続前チェック", diagnostics);
    return null;
  }
  if (!window.supabase?.createClient) {
    els.syncStatus.textContent = "Supabaseライブラリ未読込";
    renderSyncDiagnostics("接続前チェック", {
      ok: [],
      warnings: [],
      blockers: ["Supabaseライブラリが読み込めていません。ネットワーク、CSP、CDN読込を確認してください。"],
    });
    return null;
  }
  return window.supabase.createClient(settings.url, settings.key);
}

async function testSupabaseConnection() {
  saveSyncSettingsFromForm();
  const settings = getSyncSettings();
  const diagnostics = validateSyncInputs({ ...settings, password: els.password.value });
  if (diagnostics.blockers.length) {
    els.syncStatus.textContent = "接続確認前に設定修正が必要";
    renderSyncDiagnostics("接続確認", diagnostics);
    return;
  }

  const endpoint = `${settings.url}/auth/v1/health`;
  els.syncStatus.textContent = "Supabase接続確認中";
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: settings.key,
      },
    });
    renderSyncDiagnostics("接続確認", {
      ok: [`Auth endpointへ到達しました。HTTP ${response.status}`],
      warnings: response.ok ? [] : [`HTTP ${response.status} が返りました。到達はしていますが、Supabase側の状態を確認してください。`],
      blockers: [],
    });
    els.syncStatus.textContent = response.ok ? "Supabase接続OK" : `Supabase応答あり: HTTP ${response.status}`;
  } catch (error) {
    els.syncStatus.textContent = `接続失敗: ${error.message}`;
    renderSyncDiagnostics("接続失敗", buildNetworkErrorDiagnostics(error, settings.url));
  }
}

async function signIn() {
  saveSyncSettingsFromForm();
  const client = getSupabaseClient();
  if (!client) return;
  const email = els.email.value.trim();
  const password = els.password.value;
  if (!email || !password) {
    els.syncStatus.textContent = "メールとパスワードを入力してください";
    renderSyncDiagnostics("ログイン前チェック", validateSyncInputs({ ...getSyncSettings(), password }));
    return;
  }
  els.syncStatus.textContent = "ログイン中";
  renderSyncDiagnostics("ログイン前チェック", validateSyncInputs({ ...getSyncSettings(), email, password }));
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    els.syncStatus.textContent = `ログイン失敗: ${error.message}`;
    renderSyncDiagnostics("ログイン失敗", buildAuthErrorDiagnostics(error));
    return;
  }
  els.syncStatus.textContent = "ログイン済み";
  renderSyncDiagnostics("ログイン成功", {
    ok: [`ログインユーザー: ${data?.user?.email || email}`, `user_id: ${data?.user?.id || "取得不可"}`],
    warnings: [],
    blockers: [],
  });
  await syncNow();
}

function scheduleSync() {
  clearTimeout(syncTimer);
  if (!getSyncSettings().url || !getSyncSettings().key) return;
  syncTimer = setTimeout(() => syncNow(), 2500);
}

async function syncNow() {
  const client = getSupabaseClient();
  if (!client) return;
  els.syncStatus.textContent = "同期中";
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData?.user) {
    els.syncStatus.textContent = userError ? `未ログイン: ${userError.message}` : "未ログイン";
    renderSyncDiagnostics("同期前チェック", buildAuthErrorDiagnostics(userError || { message: "セッションがありません。先にログインしてください。" }));
    return;
  }
  const userId = userData.user.id;
  const { data: remoteRows, error: fetchError } = await client
    .from("notes")
    .select("id,user_id,title,slug,content,folder_id,versions,created_at,updated_at,deleted_at");
  if (fetchError) {
    els.syncStatus.textContent = `取得失敗: ${fetchError.message}`;
    renderSyncDiagnostics("取得失敗", buildDatabaseErrorDiagnostics(fetchError));
    return;
  }

  const remoteNotes = (remoteRows || []).map(fromRemoteNote);
  const syncWarnings = [];
  if (remoteNotes.length && isOnlyUneditedSeedVault(state.notes)) {
    state.notes = remoteNotes.map((note) => ({ ...note, syncStatus: "synced" }));
    state.folders = normalizeFolders([...defaultFolders, ...state.notes.map((note) => note.folder)]);
    activeNoteId = state.notes.find((note) => !note.deletedAt)?.id || state.notes[0]?.id;
    syncWarnings.push("remoteNotesが存在し、ローカルが未編集seedのみだったため、ローカルseedを破棄してSupabase側を正としました。");
  } else {
    mergeRemoteNotes(remoteNotes);
  }

  const dedupeResult = removeExactDuplicateNotes(state.notes);
  state.notes = dedupeResult.notes;
  if (!state.notes.some((note) => note.id === activeNoteId && !note.deletedAt)) activeNoteId = state.notes.find((note) => !note.deletedAt)?.id || state.notes[0]?.id;
  if (dedupeResult.removed.length) {
    syncWarnings.push(`同期前に title + folder + content が完全一致する重複ノートを ${dedupeResult.removed.length} 件除去しました。`);
    dedupeResult.removed.slice(0, 8).forEach((item) => syncWarnings.push(`除去: ${item.title} / ${item.folder} / id=${item.id}`));
    if (dedupeResult.removed.length > 8) syncWarnings.push(`ほか ${dedupeResult.removed.length - 8} 件`);
  }

  const rows = state.notes.map((note) => toRemoteNote(note, userId));
  const { error: upsertError } = await client.from("notes").upsert(rows, { onConflict: "id" });
  if (upsertError) {
    els.syncStatus.textContent = `保存失敗: ${upsertError.message}`;
    renderSyncDiagnostics("保存失敗", buildDatabaseErrorDiagnostics(upsertError));
    return;
  }
  state.notes.forEach((note) => {
    note.syncStatus = "synced";
  });
  persist(true);
  render();
  els.syncStatus.textContent = `同期済み ${new Date().toLocaleTimeString("ja-JP")}`;
  renderSyncDiagnostics("同期成功", {
    ok: [`同期ユーザー: ${userData.user.email || userData.user.id}`, `同期対象ノート: ${rows.length}件`],
    warnings: syncWarnings,
    blockers: [],
  });
}

function normalizeSupabaseUrl(value) {
  return value.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

function validateSyncInputs({ url = "", key = "", email = "", password = "" }) {
  const ok = [];
  const warnings = [];
  const blockers = [];
  const normalizedUrl = normalizeSupabaseUrl(url);

  if (!normalizedUrl) {
    blockers.push("Supabase URLが未入力です。Project Settings > API の Project URL を入れてください。");
  } else {
    try {
      const parsed = new URL(normalizedUrl);
      if (!/^https:$/.test(parsed.protocol)) warnings.push("Supabase URLは通常 https:// で始まります。");
      if (!parsed.hostname.endsWith(".supabase.co")) warnings.push("Supabase URLのホストが *.supabase.co ではありません。カスタムドメインでなければ確認してください。");
      if (/\/rest\/v1\/?$/i.test(url.trim())) warnings.push("Supabase URLに /rest/v1 が含まれていたため、自動でProject URL形式へ補正します。");
      ok.push("Supabase URL: Project URL形式です。");
    } catch {
      blockers.push("Supabase URLの形式がURLとして不正です。");
    }
  }

  if (!key) {
    blockers.push("anon public key / publishable key が未入力です。");
  } else {
    if (key.includes("service_role")) blockers.push("service_role keyは絶対に使わないでください。anon public keyまたはpublishable keyを使ってください。");
    if (key.startsWith("eyJ")) ok.push("Key: JWT形式のanon public keyらしい形式です。");
    else if (key.startsWith("sb_publishable_")) ok.push("Key: Supabase publishable keyらしい形式です。");
    else warnings.push("Key形式が一般的な anon JWT / sb_publishable_ 形式に見えません。Project Settings > API のキーを確認してください。");
  }

  if (!email) blockers.push("メールアドレスが未入力です。Authentication > Users に存在するメールを入れてください。");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) blockers.push("メールアドレスの形式が不正です。");
  else ok.push("メール: 形式は正常です。");

  if (!password) warnings.push("パスワード未入力です。ログイン時は入力してください。");

  return { ok, warnings, blockers };
}

function renderSyncDiagnostics(title, diagnostics) {
  if (!els.syncDiagnostics) return;
  const lines = [`[${title}]`];
  diagnostics.ok.forEach((item) => lines.push(`OK: ${item}`));
  diagnostics.warnings.forEach((item) => lines.push(`確認: ${item}`));
  diagnostics.blockers.forEach((item) => lines.push(`要修正: ${item}`));
  if (!diagnostics.ok.length && !diagnostics.warnings.length && !diagnostics.blockers.length) lines.push("表示する診断はありません。");
  els.syncDiagnostics.textContent = lines.join("\n");
}

function buildAuthErrorDiagnostics(error) {
  const message = error?.message || "不明なAuthエラー";
  const status = error?.status || error?.code || "";
  const blockers = [`Supabase Auth error: ${message}${status ? ` (${status})` : ""}`];
  const warnings = [
    "まず接続確認ボタンを押し、Auth endpointへ到達できるか確認してください。",
    "Authentication > Users に該当メールのユーザーが存在するか確認してください。",
    "メール確認が必須なら、対象ユーザーのConfirmが完了しているか確認してください。",
    "パスワードが正しいか確認してください。",
    "Supabase URLが /rest/v1 ではなく Project URL だけになっているか確認してください。",
    "anon public keyまたはpublishable keyが同じプロジェクトのものか確認してください。",
  ];
  return { ok: [], warnings, blockers };
}

function buildNetworkErrorDiagnostics(error, url) {
  return {
    ok: [],
    warnings: [
      `確認URL: ${url}`,
      "Supabase Dashboard > Project Settings > API の Project URLを再コピーしてください。",
      "Project URLにタイプミスがないか確認してください。",
      "プロジェクト作成直後なら数分待って再試行してください。",
      "ブラウザ拡張、広告ブロック、セキュリティソフト、VPNで supabase.co への通信が遮断されていないか確認してください。",
      "別ブラウザまたはスマホ回線で同じURLを試してください。",
    ],
    blockers: [`Network error: ${error?.message || "Failed to fetch"}`],
  };
}

function buildDatabaseErrorDiagnostics(error) {
  const message = error?.message || "不明なDBエラー";
  const details = [error?.details, error?.hint, error?.code].filter(Boolean).join(" / ");
  return {
    ok: [],
    warnings: [
      "RLSで自分のuser_idだけ許可されているか確認してください。",
      "schema.sqlが現在のSupabaseプロジェクトへ適用済みか確認してください。",
    ],
    blockers: [`Supabase DB error: ${message}${details ? ` (${details})` : ""}`],
  };
}

function mergeRemoteNotes(remoteNotes) {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  remoteNotes.forEach((remote) => {
    const local = byId.get(remote.id);
    if (!local) {
      state.notes.push({ ...remote, syncStatus: "synced" });
      return;
    }
    if (remote.updatedAt > local.updatedAt) {
      if (local.syncStatus === "local") {
        const conflict = {
          ...local,
          id: crypto.randomUUID(),
          title: `${local.title} (競合ローカル ${formatDate(new Date().toISOString())})`,
          slug: slugify(`${local.title}-conflict`),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: "local",
        };
        state.notes.push(conflict);
      }
      Object.assign(local, remote, { syncStatus: "synced" });
    }
  });
}

function toRemoteNote(note, userId) {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    slug: note.slug || slugify(note.title),
    content: note.content,
    folder_id: note.folder,
    versions: note.versions || [],
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    deleted_at: note.deletedAt,
  };
}

function fromRemoteNote(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content || "",
    folder: row.folder_id || "00_Inbox",
    versions: Array.isArray(row.versions) ? row.versions : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
