# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

アリアンロッド2E（Arianrhod 2E）のエネミーデータをブラウザで作成・管理し、ユドナリウム用XML/ZIPを生成する単一HTMLアプリケーションです。

## 言語設定

**すべての回答・質問・コミュニケーションは日本語で行う。** ユーザーは日本語入力を想定します。

## 開発・テスト

### 動作確認方法

- `index.html` をブラウザへドラッグ&ドロップで開く（ローカルサーバーや `xdg-open` は使用しない）
- README記載の手順を先頭から最後まで手動で踏む
- 新挙動の検証前は `chrome://settings/siteData` でブラウザストレージを消去してクリーン状態で再テスト

### 注意事項

- ブラウザで直接ファイルを開いて動作確認するため、サーバーを起動しない
- 初回アクセスでCDN（JSZip, FileSaver.js）からライブラリを取得するためネット接続が必要

## アーキテクチャ

### オブジェクト指向設計

コードベースは明確なクラス分離によるオブジェクト指向アーキテクチャを採用：

```text
App (script.js:4568)
├── EnemyManager (script.js:252) - エネミーデータのCRUD操作
├── SkillLibraryManager (script.js:351) - スキルライブラリのCRUD操作
├── XMLGenerator (script.js:459) - ユドナリウム用XML生成
└── UIManager (script.js:1333) - UI制御とイベント管理
```

### 主要クラス

1. **DataManager** (script.js:73)
   - ローカルストレージの読み書きを抽象化
   - 各マネージャークラスが継承・利用

2. **Enemy** (script.js:111)
   - エネミーデータモデル
   - 基本情報、リソース、能力値、スキル、ドロップ品を保持

3. **Skill** (script.js:214)
   - スキル・パワーデータモデル
   - 判定コマンド、ダメージコマンド、武器メタ情報を含む

4. **EnemyManager** (script.js:252)
   - エネミーの作成・編集・削除・検索
   - localStorage (`ar2e_enemies`) への永続化

5. **SkillLibraryManager** (script.js:351)
   - スキルライブラリの管理
   - localStorage (`ar2e_skills`) への永続化

6. **XMLGenerator** (script.js:459)
   - エネミーデータからユドナリウム用XMLを生成
   - チャットパレット、バフパレット、ドロップ品を含む完全なXML構造を出力
   - `FORCE_BLOCK_ELEMENT_NAMES` で強制的に開始/終了タグ形式に変換

7. **UIManager** (script.js:1333)
   - DOM操作、イベントリスナー、モーダル管理
   - フォーム入力、検索、タブ切り替え、プレビューなど全UI制御

### データフロー

```text
localStorage → DataManager → EnemyManager/SkillLibraryManager
                                    ↓
                           Enemy/Skill Models
                                    ↓
                              XMLGenerator → XML/ZIP出力
                                    ↑
                              UIManager (ユーザー入力)
```

## ファイル構成

- `index.html` - 単一HTMLアプリケーション。全UIコンポーネント、テンプレート、モーダルを含む
- `script.js` (4590行) - 全ロジック。クラス定義、XML生成、UI制御
- `style.css` - スタイル定義
- `README.md` - ユーザー向けドキュメント（利用方法、トラブルシューティング）
- `SPEC/` - 実装済み仕様の詳細（体系的に整理された仕様書ディレクトリ）
- `TODO.md` - 未実装タスクと改善案
- `AGENTS.md` - 開発方針とコーディング規約

## データ保存

- **エネミーデータ**: `localStorage['ar2e_enemies']`
- **スキルライブラリ**: `localStorage['ar2e_skills']`
- JSON形式でエクスポート/インポート可能
- マージ時は `updatedAt` / `createdAt` で衝突解決

## コーディングスタイル

### JavaScript

- モダンES6+: `const`/`let`、アロー関数、クラス構文
- 2スペースインデント
- DOM参照には `nameEl` / `submitBtn` のように `El`/`Btn` 接尾辞
- 変数名は役割が伝わる日本語またはcamelCase

### CSS

- ケバブケース
- コンポーネント単位で宣言を整理
- 既存UIと配色・余白・文字サイズを統一

### HTML

- テンプレート要素 (`<template>`) を活用
- 動的コンテンツはJavaScriptで生成・挿入

## 重要な制約

### ファイル変更範囲

- **変更可能**: `index.html`, `script.js`, `style.css`, `README.md`, `TODO.md`, `AGENTS.md`
- **変更禁止**: 親ディレクトリや他ツールのファイルには触れない
- 共有アセットは存在しない想定

### ドキュメント更新ルール

- `SPEC/` ファイル更新時は `TODO.md` の該当項目を同時に削除・移動
- `TODO.md` のタスク実装時は適切な `SPEC/*.md` に仕様を追記してから `TODO.md` から削除
- README は利用者視点のみ（開発フローや内部情報は含めない）

## XML生成の重要ポイント

### 強制ブロック要素

```javascript
const FORCE_BLOCK_ELEMENT_NAMES = [
  'character', 'image', 'common', 'detail',
  'リソース', '詳細情報', 'ドロップ品', '能力値', 'スキル・パワー',
  '立ち絵位置', 'コマ画像', 'buff'
];
```

これらの要素は空でも `<tag></tag>` 形式で出力される（ユドナリウム互換性のため）。

### チャットパレット生成順序

1. 受動判定（回避/ダメージ適用）
2. 能動判定
3. バフ関連
4. カスタムコマンド
5. 識別公開情報
6. エネミースキル
7. ドロップ品

スキル行は `{スキル名}` でnote要素と連動。

## 既知の課題と対策

### Windows ZIPブロック問題

- ダウンロードしたZIPがWindows Defenderに危険判定される（MOTW: Mark of the Web）
- 回避策:
  - ZIPを展開前に右クリック→「プロパティ」→「ブロックの解除」
  - PowerShellで `Unblock-File -Path "展開先\*.xml" -Recurse`
  - 「XMLダウンロード」ボタンで直接取得してローカルでZIP化（MOTWが付与されない）
- 詳細は `TODO.md` の「WindowsセキュリティによるZIPファイルのブロック問題」を参照

### スキル保存漏れ

- スキル入力中のフォーカス状態によって保存が漏れる可能性がある
- 保存前にblurイベントの明示的な発火が必要な場合がある

## 外部依存

- **JSZip 3.10.1** - ZIP生成（CDN: <https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js>）
- **FileSaver.js 2.0.5** - ファイルダウンロード（CDN: <https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js>）

## 配布

```bash
cd AR2EEnemyCreator
zip -r ../dist/AR2EEnemyCreator.zip index.html script.js style.css README.md
```

作成前に同名の旧zipを削除して最新ファイルのみが入るようにする。

## 著作権と利用制限

- アリアンロッド2Eの著作権は菊池たけし / F.E.A.R.に帰属
- 本ツールは非公式ファンメイド
- 生成データ（XML/ZIP/JSON）は私的利用限定、再頒布・公的配布禁止
- コード内の `COPYRIGHT_NOTICE` (script.js:57) に詳細が定義されている
