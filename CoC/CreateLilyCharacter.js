javascript: (() => {
  /* サイト検証 */
  const validateSite = () => {
    const url = new URL(window.location.href);
    if (url.hostname !== 'charasheet.vampire-blood.net') {
      alert('このブックマークレットはCoC キャラクターシートページでのみ使用できます。');
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

  /* チャットパレットテキストの生成 */
  const generateChatPaletteText = () => {
    /* スキル情報取得ヘルパー関数 */
    const skillSetter = (type, skillList) => {
      let result = ``;
      for (let skill of skillList) {
        if (skill.name) {
          result += `${type}<=${skill.value || 0} ${skill.name || `名称不明`}\n`
        }
      }
      return result;
    };

    /* テーブルからスキル情報を取得する関数 */
    const getSkillList = (idSelector) => {
      const rowParser = (element) => {
        const nameElement = element.querySelector('th');
        return {
          name: nameElement.textContent || nameElement.firstChild.value,
          value: element.querySelector('td.sumTD input')?.value || '0'
        };
      };
      return Array.from(document.querySelectorAll(`#${idSelector} tr:nth-child(n + 2)`), rowParser);
    };

    /* 各カテゴリのスキルを取得 */
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

  /* キャラクターの詳細データ要素を生成 */
  const createCharacterDetailElements = () => {
    const detailList = [];

    /* リソース情報の追加 */
    const resourceData = xml.createDataElement({ name: 'リソース' });
    const hp = getElementValue('#NP9', '0');
    const mp = getElementValue('#NP10', '0');
    const san = getElementValue('input[name="SAN_Left"]', '0');

    resourceData.appendChild(xml.createDataElement({ name: 'HP', type: 'numberResource', currentValue: hp }, hp));
    resourceData.appendChild(xml.createDataElement({ name: 'MP', type: 'numberResource', currentValue: mp }, mp));
    resourceData.appendChild(xml.createDataElement({ name: 'SAN', type: 'numberResource', currentValue: san }, san));
    resourceData.appendChild(xml.createDataElement({ name: '不定領域' }, getElementValue('input[name="SAN_Danger"]', '0')));
    resourceData.appendChild(xml.createDataElement({ name: '所持金' }, getElementValue('#money', '0')));
    resourceData.appendChild(xml.createDataElement({ name: '預金・借金' }, getElementValue('#debt', '0')));

    detailList.push(resourceData);

    /* 能力値情報の追加 */
    const abilityData = xml.createDataElement({ name: '能力値' });

    abilityData.appendChild(xml.createDataElement({ name: 'STR' }, getElementValue('#NP1', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'CON' }, getElementValue('#NP2', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'POW' }, getElementValue('#NP3', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'DEX' }, getElementValue('#NP4', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'APP' }, getElementValue('#NP5', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'SIZ' }, getElementValue('#NP6', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'INT' }, getElementValue('#NP7', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'EDU' }, getElementValue('#NP8', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'アイディア' }, getElementValue('#NP12', '0')));
    abilityData.appendChild(xml.createDataElement({ name: '幸運' }, getElementValue('#NP13', '0')));
    abilityData.appendChild(xml.createDataElement({ name: '知識' }, getElementValue('#NP14', '0')));
    abilityData.appendChild(xml.createDataElement({ name: 'db' }, getElementValue('input[name="dmg_bonus"]', '0')));

    detailList.push(abilityData);

    /* 武器情報の追加 */
    const weaponData = xml.createDataElement({ name: '武器' });

    Array.from(document.querySelectorAll('#Table_arms tr:not(.nodrag.nodrop)')).forEach(weapon => {
      const weaponName = weapon.querySelector('input[name="arms_name[]"]')?.value;
      if (weaponName) {
        const weaponDetails = xml.createDataElement({ name: weaponName });

        weaponDetails.appendChild(xml.createDataElement({ name: '成功率' }, weapon.querySelector('input[name="arms_hit[]"]')?.value || '0'));
        weaponDetails.appendChild(xml.createDataElement({ name: 'ダメージ' }, weapon.querySelector('input[name="arms_damage[]"]')?.value || '0'));
        weaponDetails.appendChild(xml.createDataElement({ name: '射程' }, weapon.querySelector('input[name="arms_range[]"]')?.value || '0'));
        weaponDetails.appendChild(xml.createDataElement({ name: '攻撃回数' }, weapon.querySelector('input[name="arms_attack_count[]"]')?.value || '0'));
        weaponDetails.appendChild(xml.createDataElement({ name: '装弾数' }, weapon.querySelector('input[name="arms_last_shot[]"]')?.value || '0'));
        weaponDetails.appendChild(xml.createDataElement({ name: '耐久力' }, weapon.querySelector('input[name="arms_vitality[]"]')?.value || '0'));
        weaponDetails.appendChild(xml.createDataElement({ name: 'その他', type: 'note' }, weapon.querySelector('input[name="arms_sonota[]"]')?.value || ''));

        weaponData.appendChild(weaponDetails);
      }
    });

    detailList.push(weaponData);

    /* 所持品情報の追加 */
    const itemData = xml.createDataElement({ name: '所持品' });

    Array.from(document.querySelectorAll('#Table_item tr:not(.nodrag.nodrop)')).forEach(item => {
      const itemName = item.querySelector('input[name="item_name[]"]')?.value;
      if (itemName) {
        const itemDetails = xml.createDataElement({ name: itemName });

        itemDetails.appendChild(xml.createDataElement({ name: '単価' }, item.querySelector('input[name="item_tanka[]"]')?.value || '0'));
        itemDetails.appendChild(xml.createDataElement({ name: '個数' }, item.querySelector('input[name="item_num[]"]')?.value || '0'));
        itemDetails.appendChild(xml.createDataElement({ name: '価格' }, item.querySelector('input[name="item_price[]"]')?.value || '0'));
        itemDetails.appendChild(xml.createDataElement({ name: '効果' }, item.querySelector('input[name="item_memo[]"]')?.value || ''));

        itemData.appendChild(itemDetails);
      }
    });

    detailList.push(itemData);

    /* パーソナル情報の追加 */
    const personalData = xml.createDataElement({ name: 'パーソナル' });

    personalData.appendChild(xml.createDataElement({ name: '職業' }, getElementValue('#shuzoku', '')));
    personalData.appendChild(xml.createDataElement({ name: '年齢' }, getElementValue('#age', '')));
    personalData.appendChild(xml.createDataElement({ name: '性別' }, getElementValue('#sex', '')));
    personalData.appendChild(xml.createDataElement({ name: '身長' }, getElementValue('#pc_height', '')));
    personalData.appendChild(xml.createDataElement({ name: '体重' }, getElementValue('#pc_weight', '')));
    personalData.appendChild(xml.createDataElement({ name: '出身' }, getElementValue('#pc_kigen', '')));
    personalData.appendChild(xml.createDataElement({ name: 'その他メモ', type: 'note' }, getElementValue('textarea[name="pc_making_memo"]', '')));

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
      const chatPaletteElement = xml.createChatPalette('Cthulhu', generateChatPaletteText());
      const buffPaletteElement = xml.createBuffPalette('Cthulhu', '');

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
