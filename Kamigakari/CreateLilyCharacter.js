javascript: (() => {
  /* キャラシのサイト以外は処理しない */
  const url = new URL(window.location.href);
  if (url.hostname !== 'charasheet.vampire-blood.net') {
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
  const diceBotName = 'Kamigakari';
  /* キャラ名を設定する */
  const charName = `${document.querySelector('#pc_name').value || 'NoName'}`;
  /* 詳細データを追加する */
  const detailList = [];

  {
    const result = dataCreator({ name: 'リソース' });
    let hp = document.querySelector('#NP9').value;
    result.appendChild(dataCreator({ name: '生命力', type: 'numberResource', currentValue: hp }, hp));
    result.appendChild(dataCreator({ name: '霊紋', type: 'numberResource', currentValue: 22 }, 22));
    result.appendChild(dataCreator({ name: '感情', type: 'numberResource', currentValue: 3 }, 7));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '判定値' });
    result.appendChild(dataCreator({ name: '体力' }, document.querySelector('#NB1').value));
    result.appendChild(dataCreator({ name: '敏捷' }, document.querySelector('#NB2').value));
    result.appendChild(dataCreator({ name: '知性' }, document.querySelector('#NB3').value));
    result.appendChild(dataCreator({ name: '精神' }, document.querySelector('#NB4').value));
    result.appendChild(dataCreator({ name: '幸運' }, document.querySelector('#NB5').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '戦闘能力値' });
    result.appendChild(dataCreator({ name: '命中' }, document.querySelector('#NP1').value));
    result.appendChild(dataCreator({ name: '回避' }, document.querySelector('#kaihi').value));
    result.appendChild(dataCreator({ name: '発動' }, document.querySelector('#NP3').value));
    result.appendChild(dataCreator({ name: '抵抗' }, document.querySelector('#NP4').value));
    result.appendChild(dataCreator({ name: '看破' }, document.querySelector('#NP5').value));
    result.appendChild(dataCreator({ name: '物D' }, document.querySelector('#NP6').value));
    result.appendChild(dataCreator({ name: '魔D' }, document.querySelector('#NP7').value));
    result.appendChild(dataCreator({ name: '行動値' }, document.querySelector('#act').value));
    result.appendChild(dataCreator({ name: '攻撃命中値' }, document.querySelector('input[name=arms_total_hit]').value));
    result.appendChild(dataCreator({ name: '攻撃ダメージ値' }, document.querySelector('input[name=arms_total_damage]').value));
    result.appendChild(dataCreator({ name: '主能力値' }, Math.max(...[
      document.querySelector('#NK1').value,
      document.querySelector('#NK2').value,
      document.querySelector('#NK3').value,
      document.querySelector('#NK4').value,
      document.querySelector('#NK5').value,
    ].map(e => Number(e)))));
    result.appendChild(dataCreator({ name: '装甲' }, document.querySelector('#def').value));
    result.appendChild(dataCreator({ name: '結界' }, document.querySelector('#mdef').value));
    result.appendChild(dataCreator({ name: '移動力' }, document.querySelector('#ido').value));
    result.appendChild(dataCreator({ name: '全力移動' }, document.querySelector('#zenryoku_ido').value));
    result.appendChild(dataCreator({ name: '生命燃焼時の生命力' }, document.querySelector('#NK1').value));
    detailList.push(result);
  }
  {
    const selectedText = (selectDom) => {
      if (!selectDom || selectDom.tagName !== 'SELECT') {
        return '';
      }
      return selectDom.options[selectDom.selectedIndex].textContent
    };
    const result = dataCreator({ name: 'パーソナルデータ' });
    result.appendChild(dataCreator({ name: '種族' }, `${document.querySelector('input[name=manual_shuzoku]').value} ${selectedText(document.querySelector('#SL_shuzoku_type'))}型`));
    result.appendChild(dataCreator({ name: 'メイン称号' }, `${document.querySelector('#main_class').value} タイプ${selectedText(document.querySelector('#SL_main_class_type'))}`));
    result.appendChild(dataCreator({ name: 'サブ称号' }, `${document.querySelector('#support_class').value} タイプ${selectedText(document.querySelector('#SL_sub_class_type'))}`));
    result.appendChild(dataCreator({ name: '表の職業' }, document.querySelector('input[name=omote_face]').value));
    result.appendChild(dataCreator({ name: '所属組織' }, document.querySelector('#shuzoku').value));
    result.appendChild(dataCreator({ name: '所持金' }, document.querySelector('#money').value));
    detailList.push(result);
  }

  /* チャットパレットの文字列 */
  const getChatPaletteText = () => {
    let txt = '';
    txt += `//---判定値\n`;
    txt += `2D6+{体力}>=0 【体力】\n`;
    txt += `2D6+{敏捷}>=0 【敏捷】\n`;
    txt += `2D6+{知性}>=0 【知性】\n`;
    txt += `2D6+{精神}>=0 【精神】\n`;
    txt += `2D6+{幸運}>=0 【幸運】\n`;
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
    txt += `2D6+{命中}>=0 【命中】\n`;
    txt += `2D6+{回避}>=0 【回避】(装備品適用後)\n`;
    txt += `2D6+{発動}>=0 【発動】\n`;
    txt += `2D6+{抵抗}>=0 【抵抗】\n`;
    txt += `2D6+{看破}>=0 【看破】\n`;
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
    txt += `2D6+{攻撃命中値}>=0 【攻撃命中値】(装備品適用後)\n`;
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
