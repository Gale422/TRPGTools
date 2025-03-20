javascript: (() => {
  /* サイト検証 */
  const validateSite = () => {
    const url = new URL(window.location.href);
    if (url.hostname !== 'lhrpg.com' || !url.pathname.startsWith('/lhz/')) {
      alert('このブックマークレットはLogHorizon TRPGのエネミーシートページでのみ使用できます。');
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
    const characterId = new URL(window.location.href).searchParams.get('id');
    if (!characterId) {
      alert('エネミーIDが見つかりません。');
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

  /* エネミーの詳細データを作成する */
  const createEnemyDetailElements = async (enemyData) => {
    const detailList = [];

    /* リソース情報 */
    const resourcesElement = xml.createDataElement({ name: 'リソース' });
    resourcesElement.appendChild(xml.createDataElement({
      name: 'HP',
      type: 'numberResource',
      currentValue: enemyData.hit_point
    }, enemyData.hit_point));
    resourcesElement.appendChild(xml.createDataElement({
      name: '障壁',
      type: 'numberResource',
      currentValue: 0
    }, 999));
    resourcesElement.appendChild(xml.createDataElement({ name: '軽減' }, 0));
    resourcesElement.appendChild(xml.createDataElement({ name: '再生' }, 0));
    resourcesElement.appendChild(xml.createDataElement({ name: '因果力' }, enemyData.fate || ''));
    resourcesElement.appendChild(xml.createDataElement({ name: 'BS', type: 'note' }, ''));
    resourcesElement.appendChild(xml.createDataElement({ name: 'LS', type: 'note' }, ''));
    resourcesElement.appendChild(xml.createDataElement({ name: 'OS', type: 'note' }, ''));
    detailList.push(resourcesElement);

    /* 戦闘の諸数値 */
    const combatElement = xml.createDataElement({ name: '戦闘の諸数値' });
    combatElement.appendChild(xml.createDataElement({
      name: 'タグ'
    }, enemyData.tags?.map(tag => `［${tag}］`)?.join('') || ''));
    combatElement.appendChild(xml.createDataElement({ name: 'ランク' }, enemyData.character_rank || ''));
    combatElement.appendChild(xml.createDataElement({ name: '識別難易度' }, enemyData.identification || ''));
    combatElement.appendChild(xml.createDataElement({ name: 'STR' }, enemyData.strength));
    combatElement.appendChild(xml.createDataElement({ name: 'DEX' }, enemyData.dexterity));
    combatElement.appendChild(xml.createDataElement({ name: 'POW' }, enemyData.power));
    combatElement.appendChild(xml.createDataElement({ name: 'INT' }, enemyData.intelligence));

    if (enemyData.rank === 'モブ') {
      combatElement.appendChild(xml.createDataElement({ name: '回避' }, `${enemyData.avoid}［固定］`));
      combatElement.appendChild(xml.createDataElement({ name: '抵抗' }, `${enemyData.resist}［固定］`));
    } else {
      combatElement.appendChild(xml.createDataElement({ name: '回避' }, `${enemyData.avoid_dice}D+${enemyData.avoid}`));
      combatElement.appendChild(xml.createDataElement({ name: '抵抗' }, `${enemyData.resist_dice}D+${enemyData.resist}`));
    }

    combatElement.appendChild(xml.createDataElement({ name: '物理防御力' }, enemyData.physical_defense || ''));
    combatElement.appendChild(xml.createDataElement({ name: '魔法防御力' }, enemyData.magic_defense || ''));
    combatElement.appendChild(xml.createDataElement({ name: 'ヘイト倍率' }, enemyData.hate || ''));
    combatElement.appendChild(xml.createDataElement({ name: '行動力' }, enemyData.action || ''));
    combatElement.appendChild(xml.createDataElement({ name: '移動力' }, enemyData.move || ''));
    detailList.push(combatElement);

    /* 特技情報 */
    const skillsElement = xml.createDataElement({ name: '特技の情報' });

    /* シナリオ制限特技 */
    const scenarioSkills = enemyData.skills?.filter(s => s?.limit?.includes('シナリオ')) || [];
    if (scenarioSkills.length > 0) {
      const textList = scenarioSkills.map(skill => {
        const limitCount = skill.limit.replace(/.*?シナリオ(.+?)回.*?/, '$1');
        return `|${skill.name}|${'[]'.repeat(limitCount)}|`;
      });

      skillsElement.appendChild(xml.createDataElement(
        { name: 'シナリオ制限特技', type: 'markdown' },
        `|特技名|使用回数|\n${textList.join('\n')}`
      ));
    }

    /* シーン制限特技 */
    const sceneSkills = enemyData.skills?.filter(s => s?.limit?.includes('シーン')) || [];
    if (sceneSkills.length > 0) {
      const textList = sceneSkills.map(skill => {
        const limitCount = skill.limit.replace(/.*?シーン(.+?)回.*?/, '$1');
        return `|${skill.name}|${'[]'.repeat(limitCount)}|`;
      });

      skillsElement.appendChild(xml.createDataElement(
        { name: 'シーン制限特技', type: 'markdown' },
        `|特技名|使用回数|\n${textList.join('\n')}`
      ));
    }

    detailList.push(skillsElement);

    /* その他情報 */
    const otherElement = xml.createDataElement({ name: 'その他' });

    /* 識別情報 */
    let identText = '';
    identText += `タグ: {タグ}\n`;
    identText += `ランク: {ランク} 識別難易度: {識別難易度}\n`;
    identText += `▼能力値\n`;
    identText += `STR: {STR} DEX: {DEX} POW: {POW} INT: {INT} 回避: {回避} 抵抗: {抵抗}\n`;
    identText += `物理防御力: {物理防御力} 魔法防御力: {魔法防御力} 最大HP: {HP^} ヘイト倍率: x{ヘイト倍率} 行動力: {行動力} 移動力: {移動力}\n\n`;
    otherElement.appendChild(xml.createDataElement({ name: '識別', type: 'note' }, identText));

    /* 特技一覧 */
    let skillListText = '▼特技\n';
    skillListText += enemyData.skills?.map(s => {
      let sDataList = [];
      sDataList.push(`《${s.name}》`);
      sDataList.push(`${s.tags?.map(t => `［${t}］`).join('') || ''}`);
      sDataList.push(`${s.timing || ''}`);
      sDataList.push(`${s.role || ''}`);
      sDataList.push(`${s.target || ''}`);
      sDataList.push(`${s.range || ''}`);
      sDataList.push(`${s.limit || ''}`);
      sDataList.push(`${s.function || ''}`);
      return sDataList.filter(s => s !== '').join('＿');
    }).join(`\n`);
    skillListText += '\n\n';
    otherElement.appendChild(xml.createDataElement({ name: '特技一覧', type: 'note' }, skillListText));

    /* ドロップ品 */
    let dropText = '▼ドロップ品\n';
    dropText += enemyData.items?.map(i => `${i.dice} : ${i.item}`).join(`\n`);
    dropText += '\n\n';
    otherElement.appendChild(xml.createDataElement({ name: 'ドロップ品', type: 'note' }, dropText));

    /* 解説 */
    otherElement.appendChild(xml.createDataElement(
      { name: '解説', type: 'note' },
      `▼解説\n${enemyData.contents}` || ''
    ));

    detailList.push(otherElement);

    return [enemyData.name, detailList, enemyData];
  };

  /* エネミー用チャットパレットのテキストを生成する */
  const generateEnemyChatPaletteText = (enemyData) => {
    let txt = '';

    /* 受動判定 */
    txt += `//--- 受動判定\n`;
    if (enemyData.rank === 'モブ') {
      txt += `${enemyData.avoid} [回避(固定)]\n`;
      txt += `${enemyData.resist} [抵抗(固定)]\n`;
    } else {
      txt += `${enemyData.avoid_dice}LH+${enemyData.avoid}>=0 [回避]\n`;
      txt += `${enemyData.resist_dice}LH+${enemyData.resist}>=0 [抵抗]\n`;
    }
    txt += `:HP-+{物理防御力}LZ 被物理ダメージ\n`;
    txt += `:HP-+{魔法防御力}LZ 被魔法ダメージ\n`;
    txt += `:HP-LZ 貫通・直接点ダメージ\n`;
    txt += `\n`;

    /* 能動判定 */
    txt += `//--- 能動判定\n`;
    txt += `1D 対象選択\n`;
    txt += `choice[] 対象選択\n`;
    txt += `C(*{ヘイト倍率}) ヘイトダメージ\n`;
    txt += `\n`;

    /* メジャーアクション特技 */
    const majorSkills = enemyData.skills?.filter(s => {
      return s.timing === 'メジャー' && s.role?.includes('対決');
    }) || [];

    if (majorSkills.length > 0) {
      txt += majorSkills.map(s => {
        let sTxt = '';
        sTxt += `${s.role?.replace(/.*?(\d+?)＋(\d+?)D.*/, '$2LH+$1>=0') || ''} 《${s.name}》\n`;
        sTxt += `${s.function?.replace(/.*?［(\d+?)＋(\d+?)D］の(.+?)ダメージ.*/, `$2D+$1 《${s.name}》($3ダメージ)`)}\n`;
        return sTxt;
      }).join(`\n`);
    }

    txt += `\n`;

    /* エネミー特技一覧 */
    txt += `//--- エネミー特技一覧\n`;
    txt += enemyData.skills?.map(s => {
      let sDataList = [];
      sDataList.push(`《${s.name}》`);
      sDataList.push(`${s.tags?.map(t => `［${t}］`).join('') || ''}`);
      sDataList.push(`${s.timing || ''}`);
      sDataList.push(`${s.role || ''}`);
      sDataList.push(`${s.target || ''}`);
      sDataList.push(`${s.range || ''}`);
      sDataList.push(`${s.limit || ''}`);
      sDataList.push(`${s.function || ''}`);
      return sDataList.filter(s => s !== '').join('＿');
    }).join(`\n`);
    txt += `\n`;
    txt += `\n`;

    /* 公開用エネミーデータ */
    txt += `//--- 公開用エネミーデータ\n`;
    txt += `{識別}{特技一覧}{ドロップ品}{解説}\n`;
    txt += `\n`;

    /* その他 */
    txt += `//--- その他\n`;
    txt += `&バフ名/効果/R数 バフ追加\n`;
    txt += `&バフ名- バフ消去\n`;
    txt += `&R- バフラウンド-1\n`;
    txt += `&R+ バフラウンド+1\n`;
    txt += `&D 0R以下のバフ消去\n`;
    txt += `&R- &D バフのラウンド進行\n`;
    txt += `\n`;
    txt += `t&バフ名/効果/R数 対象にバフ追加\n`;
    txt += `t&バフ名- 対象のバフ消去\n`;
    txt += `t&R- 対象のバフラウンド-1\n`;
    txt += `t&R+ 対象のバフラウンド+1\n`;
    txt += `t&D 対象の0R以下のバフ消去\n`;
    txt += `t&R- t&D 対象のバフのラウンド進行\n`;
    txt += `\n`;

    return txt;
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

      const characterId = new URL(window.location.href).searchParams.get('id');

      /* エネミーデータを取得 */
      const response = await fetch(`https://lhrpg.com/lhz/ij/${characterId}.json`);
      if (!response.ok) {
        throw new Error(`エネミーデータの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();

      /* エネミーデータかどうかチェック */
      if (data.index_type !== 'エネミー') {
        throw new Error('このデータはエネミーデータではありません。');
      }

      /* エネミーデータの生成 */
      const [enemyName, detailElements, enemyData] = await createEnemyDetailElements(data);

      /* XML要素等の生成 */
      const characterElement = xml.createCharacterData(`${enemyName}《${data.ruby}》`, detailElements);
      const chatPaletteElement = xml.createChatPalette('LogHorizon', generateEnemyChatPaletteText(data));
      const buffPaletteElement = xml.createBuffPalette('LogHorizon', '');

      /* ZIPファイル作成 */
      createZipFile(enemyName, characterElement, chatPaletteElement, buffPaletteElement);

    } catch (error) {
      console.error('エラーが発生しました:', error);
      alert(`処理中にエラーが発生しました: ${error.message}`);
    }
  };

  /* メイン処理実行 */
  main();
})();
