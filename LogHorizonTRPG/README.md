# ログ・ホライズンTRPG用ツール<!-- omit in toc -->

- [各jsファイルの説明](#各jsファイルの説明)
- [PLのキャラクター駒を作成する](#plのキャラクター駒を作成する)
- [エネミーのキャラクター駒を作成する](#エネミーのキャラクター駒を作成する)

## 各jsファイルの説明

| ファイル名             | 説明                                                                                             |
| :--------------------- | :----------------------------------------------------------------------------------------------- |
| CreateLilyCharacter.js | ユドナリウムリリィ用。PLのキャラクター駒を作成するツール                                         |
| CreateLilyEnemy.js     | ユドナリウムリリィ用。ログ・ホライズンデータベースのエネミーページからエネミー駒を作成するツール |

## PLのキャラクター駒を作成する

1. [ログ・ホライズンTRPG](https://lhrpg.com/lhz/top)のマイページを表示する
1. 出力したいキャラクターのキャラクター詳細ページを表示する
1. 「基本情報を変更する」をクリックし、基本情報の変更ページを表示する
1. 「外部ツールからの〈冒険者〉データ参照を許可する」にチェックが入っている状態で「変更内容を確定する」をクリックする
1. キャラクター詳細画面のパーソナルファクター、能力値、特技、アイテムのタブのどれかを開いている状態で[ユドナリウムリリィ用キャラクター作成ツール](CreateLilyCharacter.js)を登録したブックマーク（登録方法は[README](../README.md)を参照）をクリックする
1. ユドナリウムリリィで使用できるキャラクターのZIPファイルがダウンロードできる
    1. ※所持金だけは取得できなかったため、所持金の枠はありますが中のデータは空になっています
1. ブラウザでユドナリウムを表示してダウンロードしたZIPファイルをドラッグ&ドロップする
1. キャラクターが作成できる

## エネミーのキャラクター駒を作成する

1. [ログ・ホライズン データベース](https://lhrpg.com/lhz/database)を表示する
1. エネミーのデータを表示する
1. [ユドナリウムリリィ用エネミー作成ツール](CreateLilyEnemy.js)を登録したブックマーク（登録方法は[README](../README.md)を参照）をクリックする
1. ユドナリウムリリィで使用できるエネミーデータのZIPファイルがダウンロードできる
1. ブラウザでユドナリウムを表示してダウンロードしたZIPファイルをドラッグ&ドロップする
1. エネミーのキャラクターが作成できる
