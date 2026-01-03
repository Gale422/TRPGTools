## XMLテンプレートとサンプル

### 基本テンプレート

```xml
<?xml version="1.0" encoding="UTF-8"?>
<character location.name="table" location.x="0" location.y="0" posZ="0" isLock="false" rotate="0" roll="0" hideInventory="true" nonTalkFlag="false" overViewWidth="270" overViewMaxHeight="250" specifyKomaImageFlag="false" komaImageHeignt="100" chatColorCode.0="#000000" chatColorCode.1="#FF0000" chatColorCode.2="#0099FF" syncDummyCounter="0">
  <data name="character">
    <data name="image">
      <data type="image" name="imageIdentifier">none_icon</data>
    </data>
    <data name="common">
      <data name="name">素体</data>
      <data name="size">2</data>
    </data>
    <data name="detail">
      <data name="リソース">
        <data type="numberResource" name="EHP" currentValue="0">0</data>
        <data type="numberResource" name="EMP" currentValue="0">0</data>
        <data name="行動値">0</data>
        <data name="移動力">0</data>
        <data name="物防">0</data>
        <data name="魔防">0</data>
        <data name="状態異常" type="note"></data>
      </data>
      <data name="詳細情報">
        <data name="ページ"></data>
        <data name="分類"></data>
        <data name="属性"></data>
        <data name="レベル"></data>
        <data name="識別値"></data>
      </data>
      <data name="ドロップ品">
        <data name=""></data>
        <data name=""></data>
        <data name=""></data>
        <data name=""></data>
      </data>
      <data name="能力値">
        <data name="筋力基本値">0</data>
        <data name="筋力">0</data>
        <data name="器用基本値">0</data>
        <data name="器用">0</data>
        <data name="敏捷基本値">0</data>
        <data name="敏捷">0</data>
        <data name="知力基本値">0</data>
        <data name="知力">0</data>
        <data name="感知基本値">0</data>
        <data name="感知">0</data>
        <data name="精神基本値">0</data>
        <data name="精神">0</data>
        <data name="幸運基本値">0</data>
        <data name="幸運">0</data>
        <data name="アクション">0</data>
        <data name="リアクション">0</data>
      </data>
      <data name="立ち絵位置">
        <data type="numberResource" currentValue="0" name="POS">0</data>
      </data>
      <data name="コマ画像">
        <data type="numberResource" currentValue="0" name="ICON">0</data>
      </data>
    </data>
    <data name="buff">
      <data name="バフ/デバフ"></data>
    </data>
  </data>
  <chat-palette dicebot="Arianrhod">//--- 受動判定
2D6+{敏捷}&gt;=? 回避
2D6+{リアクション}&gt;=? 回避
S:EHP-(-{物防})LZ 物理ダメージ適用
S:EHP-(-{魔防})LZ 魔法ダメージ適用
S:EHP-LZ 貫通ダメージ適用
S:EHP-(-({魔防}*2))LZ 魔法ダメージ適用(属性一致)
S:EHP-({毒}*5)LZ
S:EHP-({衰弱}*5)LZ

//--- 能動判定
1D 対象決定
D6+&gt;=? 命中判定
D6+ ダメージ
2D6+
3D6+

//--- バフ関連
&amp;バフ名/効果/R数 バフ追加
&amp;バフ名- バフ消去
&amp;R- バフラウンド-1
&amp;R+ バフラウンド+1
&amp;D 0R以下のバフ消去
&amp;R- &amp;D バフのラウンド進行

t&amp;バフ名/効果/R数 対象にバフ追加
t&amp;バフ名- 対象のバフ消去
t&amp;R- 対象のバフラウンド-1
t&amp;R+ 対象のバフラウンド+1
t&amp;D 対象の0R以下のバフ消去
t&amp;R- t&amp;D 対象のバフのラウンド進行

//--- ==========識別公開情報==========
名称: {name} 分類: {分類} レベル: {レベル} 属性: {属性} 防御力:
// 物理防御力の方が高い
// 魔法防御力の方が高い
// 物理防御力と魔法防御力が同じ
//--- ==========エネミースキル==========
//--- 【パッシブ】

//--- 【セットアップ】

//--- 【イニシアチブ】

//--- 【フリー】

//--- 【ムーブ】

//--- 【レガシー】

//--- 【マイナー】

//--- 【メジャー】

//--- 【判定の直前】

//--- 【判定の直後】

//--- 【DRの直前】

//--- 【DRの直後】

//--- 【リアクション】

//--- 【クリンナップ】

//--- 【戦闘不能】

//--- 【効果参照】

//--- ==========ドロップ品==========
{}
</chat-palette>
  <buff-palette dicebot="Arianrhod">毒 0 9999
衰弱 0 9999
威圧 1 9999
逆上 1 1
スタン 1 0
スリップ 1 9999
ノックバック 0 1
放心 1 1
狂戦士化 0 9999
恐怖 1 0
縛鎖 1 2</buff-palette>
</character>
```

### モブエネミーの例: フェアリーA

```xml
<?xml version="1.0" encoding="UTF-8"?>
<character location.name="table" location.x="0" location.y="0" posZ="0" isLock="false" rotate="0" roll="0" hideInventory="true" nonTalkFlag="false" overViewWidth="270" overViewMaxHeight="250" specifyKomaImageFlag="false" komaImageHeignt="100" chatColorCode.0="#000000" chatColorCode.1="#FF0000" chatColorCode.2="#0099FF" syncDummyCounter="0">
  <data name="character">
    <data name="image">
      <data type="image" name="imageIdentifier">none_icon</data>
    </data>
    <data name="common">
      <data name="name">フェアリーA</data>
      <data name="size">2</data>
    </data>
    <data name="detail">
      <data name="リソース">
        <data type="numberResource" name="EHP" currentValue="28">28</data>
        <data type="numberResource" name="EMP" currentValue="0">0</data>
        <data name="行動値">9</data>
        <data name="移動力">15</data>
        <data name="物防">3</data>
        <data name="魔防">8</data>
        <data name="状態異常" type="note"></data>
      </data>
      <data name="詳細情報">
        <data name="ページ">63</data>
        <data name="分類">妖精</data>
        <data name="属性">風</data>
        <data name="レベル">1(モブ)</data>
        <data name="識別値">9</data>
      </data>
      <data name="ドロップ品">
        <data name="6-8">妖精の羽(10G)</data>
        <data name="9-12">妖精の服(30G)</data>
        <data name="13-">風妖精の結晶(200G)</data>
      </data>
      <data name="能力値">
        <data name="アクション">4</data>
        <data name="リアクション">4</data>
      </data>
      <data name="立ち絵位置">
        <data type="numberResource" currentValue="0" name="POS">0</data>
      </data>
      <data name="コマ画像">
        <data type="numberResource" currentValue="0" name="ICON">0</data>
      </data>
    </data>
    <data name="buff">
      <data name="バフ/デバフ"></data>
    </data>
  </data>
  <chat-palette dicebot="Arianrhod">//--- 受動判定
2D6+{リアクション}&gt;=0 回避
S:EHP-(-{物防})LZ 物理ダメージ適用
S:EHP-(-{魔防})LZ 魔法ダメージ適用
S:EHP-LZ 貫通ダメージ適用
S:EHP-(-({魔防}*2))LZ 魔法ダメージ適用(属性一致)
S:EHP-({毒}*5)LZ
S:EHP-({衰弱}*5)LZ

//--- 能動判定
1D 対象決定
2D6+6&gt;=? 命中《魔術攻撃:風》
2D6+10 ダメージ《魔術攻撃:風》
2D6+
3D6+

//--- バフ関連
&amp;バフ名/効果/R数 バフ追加
&amp;バフ名- バフ消去
&amp;R- バフラウンド-1
&amp;R+ バフラウンド+1
&amp;D 0R以下のバフ消去
&amp;R- &amp;D バフのラウンド進行

t&amp;バフ名/効果/R数 対象にバフ追加
t&amp;バフ名- 対象のバフ消去
t&amp;R- 対象のバフラウンド-1
t&amp;R+ 対象のバフラウンド+1
t&amp;D 対象の0R以下のバフ消去
t&amp;R- t&amp;D 対象のバフのラウンド進行

//--- ==========識別公開情報==========
名称: {name} 分類: {分類} レベル: {レベル} 属性: {属性} 防御力: 魔法防御力の方が高い
//--- ==========エネミースキル==========
//--- 【パッシブ】
《飛行能力》[タイミング:パッシブ][判定:-][対象:自身][射程:-][コスト:-][SL:1][使用条件:-][効果]:飛行状態となる。シーンに登場する際、このスキルの効果を適用するか、適用しないかを選択すること。このスキルの効果の適用と解除はマイナーアクションで行なう。

//--- 【セットアップ】

//--- 【イニシアチブ】

//--- 【フリー】

//--- 【ムーブ】

//--- 【レガシー】

//--- 【マイナー】

//--- 【メジャー】
《魔術攻撃:風》[分類:魔術(魔法&lt;風&gt;)][タイミング:メジャー][判定:][対象:単体][射程:20m][SL:1][効果]:対象に魔法攻撃を行なう。この攻撃のダメージは風属性魔法ダメージとなる。【クリティカル:ダイスロール増加】

//--- 【判定の直前】
《風のいたずら》[タイミング:判定の直前][判定:自動成功][対象:単体][射程:20m][コスト:-][SL:1][使用条件:ラウンド1回][効果]:対象が行なうリアクションの判定の達成値に-1する。

//--- 【判定の直後】

//--- 【DRの直前】

//--- 【DRの直後】

//--- 【リアクション】

//--- 【クリンナップ】

//--- 【戦闘不能】

//--- 【効果参照】

//--- ==========ドロップ品==========
{6-8}
{9-12}
{13-}
</chat-palette>
  <buff-palette dicebot="Arianrhod">毒 0 9999
衰弱 0 9999
威圧 1 9999
逆上 1 1
スタン 1 0
スリップ 1 9999
ノックバック 0 1
放心 1 1
狂戦士化 0 9999
恐怖 1 0
縛鎖 1 2</buff-palette>
</character>
```

### 一般ボスエネミーの例: ドライアド

```xml
<?xml version="1.0" encoding="UTF-8"?>
<character location.name="table" location.x="0" location.y="0" posZ="0" isLock="false" rotate="0" roll="0" hideInventory="true" nonTalkFlag="false" overViewWidth="270" overViewMaxHeight="250" specifyKomaImageFlag="false" komaImageHeignt="100" chatColorCode.0="#000000" chatColorCode.1="#FF0000" chatColorCode.2="#0099FF" syncDummyCounter="0">
  <data name="character">
    <data name="image">
      <data type="image" name="imageIdentifier">none_icon</data>
    </data>
    <data name="common">
      <data name="name">ドライアド</data>
      <data name="size">2</data>
    </data>
    <data name="detail">
      <data name="リソース">
        <data type="numberResource" name="EHP" currentValue="109">109</data>
        <data type="numberResource" name="EMP" currentValue="120">120</data>
        <data name="行動値">10</data>
        <data name="移動力">11</data>
        <data name="物防">16</data>
        <data name="魔防">8</data>
        <data name="状態異常" type="note"></data>
      </data>
      <data name="詳細情報">
        <data name="ページ">66</data>
        <data name="分類">妖精</data>
        <data name="属性">地</data>
        <data name="レベル">10</data>
        <data name="識別値">13</data>
      </data>
      <data name="ドロップ品">
        <data name="5-8">妖精の上等な服(300G)</data>
        <data name="9-12">高級トパーズ(1,000G)</data>
        <data name="13-">ドライアドの芽(1,300G)</data>
      </data>
      <data name="能力値">
        <data name="筋力基本値">18</data>
        <data name="筋力">6</data>
        <data name="器用基本値">22</data>
        <data name="器用">7</data>
        <data name="敏捷基本値">17</data>
        <data name="敏捷">5</data>
        <data name="知力基本値">27</data>
        <data name="知力">9</data>
        <data name="感知基本値">17</data>
        <data name="感知">5</data>
        <data name="精神基本値">26</data>
        <data name="精神">8</data>
        <data name="幸運基本値">22</data>
        <data name="幸運">7</data>
      </data>
      <data name="立ち絵位置">
        <data type="numberResource" currentValue="0" name="POS">0</data>
      </data>
      <data name="コマ画像">
        <data type="numberResource" currentValue="0" name="ICON">0</data>
      </data>
    </data>
    <data name="buff">
      <data name="バフ/デバフ"></data>
    </data>
  </data>
  <chat-palette dicebot="Arianrhod">//--- 受動判定
2D6+{敏捷}&gt;=? 回避
S:EHP-(-{物防})LZ 物理ダメージ適用
S:EHP-(-{魔防})LZ 魔法ダメージ適用
S:EHP-LZ 貫通ダメージ適用
S:EHP-(-({魔防}*2))LZ 魔法ダメージ適用(属性一致)
S:EHP-({毒}*5)LZ
S:EHP-({衰弱}*5)LZ

//--- 能動判定
1D 対象決定
D6+&gt;=? 命中判定
D6+ ダメージ
2D6+
3D6+

//--- バフ関連
t&amp;R- t&amp;D 対象のバフのラウンド進行
&amp;R- &amp;D バフのラウンド進行
&amp;バフ名/効果/R数 バフ追加
&amp;バフ名- バフ消去
&amp;R- バフラウンド-1
&amp;R+ バフラウンド+1
&amp;D 0R以下のバフ消去

//--- ==========識別公開情報==========
名称: {name} 分類: {分類} レベル: {レベル} 属性: {属性} 防御力: 物理防御力の方が高い
//--- ==========エネミースキル==========
//--- 【パッシブ】
《抵抗性:スリップ》[タイミング:パッシブ][SL:1][効果]:スリップを受けない。《抵抗性:～～》は最大で3つまで取得可能。
《得意分野:精神》[タイミング:パッシブ][SL:1][効果]:精神による判定に+[(SL)D]する。
《得意分野:魔法》[タイミング:パッシブ][SL:1][効果]:魔法による判定に+[(SL)D]する。

//--- 【セットアップ】

//--- 【イニシアチブ】

//--- 【フリー】

//--- 【ムーブ】

//--- 【レガシー】

//--- 【マイナー】

//--- 【メジャー】
《新緑の葉》[タイミング:メジャー][対象:範囲(選択)][射程:20m][SL:1][効果]:HP回復を行なう。対象の【HP】を[2D6+20]点回復する。
《再生の芽》[タイミング:メジャー][対象:単体][射程:至近][SL:1][効果]:対象の戦闘不能を回復し、さらに【HP】を1点まで回復する。対象が未行動だった場合、行動済となる。メインプロセス終了時にあなたは死亡する。
《魔術攻撃:地》[分類:魔術(魔法&lt;地&gt;)][タイミング:メジャー][判定:3D6+11][対象:単体][射程:20m][SL:1][効果]:対象に魔法攻撃を行なう。この攻撃のダメージは[5D6+20]の地属性魔法ダメージとなる。【クリティカル:ダイスロール増加】

//--- 【判定の直前】

//--- 【判定の直後】

//--- 【DRの直前】

//--- 【DRの直後】

//--- 【リアクション】

//--- 【クリンナップ】

//--- 【戦闘不能】

//--- 【効果参照】

//--- ==========ドロップ品==========
{5-8}
{9-12}
{13-}
</chat-palette>
  <buff-palette dicebot="Arianrhod">毒 0 9999
衰弱 0 9999
威圧 1 9999
逆上 1 1
スタン 1 0
スリップ 1 9999
ノックバック 0 1
放心 1 1
狂戦士化 0 9999
恐怖 1 0
縛鎖 1 2</buff-palette>
</character>
```

### スキル・パワーのXML例

```xml
<data name="スキル・パワー">
  <data name="調子に乗る" type="note">《調子に乗る》
[タイミング:パッシブ][判定:-]
[対象:自身][射程:-]
[コスト:-][SL:1][使用条件:-]
[効果]:白兵攻撃のダメージに+[同じエンゲージに存在する山賊の数]する。</data>
  <data name="ショートソード" type="note">《ショートソード》(長剣/片/白兵/物理)
[タイミング:メジャー][判定:武器攻撃]
[対象:単体][射程:至近]
[コスト:-][SL:-][使用条件:-]
[効果]:対象に武器攻撃を行う。
【クリティカル:ダイスロール増加】</data>
  <data name="魔術攻撃:火" type="note">《魔術攻撃:火》[分類:魔術(魔法&lt;火&gt;)]
[タイミング:メジャー][判定:魔術判定]
[対象:単体][射程:20m]
[コスト:-][SL:1][使用条件:-]
[効果]:対象に魔法攻撃を行なう。この攻撃のダメージは、[2D+10]の火属性魔法ダメージとなる。
【クリティカル:ダイスロール増加】</data>
  <data name="連続攻撃" type="note">《連続攻撃》
[タイミング:メジャー][判定:自動成功]
[対象:自身][射程:-]
[コスト:-][SL:1][使用条件:-]
[効果]:武器攻撃を2回行なう。この攻撃では「タイミング:メジャーアクション」のスキル、パワー、アイテムの効果は使用できない。同じ対象に2回攻撃しても、別々の対象に1回ずつ攻撃してもよい。</data>
  <data name="フライト" type="note">《フライト》[分類:魔術(魔法&lt;風&gt;)]
[タイミング:メジャー][判定:魔術判定]
[対象:単体][射程:至近]
[コスト:4][SL:3][使用条件:-]
[効果]:対象を飛行状態にし、【移動力】に+[SLx5]mする。この効果は対象がマイナーアクションで解除を宣言するか、シーン終了まで持続する。
【クリティカル：コスト0】</data>
</data>
```

---
