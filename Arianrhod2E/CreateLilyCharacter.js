javascript: (() => {
  /* ユーティリティ関数 */
  const getElementValue = (selector, defaultValue = '') => {
    const element = document.querySelector(selector);
    return element?.value || defaultValue;
  };

  /* 検証関数群 */
  const validateSite = () => {
    const url = new URL(window.location.href);
    if (url.hostname !== 'charasheet.vampire-blood.net') {
      alert('このブックマークレットはアリアンロッドキャラクターシートページでのみ使用できます。');
      return false;
    }
    return true;
  };

  const validateBrowser = () => {
    if (!window.URL || !window.XMLSerializer || !document.createElement) {
      alert('このブラウザはサポートされていません。');
      return false;
    }
    return true;
  };

  const validateCharacterSheet = () => {
    if (!document.querySelector('#pc_name')) {
      alert('キャラクターシートが正しく読み込まれていません。');
      return false;
    }
    return true;
  };

  /* 非同期処理関数 */
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

  /* XML生成関数群 */
  const dataCreator = (attrs, value = '') => {
    const elem = document.createElement('data');
    for (const [key, attrValue] of Object.entries(attrs)) {
      elem.setAttribute(key, attrValue);
    }
    elem.textContent = value;
    return elem;
  };

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

  const createChatPalette = (diceBotName, chatPalette) => {
    const xml = document.createElement('chat-palette');
    xml.setAttribute('dicebot', diceBotName);
    xml.textContent = chatPalette;
    return xml;
  };

  const createBuffPalette = (diceBotName, buffPalette) => {
    const xml = document.createElement('buff-palette');
    xml.setAttribute('dicebot', diceBotName);
    xml.textContent = buffPalette;
    return xml;
  };

  /* データ処理関数群 */
  const getChatPaletteText = () => {
    let txt = '';
    txt += `//--- 能力値判定\n`;
    txt += '2D6+{筋力}>=? 【筋力】判定\n';
    txt += '2D6+{器用}>=? 【器用】判定\n';
    txt += '2D6+{敏捷}>=? 【敏捷】判定\n';
    txt += '2D6+{知力}>=? 【知力】判定\n';
    txt += '2D6+{感知}>=? 【感知】判定\n';
    txt += '2D6+{精神}>=? 【精神】判定\n';
    txt += '2D6+{幸運}>=? 【幸運】判定\n';
    txt += `\n`;
    txt += `//--- 技能判定\n`;
    txt += `${getElementValue('#dice_wanatanti')}D6+{感知}+${getElementValue('[name="THS1"]', '0')}+${getElementValue('[name="THO1"]', '0')}>=? トラップ探知判定\n`;
    txt += `${getElementValue('#dice_wanakaijo')}D6+{器用}+${getElementValue('[name="THS2"]', '0')}+${getElementValue('[name="THO2"]', '0')}>=? トラップ解除判定\n`;
    txt += `${getElementValue('#dice_kanti')}D6+{感知}+${getElementValue('[name="THS3"]', '0')}+${getElementValue('[name="THO3"]', '0')}>=? 危険感知判定\n`;
    txt += `${getElementValue('#dice_sikibetu')}D6+{知力}+${getElementValue('[name="THS4"]', '0')}+${getElementValue('[name="THO4"]', '0')}>=? エネミー識別判定\n`;
    txt += `${getElementValue('#dice_kantei')}D6+{知力}+${getElementValue('[name="THS5"]', '0')}+${getElementValue('[name="THO5"]', '0')}>=? アイテム鑑定判定\n`;
    txt += `${getElementValue('#dice_majutu')}D6+{知力}+${getElementValue('[name="THS6"]', '0')}+${getElementValue('[name="THO6"]', '0')}>=? 魔術判定\n`;
    txt += `${getElementValue('#dice_juka')}D6+{精神}+${getElementValue('[name="THS7"]', '0')}+${getElementValue('[name="THO7"]', '0')}>=? 呪歌判定\n`;
    txt += `${getElementValue('#dice_renkin')}D6+{器用}+${getElementValue('[name="THS8"]', '0')}+${getElementValue('[name="THO8"]', '0')}>=? 錬金術判定\n`;
    txt += `\n`;
    txt += `//--- 受動判定\n`;
    txt += `${getElementValue('#dice_kaihi')}D6+${getElementValue('#BSUM3')}>=? 回避判定\n`;
    txt += `:HP-(n-{物防})LZ 【被物理ダメージ】\n`;
    txt += `:HP-(n-{魔防})LZ 【被魔法ダメージ】\n`;
    txt += `:HP-nLZ 【被貫通ダメージ】\n`;
    txt += `\n`;
    txt += `//--- 能動判定\n`;
    txt += `${getElementValue('#dice_meichu')}D6+${getElementValue('#BSUM1R')}>=? 右手命中\n`;
    txt += `${getElementValue('#dice_attack')}D6+${getElementValue('#BSUM2R')}>=? 右手ダメージロール\n`;
    txt += `${getElementValue('#dice_meichu')}D6+${getElementValue('#BSUM1L')}>=? 左手命中\n`;
    txt += `${getElementValue('#dice_attack')}D6+${getElementValue('#BSUM2L')}>=? 左手ダメージロール\n`;
    txt += `${getElementValue('#dice_majutu')}D6+{知力}+${getElementValue('[name="THS6"]', '0')}+${getElementValue('[name="THO6"]', '0')}>=? 魔術判定\n`;
    txt += `\n`;
    txt += `//--- その他\n`;
    txt += `:フェイト-L フェイトの使用\n`;
    txt += `:HP+2D6LZ HPポーション\n`;
    txt += `:MP+2D6LZ MPポーション\n`;
    txt += `&R- &D バフのラウンド進行\n`;
    txt += `\n`;
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

  const getBuffPaletteText = () => {
    return '';
  };

  /* キャラクターデータ生成 */
  const createCharacterDetailElements = () => {
    const detailList = [];

    /* リソース情報 */
    const resourceData = dataCreator({ name: 'リソース' });
    const HP = getElementValue('#NP8', '0');
    resourceData.appendChild(dataCreator({ name: 'HP', type: 'numberResource', currentValue: HP }, HP));
    const MP = getElementValue('#NP9', '0');
    resourceData.appendChild(dataCreator({ name: 'MP', type: 'numberResource', currentValue: MP }, MP));
    const fate = getElementValue('#SL_fate', '0');
    resourceData.appendChild(dataCreator({ name: 'フェイト', type: 'numberResource', currentValue: fate }, fate));
    resourceData.appendChild(dataCreator({ name: '行動値' }, getElementValue('#BSUM6', '0')));
    resourceData.appendChild(dataCreator({ name: '移動力' }, getElementValue('#BSUM7', '0')));
    resourceData.appendChild(dataCreator({ name: '物防' }, getElementValue('#BSUM4', '0')));
    resourceData.appendChild(dataCreator({ name: '魔防' }, getElementValue('#BSUM5', '0')));
    detailList.push(resourceData);

    /* 所持品情報 */
    const inventoryData = dataCreator({ name: '所持品' });
    inventoryData.appendChild(dataCreator({ name: '所持金' }, getElementValue('#money', '0')));
    inventoryData.appendChild(dataCreator({ name: '預金・借金' }, getElementValue('#dept', '0')));
    inventoryData.appendChild(dataCreator(
      { name: '重量', type: 'numberResource', currentValue: getElementValue('#weight_item_sum', '0') },
      getElementValue('#weight_item_max', '0')
    ));

    /* アイテム一覧 */
    const itemNameElements = document.querySelectorAll('[name="item_name[]"]');
    for (const itemNameElement of itemNameElements) {
      if (!itemNameElement.value) continue;

      const itemRow = itemNameElement.closest('tr');
      const itemWeight = itemRow.querySelector('[name="item_weight[]"]')?.value || '';
      const itemPrice = itemRow.querySelector('[name="item_price[]"]')?.value || '';
      const itemMemo = itemRow.querySelector('[name="item_memo[]"]')?.value || '';

      const itemDesc = `重量[${itemWeight}]価格[${itemPrice}]効果・備考[${itemMemo}]`;
      inventoryData.appendChild(dataCreator({ name: itemNameElement.value }, itemDesc));
    }
    detailList.push(inventoryData);

    /* キャラクター基本情報 */
    const characterInfo = dataCreator({ name: 'キャラクター情報' });
    characterInfo.appendChild(dataCreator(
      { name: 'CL' },
      getElementValue('#SL_level', '1')
    ));

    const classInfo = dataCreator({ name: 'クラス' });
    const mainClass = document.querySelector('#SL_main_class')?.selectedOptions[0]?.textContent || '';
    classInfo.appendChild(dataCreator({ name: 'メイン' }, mainClass));
    classInfo.appendChild(dataCreator({ name: 'サポート' }, getElementValue('#support_class', '')));
    characterInfo.appendChild(classInfo);

    const race = getElementValue('#shuzoku', '') ||
      (document.querySelector('#SL_shuzoku')?.selectedOptions[0]?.text || '');
    characterInfo.appendChild(dataCreator({ name: '種族' }, race));
    characterInfo.appendChild(dataCreator({ name: '性別' }, getElementValue('#sex', '')));
    characterInfo.appendChild(dataCreator({ name: '年齢' }, getElementValue('#age', '')));
    characterInfo.appendChild(dataCreator({ name: '身長' }, getElementValue('#pc_height', '')));
    characterInfo.appendChild(dataCreator({ name: '体重' }, getElementValue('#pc_weight', '')));
    characterInfo.appendChild(dataCreator({ name: '髪の色' }, getElementValue('#color_hair', '')));
    characterInfo.appendChild(dataCreator({ name: '瞳の色' }, getElementValue('#color_eye', '')));
    characterInfo.appendChild(dataCreator({ name: '肌の色' }, getElementValue('#color_skin', '')));
    detailList.push(characterInfo);

    /* 能力値 */
    const abilityData = dataCreator({ name: '能力値' });
    abilityData.appendChild(dataCreator({ name: '筋力' }, getElementValue('#NP1', '0')));
    abilityData.appendChild(dataCreator({ name: '器用' }, getElementValue('#NP2', '0')));
    abilityData.appendChild(dataCreator({ name: '敏捷' }, getElementValue('#NP3', '0')));
    abilityData.appendChild(dataCreator({ name: '知力' }, getElementValue('#NP4', '0')));
    abilityData.appendChild(dataCreator({ name: '感知' }, getElementValue('#NP5', '0')));
    abilityData.appendChild(dataCreator({ name: '精神' }, getElementValue('#NP6', '0')));
    abilityData.appendChild(dataCreator({ name: '幸運' }, getElementValue('#NP7', '0')));
    detailList.push(abilityData);

    /* 装備情報 */
    const equipmentData = dataCreator({ name: '装備' });

    /* 武器データ */
    const weaponData = dataCreator({ name: '武器' });

    /* 右手武器 */
    const rightWeaponName = getElementValue('#IR_name', '');
    if (rightWeaponName) {
      const rightWeapon = dataCreator({ name: rightWeaponName });
      let weaponInfo = '';
      weaponInfo += `|命中|${getElementValue('#BIR1', '0')}|\n`;
      weaponInfo += `|攻撃力|${getElementValue('#BIR2', '0')}|\n`;
      weaponInfo += `|回避|${getElementValue('#BIR3', '0')}|\n`;
      weaponInfo += `|物防|${getElementValue('#BIR4', '0')}|\n`;
      weaponInfo += `|魔防|${getElementValue('#BIR5', '0')}|\n`;
      weaponInfo += `|行動値|${getElementValue('#BIR6', '0')}|\n`;
      weaponInfo += `|移動力|${getElementValue('#BIR7', '0')}|\n`;
      weaponInfo += `|射程|${getElementValue('#IR_shatei', '')}|\n`;
      weaponInfo += `|種別|${getElementValue('#IR_type', '')}|\n`;
      weaponInfo += `|Lv|${getElementValue('#IR_lv', '')}|\n`;
      weaponInfo += `|重量|${getElementValue('#IR_weight', '')}|\n`;
      weaponInfo += `|価格|${getElementValue('#IR_price', '')}|\n`;
      weaponInfo += `|クラス制限|${getElementValue('#IR_only_cls', '')}|\n`;

      rightWeapon.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, weaponInfo));
      rightWeapon.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, getElementValue('#IR_memo', '')));
      weaponData.appendChild(rightWeapon);
    }

    /* 左手武器 */
    const leftWeaponName = getElementValue('#IL_name', '');
    if (leftWeaponName) {
      const leftWeapon = dataCreator({ name: leftWeaponName });
      let weaponInfo = '';
      weaponInfo += `|命中|${getElementValue('#BIL1', '0')}|\n`;
      weaponInfo += `|攻撃力|${getElementValue('#BIL2', '0')}|\n`;
      weaponInfo += `|回避|${getElementValue('#BIL3', '0')}|\n`;
      weaponInfo += `|物防|${getElementValue('#BIL4', '0')}|\n`;
      weaponInfo += `|魔防|${getElementValue('#BIL5', '0')}|\n`;
      weaponInfo += `|行動値|${getElementValue('#BIL6', '0')}|\n`;
      weaponInfo += `|移動力|${getElementValue('#BIL7', '0')}|\n`;
      weaponInfo += `|射程|${getElementValue('#IL_shatei', '')}|\n`;
      weaponInfo += `|種別|${getElementValue('#IL_type', '')}|\n`;
      weaponInfo += `|Lv|${getElementValue('#IL_lv', '')}|\n`;
      weaponInfo += `|重量|${getElementValue('#IL_weight', '')}|\n`;
      weaponInfo += `|価格|${getElementValue('#IL_price', '')}|\n`;
      weaponInfo += `|クラス制限|${getElementValue('#IL_only_cls', '')}|\n`;

      leftWeapon.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, weaponInfo));
      leftWeapon.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, getElementValue('#IL_memo', '')));
      weaponData.appendChild(leftWeapon);
    }

    weaponData.appendChild(dataCreator(
      { name: '重量', type: 'numberResource', currentValue: getElementValue('#weight_arms_sum', '0') },
      getElementValue('#weight_arms_max', '0')
    ));
    equipmentData.appendChild(weaponData);

    /* 防具データ */
    const armorData = dataCreator({ name: '防具等' });

    /* 頭装備 */
    const headArmorName = getElementValue('#IH_name', '');
    if (headArmorName) {
      const headArmor = dataCreator({ name: headArmorName });
      let armorInfo = '';
      armorInfo += `|命中|${getElementValue('#BIH1', '0')}|\n`;
      armorInfo += `|攻撃力|${getElementValue('#BIH2', '0')}|\n`;
      armorInfo += `|回避|${getElementValue('#BIH3', '0')}|\n`;
      armorInfo += `|物防|${getElementValue('#BIH4', '0')}|\n`;
      armorInfo += `|魔防|${getElementValue('#BIH5', '0')}|\n`;
      armorInfo += `|行動値|${getElementValue('#BIH6', '0')}|\n`;
      armorInfo += `|移動力|${getElementValue('#BIH7', '0')}|\n`;
      armorInfo += `|種別|${getElementValue('#IH_type', '')}|\n`;
      armorInfo += `|Lv|${getElementValue('#IH_lv', '')}|\n`;
      armorInfo += `|重量|${getElementValue('#IH_weight', '')}|\n`;
      armorInfo += `|価格|${getElementValue('#IH_price', '')}|\n`;
      armorInfo += `|クラス制限|${getElementValue('#IH_only_cls', '')}|\n`;

      headArmor.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, armorInfo));
      headArmor.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, getElementValue('#IH_memo', '')));
      armorData.appendChild(headArmor);
    }

    /* 身体装備 */
    const bodyArmorName = getElementValue('#IB_name', '');
    if (bodyArmorName) {
      const bodyArmor = dataCreator({ name: bodyArmorName });
      let armorInfo = '';
      armorInfo += `|命中|${getElementValue('#BIB1', '0')}|\n`;
      armorInfo += `|攻撃力|${getElementValue('#BIB2', '0')}|\n`;
      armorInfo += `|回避|${getElementValue('#BIB3', '0')}|\n`;
      armorInfo += `|物防|${getElementValue('#BIB4', '0')}|\n`;
      armorInfo += `|魔防|${getElementValue('#BIB5', '0')}|\n`;
      armorInfo += `|行動値|${getElementValue('#BIB6', '0')}|\n`;
      armorInfo += `|移動力|${getElementValue('#BIB7', '0')}|\n`;
      armorInfo += `|種別|${getElementValue('#IB_type', '')}|\n`;
      armorInfo += `|Lv|${getElementValue('#IB_lv', '')}|\n`;
      armorInfo += `|重量|${getElementValue('#IB_weight', '')}|\n`;
      armorInfo += `|価格|${getElementValue('#IB_price', '')}|\n`;
      armorInfo += `|クラス制限|${getElementValue('#IB_only_cls', '')}|\n`;

      bodyArmor.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, armorInfo));
      bodyArmor.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, getElementValue('#IB_memo', '')));
      armorData.appendChild(bodyArmor);
    }

    /* サポート装備 */
    const supportEquipName = getElementValue('#IS_name', '');
    if (supportEquipName) {
      const supportEquip = dataCreator({ name: supportEquipName });
      let equipInfo = '';
      equipInfo += `|命中|${getElementValue('#BIS1', '0')}|\n`;
      equipInfo += `|攻撃力|${getElementValue('#BIS2', '0')}|\n`;
      equipInfo += `|回避|${getElementValue('#BIS3', '0')}|\n`;
      equipInfo += `|物防|${getElementValue('#BIS4', '0')}|\n`;
      equipInfo += `|魔防|${getElementValue('#BIS5', '0')}|\n`;
      equipInfo += `|行動値|${getElementValue('#BIS6', '0')}|\n`;
      equipInfo += `|移動力|${getElementValue('#BIS7', '0')}|\n`;
      equipInfo += `|種別|${getElementValue('#IS_type', '')}|\n`;
      equipInfo += `|Lv|${getElementValue('#IS_lv', '')}|\n`;
      equipInfo += `|重量|${getElementValue('#IS_weight', '')}|\n`;
      equipInfo += `|価格|${getElementValue('#IS_price', '')}|\n`;
      equipInfo += `|クラス制限|${getElementValue('#IS_only_cls', '')}|\n`;

      supportEquip.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, equipInfo));
      supportEquip.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, getElementValue('#IS_memo', '')));
      armorData.appendChild(supportEquip);
    }

    equipmentData.appendChild(armorData);
    detailList.push(equipmentData);

    return [getElementValue('#pc_name', 'NoName'), detailList];
  };

  /* ファイル生成と保存 */
  const createZipFile = (fileName, charaData, chatPaletteData, buffPaletteData) => {
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
      zip.generateAsync({ type: 'blob' })
        .then(blob => saveAs(blob, `${fileName}.zip`))
        .catch(error => {
          console.error('ZIP生成中にエラーが発生しました:', error);
          alert(`ZIP生成中にエラーが発生しました: ${error.message}`);
        });
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

  /* メイン処理 */
  const main = async () => {
    try {
      /* 環境検証 */
      if (!validateSite() || !validateBrowser() || !validateCharacterSheet()) return;

      /* ライブラリ読み込み */
      await loadLibraries([
        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
      ]);

      /* キャラクターデータの生成 */
      const [charaName, detailElements] = createCharacterDetailElements();

      /* チャットパレットとバフパレットの生成 */
      const chatPaletteElement = createChatPalette('Arianrhod', getChatPaletteText());
      const buffPaletteElement = createBuffPalette('Arianrhod', getBuffPaletteText());

      /* キャラクターデータの生成と保存 */
      createZipFile(charaName, createCharacter(charaName, detailElements), chatPaletteElement, buffPaletteElement);

    } catch (error) {
      console.error('エラーが発生しました:', error);
      alert(`処理中にエラーが発生しました: ${error.message}`);
    }
  };

  /* メイン処理実行 */
  main();
})();
