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
  const diceBotName = 'Cthulhu';
  /* キャラ名を設定する */
  const charName = document.querySelector('#pc_name').value;
  /* 詳細データを追加する */
  const detailList = [];

  {
    const result = dataCreator({ name: 'リソース' });
    const hp = document.querySelector('#NP9').value;
    const mp = document.querySelector('#NP10').value;
    const san = document.querySelector('input[name="SAN_Left"]').value;
    result.appendChild(dataCreator({ name: 'HP', type: 'numberResource', currentValue: hp }, hp));
    result.appendChild(dataCreator({ name: 'MP', type: 'numberResource', currentValue: mp }, mp));
    result.appendChild(dataCreator({ name: 'SAN', type: 'numberResource', currentValue: san }, san));
    result.appendChild(dataCreator({ name: '不定領域' }, document.querySelector('input[name="SAN_Danger"]').value));
    result.appendChild(dataCreator({ name: '所持金' }, document.querySelector('#money').value));
    result.appendChild(dataCreator({ name: '預金・借金' }, document.querySelector('#debt').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '能力値' });
    result.appendChild(dataCreator({ name: 'STR' }, document.querySelector('#NP1').value));
    result.appendChild(dataCreator({ name: 'CON' }, document.querySelector('#NP2').value));
    result.appendChild(dataCreator({ name: 'POW' }, document.querySelector('#NP3').value));
    result.appendChild(dataCreator({ name: 'DEX' }, document.querySelector('#NP4').value));
    result.appendChild(dataCreator({ name: 'APP' }, document.querySelector('#NP5').value));
    result.appendChild(dataCreator({ name: 'SIZ' }, document.querySelector('#NP6').value));
    result.appendChild(dataCreator({ name: 'INT' }, document.querySelector('#NP7').value));
    result.appendChild(dataCreator({ name: 'EDU' }, document.querySelector('#NP8').value));
    result.appendChild(dataCreator({ name: 'アイディア' }, document.querySelector('#NP12').value));
    result.appendChild(dataCreator({ name: '幸運' }, document.querySelector('#NP13').value));
    result.appendChild(dataCreator({ name: '知識' }, document.querySelector('#NP14').value));
    result.appendChild(dataCreator({ name: 'db' }, document.querySelector('input[name="dmg_bonus"]').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '武器' });
    for (const weaponData of Array.from(document.querySelectorAll('#Table_arms tr:not(.nodrag.nodrop)'))) {
      const weaponName = weaponData.querySelector('input[name="arms_name[]"]').value;
      if (weaponName) {
        const data = dataCreator({ name: weaponName });
        data.appendChild(dataCreator({ name: '成功率' }, weaponData.querySelector('input[name="arms_hit[]"]').value));
        data.appendChild(dataCreator({ name: 'ダメージ' }, weaponData.querySelector('input[name="arms_damage[]"]').value));
        data.appendChild(dataCreator({ name: '射程' }, weaponData.querySelector('input[name="arms_range[]"]').value));
        data.appendChild(dataCreator({ name: '攻撃回数' }, weaponData.querySelector('input[name="arms_attack_count[]"]').value));
        data.appendChild(dataCreator({ name: '装弾数' }, weaponData.querySelector('input[name="arms_last_shot[]"]').value));
        data.appendChild(dataCreator({ name: '耐久力' }, weaponData.querySelector('input[name="arms_vitality[]"]').value));
        data.appendChild(dataCreator({ name: 'その他', type: 'note' }, weaponData.querySelector('input[name="arms_sonota[]"]').value));
        result.appendChild(data);
      }
    }
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '所持品' });
    for(const itemData of Array.from(document.querySelectorAll('#Table_item tr:not(.nodrag.nodrop)'))) {
      const itemName = itemData.querySelector('input[name="item_name[]"]').value;
      if (itemName) {
        let data = dataCreator({ name: itemName });
        data.appendChild(dataCreator({ name: '単価' }, itemData.querySelector('input[name="item_tanka[]"]').value));
        data.appendChild(dataCreator({ name: '個数' }, itemData.querySelector('input[name="item_num[]"]').value));
        data.appendChild(dataCreator({ name: '価格' }, itemData.querySelector('input[name="item_price[]"]').value));
        data.appendChild(dataCreator({ name: '効果' }, itemData.querySelector('input[name="item_memo[]"]').value));
        result.appendChild(data);
      }
    }
    detailList.push(result);
  }
  {
    let result = dataCreator({ name: 'パーソナル' });
    result.appendChild(dataCreator({ name: '職業' }, document.querySelector('#shuzoku').value));
    result.appendChild(dataCreator({ name: '年齢' }, document.querySelector('#age').value));
    result.appendChild(dataCreator({ name: '性別' }, document.querySelector('#sex').value));
    result.appendChild(dataCreator({ name: '身長' }, document.querySelector('#pc_height').value));
    result.appendChild(dataCreator({ name: '体重' }, document.querySelector('#pc_weight').value));
    result.appendChild(dataCreator({ name: '出身' }, document.querySelector('#pc_kigen').value));
    result.appendChild(dataCreator({ name: 'その他メモ', type: 'note' }, document.querySelector('textarea[name="pc_making_memo"]').value));
    detailList.push(result);
  }

  /* チャットパレットの文字列 */
  const getChatPaletteText = () => {
    const skillSetter = (type, skillList) => {
      let result = ``;
      for (let skill of skillList) {
        if (skill.name) {
          result += `${type}<=${skill.value || 0} ${skill.name || `名称不明`}\n`
        }
      }
      return result;
    };
    const getSkillList = (idSelector) => {
      const rowParser = (element) => {
        const nameElement = element.querySelector('th');
        return {
          name: nameElement.textContent || nameElement.firstChild.value,
          value: element.querySelector('td.sumTD input').value
        };
      };
      return Array.from(document.querySelectorAll(`#${idSelector} tr:nth-child(n + 2)`), rowParser);
    };
    const battleSkillList = getSkillList('Table_battle_arts');
    const findSkillList = getSkillList('Table_find_arts');
    const actSkillList = getSkillList('Table_act_arts');
    const commuSkillList = getSkillList('Table_commu_arts');
    const knowSkillList = getSkillList('Table_know_arts');
    let txt = '';
    txt += `//--- ルルブ6版準拠\n`;
    txt += `CC<=\n`;
    txt += `\n`;
    txt += `CC<={SAN} SANチェック\n`;
    txt += `:SAN-LZ SANの減少\n`;
    txt += `:不定領域=({SAN}*4)/5 :SAN^={SAN} 不定領域の更新\n`;
    txt += `\n`;
    txt += `CC<={アイディア} アイディア\n`;
    txt += `CC<={幸運} 幸運\n`;
    txt += `CC<={知識} 知識\n`;
    txt += `\n`;
    txt += `//--- ## 探索技能\n`;
    txt += skillSetter('CC', findSkillList);
    txt += `\n`;
    txt += `//--- ## 行動技能\n`;
    txt += skillSetter('CC', actSkillList);
    txt += `\n`;
    txt += `//--- ## 交渉技能\n`;
    txt += skillSetter('CC', commuSkillList);
    txt += `\n`;
    txt += `//--- ## 知識技能\n`;
    txt += skillSetter('CC', knowSkillList);
    txt += `\n`;
    txt += `//--- ## 戦闘技能\n`;
    txt += `D+({db}) ダメージ\n`;
    txt += skillSetter('CCB', battleSkillList);
    txt += `=========================\n`;
    txt += `//--- 全てCCB\n`;
    txt += `CCB<=\n`;
    txt += `\n`;
    txt += `CC<={SAN} SANチェック\n`;
    txt += `:SAN-LZ SANの減少\n`;
    txt += `:不定領域=({SAN}*4)/5 :SAN^={SAN} 不定領域の更新\n`;
    txt += `\n`;
    txt += `CCB<={アイディア} アイディア\n`;
    txt += `CCB<={幸運} 幸運\n`;
    txt += `CCB<={知識} 知識\n`;
    txt += `\n`;
    txt += `//--- ## 探索技能\n`;
    txt += skillSetter('CCB', findSkillList);
    txt += `\n`;
    txt += `//--- ## 行動技能\n`;
    txt += skillSetter('CCB', actSkillList);
    txt += `\n`;
    txt += `//--- ## 交渉技能\n`;
    txt += skillSetter('CCB', commuSkillList);
    txt += `\n`;
    txt += `//--- ## 知識技能\n`;
    txt += skillSetter('CCB', knowSkillList);
    txt += `\n`;
    txt += `//--- ## 戦闘技能\n`;
    txt += `D+({db}) ダメージ\n`;
    txt += skillSetter('CCB', battleSkillList);
    txt += `=========================\n`;
    txt += `//--- 全てCC\n`;
    txt += `CC<=\n`;
    txt += `\n`;
    txt += `CC<={SAN} SANチェック\n`;
    txt += `:SAN-LZ SANの減少\n`;
    txt += `:不定領域=({SAN}*4)/5 :SAN^={SAN} 不定領域の更新\n`;
    txt += `\n`;
    txt += `CC<={アイディア} アイディア\n`;
    txt += `CC<={幸運} 幸運\n`;
    txt += `CC<={知識} 知識\n`;
    txt += `\n`;
    txt += `//--- ## 探索技能\n`;
    txt += skillSetter('CC', findSkillList);
    txt += `\n`;
    txt += `//--- ## 行動技能\n`;
    txt += skillSetter('CC', actSkillList);
    txt += `\n`;
    txt += `//--- ## 交渉技能\n`;
    txt += skillSetter('CC', commuSkillList);
    txt += `\n`;
    txt += `//--- ## 知識技能\n`;
    txt += skillSetter('CC', knowSkillList);
    txt += `\n`;
    txt += `//--- ## 戦闘技能\n`;
    txt += `D+({db}) ダメージ\n`;
    txt += skillSetter('CC', battleSkillList);
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
