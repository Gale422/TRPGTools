javascript: (() => {
  /* サイト検証 */
  const validateSite = () => {
    const url = new URL(window.location.href);
    if (url.hostname !== 'lhrpg.com' || !url.pathname.startsWith('/lhz/')) {
      alert('このブックマークレットはLog Horizon TRPGキャラクターシートページでのみ使用できます。');
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
      alert('キャラクターIDが見つかりません。');
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

  /* キャラクターデータを非同期に取得する */
  const fetchCharacterData = async (characterId) => {
    try {
      const response = await fetch(`https://lhrpg.com/lhz/api/${characterId}.json`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`キャラクターデータの取得に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`データ取得エラー: ${error.message}\r\n基本情報の「外部ツールからの〈冒険者〉データ参照を許可する」が選択されていることを確認してください。`);
    }
  };

  /* キャラクターの詳細データ要素を生成 */
  const createCharacterDetailElements = (json) => {
    const detailList = [];

    /* リソース情報 */
    {
      const result = xml.createDataElement({ name: 'リソース' });
      result.appendChild(xml.createDataElement({ name: 'HP', type: 'numberResource', currentValue: json.max_hitpoint }, json.max_hitpoint));
      result.appendChild(xml.createDataElement({ name: '障壁', type: 'numberResource', currentValue: 0 }, 999));
      result.appendChild(xml.createDataElement({ name: '軽減' }, 0));
      result.appendChild(xml.createDataElement({ name: '再生' }, 0));
      result.appendChild(xml.createDataElement({ name: '因果力' }, json.effect || 0));
      result.appendChild(xml.createDataElement({ name: 'ヘイト', type: 'numberResource', currentValue: 0 }, 25));
      result.appendChild(xml.createDataElement({ name: '疲労' }, 0));
      result.appendChild(xml.createDataElement({ name: '初期上限HP' }, json.max_hitpoint || 0));
      detailList.push(result);
    }

    /* 戦闘の諸数値 */
    {
      const result = xml.createDataElement({ name: '戦闘の諸数値' });
      result.appendChild(xml.createDataElement({ name: '行動力' }, json.action || 0));
      result.appendChild(xml.createDataElement({ name: '移動力' }, json.move || 0));
      result.appendChild(xml.createDataElement({ name: '武器の射程' }, json.range || 0));
      result.appendChild(xml.createDataElement({ name: '攻撃力' }, json.physical_attack || 0));
      result.appendChild(xml.createDataElement({ name: '魔力' }, json.magic_attack || 0));
      result.appendChild(xml.createDataElement({ name: '回復力' }, json.heal_power || 0));
      result.appendChild(xml.createDataElement({ name: '物理防御力' }, json.physical_defense || 0));
      result.appendChild(xml.createDataElement({ name: '魔法防御力' }, json.magic_defense || 0));
      detailList.push(result);
    }

    /* スキルの情報 */
    {
      const result = xml.createDataElement({ name: 'スキルの情報' });

      /* シナリオ制限スキル */
      let skills = json.skills?.filter(s => s.limit.includes('シナリオ')) || [];
      let textList = [];
      for (const skill of skills) {
        const limitCount = skill.limit.replace(/.*?シナリオ(.+?)回.*?/, '$1');
        if (limitCount === '[SR]') {
          textList.push(`|${skill.name}|${'[]'.repeat(skill.skill_rank)}|`);
        } else {
          textList.push(`|${skill.name}|${'[]'.repeat(limitCount)}|`);
        }
      }
      if (textList.length > 0) {
        result.appendChild(xml.createDataElement({
          name: 'シナリオ制限スキル',
          type: 'markdown'
        }, `|スキル名|使用回数|\n${textList.join('\n')}`));
      }

      /* シーン制限スキル */
      skills = json.skills?.filter(s => s.limit.includes('シーン')) || [];
      textList = [];
      for (const skill of skills) {
        const limitCount = skill.limit.replace(/.*?シーン(.+?)回.*?/, '$1');
        if (limitCount === '[SR]') {
          textList.push(`|${skill.name}|${'[]'.repeat(skill.skill_rank)}|`);
        } else {
          textList.push(`|${skill.name}|${'[]'.repeat(limitCount)}|`);
        }
      }
      if (textList.length > 0) {
        result.appendChild(xml.createDataElement({
          name: 'シーン制限スキル',
          type: 'markdown'
        }, `|スキル名|使用回数|\n${textList.join('\n')}`));
      }

      detailList.push(result);
    }

    /* 能力値 */
    {
      const result = xml.createDataElement({ name: '能力値' });
      result.appendChild(xml.createDataElement({ name: 'CR' }, json.character_rank));
      result.appendChild(xml.createDataElement({ name: 'STR基本値' }, json.str_basic_value));
      result.appendChild(xml.createDataElement({ name: 'DEX基本値' }, json.dex_basic_value));
      result.appendChild(xml.createDataElement({ name: 'POW基本値' }, json.pow_basic_value));
      result.appendChild(xml.createDataElement({ name: 'INT基本値' }, json.int_basic_value));
      result.appendChild(xml.createDataElement({ name: 'STR' }, json.str_value));
      result.appendChild(xml.createDataElement({ name: 'DEX' }, json.dex_value));
      result.appendChild(xml.createDataElement({ name: 'POW' }, json.pow_value));
      result.appendChild(xml.createDataElement({ name: 'INT' }, json.int_value));
      detailList.push(result);
    }

    /* 装備品 */
    {
      const result = xml.createDataElement({ name: '装備品' });
      result.appendChild(xml.createDataElement({ name: '手1' }, json.hand1?.alias || ''));
      result.appendChild(xml.createDataElement({ name: '手2' }, json.hand2?.alias || ''));
      result.appendChild(xml.createDataElement({ name: '防具' }, json.armor?.alias || ''));
      result.appendChild(xml.createDataElement({ name: '補助1' }, json.support_item1?.alias || ''));
      result.appendChild(xml.createDataElement({ name: '補助2' }, json.support_item2?.alias || ''));
      result.appendChild(xml.createDataElement({ name: '補助3' }, json.support_item3?.alias || ''));
      result.appendChild(xml.createDataElement({ name: '鞄' }, json.bag?.alias || ''));
      detailList.push(result);
    }

    /* 所持品 */
    {
      const result = xml.createDataElement({ name: '所持品' });
      json.items ??= [];
      json.items.forEach((item, index) => {
        result.appendChild(xml.createDataElement({ name: `アイテム${index + 1}` }, item?.alias || ''));
      });
      detailList.push(result);
    }

    /* その他 */
    {
      const result = xml.createDataElement({ name: 'その他' });
      result.appendChild(xml.createDataElement({ name: 'PL名' }, json.player_name || ''));
      result.appendChild(xml.createDataElement({ name: '種族' }, json.race || ''));
      result.appendChild(xml.createDataElement({ name: '性別' }, json.gender || ''));
      result.appendChild(xml.createDataElement({ name: 'アーキ職業' }, json.archetype || ''));
      result.appendChild(xml.createDataElement({ name: 'メイン職業' }, json.main_job || ''));
      result.appendChild(xml.createDataElement({ name: 'サブ職業' }, json.sub_job || ''));
      result.appendChild(xml.createDataElement({ name: 'タグ', type: 'note' }, json.tags?.filter(e => e).map(e => `［${e}］`).join(',')));
      result.appendChild(xml.createDataElement({ name: 'Lv' }, json.level || ''));
      result.appendChild(xml.createDataElement({ name: '所持金' }, ''));
      result.appendChild(xml.createDataElement({ name: '説明', type: 'note' }, json.remarks || ''));
      detailList.push(result);
    }

    return [json.name, detailList];
  };

  /* チャットパレットテキストの生成 */
  const generateChatPaletteText = (json) => {
    const convertStr = str => str?.replace(/(\d+?)\+(\d+?)D/, '$2LH+$1');
    const nameOfHighestAbility = (json) => {
      let result = 'STR';
      let base = json.str_value;
      if (json.dex_value > base) {
        result = 'DEX';
        base = json.dex_value;
      }
      if (json.pow_value > base) {
        result = 'POW';
        base = json.pow_value;
      }
      if (json.int_value > base) {
        result = 'INT';
        base = json.int_value;
      }
      return `【${result}】`;
    };

    let txt = '';
    txt += `//--- 技能判定\n`;
    txt += `${convertStr(json?.abl_motion)}>=0 [運動値]\n`;
    txt += `${convertStr(json?.abl_durability)}>=0 [耐久値]\n`;
    txt += `${convertStr(json?.abl_dismantle)}>=0 [解除値]\n`;
    txt += `${convertStr(json?.abl_operate)}>=0 [操作値]\n`;
    txt += `${convertStr(json?.abl_sense)}>=0 [知覚値]\n`;
    txt += `${convertStr(json?.abl_negotiate)}>=0 [交渉値]\n`;
    txt += `${convertStr(json?.abl_knowledge)}>=0 [知識値]\n`;
    txt += `${convertStr(json?.abl_analyze)}>=0 [解析値]\n`;
    txt += `\n`;
    txt += `//--- 受動判定\n`;
    txt += `${convertStr(json?.abl_avoid)}>=0 [回避値]\n`;
    txt += `${convertStr(json?.abl_avoid)}+2>=0 [回避値](ヘイトアンダー)\n`;
    txt += `${convertStr(json?.abl_resist)}>=0 [抵抗値]\n`;
    txt += `${convertStr(json?.abl_resist)}+2>=0 [抵抗値](ヘイトアンダー)\n`;
    txt += `:HP-n+{物理防御力}+{軽減}LZ :ヘイト-1L 【物理ダメージ】\n`;
    txt += `:HP-n+{魔法防御力}+{軽減}LZ :ヘイト-1L 【魔法ダメージ】\n`;
    txt += `:HP-nLZ 【ヘイトダメージ適用】\n`;
    txt += `:障壁-n+{物理防御力}+{軽減}Z :ヘイト-1L 【物理ダメージ(障壁)】\n`;
    txt += `:障壁-n+{魔法防御力}+{軽減}Z :ヘイト-1L 【魔法ダメージ(障壁)】\n`;
    txt += `:障壁-nZ 【ヘイトダメージ適用】\n`;
    txt += `:HP-({障壁}*-1)LZ :障壁=0 障壁超過ダメージの適用\n`;
    txt += `\n`;
    txt += `//--- 能動判定\n`;
    txt += `${convertStr(json?.abl_hit)}>=0 [命中値]${nameOfHighestAbility(json || {})} 基本武器攻撃or基本魔法攻撃 :ヘイト+0\n`;
    txt += `1D6+{攻撃力} 基本武器攻撃\n`;
    txt += `1D6+{魔力} 基本魔法攻撃\n`;
    txt += `※作成例\n`;
    txt += `${convertStr(json?.abl_hit)}>=0 [命中値]${nameOfHighestAbility(json || {})} ◯◯ :ヘイト+n\n`;
    txt += `t:HP+3D6+{魔力}+{回復力}LZ ヒール :ヘイト+1\n`;
    txt += `t:ヘイト-3LZ パシフィケーション\n`;
    txt += `\n`;
    txt += `//--- ラウンド進行\n`;
    txt += `:因果力\n`;
    txt += `:HP={HP^} :障壁=0 :軽減=0 :再生=0 :ヘイト=0 初期化\n`;
    txt += `:HP+{再生}LZ 再生回復\n`;
    txt += `:疲労+\n`;
    txt += `:HP^={初期上限HP^}-{疲労}LZ :HP={HP}LZ 疲労適用\n`;
    txt += `\n`;
    txt += `//--- 消耗表\n`;
    txt += `PCT${json.character_rank} 体力消耗\n`;
    txt += `ECT${json.character_rank} 気力消耗\n`;
    txt += `GCT${json.character_rank} 物品消耗\n`;
    txt += `CCT${json.character_rank} 金銭消耗\n`;
    txt += `\n`;
    txt += `//--- 財宝表\n`;
    txt += `CTRS${json.character_rank} 金銭\n`;
    txt += `MTRS${json.character_rank} 魔法素材\n`;
    txt += `ITRS${json.character_rank} 換金アイテム\n`;
    txt += `HTRS${json.character_rank} ヒロイン\n`;
    txt += `GTRS${json.character_rank} ゴブリン財宝表\n`;
    txt += `CTRSE${json.character_rank} 金銭(拡張版)\n`;
    txt += `MTRSE${json.character_rank} 魔法素材(拡張版)\n`;
    txt += `ITRSE${json.character_rank} 換金アイテム(拡張版)\n`;
    txt += `OTRSE${json.character_rank} その他(拡張版)\n`;
    txt += `\n`;
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

  /* バフパレットテキストの生成 */
  const generateBuffPaletteText = () => {
    return '';
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

      /* キャラクターIDを取得 */
      const characterId = new URL(window.location.href).searchParams.get('id');

      /* キャラクターデータを取得 */
      const json = await fetchCharacterData(characterId);

      /* キャラクターデータの生成 */
      const [charaName, detailElements] = createCharacterDetailElements(json);

      /* チャットパレットとバフパレットの生成 */
      const chatPaletteText = generateChatPaletteText(json);
      const buffPaletteText = generateBuffPaletteText();

      const chatPaletteElement = xml.createChatPalette('LogHorizon', chatPaletteText);
      const buffPaletteElement = xml.createBuffPalette('LogHorizon', buffPaletteText);

      /* キャラクターデータのXML作成と保存 */
      const characterElement = xml.createCharacterData(charaName, detailElements);
      createZipFile(charaName, characterElement, chatPaletteElement, buffPaletteElement);

    } catch (error) {
      console.error('エラーが発生しました:', error);
      alert(`処理中にエラーが発生しました: ${error.message}`);
    }
  };

  /* メイン処理実行 */
  main();
})();
