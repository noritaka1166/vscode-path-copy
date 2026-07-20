# Path Copy

VS Code のエクスプローラーやエディタータブから、ファイルパスと Git リポジトリ URL を直接コピーする拡張です。

English: [README.md](README.md)

ソースコード・Issue: [noritaka1166/vscode-path-copy](https://github.com/noritaka1166/vscode-path-copy)

## 機能

ファイルまたはフォルダーを右クリックし、**パスまたはリポジトリ URL をコピー…** を選択します。コピー選択ダイアログが開き、各候補の右側に実際にコピーされる値が表示されます。

- 絶対パス
- ファイル名
- コンテンツルートからのパス（VS Code ではワークスペースフォルダー）
- リポジトリルートからのパス
- リポジトリ URL

長い値はダイアログ上で省略表示されます。行の右端にある情報アイコンへカーソルを合わせると全量を確認でき、アイコンをクリックしてもコピーできます。

マルチルートワークスペースでは、選択した項目が属するワークスペースフォルダーを基準にします。Git 関連の項目は、選択した項目を含む最も近い Git リポジトリを自動検出します。

## 多言語対応

既定の言語は英語です。日本語・中国語（簡体字）・韓国語・フランス語・ドイツ語・スペイン語・ポルトガル語（ブラジル）も含まれており、VS Code の表示言語に自動追従します。

## リモート URL の形式

既定では、`git@github.com:owner/repository.git` のような SSH URL を、共有しやすい `https://github.com/owner/repository` に変換します。

Git に設定された文字列をそのままコピーしたい場合は、設定で次を指定してください。

```json
{
  "pathCopy.remoteUrlFormat": "preserve"
}
```

`origin` 以外を使うリポジトリでは、対象リモート名も設定できます。

```json
{
  "pathCopy.remoteName": "upstream"
}
```

## ローカルで試す

1. このフォルダー、または一つ上の `intellj-vscode` フォルダーを VS Code で開きます。
2. `F5`（Mac のファンクションキー設定によっては `fn + F5`）を押して Extension Development Host を起動します。
3. 開いたウィンドウでファイルまたはフォルダーを右クリックします。

## 配布用 VSIX の作成

```bash
npm install
npx vsce package
```

生成された `.vsix` は VS Code の **Extensions: Install from VSIX...** でインストールできます。
