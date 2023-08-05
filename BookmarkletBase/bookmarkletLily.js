javascript: (() => {
  /* キャラシのサイト以外は処理しない */
  if (!/^http(s)?:\/\/charasheet\.vampire-blood\.net\//.test(window.document.location.href)) {
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
  const diceBotName = '';
  /* キャラ名を設定する */
  const charName = '';
  /* 詳細データを追加する */
  const detailList = [];

  {
    const result = dataCreator({name: 'リソース'});
    const maxHP = 100;
    result.appendChild(dataCreator({ name: 'HP', type: 'numberResource', currentValue: maxHP }, maxHP));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: 'リソース' });
    const maxHP = 100;
    result.appendChild(dataCreator({ name: '通常の数値' }, 0));
    result.appendChild(dataCreator({ name: 'HP', type: 'numberResource', currentValue: maxHP }, maxHP));
    result.appendChild(dataCreator({ name: 'ノート', type: 'note' }, ''));
    result.appendChild(dataCreator({ name: 'チェックボックス1(|で表組み可能)', type: 'markdown' }, '[]'.repeat('5')));
    result.appendChild(dataCreator({ name: 'チェックボックス2(|で表組み可能)', type: 'markdown' }, '[]'.repeat(3)));
    result.appendChild(dataCreator({ name: '単一チェック(チェックなし)', type: 'check' }, 0));
    result.appendChild(dataCreator({ name: '単一チェック(チェックあり)', type: 'check' }, 1));
    detailList.push(result);
  }

  /* チャットパレットの文字列 */
  const getChatPaletteText = () => {
    let txt = '';
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
