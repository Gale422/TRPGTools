javascript: (() => {
  /* サイト検証 */
  const validateSite = () => {
    const url = new URL(window.location.href);
    if (url.hostname !== 'character-sheets.appspot.com') {
      alert('このブックマークレットはサタスペキャラクターシートページでのみ使用できます。');
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
    if (!document.querySelector('#base\\.name')) {
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
  const createChatPalette = (diceBotName, chatPalette) => {
    const xml = document.createElement('chat-palette');
    xml.setAttribute('dicebot', diceBotName);
    xml.textContent = chatPalette;
    return xml;
  };

  /* バフパレットを生成する */
  const createBuffPalette = (diceBotName, buffPalette) => {
    const xml = document.createElement('buff-palette');
    xml.setAttribute('dicebot', diceBotName);
    xml.textContent = buffPalette;
    return xml;
  };

  /* ZIPファイル作成とダウンロード */
  const createZipFile = (fileName, charaData, chatPaletteData, buffPaletteData) => {
    /* 内部関数: 実際のZIPファイル作成とダウンロード処理 */
    const downloadZip = (fileName, data) => {
      if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
        setTimeout(() => downloadZip(fileName, data), 100);
        return;
      }

      const serializer = new XMLSerializer();
      let xmlString = serializer.serializeToString(data);

      /* XMLデータの整形 */
      xmlString = xmlString.replace(/xmlns=.http:\/\/www\.w3\.org\/1999\/xhtml../, '');
      xmlString = xmlString.replace(/<br \/>/g, '\n');
      xmlString = xmlString.replace(/currentvalue/g, 'currentValue');

      const zip = new JSZip();
      zip.file(`${fileName}.xml`, xmlString);
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

  /* DOM要素を安全に取得する関数 */
  const getElementValue = (selector, defaultValue = '0') => {
    const element = document.querySelector(selector);
    return element?.value || defaultValue;
  };

  /* チャットパレットテキストの生成 */
  const getChatPaletteText = () => {
    let txt = '';
    txt += `//--- 判定\n`;
    txt += `({犯罪}{肉体重傷}{精神重傷}+0)R>=5[,1,13] 犯罪判定\n`;
    txt += `({生活}{肉体重傷}{精神重傷}+0)R>=5[,1,13] 生活判定\n`;
    txt += `({恋愛}{肉体重傷}{精神重傷}+0)R>=5[,1,13] 恋愛判定\n`;
    txt += `({教養}{肉体重傷}{精神重傷}+0)R>=5[,1,13] 教養判定\n`;
    txt += `({戦闘}{肉体重傷}{精神重傷}+0)R>=5[,1,13] 戦闘判定\n`;
    txt += `({肉体}{肉体重傷}{精神重傷}+0)R>=5[,1,13] 肉体判定\n`;
    txt += `({精神}{肉体重傷}{精神重傷}+0)R>=5[,1,13] 精神判定\n`;
    txt += `\n`;
    txt += `(0{肉体重傷}{精神重傷}+0)R>=[,1,13] 判定\n`;
    txt += `SR{性業値} 性業値\n`;
    txt += `\n`;
    txt += `:精神点+(10-0)LZ 睡眠\n`;
    txt += `:精神点-1D6LZ ファンブルからの逆転\n`;
    txt += `:精神点+1LZ 食事\n`;
    txt += `({肉体}{肉体重傷}{精神重傷}+0)R>=7[1,1,13] 肉体判定(お酒のバッドトリップ)\n`;
    txt += `NPCT :精神点+1LZ お酒(好みの変化も行う)\n`;
    txt += `\n`;
    txt += `//--- バフ\n`;
    txt += `&肉体重傷/-1/999 肉体重傷化\n`;
    txt += `&精神重傷/-1/999 精神重傷化\n`;
    txt += `&肉体重傷- 肉体重傷解除\n`;
    txt += `&精神重傷- 精神重傷解除\n`;
    txt += `\n`;
    txt += `//--- 攻撃\n`;
    Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => { return elem.querySelector('[id$=place]').value === ''; }).map(elem => {
      return {
        name: elem.querySelector('[id$=name]').value,
        aim: elem.querySelector('[id$=aim]').value,
        damage: elem.querySelector('[id$=damage]').value,
        range: elem.querySelector('[id$=range]').value,
        notes: elem.querySelector('[id$=notes]').value
      };
    }).forEach(value => {
      txt += `({攻撃力}+0{肉体重傷}{精神重傷})R>=${value.aim}[,1,13] 攻撃判定(${value.name || '武器名'}) ${value.range || '射程未設定'} 【${value.notes || '特殊機能無し'}】\n`;
      if (value.range === '格闘') {
        txt += `C({破壊力}+) ダメージ(${value.name || '武器名'})\n`;
      } else {
        txt += `C(${value.damage}) ダメージ(${value.name || '武器名'})\n`;
      }
      txt += `\n`;
    });
    txt += `\n`;
    txt += `# 各種表は、末尾に数値を入れることで回数を指定してダイスロール可能 例:TAGT3 タグ決定表\n`;
    txt += `//--- # 計画フェイズ\n`;
    txt += `//--- ## 情報判定\n`;
    txt += `TAGT タグ決定表\n`;
    txt += `\n`;
    txt += `//--- ### イベント表 +,- でダイス目修正、=でダイス目指定が可能\n`;
    txt += `CrimeIET 犯罪表\n`;
    txt += `LifeIET 生活表\n`;
    txt += `LoveIET 恋愛表\n`;
    txt += `CultureIET 教養表\n`;
    txt += `CombatIET 戦闘表\n`;
    txt += `\n`;
    txt += `//--- ### ハプニング表 +,- でダイス目修正、=でダイス目指定が可能\n`;
    txt += `CrimeIHT 犯罪表\n`;
    txt += `LifeIHT 生活表\n`;
    txt += `LoveIHT 恋愛表\n`;
    txt += `CultureIHT 教養表\n`;
    txt += `CombatIHT 戦闘表\n`;
    txt += `\n`;
    txt += `//--- ## ロマンス\n`;
    txt += `RomanceFT ロマンスファンブル表\n`;
    txt += `\n`;
    txt += `//--- # 実行フィエズ\n`;
    txt += `//--- ## 血戦\n`;
    txt += `FumbleT 命中判定ファンブル表\n`;
    txt += `FatalT 致命傷表\n`;
    txt += `\n`;
    txt += `//--- ## ケチャップ\n`;
    txt += `AccidentT アクシデント表\n`;
    txt += `GeneralAT 汎用アクシデント表\n`;
    txt += `\n`;
    txt += `//--- ## 宝物表\n`;
    txt += `GetgT ガラクタ\n`;
    txt += `GetzT 実用品\n`;
    txt += `GetnT 値打ち物\n`;
    txt += `GetkT 奇天烈\n`;
    txt += `\n`;
    txt += `//--- # アフタープレイ\n`;
    txt += `AfterT その後表\n`;
    txt += `\n`;
    txt += `//--- # その他\n`;
    txt += `KusaiMT 臭い飯表\n`;
    txt += `EnterT 登場表\n`;
    txt += `BudTT バッドトリップ表\n`;
    txt += `GETSST 「サタスペ」のベースとアクセサリを出力(末尾にアクセサリ数入力、省略時１)\n`;
    txt += `NPCT NPCの年齢と好みを一括出力\n`;
    return txt;
  };

  /* バフパレットテキストの生成 */
  const getBuffPaletteText = () => {
    return '';
  };

  /* キャラクターの詳細データ要素を生成 */
  const createCharacterDetailElements = () => {
    const detailList = [];

    {
      const result = dataCreator({ name: 'リソース' });
      result.appendChild(dataCreator({ name: '肉体点', type: 'numberResource', currentValue: 10 - getElementValue('#cond\\.body\\.value', '0') }, 10));
      result.appendChild(dataCreator({ name: '精神点', type: 'numberResource', currentValue: 10 - getElementValue('#cond\\.mental\\.value', '0') }, 10));
      let life = getElementValue('#base\\.abl\\.life\\.value', '0');
      result.appendChild(dataCreator({ name: 'サイフ', type: 'numberResource', currentValue: life }, life));
      detailList.push(result);
    }

    {
      const result = dataCreator({ name: '能力値' });
      const environment = dataCreator({ name: '環境値' });
      const heaven = dataCreator({ name: '天分値' });
      const combat = dataCreator({ name: '戦闘値' });

      environment.appendChild(dataCreator({ name: '犯罪' }, getElementValue('#base\\.abl\\.crime\\.value', '0')));
      environment.appendChild(dataCreator({ name: '生活' }, getElementValue('#base\\.abl\\.life\\.value', '0')));
      environment.appendChild(dataCreator({ name: '恋愛' }, getElementValue('#base\\.abl\\.love\\.value', '0')));
      environment.appendChild(dataCreator({ name: '教養' }, getElementValue('#base\\.abl\\.culture\\.value', '0')));
      environment.appendChild(dataCreator({ name: '戦闘' }, getElementValue('#base\\.abl\\.combat\\.value', '0')));

      heaven.appendChild(dataCreator({ name: '肉体' }, getElementValue('#base\\.gift\\.body\\.value', '0')));
      heaven.appendChild(dataCreator({ name: '精神' }, getElementValue('#base\\.gift\\.mind\\.value', '0')));

      combat.appendChild(dataCreator({ name: '反応力' }, getElementValue('#base\\.power\\.initiative', '0')));
      combat.appendChild(dataCreator({ name: '攻撃力' }, getElementValue('#base\\.power\\.attack', '0')));
      combat.appendChild(dataCreator({ name: '破壊力' }, getElementValue('#base\\.power\\.destroy', '0')));

      result.appendChild(environment);
      result.appendChild(heaven);
      result.appendChild(combat);
      result.appendChild(dataCreator({ name: '性業値' }, getElementValue('#base\\.emotion', '0')));
      detailList.push(result);
    }

    {
      const result = dataCreator({ name: `装備品(装備限界${getElementValue('#outfitstotal\\.limit', '0')})` });
      let itemIndex = 1;

      /* 武器 */
      Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => {
        return elem.querySelector('[id$=place]').value === '';
      }).map(elem => {
        return `${elem.querySelector('[id$=name]').value} 命中:${elem.querySelector('[id$=aim]').value} ダメージ:${elem.querySelector('[id$=damage]').value} 射程:${elem.querySelector('[id$=range]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
      }).forEach(value => {
        result.appendChild(dataCreator({ name: `装備品${itemIndex++}` }, value));
      });

      /* 道具 */
      Array.from(document.querySelectorAll('#outfits tr[id^="outfits"]')).filter(elem => {
        return elem.querySelector('[id$=place]').value === '';
      }).map(elem => {
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

      /* 残りの枠を埋める */
      for (; itemIndex <= getElementValue('#outfitstotal\\.limit', '0');) {
        result.appendChild(dataCreator({ name: `装備品${itemIndex++}` }, ''));
      }

      detailList.push(result);
    }

    /* 乗物内のアイテム情報を追加 */
    Array.from(document.querySelectorAll('#vehicles tr[id^="vehicles"]')).map(elem => {
      return {
        text: `乗物:${elem.querySelector('[id$=name]').value} (荷物:${elem.querySelector('[id$=burden]').value})`,
        burden: elem.querySelector('[id$=burden]').value
      };
    }).forEach(value => {
      const result = dataCreator({ name: value.text });
      let itemIndex = 1;

      /* 武器 */
      Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => {
        return elem.querySelector('[id$=place]').value === '乗物';
      }).map(elem => {
        return `${elem.querySelector('[id$=name]').value} 命中:${elem.querySelector('[id$=aim]').value} ダメージ:${elem.querySelector('[id$=damage]').value} 射程:${elem.querySelector('[id$=range]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
      }).forEach(value => {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
      });

      /* 道具 */
      Array.from(document.querySelectorAll('#outfits tr[id^="outfits"]')).filter(elem => {
        return elem.querySelector('[id$=place]').value === '乗物';
      }).map(elem => {
        return `${elem.querySelector('[id$=name]').value} 使用:${elem.querySelector('[id$=use]').value} 効果:${elem.querySelector('[id$=effect]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
      }).forEach(value => {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
      });

      /* 残りの枠を埋める */
      for (; itemIndex <= value.burden;) {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, ''));
      }

      detailList.push(result);
    });

    /* アジト内のアイテム情報を追加 */
    {
      const result = dataCreator({ name: 'アジト' });
      let itemIndex = 1;

      /* 武器 */
      Array.from(document.querySelectorAll('#weapons tr[id^="weapons"]')).filter(elem => {
        return elem.querySelector('[id$=place]').value === 'アジト';
      }).map(elem => {
        return `${elem.querySelector('[id$=name]').value} 命中:${elem.querySelector('[id$=aim]').value} ダメージ:${elem.querySelector('[id$=damage]').value} 射程:${elem.querySelector('[id$=range]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
      }).forEach(value => {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
      });

      /* 道具 */
      Array.from(document.querySelectorAll('#outfits tr[id^="outfits"]')).filter(elem => {
        return elem.querySelector('[id$=place]').value === 'アジト';
      }).map(elem => {
        return `${elem.querySelector('[id$=name]').value} 使用:${elem.querySelector('[id$=use]').value} 効果:${elem.querySelector('[id$=effect]').value} 特殊機能:${elem.querySelector('[id$=notes]').value}`;
      }).forEach(value => {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, value));
      });

      /* 残りの枠を埋める */
      for (; itemIndex <= 10;) {
        result.appendChild(dataCreator({ name: `アイテム${itemIndex++}` }, ''));
      }

      detailList.push(result);
    }

    /* 異能情報を追加 */
    {
      const result = dataCreator({ name: '異能' });

      Array.from(document.querySelectorAll('#karma tr[id^="karma"]')).forEach(elem => {
        result.appendChild(dataCreator({ name: elem.querySelector('[id$=name]').value },
          `${elem.querySelector('[id$="price.name"]').value} 使用:${elem.querySelector('[id$="price.use"]').value} 対象:${elem.querySelector('[id$="price.target"]').value} 判定:${elem.querySelector('[id$="price.judge"]').value} 効果:${elem.querySelector('[id$="price.effect"]').value}`));
      });

      detailList.push(result);
    }

    /* 代償情報を追加 */
    {
      const result = dataCreator({ name: '代償' });

      Array.from(document.querySelectorAll('#karma tr[id^="karma"]')).forEach(elem => {
        result.appendChild(dataCreator({ name: elem.querySelector('[id$=name]').value },
          `${elem.querySelector('[id$="talent.name"]').value} 使用:${elem.querySelector('[id$="talent.use"]').value} 対象:${elem.querySelector('[id$="talent.target"]').value} 判定:${elem.querySelector('[id$="talent.judge"]').value} 効果:${elem.querySelector('[id$="talent.effect"]').value}`));
      });

      detailList.push(result);
    }

    /* パーソナル情報を追加 */
    {
      const result = dataCreator({ name: 'パーソナル' });

      result.appendChild(dataCreator({ name: '故郷' }, getElementValue('#base\\.homeland', '')));
      result.appendChild(dataCreator({ name: '性別' }, getElementValue('#base\\.sex', '')));
      result.appendChild(dataCreator({ name: '年齢' }, getElementValue('#base\\.age', '')));
      result.appendChild(dataCreator({ name: '外見' }, getElementValue('#base\\.style', '')));
      result.appendChild(dataCreator({ name: 'チーム' }, getElementValue('#base\\.team', '')));
      result.appendChild(dataCreator({ name: '表の顔' }, getElementValue('#base\\.surface', '')));
      result.appendChild(dataCreator({ name: '盟約' }, getElementValue('#base\\.alliance', '')));
      result.appendChild(dataCreator({ name: '階級' }, getElementValue('#base\\.hierarchy', '')));
      result.appendChild(dataCreator({ name: '好きなもの' }, getElementValue('#base\\.likes', '')));
      result.appendChild(dataCreator({ name: '嫌いなもの' }, getElementValue('#base\\.dislikes', '')));
      result.appendChild(dataCreator({ name: '好みのタイプ' }, getElementValue('#base\\.favorites', '')));
      result.appendChild(dataCreator({ name: '好きな映画' }, getElementValue('#base\\.movie', '')));
      result.appendChild(dataCreator({ name: '言語' }, getElementValue('#base\\.langueges', '')));

      detailList.push(result);
    }

    /* その他情報を追加 */
    {
      const result = dataCreator({ name: 'その他' });
      const state = dataCreator({ name: '状態' });
      const hideout = dataCreator({ name: 'アジト' });

      state.appendChild(dataCreator({ name: 'トラウマ' }, getElementValue('#cond\\.trauma\\.value', '0')));
      state.appendChild(dataCreator({ name: '中毒' }, getElementValue('#cond\\.addiction\\.value', '0')));
      state.appendChild(dataCreator({ name: 'トリコ' }, getElementValue('#cond\\.prisoner\\.value', '0')));
      state.appendChild(dataCreator({ name: 'SAN' }, getElementValue('#cond\\.san\\.value', '0')));
      state.appendChild(dataCreator({ name: 'クトゥルフ神話' }, getElementValue('#cond\\.cthulhu\\.value', '0')));

      hideout.appendChild(dataCreator({ name: '場所' }, getElementValue('#home\\.place', '')));
      hideout.appendChild(dataCreator({ name: '快適度' }, getElementValue('#home\\.comfortable', '')));
      hideout.appendChild(dataCreator({ name: 'セキュリティ' }, getElementValue('#home\\.security', '')));

      result.appendChild(dataCreator({ name: '趣味' }, Array.from(document.querySelectorAll('#div\\.hobby .input.selected span'), elem => elem.textContent).join(',')));
      result.appendChild(state);
      result.appendChild(hideout);

      detailList.push(result);
    }

    return [getElementValue('#base\\.name', 'NoName'), detailList];
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

      /* チャットパレットとバフパレットの生成 */
      const chatPaletteElement = createChatPalette('Satasupe', getChatPaletteText());
      const buffPaletteElement = createBuffPalette('Satasupe', getBuffPaletteText());

      /* キャラクターデータの生成と保存 */
      const characterElement = createCharacter(charaName, detailElements);
      createZipFile(charaName, characterElement, chatPaletteElement, buffPaletteElement);

    } catch (error) {
      console.error('エラーが発生しました:', error);
      alert(`処理中にエラーが発生しました: ${error.message}`);
    }
  };

  /* メイン処理実行 */
  main();
})();
