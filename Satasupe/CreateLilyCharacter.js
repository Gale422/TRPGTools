javascript: (() => {
  /* キャラシのサイト以外は処理しない */
  const url = new URL(window.location.href);
  if (url.hostname !== 'character-sheets.appspot.com') {
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
  const diceBotName = 'Satasupe';
  /* キャラ名を設定する */
  const charName = document.querySelector('#base\\.name').value;
  /* 詳細データを追加する */
  const detailList = [];

  {
    const result = dataCreator({ name: 'リソース' });
    result.appendChild(dataCreator({ name: '肉体点', type: 'numberResource', currentValue: 10 - document.querySelector('#cond\\.body\\.value').value }, 10));
    result.appendChild(dataCreator({ name: '精神点', type: 'numberResource', currentValue: 10 - document.querySelector('#cond\\.mental\\.value').value }, 10));
    let life = document.querySelector('#base\\.abl\\.life\\.value').value;
    result.appendChild(dataCreator({ name: 'サイフ', type: 'numberResource', currentValue: life }, life));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '能力値' });
    const environment = dataCreator({ name: '環境値' });
    const heaven = dataCreator({ name: '天分値' });
    const combat = dataCreator({ name: '戦闘値' });
    environment.appendChild(dataCreator({ name: '犯罪' }, document.querySelector('#base\\.abl\\.crime\\.value').value));
    environment.appendChild(dataCreator({ name: '生活' }, document.querySelector('#base\\.abl\\.life\\.value').value));
    environment.appendChild(dataCreator({ name: '恋愛' }, document.querySelector('#base\\.abl\\.love\\.value').value));
    environment.appendChild(dataCreator({ name: '教養' }, document.querySelector('#base\\.abl\\.culture\\.value').value));
    environment.appendChild(dataCreator({ name: '戦闘' }, document.querySelector('#base\\.abl\\.combat\\.value').value));
    heaven.appendChild(dataCreator({ name: '肉体' }, document.querySelector('#base\\.gift\\.body\\.value').value));
    heaven.appendChild(dataCreator({ name: '精神' }, document.querySelector('#base\\.gift\\.mind\\.value').value));
    combat.appendChild(dataCreator({ name: '反応力' }, document.querySelector('#base\\.power\\.initiative').value));
    combat.appendChild(dataCreator({ name: '攻撃力' }, document.querySelector('#base\\.power\\.attack').value));
    combat.appendChild(dataCreator({ name: '破壊力' }, document.querySelector('#base\\.power\\.destroy').value));
    result.appendChild(environment);
    result.appendChild(heaven);
    result.appendChild(combat);
    result.appendChild(dataCreator({ name: '性業値' }, document.querySelector('#base\\.emotion').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: `装備品(装備限界${document.querySelector('#outfitstotal\\.limit').value})` });
    let itemIndex = 1;
    /* 武器 */
    Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => { return elem.querySelector('[id$=place]').value === ''; }).map(elem => {
      return `${elem.querySelector('[id$=name]').value} 命中:${elem.querySelector('[id$=aim]').value} ダメージ:${elem.querySelector('[id$=damage]').value} 射程:${elem.querySelector('[id$=range]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
    }).forEach(value => {
      result.appendChild(dataCreator({ name: `装備品${itemIndex++}` }, value));
    });
    /* 道具 */
    Array.from(document.querySelectorAll('#outfits tr[id^="outfits"]')).filter(elem => { return elem.querySelector('[id$=place]').value === ''; }).map(elem => {
      return `${elem.querySelector('[id$=name]').value} 使用:${elem.querySelector('[id$=use]').value} 効果:${elem.querySelector('[id$=effect]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
    }).forEach(value => {
      result.appendChild(dataCreator({ name: `装備品${itemIndex++}` }, value));
    });
    /* 乗物 */
    Array.from(document.querySelectorAll('#vehicles tr[id^="vehicles"]')).map(elem => {
      return `${elem.querySelector('[id$=name]').value} スピード:${elem.querySelector('[id$=speed]').value} 車体:${elem.querySelector('[id$=frame]').value} 荷物:${elem.querySelector('[id$=burden]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
    }).forEach(value => {
      result.appendChild(dataCreator({ name: `装備品${itemIndex++}` }, value));
    });
    for (; itemIndex <= document.querySelector('#outfitstotal\\.limit').value;) {
      result.appendChild(dataCreator({ name: `装備品${itemIndex++}` }, ''));
    }
    detailList.push(result);
  }
  {
    Array.from(document.querySelectorAll('#vehicles tr[id^="vehicles"]')).map(elem => {
      return { text: `乗物:${elem.querySelector('[id$=name]').value} (荷物:${elem.querySelector('[id$=burden]').value})`, burden: elem.querySelector('[id$=burden]').value };
    }).forEach(value => {
      const result = dataCreator({ name: value.text });
      let itemIndex = 1;
      /* 武器 */
      Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => { return elem.querySelector('[id$=place]').value === '乗物'; }).map(elem => {
        return `${elem.querySelector('[id$=name]').value} 命中:${elem.querySelector('[id$=aim]').value} ダメージ:${elem.querySelector('[id$=damage]').value} 射程:${elem.querySelector('[id$=range]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
      }).forEach(value => {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
      });
      /* 道具 */
      Array.from(document.querySelectorAll('#outfits tr[id^="outfits"]')).filter(elem => { return elem.querySelector('[id$=place]').value === '乗物'; }).map(elem => {
        return `${elem.querySelector('[id$=name]').value} 使用:${elem.querySelector('[id$=use]').value} 効果:${elem.querySelector('[id$=effect]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
      }).forEach(value => {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
      });
      for (; itemIndex <= value.burden;) {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, ''));
      }
      detailList.push(result);
    });
  }
  {
    const result = dataCreator({ name: 'アジト' });
    let itemIndex = 1;
    /* 武器 */
    Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => { return elem.querySelector('[id$=place]').value === 'アジト'; }).map(elem => {
      return `${elem.querySelector('[id$=name]').value} 命中:${elem.querySelector('[id$=aim]').value} ダメージ:${elem.querySelector('[id$=damage]').value} 射程:${elem.querySelector('[id$=range]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
    }).forEach((value, index) => {
      result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
    });
    /* 道具 */
    Array.from(document.querySelectorAll('#outfits tr[id^="outfits"]')).filter(elem => { return elem.querySelector('[id$=place]').value === 'アジト'; }).map(elem => {
      return `${elem.querySelector('[id$=name]').value} 使用:${elem.querySelector('[id$=use]').value} 効果:${elem.querySelector('[id$=effect]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
    }).forEach(value => {
      result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
    });
    for (; itemIndex <= 10;) {
      result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, ''));
    }
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '異能' });
    Array.from(document.querySelectorAll('#karma tr[id^="karma"]')).forEach(elem => {
      result.appendChild(dataCreator({ name: elem.querySelector('[id$=name]').value }, `${elem.querySelector('[id$="price.name"]').value} 使用:${elem.querySelector('[id$="price.use"]').value} 対象:${elem.querySelector('[id$="price.target"]').value} 判定:${elem.querySelector('[id$="price.judge"]').value} 効果:${elem.querySelector('[id$="price.effect"]').value}`));
    });
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '代償' });
    Array.from(document.querySelectorAll('#karma tr[id^="karma"]')).forEach(elem => {
      result.appendChild(dataCreator({ name: elem.querySelector('[id$=name]').value }, `${elem.querySelector('[id$="talent.name"]').value} 使用:${elem.querySelector('[id$="talent.use"]').value} 対象:${elem.querySelector('[id$="talent.target"]').value} 判定:${elem.querySelector('[id$="talent.judge"]').value} 効果:${elem.querySelector('[id$="talent.effect"]').value}`));
    });
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: 'パーソナル' });
    result.appendChild(dataCreator({ name: '故郷' }, document.querySelector('#base\\.homeland').value));
    result.appendChild(dataCreator({ name: '性別' }, document.querySelector('#base\\.sex').value));
    result.appendChild(dataCreator({ name: '年齢' }, document.querySelector('#base\\.age').value));
    result.appendChild(dataCreator({ name: '外見' }, document.querySelector('#base\\.style').value));
    result.appendChild(dataCreator({ name: 'チーム' }, document.querySelector('#base\\.team').value));
    result.appendChild(dataCreator({ name: '表の顔' }, document.querySelector('#base\\.surface').value));
    result.appendChild(dataCreator({ name: '盟約' }, document.querySelector('#base\\.alliance').value));
    result.appendChild(dataCreator({ name: '階級' }, document.querySelector('#base\\.hierarchy').value));
    result.appendChild(dataCreator({ name: '好きなもの' }, document.querySelector('#base\\.likes').value));
    result.appendChild(dataCreator({ name: '嫌いなもの' }, document.querySelector('#base\\.dislikes').value));
    result.appendChild(dataCreator({ name: '好みのタイプ' }, document.querySelector('#base\\.favorites').value));
    result.appendChild(dataCreator({ name: '好きな映画' }, document.querySelector('#base\\.movie').value));
    result.appendChild(dataCreator({ name: '言語' }, document.querySelector('#base\\.langueges').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: 'その他' });
    const state = dataCreator({ name: '状態' });
    const hideout = dataCreator({ name: 'アジト' });
    state.appendChild(dataCreator({ name: 'トラウマ' }, document.querySelector('#cond\\.trauma\\.value').value));
    state.appendChild(dataCreator({ name: '中毒' }, document.querySelector('#cond\\.addiction\\.value').value));
    state.appendChild(dataCreator({ name: 'トリコ' }, document.querySelector('#cond\\.prisoner\\.value').value));
    state.appendChild(dataCreator({ name: 'SAN' }, document.querySelector('#cond\\.san\\.value').value));
    state.appendChild(dataCreator({ name: 'クトゥルフ神話' }, document.querySelector('#cond\\.cthulhu\\.value').value));
    hideout.appendChild(dataCreator({ name: '場所' }, document.querySelector('#home\\.place').value));
    hideout.appendChild(dataCreator({ name: '快適度' }, document.querySelector('#home\\.comfortable').value));
    hideout.appendChild(dataCreator({ name: 'セキュリティ' }, document.querySelector('#home\\.security').value));
    result.appendChild(dataCreator({ name: '趣味' }, Array.from(document.querySelectorAll('#div\\.hobby .input.selected span'), elem => elem.textContent).join(',')));
    result.appendChild(state);
    result.appendChild(hideout);
    detailList.push(result);
  }

  /* チャットパレットの文字列 */
  const getChatPaletteText = () => {
    let txt = '';
    txt += `({犯罪}+0)R>=5[,1,13] 犯罪判定\n`;
    txt += `({生活}+0)R>=5[,1,13] 生活判定\n`;
    txt += `({恋愛}+0)R>=5[,1,13] 恋愛判定\n`;
    txt += `({教養}+0)R>=5[,1,13] 教養判定\n`;
    txt += `({戦闘}+0)R>=5[,1,13] 戦闘判定\n`;
    txt += `({肉体}+0)R>=5[,1,13] 肉体判定\n`;
    txt += `({精神}+0)R>=5[,1,13] 精神判定\n`;
    txt += `\n`;
    txt += `R>=[,1,13] 判定\n`;
    txt += `SR{性業値} 性業値\n`;
    txt += `\n`;
    txt += `:精神点={精神点^}LZ 睡眠\n`;
    txt += `:精神点-1D6LZ ファンブルからの逆転\n`;
    txt += `:精神点+1LZ 食事\n`;
    txt += `\n`;
    Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => { return elem.querySelector('[id$=place]').value === ''; }).map(elem => {
      return {
        name: elem.querySelector('[id$=name]').value,
        aim: elem.querySelector('[id$=aim]').value,
        damage: elem.querySelector('[id$=damage]').value,
        range: elem.querySelector('[id$=range]').value,
        notes: elem.querySelector('[id$=notes]').value
      };
    }).forEach(value => {
      txt += `({攻撃力}+0)R>=${value.aim}[,1,13] 攻撃判定(${value.name}) ${value.range} 【${value.notes}】\n`;
      if(value.range === '格闘') {
        txt += `C({破壊力}+) ダメージ(${value.name})\n`;
      } else {
        txt += `C(${value.damage}) ダメージ(${value.name})\n`;
      }
      txt += `\n`;
    });
    txt += `# 各種表は、末尾に数値を入れることで回数を指定してダイスロール可能 例:TAGT3 タグ決定表\n`;
    txt += `\n`;
    txt += `# 計画フェイズ\n`;
    txt += `## 情報判定\n`;
    txt += `TAGT タグ決定表\n`;
    txt += `\n`;
    txt += `### イベント表 +,- でダイス目修正、=でダイス目指定が可能\n`;
    txt += `CrimeIET 犯罪表\n`;
    txt += `LifeIET 生活表\n`;
    txt += `LoveIET 恋愛表\n`;
    txt += `CultureIET 教養表\n`;
    txt += `CombatIET 戦闘表\n`;
    txt += `\n`;
    txt += `### ハプニング表 +,- でダイス目修正、=でダイス目指定が可能\n`;
    txt += `CrimeIHT 犯罪表\n`;
    txt += `LifeIHT 生活表\n`;
    txt += `LoveIHT 恋愛表\n`;
    txt += `CultureIHT 教養表\n`;
    txt += `CombatIHT 戦闘表\n`;
    txt += `\n`;
    txt += `## ロマンス\n`;
    txt += `RomanceFT ロマンスファンブル表\n`;
    txt += `\n`;
    txt += `# 実行フィエズ\n`;
    txt += `## 血戦\n`;
    txt += `FumbleT 命中判定ファンブル表\n`;
    txt += `FatalT 致命傷表\n`;
    txt += `\n`;
    txt += `## ケチャップ\n`;
    txt += `AccidentT アクシデント表\n`;
    txt += `GeneralAT 汎用アクシデント表\n`;
    txt += `\n`;
    txt += `## 宝物表\n`;
    txt += `GetgT ガラクタ\n`;
    txt += `GetzT 実用品\n`;
    txt += `GetnT 値打ち物\n`;
    txt += `GetkT 奇天烈\n`;
    txt += `\n`;
    txt += `# アフタープレイ\n`;
    txt += `AfterT その後表\n`;
    txt += `\n`;
    txt += `# その他\n`;
    txt += `KusaiMT 臭い飯表\n`;
    txt += `EnterT 登場表\n`;
    txt += `BudTT バッドトリップ表\n`;
    txt += `GETSST 「サタスペ」のベースとアクセサリを出力(末尾にアクセサリ数入力、省略時１)\n`;
    txt += `NPCT NPCの年齢と好みを一括出力\n`;
    return txt;
  };

  /* バフパレットの文字列 */
  const getBuffPaletteText = () => {
    let txt = '';
    return txt;
  };

  const chara = createCharacter(charName, detailList);
  const chatPalette = createChatPalette(diceBotName, getChatPaletteText());
  const buffPalette = createBuffPalette(diceBotName, getBuffPaletteText());
  toZip(charName, chara, chatPalette, buffPalette);
})();
