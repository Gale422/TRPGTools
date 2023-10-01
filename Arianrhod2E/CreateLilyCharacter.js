javascript: (() => {
  /* キャラシサイト以外は処理しない */
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
  const diceBotName = 'Arianrhod';
  /* キャラ名を設定する */
  const id = document.querySelector('#pc_name').value || 'NoName';

  /* 詳細データを追加する */
  const detailList = [];

  {
    const result = dataCreator({ name: 'リソース' });
    const HP = document.querySelector('#NP8').value;
    result.appendChild(dataCreator({ name: 'HP', type: 'numberResource', currentValue: HP }, HP));
    const MP = document.querySelector('#NP9').value;
    result.appendChild(dataCreator({ name: 'MP', type: 'numberResource', currentValue: MP }, MP));
    const fate = document.querySelector('#SL_fate').value;
    result.appendChild(dataCreator({ name: 'フェイト', type: 'numberResource', currentValue: fate }, fate));
    result.appendChild(dataCreator({ name: '行動値' }, document.querySelector('#BSUM6').value));
    result.appendChild(dataCreator({ name: '移動力' }, document.querySelector('#BSUM7').value));
    result.appendChild(dataCreator({ name: '物防' }, document.querySelector('#BSUM4').value));
    result.appendChild(dataCreator({ name: '魔防' }, document.querySelector('#BSUM5').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '所持品' });
    result.appendChild(dataCreator({ name: '所持金' }, (document.querySelector('#money').value || 0)));
    result.appendChild(dataCreator({ name: '預金・借金' }, (document.querySelector('#dept').value || 0)));
    result.appendChild(dataCreator({ name: '重量', type: 'numberResource', currentValue: (document.querySelector('#weight_item_sum').value || 0) }, document.querySelector('#weight_item_max').value));
    for (const itemName of document.querySelectorAll('[name="item_name[]"]')) {
      if (itemName.value === '') {
        continue;
      }
      const tr = itemName.closest('tr');
      let txt = '';
      txt += `重量[${tr.querySelector('[name="item_weight[]"]').value || ''}]`;
      txt += `価格[${tr.querySelector('[name="item_price[]"]').value || ''}]`;
      txt += `効果・備考[${tr.querySelector('[name="item_memo[]"]').value || ''}]`;
      result.appendChild(dataCreator({ name: itemName.value }, txt));
    }
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: 'キャラクター情報' });
    result.appendChild(dataCreator({ name: 'CL' }, (document.querySelector('#SL_level').selectedOptions[0].value || 1)));
    const classInfo = dataCreator({ name: 'クラス' });
    classInfo.appendChild(dataCreator({ name: 'メイン' }, (document.querySelector('#SL_main_class').selectedOptions[0].textContent || '')));
    classInfo.appendChild(dataCreator({ name: 'サポート' }, (document.querySelector('#support_class').value || '')));
    result.appendChild(classInfo);
    result.appendChild(dataCreator({ name: '種族' }, (document.querySelector('#shuzoku').value || document.querySelector('#SL_shuzoku').selectedOptions[0].text || '')));
    result.appendChild(dataCreator({ name: '性別' }, document.querySelector('#sex').value));
    result.appendChild(dataCreator({ name: '年齢' }, document.querySelector('#age').value));
    result.appendChild(dataCreator({ name: '身長' }, document.querySelector('#pc_height').value));
    result.appendChild(dataCreator({ name: '体重' }, document.querySelector('#pc_weight').value));
    result.appendChild(dataCreator({ name: '髪の色' }, document.querySelector('#color_hair').value));
    result.appendChild(dataCreator({ name: '瞳の色' }, document.querySelector('#color_eye').value));
    result.appendChild(dataCreator({ name: '肌の色' }, document.querySelector('#color_skin').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '能力値' });
    result.appendChild(dataCreator({ name: '筋力' }, document.querySelector('#NP1').value));
    result.appendChild(dataCreator({ name: '起用' }, document.querySelector('#NP2').value));
    result.appendChild(dataCreator({ name: '敏捷' }, document.querySelector('#NP3').value));
    result.appendChild(dataCreator({ name: '知力' }, document.querySelector('#NP4').value));
    result.appendChild(dataCreator({ name: '感知' }, document.querySelector('#NP5').value));
    result.appendChild(dataCreator({ name: '精神' }, document.querySelector('#NP6').value));
    result.appendChild(dataCreator({ name: '幸運' }, document.querySelector('#NP7').value));
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: '装備' });
    const weapon = dataCreator({ name: '武器' });
    if (document.querySelector('#IR_name').value !== '') {
      const rWepon = dataCreator({ name: document.querySelector('#IR_name').value });
      let txt = '';
      txt += `|命中|${document.querySelector('#BIR1').value}|\n`;
      txt += `|攻撃力|${document.querySelector('#BIR2').value}|\n`;
      txt += `|回避|${document.querySelector('#BIR3').value}|\n`;
      txt += `|物防|${document.querySelector('#BIR4').value}|\n`;
      txt += `|魔防|${document.querySelector('#BIR5').value}|\n`;
      txt += `|行動値|${document.querySelector('#BIR6').value}|\n`;
      txt += `|移動力|${document.querySelector('#BIR7').value}|\n`;
      txt += `|射程|${document.querySelector('#IR_shatei').value}|\n`;
      txt += `|種別|${document.querySelector('#IR_type').value}|\n`;
      txt += `|Lv|${document.querySelector('#IR_lv').value}|\n`;
      txt += `|重量|${document.querySelector('#IR_weight').value}|\n`;
      txt += `|価格|${document.querySelector('#IR_price').value}|\n`;
      txt += `|クラス制限|${document.querySelector('#IR_only_cls').value}|\n`;
      rWepon.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, txt));
      rWepon.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, document.querySelector('#IR_memo').value));
      weapon.appendChild(rWepon);
    }
    if (document.querySelector('#IL_name').value !== '') {
      const lWepon = dataCreator({ name: document.querySelector('#IL_name').value });
      let txt = '';
      txt += `|命中|${document.querySelector('#BIL1').value}|\n`;
      txt += `|攻撃力|${document.querySelector('#BIL2').value}|\n`;
      txt += `|回避|${document.querySelector('#BIL3').value}|\n`;
      txt += `|物防|${document.querySelector('#BIL4').value}|\n`;
      txt += `|魔防|${document.querySelector('#BIL5').value}|\n`;
      txt += `|行動値|${document.querySelector('#BIL6').value}|\n`;
      txt += `|移動力|${document.querySelector('#BIL7').value}|\n`;
      txt += `|射程|${document.querySelector('#IL_shatei').value}|\n`;
      txt += `|種別|${document.querySelector('#IL_type').value}|\n`;
      txt += `|Lv|${document.querySelector('#IL_lv').value}|\n`;
      txt += `|重量|${document.querySelector('#IL_weight').value}|\n`;
      txt += `|価格|${document.querySelector('#IL_price').value}|\n`;
      txt += `|クラス制限|${document.querySelector('#IL_only_cls').value}|\n`;
      lWepon.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, txt));
      lWepon.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, document.querySelector('#IL_memo').value));
      weapon.appendChild(lWepon);
    }
    weapon.appendChild(dataCreator({ name: '重量', type: 'numberResource', currentValue: (document.querySelector('#weight_arms_sum').value || 0) }, document.querySelector('#weight_arms_max').value));
    result.appendChild(weapon);
    const armor = dataCreator({ name: '防具等' });
    if (document.querySelector('#IH_name').value !== '') {
      const head = dataCreator({ name: document.querySelector('#IH_name').value });
      let txt = '';
      txt += `|命中|${document.querySelector('#BIH1').value}|\n`;
      txt += `|攻撃力|${document.querySelector('#BIH2').value}|\n`;
      txt += `|回避|${document.querySelector('#BIH3').value}|\n`;
      txt += `|物防|${document.querySelector('#BIH4').value}|\n`;
      txt += `|魔防|${document.querySelector('#BIH5').value}|\n`;
      txt += `|行動値|${document.querySelector('#BIH6').value}|\n`;
      txt += `|移動力|${document.querySelector('#BIH7').value}|\n`;
      txt += `|種別|${document.querySelector('#IH_type').value}|\n`;
      txt += `|Lv|${document.querySelector('#IH_lv').value}|\n`;
      txt += `|重量|${document.querySelector('#IH_weight').value}|\n`;
      txt += `|価格|${document.querySelector('#IH_price').value}|\n`;
      txt += `|クラス制限|${document.querySelector('#IH_only_cls').value}|\n`;
      head.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, txt));
      head.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, document.querySelector('#IH_memo').value));
      armor.appendChild(head);
    }
    if (document.querySelector('#IB_name').value !== '') {
      const body = dataCreator({ name: document.querySelector('#IB_name').value });
      let txt = '';
      txt += `|命中|${document.querySelector('#BIB1').value}|\n`;
      txt += `|攻撃力|${document.querySelector('#BIB2').value}|\n`;
      txt += `|回避|${document.querySelector('#BIB3').value}|\n`;
      txt += `|物防|${document.querySelector('#BIB4').value}|\n`;
      txt += `|魔防|${document.querySelector('#BIB5').value}|\n`;
      txt += `|行動値|${document.querySelector('#BIB6').value}|\n`;
      txt += `|移動力|${document.querySelector('#BIB7').value}|\n`;
      txt += `|種別|${document.querySelector('#IB_type').value}|\n`;
      txt += `|Lv|${document.querySelector('#IB_lv').value}|\n`;
      txt += `|重量|${document.querySelector('#IB_weight').value}|\n`;
      txt += `|価格|${document.querySelector('#IB_price').value}|\n`;
      txt += `|クラス制限|${document.querySelector('#IB_only_cls').value}|\n`;
      body.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, txt));
      body.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, document.querySelector('#IB_memo').value));
      armor.appendChild(body);
    }
    if (document.querySelector('#IS_name').value !== '') {
      const support = dataCreator({ name: document.querySelector('#IS_name').value });
      let txt = '';
      txt += `|命中|${document.querySelector('#BIS1').value}|\n`;
      txt += `|攻撃力|${document.querySelector('#BIS2').value}|\n`;
      txt += `|回避|${document.querySelector('#BIS3').value}|\n`;
      txt += `|物防|${document.querySelector('#BIS4').value}|\n`;
      txt += `|魔防|${document.querySelector('#BIS5').value}|\n`;
      txt += `|行動値|${document.querySelector('#BIS6').value}|\n`;
      txt += `|移動力|${document.querySelector('#BIS7').value}|\n`;
      txt += `|種別|${document.querySelector('#IS_type').value}|\n`;
      txt += `|Lv|${document.querySelector('#IS_lv').value}|\n`;
      txt += `|重量|${document.querySelector('#IS_weight').value}|\n`;
      txt += `|価格|${document.querySelector('#IS_price').value}|\n`;
      txt += `|クラス制限|${document.querySelector('#IS_only_cls').value}|\n`;
      support.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, txt));
      support.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, document.querySelector('#IS_memo').value));
      armor.appendChild(support);
    }
    if (document.querySelector('#IA_name').value !== '') {
      const accessory = dataCreator({ name: document.querySelector('#IA_name').value });
      let txt = '';
      txt += `|命中|${document.querySelector('#BIA1').value}|\n`;
      txt += `|攻撃力|${document.querySelector('#BIA2').value}|\n`;
      txt += `|回避|${document.querySelector('#BIA3').value}|\n`;
      txt += `|物防|${document.querySelector('#BIA4').value}|\n`;
      txt += `|魔防|${document.querySelector('#BIA5').value}|\n`;
      txt += `|行動値|${document.querySelector('#BIA6').value}|\n`;
      txt += `|移動力|${document.querySelector('#BIA7').value}|\n`;
      txt += `|種別|${document.querySelector('#IA_type').value}|\n`;
      txt += `|Lv|${document.querySelector('#IA_lv').value}|\n`;
      txt += `|重量|${document.querySelector('#IA_weight').value}|\n`;
      txt += `|価格|${document.querySelector('#IA_price').value}|\n`;
      txt += `|クラス制限|${document.querySelector('#IA_only_cls').value}|\n`;
      accessory.appendChild(dataCreator({ name: 'データ', type: 'markdown' }, txt));
      accessory.appendChild(dataCreator({ name: '効果・備考', type: 'note' }, document.querySelector('#IA_memo').value));
      armor.appendChild(accessory);
    }
    armor.appendChild(dataCreator({ name: '重量', type: 'numberResource', currentValue: (document.querySelector('#weight_body_sum').value || 0) }, document.querySelector('#weight_body_max').value));
    result.appendChild(armor);
    detailList.push(result);
  }
  {
    const result = dataCreator({ name: 'スキル' });
    let shuzokuSkillTxt = '';
    shuzokuSkillTxt += `SL[★]`;
    shuzokuSkillTxt += `タイミング[${document.querySelector('#shuzoku_skill_timing').value}]`;
    shuzokuSkillTxt += `判定[${document.querySelector('#shuzoku_skill_hantei').value}]`;
    shuzokuSkillTxt += `対象[${document.querySelector('#shuzoku_skill_taisho').value}]`;
    shuzokuSkillTxt += `射程[${document.querySelector('#shuzoku_skill_range').value}]`;
    shuzokuSkillTxt += `コスト[${document.querySelector('#shuzoku_skill_cost').value}]`;
    shuzokuSkillTxt += `制限[${document.querySelector('#shuzoku_skill_page').value}]`;
    shuzokuSkillTxt += `効果[${document.querySelector('#shuzoku_skill_memo').value}]`;
    shuzokuSkillTxt += `取得元[${document.querySelector('#shuzoku_skill_shozoku').value}]`;
    result.appendChild(dataCreator({ name: document.querySelector('#shuzoku_skill_name').value }, shuzokuSkillTxt));
    let mainClassSkillTxt = '';
    mainClassSkillTxt += `SL[${document.querySelector('#V_mcls_skill_lv').value}]`;
    mainClassSkillTxt += `タイミング[${document.querySelector('#m_cls_skill_timing').value}]`;
    mainClassSkillTxt += `判定[${document.querySelector('#m_cls_skill_hantei').value}]`;
    mainClassSkillTxt += `対象[${document.querySelector('#m_cls_skill_taisho').value}]`;
    mainClassSkillTxt += `射程[${document.querySelector('#m_cls_skill_range').value}]`;
    mainClassSkillTxt += `コスト[${document.querySelector('#m_cls_skill_cost').value}]`;
    mainClassSkillTxt += `制限[${document.querySelector('#m_cls_skill_page').value}]`;
    mainClassSkillTxt += `効果[${document.querySelector('#m_cls_skill_memo').value}]`;
    mainClassSkillTxt += `取得元[${document.querySelector('#m_cls_skill_shozoku').value}]`;
    result.appendChild(dataCreator({ name: document.querySelector('#m_cls_skill_name').value }, mainClassSkillTxt));
    for (const skillName of document.querySelectorAll('[name="skill_name[]"]')) {
      if (skillName.value === '') {
        continue;
      }
      const tr = skillName.closest('tr');
      let txt = '';
      txt += `SL[${tr.querySelector('[name="skill_lv[]"]').value}]`;
      txt += `タイミング[${tr.querySelector('[name="skill_timing[]"]').value}]`;
      txt += `判定[${tr.querySelector('[name="skill_hantei[]"]').value}]`;
      txt += `対象[${tr.querySelector('[name="skill_taisho[]"]').value}]`;
      txt += `射程[${tr.querySelector('[name="skill_range[]"]').value}]`;
      txt += `コスト[${tr.querySelector('[name="skill_cost[]"]').value}]`;
      txt += `制限[${tr.querySelector('[name="skill_page[]"]').value}]`;
      txt += `効果[${tr.querySelector('[name="skill_memo[]"]').value}]`;
      txt += `取得元[${tr.querySelector('[name="skill_shozoku[]"]').value}]`;
      result.appendChild(dataCreator({ name: skillName.value }, txt));
    }
    for (const skillName of document.querySelectorAll('[name="ippanskill_name[]"]')) {
      if (skillName.value === '') {
        continue;
      }
      const tr = skillName.closest('tr');
      let txt = '';
      txt += `SL[${tr.querySelector('[name="ippanskill_lv[]"]').value}]`;
      txt += `タイミング[${tr.querySelector('[name="ippanskill_timing[]"]').value}]`;
      txt += `判定[${tr.querySelector('[name="ippanskill_hantei[]"]').value}]`;
      txt += `対象[${tr.querySelector('[name="ippanskill_taisho[]"]').value}]`;
      txt += `射程[${tr.querySelector('[name="ippanskill_range[]"]').value}]`;
      txt += `コスト[${tr.querySelector('[name="ippanskill_cost[]"]').value}]`;
      txt += `制限[${tr.querySelector('[name="ippanskill_page[]"]').value}]`;
      txt += `効果[${tr.querySelector('[name="ippanskill_memo[]"]').value}]`;
      txt += `取得元[${tr.querySelector('[name="ippanskill_shozoku[]"]').value}]`;
      result.appendChild(dataCreator({ name: skillName.value }, txt));
    }
    detailList.push(result);
  }

  /* チャットパレットの文字列 */
  const getChatPaletteText = () => {
    let txt = '';
    txt += `//--- 能力値判定\n`;
    txt += '2D6+{筋力}>=0 【筋力】判定\n';
    txt += '2D6+{器用}>=0 【器用】判定\n';
    txt += '2D6+{敏捷}>=0 【敏捷】判定\n';
    txt += '2D6+{知力}>=0 【知力】判定\n';
    txt += '2D6+{感知}>=0 【感知】判定\n';
    txt += '2D6+{精神}>=0 【精神】判定\n';
    txt += '2D6+{幸運}>=0 【幸運】判定\n';
    txt += `\n`;
    txt += `//--- 技能判定\n`;
    txt += `${document.querySelector('#dice_wanatanti').value}D6+{感知}+${document.querySelector('[name="THS1"]').value || 0}+${document.querySelector('[name="THO1"]').value || 0}>=0 トラップ探知判定\n`;
    txt += `${document.querySelector('#dice_wanakaijo').value}D6+{器用}+${document.querySelector('[name="THS2"]').value || 0}+${document.querySelector('[name="THO2"]').value || 0}>=0 トラップ解除判定\n`;
    txt += `${document.querySelector('#dice_kanti').value}D6+{感知}+${document.querySelector('[name="THS3"]').value || 0}+${document.querySelector('[name="THO3"]').value || 0}>=0 危険感知判定\n`;
    txt += `${document.querySelector('#dice_sikibetu').value}D6+{知力}+${document.querySelector('[name="THS4"]').value || 0}+${document.querySelector('[name="THO4"]').value || 0}>=0 エネミー識別判定\n`;
    txt += `${document.querySelector('#dice_kantei').value}D6+{知力}+${document.querySelector('[name="THS5"]').value || 0}+${document.querySelector('[name="THO5"]').value || 0}>=0 アイテム鑑定判定\n`;
    txt += `${document.querySelector('#dice_majutu').value}D6+{知力}+${document.querySelector('[name="THS6"]').value || 0}+${document.querySelector('[name="THO6"]').value || 0}>=0 魔術判定\n`;
    txt += `${document.querySelector('#dice_juka').value}D6+{精神}+${document.querySelector('[name="THS7"]').value || 0}+${document.querySelector('[name="THO7"]').value || 0}>=0 呪歌判定\n`;
    txt += `${document.querySelector('#dice_renkin').value}D6+{器用}+${document.querySelector('[name="THS8"]').value || 0}+${document.querySelector('[name="THO8"]').value || 0}>=0 錬金術判定\n`;
    txt += `\n`;
    txt += `//--- 受動判定\n`;
    txt += `${document.querySelector('#dice_kaihi').value}D6+${document.querySelector('#BSUM3').value}>=0 回避判定\n`;
    txt += `:HP-(n-{物防})LZ 【被物理ダメージ】\n`;
    txt += `:HP-(n-{魔防})LZ 【被魔法ダメージ】\n`;
    txt += `:HP-nLZ 【被貫通ダメージ】\n`;
    txt += `\n`;
    txt += `//--- 能動判定\n`;
    txt += `${document.querySelector('#dice_meichu').value}D6+${document.querySelector('#BSUM1R').value}>=0 右手命中\n`;
    txt += `${document.querySelector('#dice_attack').value}D6+${document.querySelector('#BSUM2R').value}>=0 右手ダメージロール\n`;
    txt += `${document.querySelector('#dice_meichu').value}D6+${document.querySelector('#BSUM1L').value}>=0 左手命中\n`;
    txt += `${document.querySelector('#dice_attack').value}D6+${document.querySelector('#BSUM2L').value}>=0 左手ダメージロール\n`;
    txt += `${document.querySelector('#dice_majutu').value}D6+{知力}+${document.querySelector('[name="THS6"]').value || 0}+${document.querySelector('[name="THO6"]').value || 0}>=0 魔術判定\n`;
    txt += `\n`;
    txt += `\n`;
    txt += `//--- その他\n`;
    txt += `:フェイト-L フェイトの使用\n`;
    txt += `:HP+2D6LZ HPポーション\n`;
    txt += `:MP+2D6LZ MPポーション\n`;
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
