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

  fetch(`https://lhrpg.com/lhz/ij/${id}.json`, {
    method: 'GET'
  }).then(response => response.json())
    .then(json => {

      if (json.index_type === 'エネミー') {
        /* エネミーデータ */
        /* キャラ名を設定する */
        const charName = json.name;

        /* 詳細データを追加する */
        const detailList = [];
        {
          const result = dataCreator({ name: 'リソース' });
          result.appendChild(dataCreator({ name: 'HP', type: 'numberResource', currentValue: json.hit_point }, json.hit_point));
          result.appendChild(dataCreator({ name: '障壁', type: 'numberResource', currentValue: 0 }, 999));
          result.appendChild(dataCreator({ name: '軽減' }, 0));
          result.appendChild(dataCreator({ name: '再生' }, 0));
          result.appendChild(dataCreator({ name: '因果力' }, json.fate || ''));
          detailList.push(result);
        }
        {
          const result = dataCreator({ name: '戦闘の諸数値' });
          result.appendChild(dataCreator({ name: 'タグ' }, json.tags?.map(tag => `［${tag}］`)?.join('') || ''));
          result.appendChild(dataCreator({ name: 'ランク' }, json.character_rank || ''));
          result.appendChild(dataCreator({ name: '識別難易度' }, json.identification || ''));
          result.appendChild(dataCreator({ name: 'STR' }, json.strength));
          result.appendChild(dataCreator({ name: 'DEX' }, json.dexterity));
          result.appendChild(dataCreator({ name: 'POW' }, json.power));
          result.appendChild(dataCreator({ name: 'INT' }, json.intelligence));
          if (json.rank === 'モブ'){
            result.appendChild(dataCreator({ name: '回避' }, `${json.avoid}［固定］`));
            result.appendChild(dataCreator({ name: '抵抗' }, `${json.resist}［固定］`));
          } else {
            result.appendChild(dataCreator({ name: '回避' }, `${json.avoid_dice}D+${json.avoid}`));
            result.appendChild(dataCreator({ name: '抵抗' }, `${json.resist_dice}D+${json.resist}`));
          }
          result.appendChild(dataCreator({ name: '物理防御力' }, json.physical_defense || ''));
          result.appendChild(dataCreator({ name: '魔法防御力' }, json.magic_defense || ''));
          result.appendChild(dataCreator({ name: 'ヘイト倍率' }, json.hate || ''));
          result.appendChild(dataCreator({ name: '行動力' }, json.action || ''));
          result.appendChild(dataCreator({ name: '移動力' }, json.move || ''));
          detailList.push(result);
        }
        {
          const result = dataCreator({ name: '特技の情報' });
          let skills = json.skills?.filter(s => s?.limit?.includes('シナリオ')) || [];
          let textList = [];
          for (const skill of skills) {
            const limitCount = skill.limit.replace(/.*?シナリオ(.+?)回.*?/, '$1');
            textList.push(`|${skill.name}|${'[]'.repeat(limitCount)}|`);
          }
          if (textList.length > 0) {
            result.appendChild(dataCreator({ name: 'シナリオ制限特技', type: 'markdown' }, `|特技名|使用回数|\n${textList.join('\n')}`));
          }
          skills = json.skills?.filter(s => s?.limit?.includes('シーン')) || [];
          textList = [];
          for (const skill of skills) {
            const limitCount = skill.limit.replace(/.*?シーン(.+?)回.*?/, '$1');
            textList.push(`|${skill.name}|${'[]'.repeat(limitCount)}|`);
          }
          if (textList.length > 0) {
            result.appendChild(dataCreator({ name: 'シーン制限特技', type: 'markdown' }, `|特技名|使用回数|\n${textList.join('\n')}`));
          }
          detailList.push(result);
        }
        {
          const result = dataCreator({ name: 'その他' });
          let eTxt = '';
          eTxt += `タグ: {タグ}\n`;
          eTxt += `ランク: {ランク} 識別難易度: {識別難易度}\n`;
          eTxt += `▼能力値\n`;
          eTxt += `STR: {STR} DEX: {DEX} POW: {POW} INT: {INT} 回避: {回避} 抵抗: {抵抗}\n`;
          eTxt += `物理防御力: {物理防御力} 魔法防御力: {魔法防御力} 最大HP: {HP^} ヘイト倍率: x{ヘイト倍率} 行動力: {行動力} 移動力: {移動力}\n\n`;
          result.appendChild(dataCreator({ name: '識別', type: 'note' }, eTxt));
          eTxt = '▼特技\n';
          eTxt += json.skills?.map(s => {
            let sDataList = [];
            sDataList.push(`《${s.name}》`);
            sDataList.push(`${s.tags?.map(t=>`［${t}］`).join('') || ''}`);
            sDataList.push(`${s.timing || ''}`);
            sDataList.push(`${s.role || ''}`);
            sDataList.push(`${s.target || ''}`);
            sDataList.push(`${s.range || ''}`);
            sDataList.push(`${s.limit || ''}`);
            sDataList.push(`${s.function || ''}`);
            return sDataList.filter(s =>s!=='').join('＿');
          }).join(`\n`);
          eTxt += '\n\n';
          result.appendChild(dataCreator({ name: '特技一覧', type: 'note' }, eTxt));
          eTxt = '▼ドロップ品\n';
          eTxt += json.items?.map(i=>`${i.dice} : ${i.item}`).join(`\n`);
          eTxt += '\n\n';
          result.appendChild(dataCreator({ name: 'ドロップ品', type: 'note' }, eTxt));
          result.appendChild(dataCreator({ name: '解説', type: 'note' }, json.contents || ''));
          detailList.push(result);
        }

        /* チャットパレットの文字列 */
        const getChatPaletteText = (json) => {
          let txt = '';
          txt += `//--- 受動判定\n`;
          if (json.rank === 'モブ'){
            txt += `${json.avoid} [回避(固定)]\n`;
            txt += `${json.resist} [抵抗(固定)]\n`;
          } else {
            txt += `${json.avoid_dice}LH+${json.avoid}>=0 [回避]\n`;
            txt += `${json.resist_dice}LH+${json.resist}>=0 [抵抗]\n`;
          }
          txt += `:HP-+{物理防御力}LZ 被物理ダメージ\n`;
          txt += `:HP-+{魔法防御力}LZ 被魔法ダメージ\n`;
          txt += `:HP-LZ 貫通・直接点ダメージ\n`;
          txt += `\n`;
          txt += `//--- 能動判定\n`;
          txt += `1D 対象選択\n`;
          txt += `choice[] 対象選択\n`;
          txt += `C(*{ヘイト倍率}) ヘイトダメージ\n`;
          txt += `\n`;
          txt += json.skills?.filter(s=> {
            return s.timing === 'メジャー' && s.role?.includes('対決')
          })?.map(s => {
            let sTxt = '';
            sTxt += `${s.role?.replace(/.*?(\d+?)＋(\d+?)D.*/, '$2LH+$1>=0') || ''} 《${s.name}》\n`;
            sTxt += `${s.function?.replace(/.*?［(\d+?)＋(\d+?)D］の(.+?)ダメージ.*/, `$2D+$1 《${s.name}》($3ダメージ)`)}\n`;
            return sTxt;
          }).join(`\n`);
          txt += `\n`;
          txt += `//--- エネミー特技一覧\n`;
          txt += json.skills?.map(s => {
            let sDataList = [];
            sDataList.push(`《${s.name}》`);
            sDataList.push(`${s.tags?.map(t=>`［${t}］`).join('') || ''}`);
            sDataList.push(`${s.timing || ''}`);
            sDataList.push(`${s.role || ''}`);
            sDataList.push(`${s.target || ''}`);
            sDataList.push(`${s.range || ''}`);
            sDataList.push(`${s.limit || ''}`);
            sDataList.push(`${s.function || ''}`);
            return sDataList.filter(s =>s!=='').join('＿');
          }).join(`\n`);
          txt += `\n`;
          txt += `\n`;
          txt += `//--- 公開用エネミーデータ\n`;
          txt += `{識別}{特技一覧}{ドロップ品}{解説}\n`;
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

        const chara = createCharacter(`${charName}《${json.ruby}》`, detailList);
        const chatPalette = createChatPalette(diceBotName, getChatPaletteText(json));
        const buffPalette = createBuffPalette(diceBotName, getBuffPaletteText(json));
        toZip(charName, chara, chatPalette, buffPalette);
      } else {
        /* どれにも一致しないため失敗扱いする */
        reject();
      }
    })
    .catch(error => {
      console.log(error);
      alert("データの作成に失敗しました。\r\nログ・ホライズン データベースのエネミーデータであることを確認してください。");
    });
})();
