javascript: (() => {
  /* サイト検証 */
  const validateSite = () => {
    const url = new URL(window.location.href);
    if (url.hostname !== 'charasheet.vampire-blood.net') {
      alert('このブックマークレットは神我狩キャラクターシートページでのみ使用できます。');
      return false;
    }
    return true;
  };

  /* ブラウザ互換性チェック */
  const validateBrowser = () => {
    if (!window.URL || !window.XMLSerializer || !document.createElement) {
      alert('このブラウザはサポートされていません。');
      return false;
    }
    return true;
  };

  /* キャラクターシート検証 */
  const validateCharacterSheet = () => {
    if (!document.querySelector('#pc_name')) {
      alert('キャラクターシートが正しく読み込まれていません。');
      return false;
    }
    return true;
  };

  /* ライブラリを非同期に読み込む */
  const loadLibraries = (urls) => {
    return Promise.all(urls.map(url => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.onload = resolve;
        script.onerror = () => reject(new Error(`ライブラリの読み込みに失敗しました: ${url}`));
        script.src = url;
        document.body.appendChild(script);
      });
    }));
  };

  /* XMLデータの作成関連ユーティリティ */
  const xml = {
    createElement: (tagName, attrs = {}, value = '') => {
      const elem = document.createElement(tagName);
      Object.entries(attrs).forEach(([key, val]) => {
        elem.setAttribute(key, val);
      });
      if (value) elem.textContent = value;
      return elem;
    },

    createDataElement: (attrs, value = '') => {
      return xml.createElement('data', attrs, value);
    },

    createCharacterData: (charaName, detailList = []) => {
      const charData = xml.createDataElement({ name: 'character' });

      /* 画像データの追加 */
      const imgData = xml.createDataElement({ name: 'image' });
      imgData.appendChild(xml.createDataElement({ name: 'imageIdentifier', type: 'image' }, 'null'));
      charData.appendChild(imgData);

      /* 基本情報の追加 */
      const commonData = xml.createDataElement({ name: 'common' });
      commonData.appendChild(xml.createDataElement({ name: 'name' }, charaName));
      commonData.appendChild(xml.createDataElement({ name: 'size' }, '2'));
      charData.appendChild(commonData);

      /* 詳細情報の追加 */
      const detailData = xml.createDataElement({ name: 'detail' });
      detailList.forEach(data => detailData.appendChild(data));
      charData.appendChild(detailData);

      return charData;
    },

    createChatPalette: (diceBotName, chatPalette) => {
      return xml.createElement('chat-palette', { dicebot: diceBotName }, chatPalette);
    },

    createBuffPalette: (diceBotName, buffPalette) => {
      return xml.createElement('buff-palette', { dicebot: diceBotName }, buffPalette);
    }
  };

  /* ZIPファイル作成とダウンロード */
  const createZipFile = (fileName, charaData, chatPaletteData, buffPaletteData) => {
    const character = xml.createElement('character', {
      'location.x': '0',
      'location.y': '0',
      'posz': '0'
    });

    character.appendChild(charaData);
    character.appendChild(chatPaletteData);
    character.appendChild(buffPaletteData);

    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(character);

    /* XMLデータの整形 */
    xmlString = xmlString.replace(/xmlns=.http:\/\/www\.w3\.org\/1999\/xhtml../, '');
    xmlString = xmlString.replace(/<br \/>/g, '\n');
    xmlString = xmlString.replace(/currentvalue/g, 'currentValue');

    /* ZIPファイル作成 */
    const zip = new JSZip();
    zip.file(`${fileName}.xml`, xmlString);
    zip.generateAsync({ type: 'blob' }).then(blob => saveAs(blob, `${fileName}.zip`));
  };

  /* DOM要素を安全に取得する関数 */
  const getElementValue = (selector, defaultValue = '0') => {
    const element = document.querySelector(selector);
    return element?.value || defaultValue;
  };

  /* セレクトボックスの選択テキストを取得する関数 */
  const getSelectedText = (selectDom) => {
    if (!selectDom || selectDom.tagName !== 'SELECT') {
      return '';
    }
    return selectDom.options[selectDom.selectedIndex].textContent;
  };

  /* 数値の最大値を取得する関数 */
  const getMaxValue = (...values) => {
    return Math.max(...values.map(v => Number(v) || 0));
  };

  /* チャットパレットテキストの生成 */
  const generateChatPaletteText = () => {
    let txt = '';
    txt += `//---判定値\n`;
    txt += `2D6+{体力}>=? 【体力】\n`;
    txt += `2D6+{敏捷}>=? 【敏捷】\n`;
    txt += `2D6+{知性}>=? 【知性】\n`;
    txt += `2D6+{精神}>=? 【精神】\n`;
    txt += `2D6+{幸運}>=? 【幸運】\n`;
    txt += `ET 感情表\n`;
    txt += `\n`;
    txt += `//---霊力・霊紋\n`;
    txt += `4B6 霊力回復\n`;
    txt += `:霊紋-D6 物理超越のコスト(上限3D)\n`;
    txt += `:霊紋-2D6 生命燃焼のコスト :生命力={生命燃焼時の生命力}\n`;
    txt += `:霊紋-2D6 概念破壊(コスト)\n`;
    txt += `1D6 概念破壊(上昇ランク)\n`;
    txt += `\n`;
    txt += `//---戦闘時・判定\n`;
    txt += `2D6+{命中}>=? 【命中】\n`;
    txt += `2D6+{回避}>=? 【回避】(装備品適用後)\n`;
    txt += `2D6+{発動}>=? 【発動】\n`;
    txt += `2D6+{抵抗}>=? 【抵抗】\n`;
    txt += `2D6+{看破}>=? 【看破】\n`;
    txt += `\n`;
    txt += `//---戦闘時・ダメージ減少\n`;
    txt += `:生命力-(n-{装甲})LZ 【受動物理ダメージ適用後】\n`;
    txt += `:生命力-((n-{装甲})/2C)LZ 【受動物理ダメージ適用後】(半減1回・端数切り上げ)\n`;
    txt += `:生命力-(n-{結界})LZ 【受動魔法ダメージ適用後】\n`;
    txt += `:生命力-((n-{結界})/2C)LZ 【受動魔法ダメージ適用後】(半減1回・端数切り上げ)\n`;
    txt += `:生命力-((n-{結界})/2C/2C)LZ 【受動魔法ダメージ適用後】(半減2回・端数切り上げ)\n`;
    txt += `:生命力-((n-{結界})/2C/2C/2C)LZ 【受動魔法ダメージ適用後】(半減3回・端数切り上げ)\n`;
    txt += `\n`;
    txt += `//---戦闘時・攻撃\n`;
    txt += `2D6+{攻撃命中値}>=? 【攻撃命中値】(装備品適用後)\n`;
    txt += `C(*+{攻撃ダメージ値}+) 攻撃のダメージ\n`;
    txt += `\n`;
    txt += `//---バフ操作\n`;
    txt += `&バフ名/効果/R数 バフ追加\n`;
    txt += `&バフ名- バフ削除\n`;
    txt += `&R+ バフのラウンド+1\n`;
    txt += `&R- バフのラウンド-1\n`;
    txt += `&D 0R以下のバフを消去\n`;
    txt += `&R- &D バフのラウンド進行\n`;
    return txt;
  };

  /* キャラクターの詳細データ要素を生成 */
  const createCharacterDetailElements = () => {
    const detailList = [];

    /* リソース情報の追加 */
    const resourceData = xml.createDataElement({ name: 'リソース' });
    const hp = getElementValue('#NP9', '0');

    resourceData.appendChild(xml.createDataElement({ name: '生命力', type: 'numberResource', currentValue: hp }, hp));
    resourceData.appendChild(xml.createDataElement({ name: '霊紋', type: 'numberResource', currentValue: 22 }, 22));
    resourceData.appendChild(xml.createDataElement({ name: '感情', type: 'numberResource', currentValue: 3 }, 7));

    detailList.push(resourceData);

    /* 判定値情報の追加 */
    const abilityData = xml.createDataElement({ name: '判定値' });

    abilityData.appendChild(xml.createDataElement({ name: '体力' }, getElementValue('#NB1', '0')));
    abilityData.appendChild(xml.createDataElement({ name: '敏捷' }, getElementValue('#NB2', '0')));
    abilityData.appendChild(xml.createDataElement({ name: '知性' }, getElementValue('#NB3', '0')));
    abilityData.appendChild(xml.createDataElement({ name: '精神' }, getElementValue('#NB4', '0')));
    abilityData.appendChild(xml.createDataElement({ name: '幸運' }, getElementValue('#NB5', '0')));

    detailList.push(abilityData);

    /* 戦闘能力値情報の追加 */
    const combatData = xml.createDataElement({ name: '戦闘能力値' });

    /* 基本戦闘能力 */
    combatData.appendChild(xml.createDataElement({ name: '命中' }, getElementValue('#NP1', '0')));
    combatData.appendChild(xml.createDataElement({ name: '回避' }, getElementValue('#kaihi', '0')));
    combatData.appendChild(xml.createDataElement({ name: '発動' }, getElementValue('#NP3', '0')));
    combatData.appendChild(xml.createDataElement({ name: '抵抗' }, getElementValue('#NP4', '0')));
    combatData.appendChild(xml.createDataElement({ name: '看破' }, getElementValue('#NP5', '0')));
    combatData.appendChild(xml.createDataElement({ name: '物D' }, getElementValue('#NP6', '0')));
    combatData.appendChild(xml.createDataElement({ name: '魔D' }, getElementValue('#NP7', '0')));

    /* 戦闘関連値 */
    combatData.appendChild(xml.createDataElement({ name: '行動値' }, getElementValue('#act', '0')));
    combatData.appendChild(xml.createDataElement({ name: '攻撃命中値' }, getElementValue('input[name=arms_total_hit]', '0')));
    combatData.appendChild(xml.createDataElement({ name: '攻撃ダメージ値' }, getElementValue('input[name=arms_total_damage]', '0')));

    /* 主能力値（最大値を計算） */
    const mainAbilityValue = getMaxValue(
      getElementValue('#NK1', '0'),
      getElementValue('#NK2', '0'),
      getElementValue('#NK3', '0'),
      getElementValue('#NK4', '0'),
      getElementValue('#NK5', '0')
    );
    combatData.appendChild(xml.createDataElement({ name: '主能力値' }, mainAbilityValue));

    /* 防御関連値 */
    combatData.appendChild(xml.createDataElement({ name: '装甲' }, getElementValue('#def', '0')));
    combatData.appendChild(xml.createDataElement({ name: '結界' }, getElementValue('#mdef', '0')));

    /* 移動関連値 */
    combatData.appendChild(xml.createDataElement({ name: '移動力' }, getElementValue('#ido', '0')));
    combatData.appendChild(xml.createDataElement({ name: '全力移動' }, getElementValue('#zenryoku_ido', '0')));

    /* 生命燃焼時の生命力 */
    combatData.appendChild(xml.createDataElement({ name: '生命燃焼時の生命力' }, getElementValue('#NK1', '0')));

    detailList.push(combatData);

    /* パーソナルデータ情報の追加 */
    const personalData = xml.createDataElement({ name: 'パーソナルデータ' });

    /* 種族情報 */
    const shuzokuType = getSelectedText(document.querySelector('#SL_shuzoku_type')) || '';
    personalData.appendChild(xml.createDataElement(
      { name: '種族' },
      `${getElementValue('input[name=manual_shuzoku]', '')} ${shuzokuType}型`
    ));

    /* 称号情報 */
    const mainClassType = getSelectedText(document.querySelector('#SL_main_class_type')) || '';
    personalData.appendChild(xml.createDataElement(
      { name: 'メイン称号' },
      `${getElementValue('#main_class', '')} タイプ${mainClassType}`
    ));

    const subClassType = getSelectedText(document.querySelector('#SL_sub_class_type')) || '';
    personalData.appendChild(xml.createDataElement(
      { name: 'サブ称号' },
      `${getElementValue('#support_class', '')} タイプ${subClassType}`
    ));

    /* その他情報 */
    personalData.appendChild(xml.createDataElement({ name: '表の職業' }, getElementValue('input[name=omote_face]', '')));
    personalData.appendChild(xml.createDataElement({ name: '所属組織' }, getElementValue('#shuzoku', '')));
    personalData.appendChild(xml.createDataElement({ name: '所持金' }, getElementValue('#money', '')));

    detailList.push(personalData);

    return [getElementValue('#pc_name', 'NoName'), detailList];
  };

  /* メイン処理 */
  const main = async () => {
    try {
      /* サイトとブラウザの検証 */
      if (!validateSite() || !validateBrowser()) return;

      /* ライブラリ読み込み */
      await loadLibraries([
        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
      ]);

      /* キャラクターシート検証 */
      if (!validateCharacterSheet()) return;

      /* キャラクターデータの生成 */
      const [charaName, detailElements] = createCharacterDetailElements();

      /* XML要素等の生成 */
      const characterElement = xml.createCharacterData(charaName, detailElements);
      const chatPaletteElement = xml.createChatPalette('Kamigakari', generateChatPaletteText());
      const buffPaletteElement = xml.createBuffPalette('Kamigakari', '');

      /* ZIPファイル作成 */
      createZipFile(charaName, characterElement, chatPaletteElement, buffPaletteElement);

    } catch (error) {
      console.error('エラーが発生しました:', error);
      alert(`処理中にエラーが発生しました: ${error.message}`);
    }
  };

  /* メイン処理実行 */
  main();
})();
