javascript: (() => {
  const url = new URL(window.location.href);
  if (url.hostname !== 'lhrpg.com' || !url.pathname.startsWith('/lhz/')) {
    return;
  }

  /** ライブラリを取得する関数 */
  const getLibraries = (...urls) => {
    for (const url of urls) {
      const script = document.createElement('script');
      script.src = url;
      document.body.appendChild(script);
    }
  };

  getLibraries(
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
  );

  /* ZIPファイルを生成する */
  const toZip = (fileName, charaData, chatPaletteData, buffPaletteData) => {
    /* ZIPファイルを作成する */
    const downloadZip = (fileName, data) => {
      if (typeof JSZip === 'undefined') {
        setTimeout(downloadZip, 10, fileName, data);
        return;
      }
      const s = new XMLSerializer();
      let out = s.serializeToString(data);
      out = out.replace(/xmlns=.http:\/\/www\.w3\.org\/1999\/xhtml../, '');
      out = out.replace(/<br \/>/g, '\n');
      out = out.replace(/currentvalue/g, 'currentValue');
      const zip = new JSZip();
      zip.file(`${fileName}.xml`, out);
      zip.generateAsync({ type: 'blob' }).then(blob => saveAs(blob, `${fileName}.zip`));
    };

    const data = document.createElement('character');
    data.setAttribute('location.x', '0');
    data.setAttribute('location.y', '0');
    data.setAttribute('posz', '0');
    data.appendChild(charaData);
    data.appendChild(chatPaletteData);
    data.appendChild(buffPaletteData);
    downloadZip(fileName, data);
  };

  /* dataタグのXMLデータを作成する */
  const dataCreator = (attrs, value = '') => {
    const elem = document.createElement('data');
    for (const [key, value] of Object.entries(attrs)) {
      elem.setAttribute(key, value);
    }
    elem.textContent = value;
    return elem;
  };

  /* キャラクターデータを生成する */
  const createCharacter = (charaName, detailList = []) => {
    const xml = document.createElement('data');
    xml.setAttribute('name', 'character');
    const img = dataCreator({ name: 'image' });
    img.appendChild(dataCreator({ name: 'imageIdentifier', type: 'image' }, 'null'));
    xml.appendChild(img);
    const common = dataCreator({ name: 'common' });
    common.appendChild(dataCreator({ name: 'name' }, charaName));
    common.appendChild(dataCreator({ name: 'size' }, '2'));
    xml.appendChild(common);
    const detail = dataCreator({ name: 'detail' });
    for (const data of detailList) {
      detail.appendChild(data);
    }
    xml.appendChild(detail);
    return xml;
  };

  /* チャットパレットを生成する */
  const createChatPalette = (diseBotName, chatPalette) => {
    const xml = document.createElement('chat-palette');
    xml.setAttribute('dicebot', diseBotName);
    xml.textContent = chatPalette;
    return xml;
  };

  /* バフパレットを生成する */
  const createBuffPalette = (diseBotName, buffPalette) => {
    const xml = document.createElement('buff-palette');
    xml.setAttribute('dicebot', diseBotName);
    xml.textContent = buffPalette;
    return xml;
  };

  /* ダイスボットを設定する */
  const diceBotName = 'LogHorizon';
  const id = url.searchParams.get('id');

  fetch(`https://lhrpg.com/lhz/api/${id}.json`, {
    method: 'GET'
  }).then(response => response.json())
    .then(json => {
      /* キャラ名を設定する */
      const charName = json.name;
      /* 詳細データを追加する */
      const detailList = [];
      {
        const result = dataCreator({ name: 'リソース' });
        result.appendChild(dataCreator({ name: 'HP', type: 'numberResource', currentValue: json.max_hitpoint }, json.max_hitpoint));
        result.appendChild(dataCreator({ name: '障壁', type: 'numberResource', currentValue: 0 }, 999));
        result.appendChild(dataCreator({ name: '軽減' }, 0));
        result.appendChild(dataCreator({ name: '再生' }, 0));
        result.appendChild(dataCreator({ name: '因果力' }, json.effect || ''));
        result.appendChild(dataCreator({ name: 'ヘイト', type: 'numberResource', currentValue: 0 }, 25));
        result.appendChild(dataCreator({ name: '疲労' }, 0));
        detailList.push(result);
      }
      {
        const result = dataCreator({ name: '戦闘の諸数値' });
        result.appendChild(dataCreator({ name: '行動力' }, json.action || ''));
        result.appendChild(dataCreator({ name: '移動力' }, json.move || ''));
        result.appendChild(dataCreator({ name: '武器の射程' }, json.range || ''));
        result.appendChild(dataCreator({ name: '攻撃力' }, json.physical_attack || ''));
        result.appendChild(dataCreator({ name: '魔力' }, json.magic_attack || ''));
        result.appendChild(dataCreator({ name: '回復力' }, json.heal_power || ''));
        result.appendChild(dataCreator({ name: '物理防御力' }, json.physical_defense || ''));
        result.appendChild(dataCreator({ name: '魔法防御力' }, json.magic_defense || ''));
        detailList.push(result);
      }
      {
        const result = dataCreator({ name: 'スキルの情報' });
        let skills = json.skills?.filter(s=>s.limit.includes('シナリオ')) || [];
        let textList = [];
        for(const skill of skills) {
          const limitCount = skill.limit.replace(/.*?シナリオ(.+?)回.*?/, '$1');
          if (limitCount === '[SR]') {
            /* result.appendChild(dataCreator({ name: skill.name, type: 'markdown' }, '[]'.repeat(skill.skill_rank))); */
            textList.push(`|${skill.name}|${'[]'.repeat(skill.skill_rank)}|`);
          } else {
            /* result.appendChild(dataCreator({ name: skill.name, type: 'markdown' }, '[]'.repeat(limitCount))); */
            textList.push(`|${skill.name}|${'[]'.repeat(limitCount)}|`);
          }
        }
        if (textList.length > 0) {
          result.appendChild(dataCreator({ name: 'シナリオ制限スキル', type: 'markdown' }, `|スキル名|使用回数|\n${textList.join('\n')}`));
        }
        skills = json.skills?.filter(s=>s.limit.includes('シーン')) || [];
        textList = [];
        for(const skill of skills) {
          const limitCount = skill.limit.replace(/.*?シーン(.+?)回.*?/, '$1');
          if (limitCount === '[SR]') {
            /* result.appendChild(dataCreator({ name: skill.name, type: 'markdown' }, '[]'.repeat(skill.skill_rank))); */
            textList.push(`|${skill.name}|${'[]'.repeat(skill.skill_rank)}|`);
          } else {
            /* result.appendChild(dataCreator({ name: skill.name, type: 'markdown' }, '[]'.repeat(limitCount))); */
            textList.push(`|${skill.name}|${'[]'.repeat(limitCount)}|`);
          }
        }
        if (textList.length > 0) {
          result.appendChild(dataCreator({ name: 'シーン制限スキル', type: 'markdown' }, `|スキル名|使用回数|\n${textList.join('\n')}`));
        }
        detailList.push(result);
      }
      {
        const result = dataCreator({ name: '能力値' });
        result.appendChild(dataCreator({ name: 'CR' }, json.character_rank));
        result.appendChild(dataCreator({ name: 'STR基本値' }, json.str_basic_value));
        result.appendChild(dataCreator({ name: 'DEX基本値' }, json.dex_basic_value));
        result.appendChild(dataCreator({ name: 'POW基本値' }, json.pow_basic_value));
        result.appendChild(dataCreator({ name: 'INT基本値' }, json.int_basic_value));
        result.appendChild(dataCreator({ name: 'STR' }, json.str_value));
        result.appendChild(dataCreator({ name: 'DEX' }, json.dex_value));
        result.appendChild(dataCreator({ name: 'POW' }, json.pow_value));
        result.appendChild(dataCreator({ name: 'INT' }, json.int_value));
        detailList.push(result);
      }
      {
        const result = dataCreator({ name: '装備品' });
        result.appendChild(dataCreator({ name: '手1' }, json.hand1?.alias || ''));
        result.appendChild(dataCreator({ name: '手2' }, json.hand2?.alias || ''));
        result.appendChild(dataCreator({ name: '防具' }, json.armor?.alias || ''));
        result.appendChild(dataCreator({ name: '補助1' }, json.support_item1?.alias || ''));
        result.appendChild(dataCreator({ name: '補助2' }, json.support_item2?.alias || ''));
        result.appendChild(dataCreator({ name: '補助3' }, json.support_item3?.alias || ''));
        result.appendChild(dataCreator({ name: '鞄' }, json.bag?.alias || ''));
        detailList.push(result);
      }
      {
        const result = dataCreator({ name: '所持品' });
        json.items ??= [];
        json.items.forEach((item, index) => {
          result.appendChild(dataCreator({ name: `アイテム${index + 1}` }, item?.alias || ''));
        });
        detailList.push(result);
      }
      {
        const result = dataCreator({ name: 'その他' });
        result.appendChild(dataCreator({ name: 'PL名' }, json.player_name || ''));
        result.appendChild(dataCreator({ name: '種族' }, json.race || ''));
        result.appendChild(dataCreator({ name: '性別' }, json.gender || ''));
        result.appendChild(dataCreator({ name: 'アーキ職業' }, json.archetype || ''));
        result.appendChild(dataCreator({ name: 'メイン職業' }, json.main_job || ''));
        result.appendChild(dataCreator({ name: 'サブ職業' }, json.sub_job || ''));
        result.appendChild(dataCreator({ name: 'タグ', type: 'note' }, json.tags?.filter(e => e).map(e => `［${e}］`).join(',')));
        result.appendChild(dataCreator({ name: 'Lv' }, json.level || ''));
        result.appendChild(dataCreator({ name: '所持金' }, ''));
        result.appendChild(dataCreator({ name: '説明', type: 'note' }, json.remarks || ''));
        detailList.push(result);
      }

      /* チャットパレットの文字列 */
      const getChatPaletteText = (json) => {
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
        txt += `:障壁-n+{物理防御力}+{軽減}Z :ヘイト-1L 【物理ダメージ(障壁)】\n`;
        txt += `:障壁-n+{魔法防御力}+{軽減}Z :ヘイト-1L 【魔法ダメージ(障壁)】\n`;
        txt += `:HP-({障壁}*-1)LZ :障壁=0 障壁超過ダメージの適用\n`;
        txt += `\n`;
        txt += `//--- 能動判定\n`;
        txt += `${convertStr(json?.abl_hit)}>=0 [命中値]${nameOfHighestAbility(json || {})} 基本武器攻撃or基本魔法攻撃 :ヘイト+0\n`;
        txt += `${convertStr(json?.abl_hit)}>=0 [命中値]${nameOfHighestAbility(json || {})} ◯◯ :ヘイト+n\n`;
        txt += `1D6+{攻撃力} 基本武器攻撃\n`;
        txt += `1D6+{魔力} 基本魔法攻撃\n`;
        txt += `t:HP+3D6+{魔力}+{回復力}LZ ヒール :ヘイト+1\n`;
        txt += `t:ヘイト-3LZ パシフィケーション\n`;
        txt += `\n`;
        txt += `//--- ラウンド進行\n`;
        txt += `:因果力\n`;
        txt += `:HP={HP^} :障壁=0 :軽減=0 :再生=0 :ヘイト=0 初期化\n`;
        txt += `:HP+{再生}LZ 再生回復\n`;
        txt += `\n`;
        txt += `//--- 消耗表\n`;
        txt += 'PCT{CR} 体力消耗\n';
        txt += 'ECT{CR} 気力消耗\n';
        txt += 'GCT{CR} 物品消耗\n';
        txt += 'CCT{CR} 金銭消耗\n';
        txt += `\n`;
        txt += `//--- 財宝表\n`;
        txt += 'CTRS{CR} 金銭\n';
        txt += 'MTRS{CR} 魔法素材\n';
        txt += 'ITRS{CR} 換金アイテム\n';
        txt += 'HTRS{CR} ヒロイン\n';
        txt += 'GTRS{CR} ゴブリン財宝表\n';
        txt += 'CTRSE{CR} 金銭(拡張版)\n';
        txt += 'MTRSE{CR} 魔法素材(拡張版)\n';
        txt += 'ITRSE{CR} 換金アイテム(拡張版)\n';
        txt += 'OTRSE{CR} その他(拡張版)\n';
        txt += `\n`;
        txt += `//--- その他\n`;
        txt += `&バフ名/効果/R数 バフ追加\n`;
        txt += `&バフ名- バフ消去\n`;
        txt += `&R- バフラウンド-1\n`;
        txt += `&R+ バフラウンド+1\n`;
        txt += `&D 0R以下のバフ消去\n`;
        txt += `\n`;
        txt += `t&バフ名/効果/R数 対象にバフ追加\n`;
        txt += `t&バフ名- 対象のバフ消去\n`;
        txt += `t&R- 対象のバフラウンド-1\n`;
        txt += `t&R+ 対象のバフラウンド+1\n`;
        txt += `t&D 対象の0R以下のバフ消去\n`;
        txt += `\n`;
        return txt;
      };

      /* バフパレットの文字列 */
      const getBuffPaletteText = (json) => {
        let txt = '';
        return txt;
      };

      const chara = createCharacter(charName, detailList);
      const chatPalette = createChatPalette(diceBotName, getChatPaletteText(json));
      const buffPalette = createBuffPalette(diceBotName, getBuffPaletteText(json));
      toZip(charName, chara, chatPalette, buffPalette);
    })
    .catch(error => {
      console.log(error);
      alert("データの作成に失敗しました。\r\n基本情報の「外部ツールからの〈冒険者〉データ参照を許可する」が選択されていることを確認してください。");
    });
})();
