# 貯金ビン — App Store Connect に入れる内容（v1.0・2026-11-24）

日本語だけで出す。無料＋広告（AdMob）＋プラス（¥650・買い切り）。2026年12月13日までに入れた人は、ずっと全部無料・広告なし（ほかのアプリと同じ決まり）。手本は作業ログ（~/sagyo/docs/appstore/metadata.md）。
名前・サブタイトルは本人の決定（2026-11-24）。英語版は作らない（米国の貯金ビン系は小さい。2026-11-24 調べ）。

## アプリ情報

| 項目 | 入れる内容 | メモ |
| --- | --- | --- |
| 名前（30字まで） | 貯金ビン - みんなで貯める目標別の貯金箱 | 21字 |
| サブタイトル（30字まで） | 合言葉で家族や友だちと一緒に貯める | 17字 |
| バンドルID | com.yamaguchiyudai.chokin | |
| SKU | chokin-ios-1 | 後から変えられない |
| Apple ID | （作ったら入れる） | NoAdsStore.appStoreID にも入れる |
| 主言語 | 日本語 | |
| カテゴリ | 主：ファイナンス、副：ライフスタイル | |
| プライバシーポリシーURL | https://klado.jp/chokin/privacy.html | Firebase に置く物（匿名ID・共有ビンの記録・呼び名・メモ）を書く |
| サポートURL | https://klado.jp/chokin/ | アプリの設定のリンクも ここに直す |
| マーケティングURL | https://klado.jp/ | AdMob の app-ads.txt 用 |
| 著作権 | 2026 KLADO | |
| 価格と配信 | 無料、**日本だけ**（今後足される国も自動で足さない） | |
| コンテンツ配信権 | 第三者のコンテンツは含まない | |

## キーワード（100バイトまで・今90バイト）

名前とサブタイトルにある語（貯金・ビン・みんな・貯める・目標・貯金箱・合言葉・家族・友だち・一緒）は入れない。

```
積立,共有,夫婦,カップル,旅行,先取り,節約,ためる,500円玉,ちょきん
```

## プロモーションテキスト（170字まで・審査なしで変えられる）

「沖縄旅行 10万円」「新しいiPhone」。貯めたい物ごとにビンを作って、入れるたびにビンがたまります。合言葉を伝えれば、家族や友だちと何人でも同じビンを一緒に。誰がいくら入れたかも分かります。

## 説明文

```
貯めたい物ごとに、ビンを1つ。目標別に貯める貯金箱アプリです。
「沖縄旅行 10万円」「新しいiPhone」「母の誕生日」のように目標ごとにビンを作り、貯金したら「入れる」を押すだけ。ビンの中身が増えていきます。

■ みんなで1つのビンを貯める
・ビンに合言葉を付けて伝えると、家族や友だちと何人でも同じビンを一緒にためられます
・LINE で送る・QRコードを読む・口で伝える、どれでも入れます
・誰が入れても同じビンがたまり、「母が入れた」「父が使った」と分かります
・ビンごとに一緒に貯める人を分けられます（旅行は家族と、プレゼントは兄弟と など）
・作った人は、合言葉を変える・人を外す ができます

■ 入れるのは数秒
・¥500・¥1,000・¥3,000 のボタンで、すぐ入れられます
・使った時は「使う」で引けます。メモも残せます

■ 期限を決めると、1日いくらか分かる
・期限を入れると「1日 ¥375 で届きます」「予定より ¥15,000 多くたまっています」が出ます
・たまってきた様子をグラフで見られます

■ 記録が消えない
・ひとりで貯めるビンは、この iPhone とあなたの iCloud の両方に保存します。アプリを入れ直しても、機種を変えても戻ります
・アカウントの登録はいりません
・お金を預かったり、銀行とつないだりはしません。入れた・使ったの記録だけを残します

■ プラス（¥650・買い切り）
・広告が消えます
・みんなで貯めるビンを3つ以上作れます（2つまでは無料。合言葉で入るのは、いつでも無料）
・ホーム画面のウィジェット
・記録をCSVで書き出せます

■ 無料・広告・プラスについて
目標の数・記録・グラフ・2つめまでの共有・合言葉で入るのは無料です。2026年12月14日以降に入れた方は、画面の下に小さな広告が出ます（全画面の広告や動画の広告は出しません）。2026年12月13日までに入れた方は、買わなくてもずっとプラスの中身を全部使えて、広告も出ません。

■ 一緒に貯めるビンの保存について
みんなで貯めるビンは、入った人どうしで見られるよう、KLADO の置き場（Google の Firebase）にも保存します。名前の無いアカウント（匿名）を使い、メールや電話番号は聞きません。設定から、いつでもアカウントと共有したデータを消せます。
```

## 審査メモ（App Review Information の Notes・英語）

```
Thank you for reviewing "貯金ビン" (Savings Jar).

What the app does
- A goal-based savings tracker. The user creates a "jar" per goal (e.g. "沖縄旅行" Okinawa trip, JPY 100,000) and records deposits ("入れる") and withdrawals ("使う"). The app does not hold or move money and does not connect to banks; it only keeps a record.

How to try it
- No login. A 5-page tutorial appears on first launch (tap "スキップ" to skip).
- Home: tap "目標を作る" to create a jar, then "入れる" to add an amount.
- Open a jar to see the pace ("1日 ¥375 で届きます"), a chart and the history.

Shared jars ("みんなで貯める")
- In a jar, tap "みんなで貯める" → enter a nickname → "合言葉を作る". The app creates a 7-character code (e.g. K7P-4QXM) and a QR code.
- Another person enters the code from Home → "合言葉で、ほかの人のビンに入る" on their own device. Both then see the same jar and who added each amount.
- Joining requires a second device (you cannot join your own jar). Creating a shared jar and showing the code works on one device.
- Shared jars are stored in Google Firebase (Firestore) under an anonymous Firebase Authentication account. Firestore security rules allow only members to read a jar. Non-shared jars stay on the device and in the user's iCloud key-value store.
- Account deletion: Settings (gear) → "共有のアカウントとデータを消す" deletes the anonymous account and the shared jars the user created.

Privacy
- Ads: Google AdMob banner at the bottom, shown only to users who first installed on or after 2026-12-14 (JST) and have not bought Plus. The UMP consent form and ATT prompt appear only for those users, so a reviewer installing now will see neither.

In-app purchase
- "貯金ビン プラス" (Plus), non-consumable, JPY 650, product ID com.yamaguchiyudai.chokin.plus. It removes ads, allows a third or later shared jar, the Home Screen widget and CSV export.
- Users who first installed by 2026-12-13 (JST) keep these free (AppTransaction.originalPurchaseDate), so a reviewer installing now sees everything unlocked. The purchase sheet: gear icon (設定) → "貯金ビン プラス" (Buy, "購入を復元" Restore, "コードを使う" Redeem).

Feedback link (from 2026-12-14)
- From 2026-12-14 00:00 JST, a green card "KLADO 公式LINE" appears at the top of Settings. It only opens our LINE official account (https://line.me/R/ti/p/@333bebtu) for feature requests.

Contact: KLADO (Yudai Yamaguchi) / info@klado.jp
```

## 年齢区分の答え

すべて「なし」。共有ビンの呼び名・メモは、合言葉で入った人どうしだけに見える（誰でも見られる場所・チャットは無い）。広告あり。見込み 4+。

## App Privacy（プライバシーの栄養ラベル）

作業ログ（広告）の6種類に、Firebase に置く3種類を足す。

| データの種類 | 目的 | ユーザーに紐づく | トラッキング |
| --- | --- | --- | --- |
| ID：ユーザーID（Firebase の匿名ID） | アプリの機能 | はい | いいえ |
| 財務情報：その他の財務情報（共有ビンの金額・目標） | アプリの機能 | はい | いいえ |
| ユーザーコンテンツ：その他（呼び名・メモ・ビンの名前） | アプリの機能 | はい | いいえ |
| ID：デバイスID（広告ID・許可した人のみ） | 第三者の広告、分析 | いいえ | はい |
| 使用状況：広告データ | 第三者の広告、分析 | いいえ | はい |
| 使用状況：その他の製品の操作 | 第三者の広告、分析 | いいえ | いいえ |
| 位置：おおよその位置（IPアドレスから） | 第三者の広告 | いいえ | いいえ |
| 診断：クラッシュデータ・パフォーマンスデータ | 分析 | いいえ | いいえ |

出典：<https://developers.google.com/admob/ios/privacy/data-disclosure>。購入は Apple が処理するので「購入履歴」は集めない。

## スクリーンショット（6.3インチ・1206×2622・上の時刻と電波は消した）

docs/appstore/screenshots/ の5枚（見本は `-demo` で起動。沖縄旅行を父・母・兄で貯めるビンにしてある）。

1. 01-home.png ホーム（4つの目標のビン）
2. 02-shared.png 沖縄旅行（一緒に貯めている人：兄・母・父）
3. 03-history.png たまってきた様子のグラフと「母が入れた」の記録
4. 04-code.png 合言葉と QR コード
5. 05-input.png 入れる（¥500〜¥5,000 のボタン）

## アプリ内課金

| 項目 | 内容 |
| --- | --- |
| 種類 | 非消耗型 |
| 参照名 | 貯金ビン プラス |
| 製品ID | com.yamaguchiyudai.chokin.plus |
| 価格 | ¥650 |
| 表示名 | 貯金ビン プラス |
| 説明（45字まで） | 広告が消え、共有ビン3つめ以降・ウィジェット・CSVが使えます |
