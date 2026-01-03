/**
 * アリアンロッド2E エネミー作成ツール
 * オブジェクト指向アーキテクチャ
 */

const FORCE_BLOCK_ELEMENT_NAMES = [
  'character',
  'image',
  'common',
  'detail',
  'リソース',
  '詳細情報',
  'ドロップ品',
  '能力値',
  'スキル・パワー',
  '立ち絵位置',
  'コマ画像',
  'buff'
];

const WEAPON_TYPE_OPTIONS = Object.freeze([
  '格闘',
  '短剣',
  '長剣',
  '両手剣',
  '斧',
  '打撃',
  '槍',
  '鞭',
  '弓',
  '刀',
  '魔導銃',
  '錬金銃',
  '錬金術'
]);

const WEAPON_GRIP_OPTIONS = Object.freeze([
  '片',
  '両',
  '双'
]);

const WEAPON_METHOD_OPTIONS = Object.freeze([
  '白兵',
  '射撃',
  '投擲',
  '魔法',
  '特殊'
]);

const WEAPON_DAMAGE_OPTIONS = Object.freeze([
  '物理',
  '魔法',
  '貫通'
]);

const COPYRIGHT_NOTICE = Object.freeze({
  heading: '著作権と利用上の注意',
  messages: [
    'アリアンロッド2Eの著作権は 菊池たけし / F.E.A.R. に帰属します。本ツールは非公式のファンメイドです。',
    '本ツールで生成したデータ（XML / ZIP / JSON など）は個人セッションなどの私的利用に限定し、第三者への再頒布や公的配布を行わないでください。',
    '公式ルールブックやサプリメントを引用する場合は、引用範囲と出典表記を利用者自身の責任で行い、著作権者が定める条件に従ってください。'
  ]
});

// =============================================================================
// データ管理クラス
// =============================================================================

/**
 * ローカルストレージ管理クラス
 */
class DataManager {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`${this.storageKey}の読み込みに失敗:`, error);
      return [];
    }
  }

  save(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`${this.storageKey}の保存に失敗:`, error);
      alert('データの保存に失敗しました。ストレージの容量を確認してください。');
      return false;
    }
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}

// =============================================================================
// エネミーデータモデル
// =============================================================================

/**
 * エネミーデータクラス
 */
class Enemy {
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.level = data.level || 1;
    this.isMob = data.isMob || false;
    this.classification = data.classification || '';
    this.attribute = data.attribute || '';
    this.page = data.page || '';
    this.identifyValue = data.identifyValue || 0;
    this.sizeNum = data.sizeNum || 2;

    // リソース
    this.hp = data.hp || 0;
    this.mp = data.mp || 0;
    this.initiative = data.initiative || 0;
    this.initiativeBonus = data.initiativeBonus || 0;
    this.initiativeManual = data.initiativeManual || false;
    this.move = data.move || 0;
    this.moveBonus = data.moveBonus || 0;
    this.moveManual = data.moveManual || false;
    this.physicalDef = data.physicalDef || 0;
    this.magicDef = data.magicDef || 0;

    // 能力値
    this.abilityMode = data.abilityMode || (data.isMob ? 'action' : 'base');
    this._initAbilities(data);

    // スキルとドロップ
    this.skills = data.skills || [];
    this.drops = data.drops || [];
    this.memo = data.memo || '';
    this.customCommands = data.customCommands || '';

    // メタデータ
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  _generateId() {
    return `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _initAbilities(data) {
    if (this.isMob) {
      this.action = data.action || 0;
      this.reaction = data.reaction || 0;
    } else if (data.strBase !== undefined) {
      this.strBase = data.strBase || 0;
      this.dexBase = data.dexBase || 0;
      this.agiBase = data.agiBase || 0;
      this.intBase = data.intBase || 0;
      this.senBase = data.senBase || 0;
      this.spiBase = data.spiBase || 0;
      this.luckBase = data.luckBase || 0;
      this._calculateAbilitiesFromBase();
    } else {
      this.str = data.str || 0;
      this.dex = data.dex || 0;
      this.agi = data.agi || 0;
      this.int = data.int || 0;
      this.sen = data.sen || 0;
      this.spi = data.spi || 0;
      this.luck = data.luck || 0;
    }
  }

  _calculateAbilitiesFromBase() {
    this.str = Math.floor(this.strBase / 3);
    this.dex = Math.floor(this.dexBase / 3);
    this.agi = Math.floor(this.agiBase / 3);
    this.int = Math.floor(this.intBase / 3);
    this.sen = Math.floor(this.senBase / 3);
    this.spi = Math.floor(this.spiBase / 3);
    this.luck = Math.floor(this.luckBase / 3);
  }

  getLevelDisplay() {
    return this.isMob ? `${this.level}(モブ)` : String(this.level);
  }

  getInitiativeTotal() {
    if (this.isMob) return this.initiative;
    return (this.agi || 0) + (this.sen || 0) + (this.initiativeBonus || 0);
  }

  getMoveTotal() {
    if (this.isMob) return this.move;
    return (this.str || 0) + 5 + (this.moveBonus || 0);
  }

  toJSON() {
    return { ...this };
  }
}

// =============================================================================
// スキルデータモデル
// =============================================================================

/**
 * スキルデータクラス
 */
class Skill {
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.timing = data.timing || '';
    this.classification = data.classification || '';
    this.judge = data.judge || '';
    this.target = data.target || '';
    this.range = data.range || '';
    this.cost = data.cost !== undefined ? data.cost : 0;
    this.sl = data.sl || 1;
    this.condition = data.condition || '';
    this.effect = data.effect || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.isWeaponAttack = data.isWeaponAttack || false;
    this.weaponType = data.weaponType || '';
    this.weaponGrip = data.weaponGrip || '';
    this.weaponMethod = data.weaponMethod || '';
    this.weaponDamage = data.weaponDamage || '';
  }

  _generateId() {
    return `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return { ...this };
  }
}

// =============================================================================
// エネミー管理クラス
// =============================================================================

/**
 * エネミー管理クラス
 */
class EnemyManager {
  constructor() {
    this.dataManager = new DataManager('ar2e_enemies');
    this.enemies = [];
    this.currentEnemy = null;
    this.editingEnemyId = null;
  }

  load() {
    const data = this.dataManager.load();
    this.enemies = data.map(d => new Enemy(d));
  }

  save() {
    const data = this.enemies.map(e => e.toJSON());
    return this.dataManager.save(data);
  }

  add(enemyData) {
    const enemy = new Enemy(enemyData);
    this.enemies.push(enemy);
    this._sort();
    this.save();
    return enemy;
  }

  update(id, enemyData) {
    const index = this.enemies.findIndex(e => e.id === id);
    if (index !== -1) {
      enemyData.id = id;
      enemyData.createdAt = this.enemies[index].createdAt;
      enemyData.updatedAt = new Date().toISOString();
      this.enemies[index] = new Enemy(enemyData);
      this._sort();
      this.save();
      return this.enemies[index];
    }
    return null;
  }

  delete(id) {
    this.enemies = this.enemies.filter(e => e.id !== id);
    this.save();
  }

  get(id) {
    return this.enemies.find(e => e.id === id);
  }

  getAll() {
    return this.enemies;
  }

  search(term) {
    if (!term) return this.enemies;
    const lowerTerm = term.toLowerCase();
    return this.enemies.filter(e =>
      e.name.toLowerCase().includes(lowerTerm) ||
      e.classification?.toLowerCase().includes(lowerTerm)
    );
  }

  duplicate(id) {
    const enemy = this.get(id);
    if (enemy) {
      const newEnemyData = {
        ...enemy.toJSON(),
        name: `${enemy.name}（コピー）`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      delete newEnemyData.id;
      return this.add(newEnemyData);
    }
    return null;
  }

  clear() {
    this.enemies = [];
    this.dataManager.clear();
  }

  _sort() {
    this.enemies.sort((a, b) => {
      const levelA = parseInt(a.level) || 0;
      const levelB = parseInt(b.level) || 0;
      if (levelA !== levelB) return levelA - levelB;
      return a.name.localeCompare(b.name, 'ja');
    });
  }
}

// =============================================================================
// スキルライブラリ管理クラス
// =============================================================================

/**
 * スキルライブラリ管理クラス
 */
class SkillLibraryManager {
  constructor() {
    this.dataManager = new DataManager('ar2e_skills');
    this.skills = [];
    this.timingOrder = [
      'パッシブ', 'セットアップ', 'イニシアチブ', 'フリー', 'ムーブ', 'レガシー',
      'マイナー', 'メジャー', '判定の直前', '判定の直後', 'DRの直前', 'DRの直後',
      'リアクション', 'クリンナップ', '戦闘不能', '効果参照'
    ];
  }

  load() {
    const data = this.dataManager.load();
    this.skills = data.map(d => new Skill(d));
  }

  save() {
    const data = this.skills.map(s => s.toJSON());
    return this.dataManager.save(data);
  }

  add(skillData) {
    const skill = new Skill(skillData);
    this.skills.push(skill);
    this._sort();
    this.save();
    return skill;
  }

  update(id, skillData) {
    const index = this.skills.findIndex(s => s.id === id);
    if (index !== -1) {
      skillData.id = id;
      skillData.createdAt = this.skills[index].createdAt;
      skillData.updatedAt = new Date().toISOString();
      this.skills[index] = new Skill(skillData);
      this._sort();
      this.save();
      return this.skills[index];
    }
    return null;
  }

  delete(id) {
    this.skills = this.skills.filter(s => s.id !== id);
    this.save();
  }

  get(id) {
    return this.skills.find(s => s.id === id);
  }

  getAll() {
    return this.skills;
  }

  search(term) {
    if (!term) return this.skills;
    const lowerTerm = term.toLowerCase();
    return this.skills.filter(s =>
      s.name.toLowerCase().includes(lowerTerm) ||
      s.timing?.toLowerCase().includes(lowerTerm)
    );
  }

  duplicate(id) {
    const skill = this.get(id);
    if (skill) {
      const newSkillData = {
        ...skill.toJSON(),
        name: `${skill.name}（コピー）`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      delete newSkillData.id;
      return this.add(newSkillData);
    }
    return null;
  }

  clear() {
    this.skills = [];
    this.dataManager.clear();
  }

  _sort() {
    this.skills.sort((a, b) => {
      const timingIndexA = this.timingOrder.indexOf(a.timing || '');
      const timingIndexB = this.timingOrder.indexOf(b.timing || '');
      if (timingIndexA !== timingIndexB) {
        return (timingIndexA === -1 ? 999 : timingIndexA) - (timingIndexB === -1 ? 999 : timingIndexB);
      }
      return a.name.localeCompare(b.name, 'ja');
    });
  }

  getTimingOrder() {
    return this.timingOrder;
  }
}

// =============================================================================
// XML生成クラス
// =============================================================================

/**
 * XML生成クラス
 */
class XMLGenerator {
  constructor(skillLibraryManager) {
    this.skillLibraryManager = skillLibraryManager;
  }

  // DOMツリー全体を走査して、空の要素（子要素もテキストノードもない要素）に対して空のテキストノードを追加
  // これにより、全ての要素が自己完結タグではなく開始/終了タグペアとして出力される
  _ensureNoSelfClosingTags(doc, element) {
    // まず、子要素を再帰的に処理
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        this._ensureNoSelfClosingTags(doc, child);
      }
    }

    // 子ノードがあるか確認
    const hasChildNodes = element.childNodes.length > 0;
    if (!hasChildNodes) {
      // 子ノードが全くない場合は、空のテキストノードを追加
      element.appendChild(doc.createTextNode(''));
      return;
    }

    // 子ノードがある場合、テキストノードまたは要素ノードがあるか確認
    let hasNonEmptyContent = false;
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        // テキストノードがある場合（空でも良い）
        hasNonEmptyContent = true;
        break;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // 要素ノードがある場合
        hasNonEmptyContent = true;
        break;
      }
    }

    // テキストノードも要素ノードもない場合は、空のテキストノードを追加
    if (!hasNonEmptyContent) {
      element.appendChild(doc.createTextNode(''));
    }
  }

  generate(enemy) {
    // DOM経由でXMLを生成
    const doc = document.implementation.createDocument('', '', null);
    const pi = doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
    doc.appendChild(pi);

    const character = doc.createElement('character');
    character.setAttribute('location.name', 'table');
    character.setAttribute('location.x', '0');
    character.setAttribute('location.y', '0');
    character.setAttribute('posZ', '0');
    character.setAttribute('isLock', 'false');
    character.setAttribute('rotate', '0');
    character.setAttribute('roll', '0');
    character.setAttribute('hideInventory', 'true');
    character.setAttribute('nonTalkFlag', 'false');
    character.setAttribute('overViewWidth', '270');
    character.setAttribute('overViewMaxHeight', '250');
    character.setAttribute('specifyKomaImageFlag', 'false');
    character.setAttribute('komaImageHeignt', '100');
    character.setAttribute('chatColorCode.0', '#000000');
    character.setAttribute('chatColorCode.1', '#FF0000');
    character.setAttribute('chatColorCode.2', '#0099FF');
    character.setAttribute('syncDummyCounter', '0');
    doc.appendChild(character);

    this._addCharacterData(doc, character, enemy);
    this._addChatPalette(doc, character, enemy);
    this._addBuffPalette(doc, character);

    // 全ての空要素に対して空のテキストノードを追加（自己完結タグを防ぐ）
    this._ensureNoSelfClosingTags(doc, character);

    // XMLSerializerで文字列化
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(doc);

    return xmlString;
  }

  generateFormatted(enemy) {
    const rawXml = this.generate(enemy);
    return this.formatXmlForPreview(rawXml);
  }

  _addCharacterData(doc, character, enemy) {
    const dataCharacter = doc.createElement('data');
    dataCharacter.setAttribute('name', 'character');

    // image
    const dataImage = doc.createElement('data');
    dataImage.setAttribute('name', 'image');
    const dataImageIdentifier = doc.createElement('data');
    dataImageIdentifier.setAttribute('type', 'image');
    dataImageIdentifier.setAttribute('name', 'imageIdentifier');
    dataImageIdentifier.appendChild(doc.createTextNode('none_icon'));
    dataImage.appendChild(dataImageIdentifier);
    dataCharacter.appendChild(dataImage);

    // common
    const dataCommon = doc.createElement('data');
    dataCommon.setAttribute('name', 'common');
    const dataName = doc.createElement('data');
    dataName.setAttribute('name', 'name');
    dataName.appendChild(doc.createTextNode(enemy.name || ''));
    dataCommon.appendChild(dataName);
    const dataSize = doc.createElement('data');
    dataSize.setAttribute('name', 'size');
    dataSize.appendChild(doc.createTextNode(String(enemy.sizeNum || 0)));
    dataCommon.appendChild(dataSize);
    dataCharacter.appendChild(dataCommon);

    // detail
    const dataDetail = doc.createElement('data');
    dataDetail.setAttribute('name', 'detail');
    this._addResources(doc, dataDetail, enemy);
    this._addDetailInfo(doc, dataDetail, enemy);
    this._addDropItems(doc, dataDetail, enemy);
    this._addAbilities(doc, dataDetail, enemy);
    this._addSkillNotes(doc, dataDetail, enemy);
    this._addPositionAndIcon(doc, dataDetail);
    dataCharacter.appendChild(dataDetail);

    // buff
    const dataBuff = doc.createElement('data');
    dataBuff.setAttribute('name', 'buff');
    const dataBuffDetail = doc.createElement('data');
    dataBuffDetail.setAttribute('name', 'バフ/デバフ');
    dataBuff.appendChild(dataBuffDetail);
    dataCharacter.appendChild(dataBuff);

    character.appendChild(dataCharacter);
  }

  _addResources(doc, dataDetail, enemy) {
    const dataResources = doc.createElement('data');
    dataResources.setAttribute('name', 'リソース');

    const dataEHP = doc.createElement('data');
    dataEHP.setAttribute('type', 'numberResource');
    dataEHP.setAttribute('name', 'EHP');
    dataEHP.setAttribute('currentValue', String(enemy.hp || 0));
    dataEHP.appendChild(doc.createTextNode(String(enemy.hp || 0)));
    dataResources.appendChild(dataEHP);

    const dataEMP = doc.createElement('data');
    dataEMP.setAttribute('type', 'numberResource');
    dataEMP.setAttribute('name', 'EMP');
    dataEMP.setAttribute('currentValue', String(enemy.mp || 0));
    dataEMP.appendChild(doc.createTextNode(String(enemy.mp || 0)));
    dataResources.appendChild(dataEMP);

    const dataInitiative = doc.createElement('data');
    dataInitiative.setAttribute('name', '行動値');
    dataInitiative.appendChild(doc.createTextNode(String(enemy.getInitiativeTotal() || 0)));
    dataResources.appendChild(dataInitiative);

    const dataMove = doc.createElement('data');
    dataMove.setAttribute('name', '移動力');
    dataMove.appendChild(doc.createTextNode(String(enemy.getMoveTotal() || 0)));
    dataResources.appendChild(dataMove);

    const dataPhysicalDef = doc.createElement('data');
    dataPhysicalDef.setAttribute('name', '物防');
    dataPhysicalDef.appendChild(doc.createTextNode(String(enemy.physicalDef || 0)));
    dataResources.appendChild(dataPhysicalDef);

    const dataMagicDef = doc.createElement('data');
    dataMagicDef.setAttribute('name', '魔防');
    dataMagicDef.appendChild(doc.createTextNode(String(enemy.magicDef || 0)));
    dataResources.appendChild(dataMagicDef);

    const dataStatus = doc.createElement('data');
    dataStatus.setAttribute('name', '状態異常');
    dataStatus.setAttribute('type', 'note');
    dataResources.appendChild(dataStatus);

    dataDetail.appendChild(dataResources);
  }

  _addDetailInfo(doc, dataDetail, enemy) {
    const dataDetailInfo = doc.createElement('data');
    dataDetailInfo.setAttribute('name', '詳細情報');

    const dataPage = doc.createElement('data');
    dataPage.setAttribute('name', 'ページ');
    dataPage.appendChild(doc.createTextNode(enemy.page || ''));
    dataDetailInfo.appendChild(dataPage);

    const dataClassification = doc.createElement('data');
    dataClassification.setAttribute('name', '分類');
    dataClassification.appendChild(doc.createTextNode(enemy.classification || ''));
    dataDetailInfo.appendChild(dataClassification);

    const dataAttribute = doc.createElement('data');
    dataAttribute.setAttribute('name', '属性');
    dataAttribute.appendChild(doc.createTextNode(enemy.attribute || ''));
    dataDetailInfo.appendChild(dataAttribute);

    const dataLevel = doc.createElement('data');
    dataLevel.setAttribute('name', 'レベル');
    dataLevel.appendChild(doc.createTextNode(enemy.getLevelDisplay() || ''));
    dataDetailInfo.appendChild(dataLevel);

    const dataIdentifyValue = doc.createElement('data');
    dataIdentifyValue.setAttribute('name', '識別値');
    dataIdentifyValue.appendChild(doc.createTextNode(String(enemy.identifyValue || 0)));
    dataDetailInfo.appendChild(dataIdentifyValue);

    dataDetail.appendChild(dataDetailInfo);
  }

  _addDropItems(doc, dataDetail, enemy) {
    const dataDrops = doc.createElement('data');
    dataDrops.setAttribute('name', 'ドロップ品');
    if (enemy.drops && enemy.drops.length > 0) {
      enemy.drops.forEach(drop => {
        const range = this._formatDropRange(drop);
        const item = this._formatDropItem(drop);
        const dataDrop = doc.createElement('data');
        dataDrop.setAttribute('name', range);
        dataDrop.appendChild(doc.createTextNode(item));
        dataDrops.appendChild(dataDrop);
      });
    }
    dataDetail.appendChild(dataDrops);
  }

  _addAbilities(doc, dataDetail, enemy) {
    const dataAbilities = doc.createElement('data');
    dataAbilities.setAttribute('name', '能力値');

    const createAbilityData = (name, value) => {
      const data = doc.createElement('data');
      data.setAttribute('name', name);
      data.appendChild(doc.createTextNode(String(value || 0)));
      return data;
    };

    if (enemy.isMob) {
      dataAbilities.appendChild(createAbilityData('アクション', enemy.action));
      dataAbilities.appendChild(createAbilityData('リアクション', enemy.reaction));
    } else if (enemy.strBase !== undefined) {
      dataAbilities.appendChild(createAbilityData('筋力基本値', enemy.strBase));
      dataAbilities.appendChild(createAbilityData('筋力', enemy.str));
      dataAbilities.appendChild(createAbilityData('器用基本値', enemy.dexBase));
      dataAbilities.appendChild(createAbilityData('器用', enemy.dex));
      dataAbilities.appendChild(createAbilityData('敏捷基本値', enemy.agiBase));
      dataAbilities.appendChild(createAbilityData('敏捷', enemy.agi));
      dataAbilities.appendChild(createAbilityData('知力基本値', enemy.intBase));
      dataAbilities.appendChild(createAbilityData('知力', enemy.int));
      dataAbilities.appendChild(createAbilityData('感知基本値', enemy.senBase));
      dataAbilities.appendChild(createAbilityData('感知', enemy.sen));
      dataAbilities.appendChild(createAbilityData('精神基本値', enemy.spiBase));
      dataAbilities.appendChild(createAbilityData('精神', enemy.spi));
      dataAbilities.appendChild(createAbilityData('幸運基本値', enemy.luckBase));
      dataAbilities.appendChild(createAbilityData('幸運', enemy.luck));
    } else {
      dataAbilities.appendChild(createAbilityData('筋力', enemy.str));
      dataAbilities.appendChild(createAbilityData('器用', enemy.dex));
      dataAbilities.appendChild(createAbilityData('敏捷', enemy.agi));
      dataAbilities.appendChild(createAbilityData('知力', enemy.int));
      dataAbilities.appendChild(createAbilityData('感知', enemy.sen));
      dataAbilities.appendChild(createAbilityData('精神', enemy.spi));
      dataAbilities.appendChild(createAbilityData('幸運', enemy.luck));
    }

    dataDetail.appendChild(dataAbilities);
  }

  _addSkillNotes(doc, dataDetail, enemy) {
    // スキルをnote要素として追加
    if (enemy.skills && enemy.skills.length > 0) {
      const dataSkills = doc.createElement('data');
      dataSkills.setAttribute('name', 'スキル・パワー');
      enemy.skills.forEach(skill => {
        const skillText = this._formatSkill(skill);
        const dataSkill = doc.createElement('data');
        dataSkill.setAttribute('name', skill.name || '');
        dataSkill.setAttribute('type', 'note');
        dataSkill.appendChild(doc.createTextNode(skillText));
        dataSkills.appendChild(dataSkill);
      });
      dataDetail.appendChild(dataSkills);
    }
  }

  _addPositionAndIcon(doc, dataDetail) {
    const dataPosition = doc.createElement('data');
    dataPosition.setAttribute('name', '立ち絵位置');
    const dataPOS = doc.createElement('data');
    dataPOS.setAttribute('type', 'numberResource');
    dataPOS.setAttribute('currentValue', '0');
    dataPOS.setAttribute('name', 'POS');
    dataPOS.appendChild(doc.createTextNode('0'));
    dataPosition.appendChild(dataPOS);
    dataDetail.appendChild(dataPosition);

    const dataIcon = doc.createElement('data');
    dataIcon.setAttribute('name', 'コマ画像');
    const dataICON = doc.createElement('data');
    dataICON.setAttribute('type', 'numberResource');
    dataICON.setAttribute('currentValue', '0');
    dataICON.setAttribute('name', 'ICON');
    dataICON.appendChild(doc.createTextNode('0'));
    dataIcon.appendChild(dataICON);
    dataDetail.appendChild(dataIcon);
  }

  _addChatPalette(doc, character, enemy) {
    const palette = [];
    this._addPassiveCommands(palette, enemy);
    this._addActiveCommands(palette, enemy);
    this._addBuffCommands(palette);
    this._addCustomCommands(palette, enemy);
    this._addIdentifyInfo(palette, enemy);
    this._addSkillsInfo(palette, enemy);
    this._addDropInfo(palette, enemy);

    const chatPalette = doc.createElement('chat-palette');
    chatPalette.setAttribute('dicebot', 'Arianrhod');
    if (palette.length > 0) {
      // 改行で結合してテキストノードとして追加
      // 既存のXML文字実体参照を元の文字に戻す（XMLSerializerが自動でエスケープするため）
      let paletteText = palette.join('\n');
      paletteText = this._unescapeXmlEntities(paletteText);
      chatPalette.appendChild(doc.createTextNode(paletteText));
    }
    character.appendChild(chatPalette);
  }

  _addPassiveCommands(palette, enemy) {
    palette.push('//--- 受動判定');
    if (enemy.isMob) {
      palette.push(`2D6+{リアクション}>=0 回避`);
    } else {
      palette.push(`2D6+{敏捷}>=? 回避`);
    }
    palette.push('S:EHP-(-{物防})LZ 物理ダメージ適用');
    palette.push('S:EHP-(-{魔防})LZ 魔法ダメージ適用');
    palette.push('S:EHP-LZ 貫通ダメージ適用');
    palette.push('S:EHP-(-({魔防}*2))LZ 魔法ダメージ適用(属性一致)');
    palette.push('S:EHP-({毒}*5)LZ');
    palette.push('S:EHP-({衰弱}*5)LZ');
    palette.push('');
  }

  _addActiveCommands(palette, enemy) {
    palette.push('//--- 能動判定');
    palette.push('1D 対象決定');

    // スキルの判定コマンドとダメージコマンドを追加
    if (enemy.skills && enemy.skills.length > 0) {
      enemy.skills.forEach(skill => {
        // 複数の判定コマンドに対応
        if (skill.judgeCommands && skill.judgeCommands.length > 0) {
          skill.judgeCommands.forEach((judgeCmd, judgeIndex) => {
            // 判定コマンドがあり、判定が自動成功または―でない場合
            if (skill.judge && skill.judge !== '自動成功' && skill.judge !== '―') {
              const judgeCommand = this._generateJudgeCommand(judgeCmd);
              if (judgeCommand) {
                const judgeLabel = this._getJudgePaletteLabel(skill, judgeCmd, judgeIndex);
                palette.push(`${judgeCommand} ${judgeLabel}`);
              }
            }

            // このjudgeCommandに対応するダメージコマンド
            if (judgeCmd.damageCommands && judgeCmd.damageCommands.length > 0) {
              judgeCmd.damageCommands.forEach((dmgCmd, dmgIndex) => {
                const damageCommand = this._generateDamageCommand(dmgCmd);
                if (damageCommand) {
                  const damageLabel = this._getDamagePaletteLabel(skill, judgeCmd, judgeIndex, dmgCmd, dmgIndex);
                  palette.push(`${damageCommand} ${damageLabel}`);
                }
              });
            }
          });
        }
      });
    }

    palette.push('2D6+');
    palette.push('3D6+');
    palette.push('');
  }

  // 判定タイプから能力値への対応
  _getAbilityForJudge(judge) {
    const mapping = {
      '命中判定': '器用',
      '魔術判定': '知力',
      '錬金術判定': '器用',
      '呪歌判定': '精神',
      '回避判定': '敏捷',
      '筋力判定': '筋力',
      '器用判定': '器用',
      '敏捷判定': '敏捷',
      '知力判定': '知力',
      '感知判定': '感知',
      '精神判定': '精神',
      '幸運判定': '幸運'
    };
    return mapping[judge] || null;
  }

  // 判定コマンドを生成
  _generateJudgeCommand(judgeCmd) {
    if (!judgeCmd || !judgeCmd.dice || judgeCmd.dice === 0) return null;

    const dice = judgeCmd.dice || 2;
    const fixed = judgeCmd.fixed || '0';
    const bonus = judgeCmd.bonus || 0;

    let command = `${dice}D6+${fixed}`;
    if (bonus !== 0) {
      command += bonus > 0 ? `+${bonus}` : bonus;
    }
    command += '&gt;=?';

    return command;
  }

  // ダメージコマンドを生成
  _generateDamageCommand(damageCmd) {
    if (!damageCmd) return null;

    const dice = damageCmd.dice || 0;
    const fixed = damageCmd.fixed || 0;
    const bonus = damageCmd.bonus || 0;

    if (dice === 0 && fixed === 0 && bonus === 0) return null;

    let command = '';
    if (dice > 0) {
      command = `${dice}D6`;
    }

    const total = fixed + bonus;
    if (total !== 0) {
      if (command) command += '+';
      command += total;
    }

    return command || null;
  }

  _formatPaletteLabel(customValue, defaultLabel) {
    const trimmed = (customValue || '').trim();
    return trimmed || defaultLabel;
  }

  _getDefaultJudgePaletteLabel(skillName, judgeIndex, judgeText = '') {
    const baseName = skillName || '新規スキル';
    const suffix = judgeIndex > 0 ? ` (${judgeIndex + 1})` : '';
    const labelCore = `《${baseName}${suffix}》`;
    return judgeText ? `${judgeText} ${labelCore}` : labelCore;
  }

  _getDefaultDamagePaletteLabel(skillName, judgeIndex, damageIndex) {
    const baseName = skillName || '新規スキル';
    const suffixParts = [];
    if (Number.isInteger(judgeIndex) && judgeIndex > 0) {
      suffixParts.push(`判定${judgeIndex + 1}`);
    }
    if (damageIndex > 0) {
      suffixParts.push(`ダメージ${damageIndex + 1}`);
    }
    if (suffixParts.length === 0) {
      return `ダメージ 《${baseName}》`;
    }
    return `ダメージ 《${baseName} (${suffixParts.join('-')})》`;
  }

  _getJudgePaletteLabel(skill, judgeCmd, judgeIndex) {
    const skillName = (skill && skill.name) ? skill.name : '新規スキル';
    const judgeText = (skill && skill.judge) ? skill.judge.trim() : '';
    const defaultLabel = this._getDefaultJudgePaletteLabel(skillName, judgeIndex, judgeText);
    const storedLabel = judgeCmd ? judgeCmd.label : '';
    return this._formatPaletteLabel(storedLabel, defaultLabel);
  }

  _getDamagePaletteLabel(skill, judgeCmd, judgeIndex, damageCmd, dmgIndex) {
    const skillName = (skill && skill.name) ? skill.name : '新規スキル';
    const defaultLabel = this._getDefaultDamagePaletteLabel(skillName, judgeIndex, dmgIndex);
    const storedLabel = damageCmd ? damageCmd.label : '';
    return this._formatPaletteLabel(storedLabel, defaultLabel);
  }

  _addBuffCommands(palette) {
    palette.push('//--- バフ関連');
    palette.push('&amp;バフ名/効果/R数 バフ追加');
    palette.push('&amp;バフ名- バフ消去');
    palette.push('&amp;R- バフラウンド-1');
    palette.push('&amp;R+ バフラウンド+1');
    palette.push('&amp;D 0R以下のバフ消去');
    palette.push('&amp;R- &amp;D バフのラウンド進行');
    palette.push('');
    palette.push('t&amp;バフ名/効果/R数 対象にバフ追加');
    palette.push('t&amp;バフ名- 対象のバフ消去');
    palette.push('t&amp;R- 対象のバフラウンド-1');
    palette.push('t&amp;R+ 対象のバフラウンド+1');
    palette.push('t&amp;D 対象の0R以下のバフ消去');
    palette.push('t&amp;R- t&amp;D 対象のバフのラウンド進行');
    palette.push('');
    palette.push('&amp;縛鎖- セットアップ終了時に自動的に回復');
    palette.push('&amp;スタン- イニシアチブの権利を得た際に自動的に回復');
    palette.push('&amp;スリップ- ムーブ使用時に回復');
    palette.push('&amp;威圧- マイナー使用時に回復');
    palette.push('&amp;狂戦士化- マイナー使用時に回復');
    palette.push('&amp;恐怖- メインプロセス終了時に自動的に回復');
    palette.push('&amp;逆上- &amp;ノックバック- &amp;放心- クリンナップで自動的に回復');
    palette.push('&amp;毒-');
    palette.push('&amp;衰弱-');
    palette.push('');
  }

  _addIdentifyInfo(palette, enemy) {
    palette.push('//--- ==========識別公開情報==========');
    const defenseType = enemy.physicalDef > enemy.magicDef ? '物理防御力の方が高い' :
                        enemy.physicalDef < enemy.magicDef ? '魔法防御力の方が高い' :
                        '物理防御力と魔法防御力が同じ';
    palette.push(`名称: {name} 分類: {分類} レベル: {レベル} 属性: {属性} 防御力: ${defenseType}`);
  }

  _addSkillsInfo(palette, enemy) {
    palette.push('//--- ==========エネミースキル==========');

    // スキルをタイミングごとにグループ化
    const groupedSkills = {};
    this.skillLibraryManager.getTimingOrder().forEach(timing => {
      groupedSkills[timing] = [];
    });

    if (enemy.skills && enemy.skills.length > 0) {
      enemy.skills.forEach(skill => {
        const timing = skill.timing || '効果参照';
        if (!groupedSkills[timing]) {
          groupedSkills[timing] = [];
        }
        groupedSkills[timing].push(skill);
      });
    }

    // 全てのタイミングセクションを出力（空でも）
    this.skillLibraryManager.getTimingOrder().forEach(timing => {
      palette.push(`//--- 【${timing}】`);
      if (groupedSkills[timing].length > 0) {
        groupedSkills[timing].forEach(skill => {
          // スキル名を参照して詳細を表示できるようにする
          palette.push(`{${skill.name}}`);
        });
      }
      palette.push('');
    });
  }

  _addDropInfo(palette, enemy) {
    palette.push('//--- ==========ドロップ品==========');
    if (enemy.drops && enemy.drops.length > 0) {
      enemy.drops.forEach(drop => {
        const range = this._formatDropRange(drop);
        palette.push(`{${range}}`);
      });
    }
  }

  _addCustomCommands(palette, enemy) {
    if (enemy.customCommands && enemy.customCommands.trim()) {
      palette.push('//--- ==========カスタム==========');
      // 一般的なバフ操作のテンプレートは「バフ関連」セクションに常に出力されます
      // カスタムコマンドを行ごとに分割して追加
      // DOMが自動でエスケープするため、_escapeXmlは不要
      const commands = enemy.customCommands.trim().split('\n');
      commands.forEach(command => {
        const trimmedCommand = command.trim();
        if (trimmedCommand) {
          palette.push(trimmedCommand);
        }
      });
      // カスタムセクションと公開情報セクションの間に空行を追加
      palette.push('');
    }
  }

  _formatSkill(skill) {
    const classificationText = skill.classification ? `[分類:${skill.classification}]` : '';
    let formatted = `《${skill.name || ''}》`;
    const weaponMeta = this._formatWeaponMeta(skill);
    if (weaponMeta) {
      formatted += weaponMeta;
    }
    formatted += classificationText;

    const line1Parts = [];
    if (skill.timing) line1Parts.push(`[タイミング:${skill.timing}]`);
    if (skill.judge) line1Parts.push(`[判定:${skill.judge}]`);

    const line2Parts = [];
    if (skill.target) line2Parts.push(`[対象:${skill.target}]`);
    if (skill.range) line2Parts.push(`[射程:${skill.range}]`);

    const line3Parts = [];
    // コストを出力（0の場合は―）
    const costDisplay = (skill.cost === 0 || skill.cost === '0') ? '―' : skill.cost;
    line3Parts.push(`[コスト:${costDisplay}]`);
    const slDisplay = skill.isWeaponAttack ? '―' : skill.sl;
    if (slDisplay) line3Parts.push(`[SL:${slDisplay}]`);
    const conditionDisplay = skill.condition || '―';
    line3Parts.push(`[使用条件:${conditionDisplay}]`);

    if (line1Parts.length > 0) formatted += '\n' + line1Parts.join('');
    if (line2Parts.length > 0) formatted += '\n' + line2Parts.join('');
    if (line3Parts.length > 0) formatted += '\n' + line3Parts.join('');
    if (skill.effect) formatted += '\n[効果]:' + skill.effect;

    // クリティカル処理を追加（needsCriticalがtrueの場合のみ）
    if (skill.needsCritical !== false && skill.judge && skill.judge !== '自動成功' && skill.judge !== '―') {
      let criticalText = '';
      if (skill.criticalEffect === 'diceRoll') {
        criticalText = 'ダイスロール増加';
      } else if (skill.criticalEffect === 'costZero') {
        criticalText = 'コスト0';
      } else if (skill.criticalEffect === 'custom' && skill.customCritical) {
        criticalText = skill.customCritical;
      }
      if (criticalText) {
        formatted += `\n【クリティカル:${criticalText}】`;
      }
    }

    return formatted;
  }

  _formatWeaponMeta(skill) {
    if (!skill || !skill.isWeaponAttack) return '';
    const segments = [skill.weaponType, skill.weaponGrip, skill.weaponMethod, skill.weaponDamage]
      .map(part => (part || '').trim())
      .filter(Boolean);
    return segments.length > 0 ? `(${segments.join('/')})` : '';
  }

  _addBuffPalette(doc, character) {
    const buffPalette = doc.createElement('buff-palette');
    buffPalette.setAttribute('dicebot', 'Arianrhod');
    let buffText = `毒 0 9999
衰弱 0 9999
威圧 1 9999
逆上 1 1
スタン 1 0
スリップ 1 9999
ノックバック 0 1
放心 1 1
狂戦士化 0 9999
恐怖 1 0
縛鎖 1 2`;
    // 既存のXML文字実体参照を元の文字に戻す（XMLSerializerが自動でエスケープするため）
    buffText = this._unescapeXmlEntities(buffText);
    buffPalette.appendChild(doc.createTextNode(buffText));
    character.appendChild(buffPalette);
  }

  _formatDropItem(drop) {
    // アイテム名が「なし」の場合
    if (drop.itemName === 'なし') {
      return 'なし';
    }

    // アイテム名
    let result = drop.itemName;

    // 価格を追加
    if (drop.price) {
      const priceStr = drop.price.trim();
      // 数値かどうかチェック
      if (/^\d+$/.test(priceStr)) {
        // 数値の場合はカンマ区切りにしてGを付ける
        const formatted = parseInt(priceStr).toLocaleString('ja-JP');
        result += `(${formatted}G)`;
      } else {
        // 数値以外（非売品、-など）の場合はGを付けない
        result += `(${priceStr})`;
      }
    }

    // 個数を追加（1個の場合は省略）
    if (drop.quantity && drop.quantity > 1) {
      result += `x${drop.quantity}`;
    }

    return result;
  }

  _formatDropRange(drop) {
    if (drop.max === null) {
      return `${drop.min}-`;
    }
    if (drop.min === drop.max) {
      return `${drop.min}`;
    }
    return `${drop.min}-${drop.max}`;
  }

  // XML文字実体参照を元の文字に戻す（XMLSerializerが自動でエスケープするため）
  _unescapeXmlEntities(text) {
    if (!text) return '';
    return String(text)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  // XMLを読みやすいフォーマットに整形（プレビュー表示やダウンロード両方で使用）
  formatXmlForPreview(xmlString) {
    if (!xmlString) return '';

    const indentUnit = '  ';

    const getElementName = (tag) => {
      if (!tag) return '';
      const match = tag.match(/name="([^"]*)"/);
      return match ? match[1] : '';
    };

    const shouldForceBlockElement = (tag) => {
      const name = getElementName(tag);
      if (!name) return false;
      return FORCE_BLOCK_ELEMENT_NAMES.includes(name);
    };

    // XML宣言を分離
    const xmlDeclarationMatch = xmlString.match(/^<\?xml[^?]*\?>/);
    const xmlDeclaration = xmlDeclarationMatch ? xmlDeclarationMatch[0] : '';
    let body = xmlString;
    if (xmlDeclaration) {
      body = xmlString.substring(xmlDeclaration.length).trim();
    }

    // タグとテキストを分割
    const parts = body.split(/(<[^>]+>)/);
    let result = xmlDeclaration ? xmlDeclaration + '\n' : '';

    // 開始タグと終了タグの対応を追跡するスタック
    const tagStack = [];
    let i = 0;
    let needsIndent = true;

    const appendWithIndent = (text, depth) => {
      if (!text) return;
      if (needsIndent) {
        result += indentUnit.repeat(depth);
        needsIndent = false;
      }
      result += text;
    };

    const appendText = (text) => {
      if (!text.trim()) return;
      appendWithIndent(text, tagStack.length);
    };

    const insertNewLine = (indentNext = true) => {
      if (!result.endsWith('\n')) {
        result += '\n';
      }
      needsIndent = indentNext;
    };

    const getNextPart = (startIndex) => {
      let nextIndex = startIndex;
      while (nextIndex < parts.length && !parts[nextIndex]) {
        nextIndex++;
      }
      if (nextIndex < parts.length) {
        return { index: nextIndex, part: parts[nextIndex] };
      }
      return { index: parts.length, part: null };
    };

    while (i < parts.length) {
      const part = parts[i];
      if (!part) {
        i++;
        continue;
      }

      if (part.startsWith('<')) {
        const isClosingTag = part.startsWith('</');
        const isSelfClosing = part.endsWith('/>');
        const isSpecialTag = part.startsWith('<?') || part.startsWith('<!');

        if (isClosingTag) {
          // 終了タグ
          const top = tagStack.pop();
          if (top && (top.hasChildren || top.forceBlock)) {
            insertNewLine();
            appendWithIndent(part, tagStack.length);
          } else {
            appendWithIndent(part, tagStack.length);
          }

          const { part: nextPart } = getNextPart(i + 1);
          if (!nextPart || !nextPart.startsWith('</')) {
            insertNewLine();
          } else {
            needsIndent = false;
          }
        } else if (isSelfClosing || isSpecialTag) {
          // 自己完結タグやコメントなどの特殊タグ
          appendWithIndent(part, tagStack.length);
          insertNewLine();
        } else {
          // 開始タグ
          // 次の要素を確認して、子要素があるかどうかを判定
          let hasChildren = false;
          let hasTextContent = false;

          const { index: nextIndex, part: nextPart } = getNextPart(i + 1);

          if (nextPart) {
            if (!nextPart.startsWith('<')) {
              // テキストコンテンツがある
              if (nextPart.trim()) {
                hasTextContent = true;
              }
            } else if (!nextPart.startsWith('</') && !nextPart.endsWith('/>')) {
              // 子要素（開始タグ）がある
              hasChildren = true;
            }
          }

          const forceBlock = shouldForceBlockElement(part);

          // 開始タグを出力（インデント付与）
          appendWithIndent(part, tagStack.length);

          // 子要素または強制ブロック対象の場合は改行を入れる
          if (hasChildren || forceBlock) {
            insertNewLine();
          }

          // スタックに情報を保存
          tagStack.push({
            hasChildren: hasChildren,
            hasTextContent: hasTextContent,
            forceBlock: forceBlock
          });
        }
      } else {
        // テキストコンテンツ
        appendText(part);
      }

      i++;
    }

    return result.trimEnd() + '\n';
  }

}

// =============================================================================
// UI管理クラス
// =============================================================================

/**
 * UI管理クラス
 */
class UIManager {
  constructor(enemyManager, skillLibraryManager, xmlGenerator) {
    this.enemyManager = enemyManager;
    this.skillLibraryManager = skillLibraryManager;
    this.xmlGenerator = xmlGenerator;
    this.currentTab = 'enemies';
    this.elements = this._getElements();
    this.enemyDblClickBound = false;
  }

  _getElements() {
    return {
      // タブ
      tabEnemies: document.getElementById('tabEnemies'),
      tabSkills: document.getElementById('tabSkills'),
      enemiesTab: document.getElementById('enemiesTab'),
      skillsTab: document.getElementById('skillsTab'),

      // エネミー管理
      newEnemyBtn: document.getElementById('newEnemyBtn'),
      bulkExportBtn: document.getElementById('bulkExportBtn'),
      saveEnemyBtn: document.getElementById('saveEnemyBtn'),
      cancelEditBtn: document.getElementById('cancelEditBtn'),
      previewBtn: document.getElementById('previewBtn'),
      downloadZipBtn: document.getElementById('downloadZipBtn'),
      downloadXmlBtn: document.getElementById('downloadXmlBtn'),
      searchInput: document.getElementById('searchInput'),
      enemyList: document.getElementById('enemyList'),
      enemyFormSection: document.getElementById('enemyFormSection'),
      enemyForm: document.getElementById('enemyForm'),
      formTitle: document.getElementById('formTitle'),

      // スキルライブラリ管理
      newSkillLibraryBtn: document.getElementById('newSkillLibraryBtn'),
      saveSkillLibraryBtn: document.getElementById('saveSkillLibraryBtn'),
      cancelSkillEditBtn: document.getElementById('cancelSkillEditBtn'),
      skillSearchInput: document.getElementById('skillSearchInput'),
      skillLibraryList: document.getElementById('skillLibraryList'),
      skillLibraryFormSection: document.getElementById('skillLibraryFormSection'),
      skillLibraryForm: document.getElementById('skillLibraryForm'),
      skillFormTitle: document.getElementById('skillFormTitle'),

      // データ管理
      exportDataBtn: document.getElementById('exportDataBtn'),
      importDataBtn: document.getElementById('importDataBtn'),
      importFileInput: document.getElementById('importFileInput'),
      clearAllBtn: document.getElementById('clearAllBtn'),
      exportSkillLibraryBtn: document.getElementById('exportSkillLibraryBtn'),
      importSkillLibraryBtn: document.getElementById('importSkillLibraryBtn'),
      importSkillFileInput: document.getElementById('importSkillFileInput'),
      copyrightNotice: document.getElementById('copyrightNotice'),

      // モーダル
      modal: document.getElementById('modal'),
      modalTitle: document.getElementById('modalTitle'),
      modalMessage: document.getElementById('modalMessage'),
      modalConfirmBtn: document.getElementById('modalConfirmBtn'),
      modalCancelBtn: document.getElementById('modalCancelBtn'),
      skillSelectModal: document.getElementById('skillSelectModal'),
      skillSelectList: document.getElementById('skillSelectList'),
      skillSelectSearch: document.getElementById('skillSelectSearch'),
      skillSelectCancelBtn: document.getElementById('skillSelectCancelBtn'),
      previewModal: document.getElementById('previewModal'),
      previewContent: document.getElementById('previewContent'),
      previewCloseBtn: document.getElementById('previewCloseBtn'),

      // エネミーフォーム要素
      enemyName: document.getElementById('enemyName'),
      enemyLevel: document.getElementById('enemyLevel'),
      isMob: document.getElementById('isMob'),
      enemyClassification: document.getElementById('enemyClassification'),
      enemyAttribute: document.getElementById('enemyAttribute'),
      enemyPage: document.getElementById('enemyPage'),
      enemyIdentifyValue: document.getElementById('enemyIdentifyValue'),
      enemySize: document.getElementById('enemySize'),
      enemyHP: document.getElementById('enemyHP'),
      enemyMP: document.getElementById('enemyMP'),
      enemyInitiativeBase: document.getElementById('enemyInitiativeBase'),
      enemyInitiative: document.getElementById('enemyInitiative'),
      enemyInitiativeBonus: document.getElementById('enemyInitiativeBonus'),
      initiativeManual: document.getElementById('initiativeManual'),
      enemyMoveBase: document.getElementById('enemyMoveBase'),
      enemyMove: document.getElementById('enemyMove'),
      enemyMoveBonus: document.getElementById('enemyMoveBonus'),
      moveManual: document.getElementById('moveManual'),
      enemyPhysicalDef: document.getElementById('enemyPhysicalDef'),
      enemyMagicDef: document.getElementById('enemyMagicDef'),
      enemyMemo: document.getElementById('enemyMemo'),
      enemyCustomCommands: document.getElementById('enemyCustomCommands'),
      buffName: document.getElementById('buffName'),
      buffEffect: document.getElementById('buffEffect'),
      buffRounds: document.getElementById('buffRounds'),
      buffTarget: document.getElementById('buffTarget'),
      addBuffBtn: document.getElementById('addBuffBtn'),
      addBuffRemoveBtn: document.getElementById('addBuffRemoveBtn'),
      dropItemsContainer: document.getElementById('dropItemsContainer'),
      skillsContainer: document.getElementById('skillsContainer'),
      addDropItemBtn: document.getElementById('addDropItemBtn'),
      addSkillBtn: document.getElementById('addSkillBtn'),
      addWeaponSkillBtn: document.getElementById('addWeaponSkillBtn'),
      selectFromLibraryBtn: document.getElementById('selectFromLibraryBtn'),
    };
  }

  init() {
    this._setupEventListeners();
    this._setupModalCloseHandlers();
    this.renderEnemyList();
    this.renderSkillLibraryList();
    this._renderCopyrightNotice();
  }

  _setupEventListeners() {
    // タブ切り替え
    this.elements.tabEnemies.addEventListener('click', () => this.switchTab('enemies'));
    this.elements.tabSkills.addEventListener('click', () => this.switchTab('skills'));

    // エネミー管理
    this.elements.newEnemyBtn.addEventListener('click', () => this.showEnemyForm());
    this.elements.bulkExportBtn.addEventListener('click', () => this.bulkExportEnemies());
    this.elements.saveEnemyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.saveEnemy();
    });
    this.elements.cancelEditBtn.addEventListener('click', () => this.hideEnemyForm());
    this.elements.searchInput.addEventListener('input', (e) => this.renderEnemyList(e.target.value));
    this.elements.previewBtn.addEventListener('click', () => this.showPreview());
    this.elements.downloadZipBtn.addEventListener('click', () => this.downloadEnemyZip());
    this.elements.downloadXmlBtn.addEventListener('click', () => this.downloadEnemyXml());
    this.elements.previewCloseBtn.addEventListener('click', () => this.hidePreview());
    this._attachEnemyDoubleClickHandlers();

    // モブエネミーチェックボックス
    this.elements.isMob.addEventListener('change', () => this.handleMobChange());

    // 能力値モード切り替え
    document.querySelectorAll('input[name="abilityMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this._switchAbilityMode(e.target.value);
        }
      });
    });

    // 能力値の自動計算
    ['strBase', 'dexBase', 'agiBase', 'intBase', 'senBase', 'spiBase', 'luckBase'].forEach(id => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.addEventListener('input', () => this.calculateAbilities());
      }
    });

    // 能力値変更時のリソース自動計算
    ['str', 'agi', 'sen'].forEach(id => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.addEventListener('input', () => this.calculateResources());
      }
    });

    // 補正値変更時のリソース自動計算
    ['enemyInitiativeBonus', 'enemyMoveBonus'].forEach(id => {
      const elem = this.elements[id];
      if (elem) {
        elem.addEventListener('input', () => this.calculateResources());
      }
    });

    // 直接入力チェックボックス
    this.elements.initiativeManual.addEventListener('change', () => this.toggleInitiativeManual());
    this.elements.moveManual.addEventListener('change', () => this.toggleMoveManual());

    // ドロップ品・スキル
    this.elements.addDropItemBtn.addEventListener('click', () => this.addDropItem());
    this.elements.addSkillBtn.addEventListener('click', () => this.addSkillToEnemy());
    this.elements.addWeaponSkillBtn.addEventListener('click', () => this.addWeaponSkill());
    this.elements.selectFromLibraryBtn.addEventListener('click', () => this.showSkillSelectModal());
    this.elements.skillSelectCancelBtn.addEventListener('click', () => this.hideSkillSelectModal());
    this.elements.skillSelectSearch.addEventListener('input', (e) => this.renderSkillSelectList(e.target.value));

    // バフデバフパレット
    this.elements.addBuffBtn.addEventListener('click', () => this.addBuffToPalette());
    this.elements.addBuffRemoveBtn.addEventListener('click', () => this.addBuffRemoveCommand());

    // スキルライブラリ管理
    this.elements.newSkillLibraryBtn.addEventListener('click', () => this.showSkillLibraryForm());
    this.elements.saveSkillLibraryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.saveSkillLibrary();
    });
    this.elements.cancelSkillEditBtn.addEventListener('click', () => this.hideSkillLibraryForm());
    this.elements.skillSearchInput.addEventListener('input', (e) => this.renderSkillLibraryList(e.target.value));

    // データ管理
    this.elements.exportDataBtn.addEventListener('click', () => this.exportAllData());
    this.elements.importDataBtn.addEventListener('click', () => this.elements.importFileInput.click());
    this.elements.importFileInput.addEventListener('change', (e) => this.importAllData(e.target.files[0]));
    this.elements.clearAllBtn.addEventListener('click', () => this.confirmClearAll());
    this.elements.exportSkillLibraryBtn.addEventListener('click', () => this.exportSkillLibrary());
    this.elements.importSkillLibraryBtn.addEventListener('click', () => this.elements.importSkillFileInput.click());
    this.elements.importSkillFileInput.addEventListener('change', (e) => this.importSkillLibrary(e.target.files[0]));

    // モーダル
    this.elements.modalCancelBtn.addEventListener('click', () => this.hideModal());
  }

  _renderCopyrightNotice() {
    const noticeEl = this.elements.copyrightNotice;
    if (!noticeEl) return;

    noticeEl.innerHTML = '';

    if (COPYRIGHT_NOTICE.heading) {
      const headingEl = document.createElement('p');
      headingEl.className = 'license-notice__heading';
      headingEl.textContent = COPYRIGHT_NOTICE.heading;
      noticeEl.appendChild(headingEl);
    }

    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'license-notice__messages';

    COPYRIGHT_NOTICE.messages.forEach(message => {
      const messageEl = document.createElement('p');
      messageEl.className = 'license-notice__message';
      messageEl.textContent = message;
      messageWrapper.appendChild(messageEl);
    });

    noticeEl.appendChild(messageWrapper);
  }

  // タブ切り替え
  switchTab(tab) {
    this.currentTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tab === 'enemies') {
      this.elements.tabEnemies.classList.add('active');
      this.elements.enemiesTab.classList.add('active');
    } else {
      this.elements.tabSkills.classList.add('active');
      this.elements.skillsTab.classList.add('active');
    }
  }

  // エネミー一覧表示
  renderEnemyList(searchTerm = '') {
    const enemies = this.enemyManager.search(searchTerm);

    if (enemies.length === 0) {
      const template = document.querySelector('#template-enemy-empty-state');
      const clone = template.content.cloneNode(true);
      const p = clone.querySelector('p');
      p.textContent = searchTerm ? '該当するエネミーが見つかりません。' : 'エネミーがまだ登録されていません。';

      if (!searchTerm) {
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.textContent = '最初のエネミーを作成';
        button.addEventListener('click', () => this.showEnemyForm());
        clone.querySelector('.empty-state').appendChild(button);
      }

      this.elements.enemyList.innerHTML = '';
      this.elements.enemyList.appendChild(clone);
      return;
    }

    this.elements.enemyList.innerHTML = '';
    const template = document.querySelector('#template-enemy-item');

    enemies.forEach(enemy => {
      const clone = template.content.cloneNode(true);
      const item = clone.querySelector('.enemy-item');

      if (this.enemyManager.editingEnemyId === enemy.id) {
        item.classList.add('active');
      }

      item.dataset.enemyId = enemy.id;
      clone.querySelector('.enemy-item-name').textContent = enemy.name;
      clone.querySelector('.enemy-item-level').textContent = `Lv ${enemy.getLevelDisplay()}`;
      clone.querySelector('.enemy-classification').textContent = enemy.classification || '-';
      clone.querySelector('.enemy-hp').textContent = enemy.hp;
      clone.querySelector('.enemy-attribute').textContent = enemy.attribute || '-';

      // チェックボックスの設定
      const checkbox = clone.querySelector('.enemy-checkbox');
      checkbox.dataset.enemyId = enemy.id;
      checkbox.addEventListener('change', () => this._updateBulkExportButton());

      clone.querySelector('.enemy-edit-btn').addEventListener('click', () => this.editEnemy(enemy.id));
      clone.querySelector('.enemy-download-btn').addEventListener('click', () => this.downloadSingleEnemyZip(enemy.id));
      const downloadXmlBtn = clone.querySelector('.enemy-download-xml-btn');
      if (downloadXmlBtn) {
        downloadXmlBtn.addEventListener('click', () => this.downloadSingleEnemyXml(enemy.id));
      }
      clone.querySelector('.enemy-duplicate-btn').addEventListener('click', () => this.duplicateEnemy(enemy.id));
      clone.querySelector('.enemy-delete-btn').addEventListener('click', () => this.deleteEnemy(enemy.id));

      this.elements.enemyList.appendChild(clone);
    });

    // 一括エクスポートボタンの表示状態を更新
    this._updateBulkExportButton();
  }

  _updateBulkExportButton() {
    const checkedBoxes = this.elements.enemyList.querySelectorAll('.enemy-checkbox:checked');
    this.elements.bulkExportBtn.style.display = checkedBoxes.length > 0 ? 'inline-block' : 'none';
  }

  // エネミーカードにダブルクリックイベントを追加
  _attachEnemyDoubleClickHandlers() {
    if (this.enemyDblClickBound || !this.elements.enemyList) return;
    this.enemyDblClickBound = true;
    this.elements.enemyList.addEventListener('dblclick', (event) => {
      const item = event.target.closest('.enemy-item');
      if (!item || !this.elements.enemyList.contains(item)) return;
      const enemyId = item.dataset.enemyId;
      if (enemyId) {
        this.editEnemy(enemyId);
      }
    });
  }

  // エネミーフォーム表示
  showEnemyForm(enemy = null) {
    this.enemyManager.editingEnemyId = enemy ? enemy.id : null;
    this.elements.formTitle.textContent = enemy ? 'エネミー編集' : '新規エネミー作成';
    this.elements.previewBtn.style.display = enemy ? 'inline-block' : 'none';
    this.elements.downloadZipBtn.style.display = enemy ? 'inline-block' : 'none';
    this.elements.downloadXmlBtn.style.display = enemy ? 'inline-block' : 'none';

    if (enemy) {
      this._populateEnemyForm(enemy);
    } else {
      this.elements.enemyForm.reset();
      this._clearDropItems();
      this._clearSkills();
      // デフォルトのカスタムチャットパレットコマンドを設定（空にする）
      // 一般的なバフ操作コマンドは「バフ関連」セクションに自動的に追加されるため、
      // ここでは空にして、カスタムコマンドのみを記述できるようにする
      this.elements.enemyCustomCommands.value = '';
      this.handleMobChange();
    }

    this.elements.enemyFormSection.style.display = 'block';
    this.elements.enemyFormSection.scrollIntoView({ behavior: 'smooth' });
  }

  hideEnemyForm() {
    this.elements.enemyFormSection.style.display = 'none';
    this.elements.enemyForm.reset();
    this.enemyManager.editingEnemyId = null;
    this.renderEnemyList();
  }

  _populateEnemyForm(enemy) {
    this.elements.enemyName.value = enemy.name;
    this.elements.enemyLevel.value = enemy.level;
    this.elements.isMob.checked = enemy.isMob;
    this.elements.enemyClassification.value = enemy.classification || '';
    this.elements.enemyAttribute.value = enemy.attribute || '';
    this.elements.enemyPage.value = enemy.page || '';
    this.elements.enemyIdentifyValue.value = enemy.identifyValue;
    this.elements.enemySize.value = enemy.sizeNum;

    this.elements.enemyHP.value = enemy.hp;
    this.elements.enemyMP.value = enemy.mp;
    this.elements.enemyInitiative.value = enemy.initiative;
    this.elements.enemyInitiativeBonus.value = enemy.initiativeBonus || 0;
    this.elements.initiativeManual.checked = enemy.initiativeManual || false;
    this.elements.enemyMove.value = enemy.move;
    this.elements.enemyMoveBonus.value = enemy.moveBonus || 0;
    this.elements.moveManual.checked = enemy.moveManual || false;
    this.elements.enemyPhysicalDef.value = enemy.physicalDef;
    this.elements.enemyMagicDef.value = enemy.magicDef;

    // 直接入力モードの設定
    this.toggleInitiativeManual();
    this.toggleMoveManual();

    this.handleMobChange();

    if (enemy.isMob) {
      document.getElementById('action').value = enemy.action || 0;
      document.getElementById('reaction').value = enemy.reaction || 0;
    } else if (enemy.strBase !== undefined) {
      const baseRadio = document.querySelector('input[name="abilityMode"][value="base"]');
      if (baseRadio) {
        baseRadio.checked = true;
      }
      document.getElementById('strBase').value = enemy.strBase;
      document.getElementById('dexBase').value = enemy.dexBase;
      document.getElementById('agiBase').value = enemy.agiBase;
      document.getElementById('intBase').value = enemy.intBase;
      document.getElementById('senBase').value = enemy.senBase;
      document.getElementById('spiBase').value = enemy.spiBase;
      document.getElementById('luckBase').value = enemy.luckBase;
      this._switchAbilityMode('base');
      this.calculateAbilities();
    } else {
      const normalRadio = document.querySelector('input[name="abilityMode"][value="normal"]');
      if (normalRadio) {
        normalRadio.checked = true;
      }
      document.getElementById('str').value = enemy.str || 0;
      document.getElementById('dex').value = enemy.dex || 0;
      document.getElementById('agi').value = enemy.agi || 0;
      document.getElementById('int').value = enemy.int || 0;
      document.getElementById('sen').value = enemy.sen || 0;
      document.getElementById('spi').value = enemy.spi || 0;
      document.getElementById('luck').value = enemy.luck || 0;
      this._switchAbilityMode('normal');
    }

    this._clearDropItems();
    if (enemy.drops && enemy.drops.length > 0) {
      enemy.drops.forEach(drop => this.addDropItem(drop));
    }

    this._clearSkills();
    if (enemy.skills && enemy.skills.length > 0) {
      enemy.skills.forEach(skill => this.addSkillToEnemy(skill));
    }

    this.elements.enemyMemo.value = enemy.memo || '';
    this.elements.enemyCustomCommands.value = enemy.customCommands || '';
  }

  // モブエネミーチェックボックスの変更処理
  handleMobChange() {
    const isMob = this.elements.isMob.checked;
    const abilityModeRadios = document.querySelectorAll('input[name="abilityMode"]');

    if (isMob) {
      // モブの場合はアクション/リアクションのみ
      abilityModeRadios.forEach(radio => {
        if (radio.value === 'action') {
          radio.checked = true;
          radio.disabled = false;
        } else {
          radio.disabled = true;
        }
      });
      this._switchAbilityMode('action');

      // モブの場合、行動値と移動力は手動入力可能
      this.elements.enemyInitiative.readOnly = false;
      this.elements.enemyMove.readOnly = false;
    } else {
      // 通常エネミーの場合はアクション/リアクション以外
      abilityModeRadios.forEach(radio => {
        if (radio.value === 'action') {
          radio.disabled = true;
        } else {
          radio.disabled = false;
          if (!document.querySelector('input[name="abilityMode"]:checked:not(:disabled)')) {
            if (radio.value === 'base') {
              radio.checked = true;
            }
          }
        }
      });

      const checkedMode = document.querySelector('input[name="abilityMode"]:checked');
      if (checkedMode && !checkedMode.disabled) {
        this._switchAbilityMode(checkedMode.value);
      } else {
        document.querySelector('input[name="abilityMode"][value="base"]').checked = true;
        this._switchAbilityMode('base');
      }

      // 通常エネミーの場合、行動値と移動力は自動計算（readonly）
      this.elements.enemyInitiative.readOnly = true;
      this.elements.enemyMove.readOnly = true;
      this.calculateResources();
    }
  }

  _switchAbilityMode(mode) {
    document.getElementById('abilityBaseInputs').style.display = mode === 'base' ? 'block' : 'none';
    document.getElementById('abilityNormalInputs').style.display = mode === 'normal' ? 'block' : 'none';
    document.getElementById('abilityActionInputs').style.display = mode === 'action' ? 'block' : 'none';
    this.calculateResources();
  }

  // 能力基本値から能力値を計算
  calculateAbilities() {
    const abilities = ['str', 'dex', 'agi', 'int', 'sen', 'spi', 'luck'];
    abilities.forEach(ability => {
      const baseElem = document.getElementById(ability + 'Base');
      const calcElem = document.getElementById(ability + 'Calc');
      if (baseElem && calcElem) {
        const baseValue = parseInt(baseElem.value) || 0;
        const calculatedValue = Math.floor(baseValue / 3);
        calcElem.textContent = calculatedValue;

        // 隠しinputに値を保存（フォーム送信用）
        let hiddenInput = document.getElementById(ability + 'Hidden');
        if (!hiddenInput) {
          hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.id = ability + 'Hidden';
          hiddenInput.name = ability;
          baseElem.parentNode.appendChild(hiddenInput);
        }
        hiddenInput.value = calculatedValue;
      }
    });

    // リソースも再計算
    this.calculateResources();
  }

  // リソースを自動計算
  calculateResources() {
    const isMob = this.elements.isMob.checked;

    if (!isMob) {
      const abilityMode = document.querySelector('input[name="abilityMode"]:checked')?.value;
      let agi = 0, sen = 0, str = 0;

      if (abilityMode === 'base') {
        agi = Math.floor((parseInt(document.getElementById('agiBase').value) || 0) / 3);
        sen = Math.floor((parseInt(document.getElementById('senBase').value) || 0) / 3);
        str = Math.floor((parseInt(document.getElementById('strBase').value) || 0) / 3);
      } else if (abilityMode === 'normal') {
        agi = parseInt(document.getElementById('agi').value) || 0;
        sen = parseInt(document.getElementById('sen').value) || 0;
        str = parseInt(document.getElementById('str').value) || 0;
      }

      // 基本値を計算して表示
      const initiativeBase = agi + sen;
      const moveBase = str + 5;
      this.elements.enemyInitiativeBase.value = initiativeBase;
      this.elements.enemyMoveBase.value = moveBase;

      // 直接入力モードでない場合は最終値を自動計算
      if (!this.elements.initiativeManual.checked) {
        const initiativeBonus = parseInt(this.elements.enemyInitiativeBonus.value) || 0;
        this.elements.enemyInitiative.value = initiativeBase + initiativeBonus;
      }

      if (!this.elements.moveManual.checked) {
        const moveBonus = parseInt(this.elements.enemyMoveBonus.value) || 0;
        this.elements.enemyMove.value = moveBase + moveBonus;
      }
    }
  }

  // 行動値の直接入力モード切り替え
  toggleInitiativeManual() {
    const isManual = this.elements.initiativeManual.checked;
    this.elements.enemyInitiative.readOnly = !isManual;

    if (!isManual) {
      // 自動計算モードに戻ったら再計算
      this.calculateResources();
    }
  }

  // 移動力の直接入力モード切り替え
  toggleMoveManual() {
    const isManual = this.elements.moveManual.checked;
    this.elements.enemyMove.readOnly = !isManual;

    if (!isManual) {
      // 自動計算モードに戻ったら再計算
      this.calculateResources();
    }
  }

  // エネミーを保存
  saveEnemy() {
    try {
      // フォーカスを外して入力値を確定させる
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }

      const enemyData = this._getEnemyFormData();

      if (!enemyData.name) {
        alert('エネミー名を入力してください。');
        return;
      }

      // ドロップ品のバリデーション
      const dropValidation = this._validateDropRanges(enemyData.drops);
      if (!dropValidation.valid) {
        alert(`ドロップ品の出目範囲にエラーがあります:\n\n${dropValidation.errors.join('\n')}\n\n出目の範囲に抜けや重複がないか確認してください。`);
        return;
      }

      // スキップされたスキルがあれば警告メッセージを構築
      let skippedWarning = '';
      if (this._lastSkippedSkills && this._lastSkippedSkills.length > 0) {
        const skippedList = this._lastSkippedSkills.map(s =>
          `・${s.name}: ${s.missingFields.join('、')}が未入力`
        ).join('\n');
        skippedWarning = `\n\n【注意】以下のスキルは必須項目が未入力のため保存されませんでした:\n${skippedList}`;
      }

      if (this.enemyManager.editingEnemyId) {
        this.enemyManager.update(this.enemyManager.editingEnemyId, enemyData);
        alert(`エネミー「${enemyData.name}」を更新しました。${skippedWarning}`);
      } else {
        this.enemyManager.add(enemyData);
        alert(`エネミー「${enemyData.name}」を作成しました。${skippedWarning}`);
      }

      this.hideEnemyForm();
      this.renderEnemyList();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  }

  // ドロップ品の範囲をバリデーション
  _validateDropRanges(drops) {
    if (!drops || drops.length === 0) {
      return { valid: true, errors: [] };
    }

    const errors = [];
    const ranges = [];

    // 各ドロップ品の範囲をチェック
    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];

      // 下限値チェック
      if (!drop.min) {
        errors.push(`${i + 1}番目のドロップ品: 下限値が入力されていません`);
        continue;
      }

      // 「なし」の場合はスキップ
      if (drop.itemName === 'なし') {
        continue;
      }

      const min = drop.min;
      const max = drop.max !== null ? drop.max : Infinity;

      // 範囲の妥当性チェック
      if (max !== Infinity && min > max) {
        errors.push(`${i + 1}番目のドロップ品: 下限値(${min})が上限値(${max})より大きいです`);
        continue;
      }

      ranges.push({
        index: i,
        min: min,
        max: max,
        itemName: drop.itemName
      });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // 範囲をソート
    ranges.sort((a, b) => a.min - b.min);

    // 重複と抜けをチェック
    for (let i = 0; i < ranges.length; i++) {
      const current = ranges[i];

      // 重複チェック
      for (let j = i + 1; j < ranges.length; j++) {
        const next = ranges[j];
        if (current.max >= next.min) {
          errors.push(
            `${current.index + 1}番目（${current.min}-${current.max === Infinity ? '' : current.max}）と` +
            `${next.index + 1}番目（${next.min}-${next.max === Infinity ? '' : next.max}）の範囲が重複しています`
          );
        }
      }

      // 抜けチェック（次の範囲との間）
      if (i < ranges.length - 1) {
        const next = ranges[i + 1];
        if (current.max !== Infinity && current.max + 1 < next.min) {
          errors.push(
            `${current.max + 1}から${next.min - 1}までの出目が定義されていません`
          );
        }
      }
    }

    // 最小値が2から始まっているかチェック
    if (ranges.length > 0 && ranges[0].min > 2) {
      errors.push(`最小出目は2から始める必要があります（現在: ${ranges[0].min}）`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ドロップ品をフォーマット（表示用）
  _formatDropItem(drop) {
    // アイテム名が「なし」の場合
    if (drop.itemName === 'なし') {
      return 'なし';
    }

    // アイテム名
    let result = drop.itemName;

    // 価格を追加
    if (drop.price) {
      const priceStr = drop.price.trim();
      // 数値かどうかチェック
      if (/^\d+$/.test(priceStr)) {
        // 数値の場合はカンマ区切りにしてGを付ける
        const formatted = parseInt(priceStr).toLocaleString('ja-JP');
        result += `(${formatted}G)`;
      } else {
        // 数値以外（非売品、-など）の場合はGを付けない
        result += `(${priceStr})`;
      }
    }

    // 個数を追加（1個の場合は省略）
    if (drop.quantity && drop.quantity > 1) {
      result += `x${drop.quantity}`;
    }

    return result;
  }

  // ドロップ品の範囲をフォーマット
  _formatDropRange(drop) {
    if (drop.max === null) {
      return `${drop.min}-`;
    }
    if (drop.min === drop.max) {
      return `${drop.min}`;
    }
    return `${drop.min}-${drop.max}`;
  }

  _getEnemyFormData() {
    const isMob = this.elements.isMob.checked;
    const abilityMode = isMob ? 'action' : document.querySelector('input[name="abilityMode"]:checked').value;

    const baseData = {
      name: this.elements.enemyName.value.trim(),
      level: parseInt(this.elements.enemyLevel.value) || 1,
      isMob: isMob,
      classification: this.elements.enemyClassification.value.trim(),
      attribute: this.elements.enemyAttribute.value.trim(),
      page: this.elements.enemyPage.value.trim(),
      identifyValue: parseInt(this.elements.enemyIdentifyValue.value) || 0,
      sizeNum: parseInt(this.elements.enemySize.value) || 2,
      hp: parseInt(this.elements.enemyHP.value) || 0,
      mp: parseInt(this.elements.enemyMP.value) || 0,
      initiative: parseInt(this.elements.enemyInitiative.value) || 0,
      initiativeBonus: parseInt(this.elements.enemyInitiativeBonus.value) || 0,
      initiativeManual: this.elements.initiativeManual.checked,
      move: parseInt(this.elements.enemyMove.value) || 0,
      moveBonus: parseInt(this.elements.enemyMoveBonus.value) || 0,
      moveManual: this.elements.moveManual.checked,
      physicalDef: parseInt(this.elements.enemyPhysicalDef.value) || 0,
      magicDef: parseInt(this.elements.enemyMagicDef.value) || 0,
      abilityMode: abilityMode,
      drops: this._getDropItems(),
      skills: this._getSkills(),
      memo: this.elements.enemyMemo.value.trim(),
      customCommands: this.elements.enemyCustomCommands.value.trim(),
    };

    if (isMob) {
      baseData.action = parseInt(document.getElementById('action').value) || 0;
      baseData.reaction = parseInt(document.getElementById('reaction').value) || 0;
    } else if (abilityMode === 'base') {
      baseData.strBase = parseInt(document.getElementById('strBase').value) || 0;
      baseData.dexBase = parseInt(document.getElementById('dexBase').value) || 0;
      baseData.agiBase = parseInt(document.getElementById('agiBase').value) || 0;
      baseData.intBase = parseInt(document.getElementById('intBase').value) || 0;
      baseData.senBase = parseInt(document.getElementById('senBase').value) || 0;
      baseData.spiBase = parseInt(document.getElementById('spiBase').value) || 0;
      baseData.luckBase = parseInt(document.getElementById('luckBase').value) || 0;
    } else {
      baseData.str = parseInt(document.getElementById('str').value) || 0;
      baseData.dex = parseInt(document.getElementById('dex').value) || 0;
      baseData.agi = parseInt(document.getElementById('agi').value) || 0;
      baseData.int = parseInt(document.getElementById('int').value) || 0;
      baseData.sen = parseInt(document.getElementById('sen').value) || 0;
      baseData.spi = parseInt(document.getElementById('spi').value) || 0;
      baseData.luck = parseInt(document.getElementById('luck').value) || 0;
    }

    return baseData;
  }

  // エネミーを編集
  editEnemy(id) {
    const enemy = this.enemyManager.get(id);
    if (enemy) {
      this.showEnemyForm(enemy);
    }
  }

  // エネミーを複製
  duplicateEnemy(id) {
    const newEnemy = this.enemyManager.duplicate(id);
    if (newEnemy) {
      this.renderEnemyList();
      alert(`エネミー「${newEnemy.name}」を複製しました。`);
    }
  }

  // エネミーを削除
  deleteEnemy(id) {
    const enemy = this.enemyManager.get(id);
    if (!enemy) return;

    this.showConfirmModal(
      'エネミー削除の確認',
      `エネミー「${enemy.name}」を削除してよろしいですか？`,
      () => {
        this.enemyManager.delete(id);
        this.renderEnemyList();
        if (this.enemyManager.editingEnemyId === id) {
          this.hideEnemyForm();
        }
      }
    );
  }

  // バフデバフパレット関連
  addBuffToPalette() {
    const name = this.elements.buffName.value.trim();
    if (!name) {
      alert('バフ名を入力してください。');
      return;
    }

    const effect = this.elements.buffEffect.value.trim();
    const rounds = this.elements.buffRounds.value.trim();
    const isTarget = this.elements.buffTarget.checked;

    // バフコマンドを生成
    let command = isTarget ? 't&' : '&';
    command += name;
    if (effect) {
      command += '/' + effect;
      if (rounds) {
        command += '/' + rounds;
      }
    } else if (rounds) {
      // 効果がなくてもR数だけ指定する場合は、効果を空にする
      command += '//' + rounds;
    }

    // 説明テキストを生成
    let description = isTarget ? '対象に' : '';
    description += name;
    if (effect || rounds) {
      description += 'を与える';
      if (effect && rounds) {
        description += ` (効果:${effect}, R数:${rounds})`;
      } else if (effect) {
        description += ` (効果:${effect})`;
      } else if (rounds) {
        description += ` (R数:${rounds})`;
      }
    } else {
      description += 'を追加';
    }

    // カスタムチャットパレットに追加（コマンド + 説明）
    this._appendToCustomCommands(command + ' ' + description);

    // フォームをクリア
    this.elements.buffName.value = '';
    this.elements.buffEffect.value = '';
    this.elements.buffRounds.value = '';
    this.elements.buffTarget.checked = false;
  }

  addBuffRemoveCommand() {
    const name = this.elements.buffName.value.trim();
    if (!name) {
      alert('バフ名を入力してください。');
      return;
    }

    const isTarget = this.elements.buffTarget.checked;
    const command = (isTarget ? 't&' : '&') + name + '-';
    const description = (isTarget ? '対象の' : '') + name + 'を消去';

    // カスタムチャットパレットに追加（コマンド + 説明）
    this._appendToCustomCommands(command + ' ' + description);

    // フォームをクリア
    this.elements.buffName.value = '';
    this.elements.buffEffect.value = '';
    this.elements.buffRounds.value = '';
    this.elements.buffTarget.checked = false;
  }


  _appendToCustomCommands(text) {
    const textarea = this.elements.enemyCustomCommands;
    const currentValue = textarea.value.trim();
    if (currentValue && !currentValue.endsWith('\n')) {
      textarea.value = currentValue + '\n' + text;
    } else {
      textarea.value = (currentValue ? currentValue + '\n' : '') + text;
    }
  }

  // ドロップ品追加
  addDropItem(data = {}) {
    const container = this.elements.dropItemsContainer;
    const id = `drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 自動設定: 前のドロップ品の上限値+1を下限値として設定
    let defaultMin = data.min || '';
    let defaultMax = data.max || '';

    if (!defaultMin && !defaultMax) {
      // 既存のドロップ品を取得してソート
      const existingItems = this._getDropItems();
      if (existingItems.length > 0) {
        // 下限値でソート
        existingItems.sort((a, b) => a.min - b.min);
        const lastItem = existingItems[existingItems.length - 1];

        // 最後のアイテムの上限値を確認
        if (lastItem.max !== null) {
          // 上限値がある場合のみ、上限値+1を下限値として自動設定
          defaultMin = lastItem.max + 1;
        }
        // 上限値がない場合（「以上」の場合）は、下限値も上限値も空のまま
      }
    }

    const defaultData = {
      min: defaultMin,
      max: defaultMax,
      itemName: data.itemName || '',
      price: data.price || '',
      quantity: data.quantity || 1
    };

    const template = document.querySelector('#template-drop-item-row');
    const clone = template.content.cloneNode(true);
    const tr = clone.querySelector('tr');
    tr.dataset.id = id;

    const minInput = clone.querySelector('.drop-min');
    minInput.value = defaultData.min;
    minInput.addEventListener('change', () => this.handleDropRangeChange(id));

    const maxInput = clone.querySelector('.drop-max');
    maxInput.value = defaultData.max;
    maxInput.addEventListener('change', () => this.handleDropRangeChange(id));

    clone.querySelector('.drop-item-name').value = defaultData.itemName;
    clone.querySelector('.drop-price').value = defaultData.price;
    clone.querySelector('.drop-quantity').value = defaultData.quantity;

    clone.querySelector('.drop-delete-btn').addEventListener('click', () => this.removeDropItem(id));

    container.appendChild(clone);

    // ソート
    this.sortDropItems();
  }

  removeDropItem(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) item.remove();
    // 削除後に範囲自動調整
    this._adjustDropRanges();
  }

  // ドロップ品の範囲変更時の処理
  handleDropRangeChange(id) {
    // ソート
    this.sortDropItems();
    // 範囲自動調整
    this._adjustDropRanges(id);
  }

  // 範囲自動調整
  _adjustDropRanges(changedId = null) {
    const container = this.elements.dropItemsContainer;
    const rows = Array.from(container.querySelectorAll('.drop-item-row'));

    if (rows.length <= 1) return;

    // 現在のデータを取得
    const itemsData = rows.map(row => {
      const minInput = row.querySelector('.drop-min');
      const maxInput = row.querySelector('.drop-max');
      const min = minInput.value ? parseInt(minInput.value) : null;
      const max = maxInput.value ? parseInt(maxInput.value) : null;
      return {
        row,
        id: row.dataset.id,
        min,
        max,
        minInput,
        maxInput
      };
    }).filter(item => item.min !== null);

    // 下限値でソート
    itemsData.sort((a, b) => a.min - b.min);

    // 変更されたアイテムのインデックスを取得
    let changedIndex = -1;
    if (changedId) {
      changedIndex = itemsData.findIndex(item => item.id === changedId);
    }

    // 範囲自動調整
    for (let i = 0; i < itemsData.length; i++) {
      const current = itemsData[i];
      const prev = i > 0 ? itemsData[i - 1] : null;
      const next = i < itemsData.length - 1 ? itemsData[i + 1] : null;

      // 変更されたアイテムのみ処理
      if (changedIndex !== i) continue;

      const currentMax = current.max !== null ? current.max : Infinity;

      // 上限値を増やした場合 → 次のアイテムの下限値を調整
      if (next && currentMax !== Infinity) {
        // 上限値が次のアイテムの下限値以上になった場合、次のアイテムの下限値を調整
        if (currentMax >= next.min) {
          const newNextMin = currentMax + 1;
          if (newNextMin >= 2) {
            next.minInput.value = newNextMin;
            // 再帰的に調整をトリガー
            setTimeout(() => this._adjustDropRanges(next.id), 0);
          }
        }
      }

      // 下限値を減らした場合 → 前のアイテムの上限値を調整
      if (prev) {
        const prevMax = prev.max !== null ? prev.max : Infinity;
        // 下限値が前のアイテムの上限値+1以下になった場合、前のアイテムの上限値を調整
        if (prevMax !== Infinity && current.min <= prevMax + 1) {
          const newPrevMax = current.min - 1;
          if (newPrevMax >= prev.min) {
            prev.maxInput.value = newPrevMax;
            // 再帰的に調整をトリガー
            setTimeout(() => this._adjustDropRanges(prev.id), 0);
          }
        }
      }

      // 最後のアイテム（上限値なし）の下限値を変更した場合
      if (i === itemsData.length - 1 && current.max === null && prev) {
        const prevMax = prev.max !== null ? prev.max : Infinity;
        if (prevMax !== Infinity && current.min <= prevMax + 1) {
          const newPrevMax = current.min - 1;
          if (newPrevMax >= prev.min) {
            prev.maxInput.value = newPrevMax;
            // 再帰的に調整をトリガー
            setTimeout(() => this._adjustDropRanges(prev.id), 0);
          }
        }
      }
    }
  }

  // ドロップ品を下限値でソート
  sortDropItems() {
    const container = this.elements.dropItemsContainer;
    const rows = Array.from(container.querySelectorAll('.drop-item-row'));

    // 現在のデータを取得
    const itemsData = rows.map(row => {
      const minInput = row.querySelector('.drop-min');
      const min = minInput.value ? parseInt(minInput.value) : Infinity; // 空は最後
      return { element: row, min };
    });

    // 下限値で昇順ソート
    itemsData.sort((a, b) => a.min - b.min);

    // 並び替え
    container.innerHTML = '';
    itemsData.forEach(data => container.appendChild(data.element));
  }

  _clearDropItems() {
    this.elements.dropItemsContainer.innerHTML = '';
  }

  _getDropItems() {
    const items = [];
    document.querySelectorAll('.drop-item-row').forEach(row => {
      const min = row.querySelector('.drop-min').value.trim();
      const max = row.querySelector('.drop-max').value.trim();
      const itemName = row.querySelector('.drop-item-name').value.trim();
      const price = row.querySelector('.drop-price').value.trim();
      const quantity = row.querySelector('.drop-quantity').value.trim();

      if (min) {
        items.push({
          min: parseInt(min),
          max: max ? parseInt(max) : null,
          itemName: itemName || 'なし',
          price: price,
          quantity: quantity ? parseInt(quantity) : 1
        });
      }
    });
    return items;
  }

  addWeaponSkill() {
    const defaultWeaponSkill = {
      name: '通常武器攻撃',
      timing: 'メジャー',
      classification: '',
      judge: '武器攻撃',
      target: '単体',
      range: '至近',
      cost: 0,
      sl: 1,
      condition: '―',
      effect: '対象に武器攻撃を行う。',
      judgeCommands: [],
      criticalEffect: 'diceRoll',
      customCritical: '',
      needsCritical: true,
      isWeaponAttack: true,
      weaponType: '',
      weaponGrip: '',
      weaponMethod: '',
      weaponDamage: ''
    };
    this.addSkillToEnemy(defaultWeaponSkill);
  }

  // スキル追加
  addSkillToEnemy(skillData = null) {
    const container = this.elements.skillsContainer;
    const id = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const defaultSkill = {
      name: '',
      timing: '',
      classification: '',
      judge: '',
      target: '',
      range: '',
      cost: 0,
      sl: 1,
      condition: '',
      effect: '',
      judgeCommands: [],
      criticalEffect: 'diceRoll',
      customCritical: '',
      needsCritical: true,
      isWeaponAttack: false,
      weaponType: '',
      weaponGrip: '',
      weaponMethod: '',
      weaponDamage: ''
    };

    const skill = {
      ...defaultSkill,
      ...(skillData ? JSON.parse(JSON.stringify(skillData)) : {})
    };

    skill.judgeCommands = Array.isArray(skill.judgeCommands)
      ? skill.judgeCommands.map(cmd => ({
        ...cmd,
        label: typeof cmd.label === 'string' ? cmd.label : '',
        damageCommands: Array.isArray(cmd.damageCommands)
          ? cmd.damageCommands.map(dmg => ({
            ...dmg,
            label: typeof dmg.label === 'string' ? dmg.label : ''
          }))
          : []
      }))
      : [];

    // 既存データの互換性対応
    if (skill.judgeDice !== undefined && skill.judgeCommands.length === 0) {
      skill.judgeCommands = [{
        dice: skill.judgeDice || 2,
        fixedAuto: true,
        fixed: '',
        bonus: skill.judgeBonus || 0,
        label: '',
        damageCommands: []
      }];
      if (skill.damageDice !== undefined) {
        skill.judgeCommands[0].damageCommands.push({
          dice: skill.damageDice || 0,
          fixed: skill.damageFixed || 0,
          bonus: skill.damageBonus || 0,
          label: ''
        });
      }
    }

    // judgeCommandsが空の場合は初期化
    if (!skill.judgeCommands || skill.judgeCommands.length === 0) {
      skill.judgeCommands = [];
    }

    if (skill.isWeaponAttack) {
      skill.timing = skill.timing || 'メジャー';
      skill.judge = skill.judge || '武器攻撃';
      skill.target = skill.target || '単体';
      skill.range = skill.range || '至近';
      if (skill.cost === undefined || skill.cost === null) skill.cost = 0;
      skill.sl = skill.sl || 1;
      skill.condition = skill.condition || '―';
      skill.effect = skill.effect || '対象に武器攻撃を行う。';
      skill.needsCritical = true;
      skill.criticalEffect = 'diceRoll';
      skill.customCritical = '';
    }

    // タイミングの選択肢
    const timingOptions = [
      '―', 'パッシブ', 'セットアップ', 'イニシアチブ', 'フリー', 'ムーブ', 'レガシー',
      'マイナー', 'メジャー', '判定の直前', '判定の直後', 'DRの直前', 'DRの直後',
      'リアクション', 'クリンナップ', '戦闘不能', '効果参照'
    ];

    // 判定の選択肢
    const judgeOptions = [
      '―', '自動成功', '命中判定', '魔術判定', '錬金術判定', '呪歌判定', '回避判定',
      '筋力判定', '器用判定', '敏捷判定', '知力判定', '感知判定', '精神判定', '幸運判定',
      '効果参照'
    ];

    const template = document.querySelector('#template-skill-item');
    const clone = template.content.cloneNode(true);
    const div = clone.querySelector('.skill-item');
    div.dataset.id = id;

    // ヘッダー部分
    clone.querySelector('.skill-timing-badge').textContent = skill.timing || 'タイミング未設定';
    clone.querySelector('.skill-name-display').textContent = skill.name || '新規スキル';

    clone.querySelector('.skill-move-up-btn').addEventListener('click', () => this.moveSkillUp(id));
    clone.querySelector('.skill-move-down-btn').addEventListener('click', () => this.moveSkillDown(id));
    clone.querySelector('.skill-edit-btn').addEventListener('click', () => this.toggleSkillDetails(id));
    clone.querySelector('.skill-delete-btn').addEventListener('click', () => this.removeSkill(id));

    // フォーム部分
    clone.querySelector('.skill-name').value = skill.name || '';
    clone.querySelector('.skill-timing').value = skill.timing || '';
    clone.querySelector('.skill-classification').value = skill.classification || '';
    clone.querySelector('.skill-judge').value = skill.judge || '';
    clone.querySelector('.skill-target').value = skill.target || '';
    clone.querySelector('.skill-range').value = skill.range || '';
    clone.querySelector('.skill-cost').value = skill.cost || 0;
    clone.querySelector('.skill-sl').value = skill.sl || 1;
    clone.querySelector('.skill-condition').value = skill.condition || '';
    clone.querySelector('.skill-effect').value = skill.effect || '';

    // 武器メタ情報
    const weaponMetaSection = clone.querySelector('.weapon-meta-section');
    const weaponTypeInput = clone.querySelector('.weapon-type');
    const weaponGripInput = clone.querySelector('.weapon-grip');
    const weaponMethodInput = clone.querySelector('.weapon-method');
    const weaponDamageInput = clone.querySelector('.weapon-damage');

    if (weaponMetaSection) {
      const weaponTypeDatalist = weaponMetaSection.querySelector('.weapon-type-datalist');
      const weaponGripDatalist = weaponMetaSection.querySelector('.weapon-grip-datalist');
      const weaponMethodDatalist = weaponMetaSection.querySelector('.weapon-method-datalist');
      const weaponDamageDatalist = weaponMetaSection.querySelector('.weapon-damage-datalist');

      if (weaponTypeDatalist && weaponTypeInput) {
        weaponTypeDatalist.id = `weapon-type-options-${id}`;
        weaponTypeInput.setAttribute('list', weaponTypeDatalist.id);
        this._populateDatalist(weaponTypeDatalist, WEAPON_TYPE_OPTIONS);
        weaponTypeInput.value = skill.weaponType || '';
      }

      if (weaponGripDatalist && weaponGripInput) {
        weaponGripDatalist.id = `weapon-grip-options-${id}`;
        weaponGripInput.setAttribute('list', weaponGripDatalist.id);
        this._populateDatalist(weaponGripDatalist, WEAPON_GRIP_OPTIONS);
        weaponGripInput.value = skill.weaponGrip || '';
      }

      if (weaponMethodDatalist && weaponMethodInput) {
        weaponMethodDatalist.id = `weapon-method-options-${id}`;
        weaponMethodInput.setAttribute('list', weaponMethodDatalist.id);
        this._populateDatalist(weaponMethodDatalist, WEAPON_METHOD_OPTIONS);
        weaponMethodInput.value = skill.weaponMethod || '';
      }

      if (weaponDamageDatalist && weaponDamageInput) {
        weaponDamageDatalist.id = `weapon-damage-options-${id}`;
        weaponDamageInput.setAttribute('list', weaponDamageDatalist.id);
        this._populateDatalist(weaponDamageDatalist, WEAPON_DAMAGE_OPTIONS);
        weaponDamageInput.value = skill.weaponDamage || '';
      }
    }

    // datalistを動的に生成
    const timingInput = clone.querySelector('.skill-timing');
    const timingDatalist = clone.querySelector('.timing-datalist');
    timingDatalist.id = `timing-options-${id}`;
    timingInput.setAttribute('list', `timing-options-${id}`);
    timingOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      timingDatalist.appendChild(option);
    });

    const judgeInput = clone.querySelector('.skill-judge');
    const judgeDatalist = clone.querySelector('.judge-datalist');
    judgeDatalist.id = `judge-options-${id}`;
    judgeInput.setAttribute('list', `judge-options-${id}`);
    judgeOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      judgeDatalist.appendChild(option);
    });

    // 判定コマンドセクションの表示/非表示
    const judgeCommandsSection = clone.querySelector('.skill-judge-commands-section');
    const shouldShowJudgeSection = skill.judge && skill.judge !== '自動成功' && skill.judge !== '―';
    judgeCommandsSection.style.display = shouldShowJudgeSection ? 'block' : 'none';

    // クリティカルセクションの表示/非表示
    const criticalSection = clone.querySelector('.skill-critical-section');
    const shouldShowCriticalSection = !skill.isWeaponAttack && shouldShowJudgeSection;
    criticalSection.style.display = shouldShowCriticalSection ? 'block' : 'none';

    const needsCriticalCheckbox = clone.querySelector('.skill-needs-critical');
    needsCriticalCheckbox.checked = skill.needsCritical !== false;
    needsCriticalCheckbox.disabled = !!skill.isWeaponAttack;

    const criticalOptions = clone.querySelector('.skill-critical-options');
    criticalOptions.style.display = (!skill.isWeaponAttack && skill.needsCritical !== false) ? 'block' : 'none';

    // クリティカルラジオボタン
    const criticalRadios = clone.querySelectorAll('.critical-radio');
    criticalRadios.forEach(radio => {
      radio.name = `critical-${id}`;
      if (radio.value === (skill.criticalEffect || 'diceRoll')) {
        radio.checked = true;
      }
      radio.disabled = !!skill.isWeaponAttack;
    });

    // カスタムクリティカル処理
    const customCriticalInput = clone.querySelector('.skill-custom-critical');
    customCriticalInput.value = skill.customCritical || '';

    const customCriticalGroup = clone.querySelector('.custom-critical-group');
    const customRadio = clone.querySelector('.critical-radio[value="custom"]');
    if (skill.criticalEffect === 'custom' && !skill.isWeaponAttack) {
      customCriticalGroup.style.display = 'block';
      if (customRadio) {
        customRadio.checked = true;
      }
    } else {
      customCriticalGroup.style.display = 'none';
    }

    container.appendChild(clone);

    const skillItem = div;
    this._configureWeaponSkillView(skillItem, skill, id);
    skillItem.querySelector('.skill-name').addEventListener('input', () => this.updateSkillDisplay(id));
    skillItem.querySelector('.skill-timing').addEventListener('change', () => this.updateSkillDisplay(id));

    // 判定変更時の処理
    skillItem.querySelector('.skill-judge').addEventListener('input', () => this.updateSkillJudgeSettings(id));

    // 判定コマンド追加ボタン
    const addJudgeBtn = skillItem.querySelector('.add-judge-command-btn');
    if (addJudgeBtn) {
      addJudgeBtn.addEventListener('click', () => this.addJudgeCommand(id));
    }

    // クリティカル設定チェックボックス（既に定義済みのneedsCriticalCheckboxを使用）
    const needsCriticalCheckboxEl = skillItem.querySelector('.skill-needs-critical');
    if (needsCriticalCheckboxEl) {
      needsCriticalCheckboxEl.addEventListener('change', (e) => {
        const optionsDiv = skillItem.querySelector('.skill-critical-options');
        if (optionsDiv) {
          optionsDiv.style.display = e.target.checked ? 'block' : 'none';
        }
      });
    }

    // 初期表示を更新
    this.updateSkillJudgeSettings(id);

    // 既存の判定コマンドを表示
    if (skill.judgeCommands && skill.judgeCommands.length > 0) {
      skill.judgeCommands.forEach((judgeCmd, index) => {
        this.addJudgeCommand(id, judgeCmd, index);
      });
    }

    // スキルヘッダーにダブルクリックイベントを追加
    const skillHeader = skillItem.querySelector('.skill-header');
    if (skillHeader) {
      skillHeader.addEventListener('dblclick', (e) => {
        // ボタンクリック時はダブルクリックイベントを無視
        if (e.target.tagName === 'BUTTON') {
          return;
        }
        this.toggleSkillDetails(id);
      });
    }
  }

  updateSkillDisplay(id) {
    const skillItem = document.querySelector(`[data-id="${id}"]`);
    if (!skillItem) return;

    const name = skillItem.querySelector('.skill-name').value.trim() || '新規スキル';
    const timing = skillItem.querySelector('.skill-timing').value || 'タイミング未設定';

    skillItem.querySelector('.skill-name-display').textContent = name;
    skillItem.querySelector('.skill-timing-badge').textContent = timing;
    this._refreshCommandLabelDefaults(skillItem);
  }

  _initEditableLabel(input, defaultLabel, customValue = '', placeholderText = '') {
    if (!input) return;
    const trimmed = (customValue || '').trim();
    input.dataset.defaultLabel = defaultLabel;
    if (placeholderText) {
      input.placeholder = placeholderText;
    }
    if (trimmed) {
      input.value = trimmed;
      input.dataset.isCustom = 'true';
    } else {
      input.value = defaultLabel;
      input.dataset.isCustom = 'false';
    }
    input.addEventListener('input', () => {
      const value = input.value.trim();
      if (!value) {
        input.dataset.isCustom = 'false';
        return;
      }
      input.dataset.isCustom = value !== input.dataset.defaultLabel ? 'true' : 'false';
    });
    input.addEventListener('blur', () => {
      if (!input.value.trim()) {
        input.value = input.dataset.defaultLabel;
        input.dataset.isCustom = 'false';
      }
    });
  }

  _updateEditableLabelDefault(input, defaultLabel) {
    if (!input) return;
    input.dataset.defaultLabel = defaultLabel;
    if (input.dataset.isCustom !== 'true') {
      input.value = defaultLabel;
    }
  }

  _getEditableLabelValue(input) {
    if (!input) return '';
    if (input.dataset.isCustom === 'true') {
      return input.value.trim();
    }
    return '';
  }

  _formatCommandLabel(customValue, defaultLabel) {
    const trimmed = (customValue || '').trim();
    return trimmed || defaultLabel;
  }

  _getDefaultJudgeLabel(skillName, judgeIndex, judgeText = '') {
    const baseName = skillName || '新規スキル';
    const suffix = judgeIndex > 0 ? ` (${judgeIndex + 1})` : '';
    const labelCore = `《${baseName}${suffix}》`;
    return judgeText ? `${judgeText} ${labelCore}` : labelCore;
  }

  _getDefaultDamageLabel(skillName, judgeIndex, damageIndex) {
    const baseName = skillName || '新規スキル';
    const suffixParts = [];
    if (Number.isInteger(judgeIndex) && judgeIndex > 0) {
      suffixParts.push(`判定${judgeIndex + 1}`);
    }
    if (damageIndex > 0) {
      suffixParts.push(`ダメージ${damageIndex + 1}`);
    }
    if (suffixParts.length === 0) {
      return `ダメージ 《${baseName}》`;
    }
    return `ダメージ 《${baseName} (${suffixParts.join('-')})》`;
  }

  _getSkillNameFromItem(skillItem) {
    if (!skillItem) return '新規スキル';
    const skillNameInput = skillItem.querySelector('.skill-name');
    return (skillNameInput && skillNameInput.value.trim()) || '新規スキル';
  }

  _getJudgeIndex(judgeItem) {
    if (!judgeItem) return 0;
    const skillItem = judgeItem.closest('.skill-item');
    if (!skillItem) return 0;
    const judgeItems = Array.from(skillItem.querySelectorAll('.judge-command-item'));
    const index = judgeItems.indexOf(judgeItem);
    return index >= 0 ? index : 0;
  }

  _resetCommandLabel(input) {
    if (!input) return;
    const defaultLabel = input.dataset.defaultLabel || '';
    input.value = defaultLabel;
    input.dataset.isCustom = 'false';
  }

  _refreshCommandLabelDefaults(skillItem) {
    if (!skillItem) return;
    const skillName = this._getSkillNameFromItem(skillItem);
    const judgeText = (skillItem.querySelector('.skill-judge')?.value || '').trim();
    const judgeItems = skillItem.querySelectorAll('.judge-command-item');
    judgeItems.forEach((judgeItem, judgeIndex) => {
      const judgeLabelInput = judgeItem.querySelector('.judge-label-input');
      const judgeDefault = this._getDefaultJudgeLabel(skillName, judgeIndex, judgeText);
      this._updateEditableLabelDefault(judgeLabelInput, judgeDefault);
      const judgeCaption = judgeItem.querySelector('.command-label-caption');
      if (judgeCaption) {
        judgeCaption.textContent = `判定コマンド ${judgeIndex + 1}`;
      }
      const damageItems = judgeItem.querySelectorAll('.damage-command-item');
      damageItems.forEach((damageItem, damageIndex) => {
        const damageLabelInput = damageItem.querySelector('.damage-label-input');
        const damageDefault = this._getDefaultDamageLabel(skillName, judgeIndex, damageIndex);
        this._updateEditableLabelDefault(damageLabelInput, damageDefault);
        const damageCaption = damageItem.querySelector('.command-label-caption');
        if (damageCaption) {
          damageCaption.textContent = `ダメージ ${damageIndex + 1}`;
        }
      });
    });
  }

  // 判定コマンドを追加
  addJudgeCommand(skillId, judgeData = null, index = null) {
    const skillItem = document.querySelector(`[data-id="${skillId}"]`);
    if (!skillItem) return;

    const container = skillItem.querySelector('.skill-judge-commands-container');
    if (!container) return;

    const judgeId = index !== null ? `judge_${skillId}_${index}` : `judge_${skillId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const judge = skillItem.querySelector('.skill-judge').value.trim();
    const abilityInfo = this.getAbilityForJudge(judge);

    const data = judgeData || {
      dice: 2,
      fixedAuto: true,
      fixed: abilityInfo ? `{${abilityInfo.ability}}` : '0',
      bonus: 0,
      label: '',
      damageCommands: []
    };

    const template = document.querySelector('#template-judge-command');
    const clone = template.content.cloneNode(true);
    const judgeDiv = clone.querySelector('.judge-command-item');
    judgeDiv.dataset.id = judgeId;

    const labelInput = clone.querySelector('.judge-label-input');
    const skillName = this._getSkillNameFromItem(skillItem);
    const judgeText = (skillItem.querySelector('.skill-judge')?.value || '').trim();
    const judgeOrder = index !== null ? index : container.children.length;
    const defaultLabel = this._getDefaultJudgeLabel(skillName, judgeOrder, judgeText);
    this._initEditableLabel(labelInput, defaultLabel, data.label, 'チャットパレット表記（任意）');
    const captionEl = judgeDiv.querySelector('.command-label-caption');
    if (captionEl) {
      captionEl.textContent = `判定コマンド ${judgeOrder + 1}`;
    }
    const resetBtn = judgeDiv.querySelector('.judge-label-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._resetCommandLabel(labelInput));
    }

    clone.querySelector('.judge-delete-btn').addEventListener('click', () => this.removeJudgeCommand(skillId, judgeId));

    clone.querySelector('.judge-dice').value = data.dice;

    const fixedAutoCheckbox = clone.querySelector('.fixed-auto-checkbox');
    fixedAutoCheckbox.checked = data.fixedAuto || false;

    const abilityLabel = clone.querySelector('.judge-ability-label');
    if (abilityInfo) {
      abilityLabel.textContent = `(${abilityInfo.ability})`;
    }

    const fixedInput = clone.querySelector('.judge-fixed');
    fixedInput.value = data.fixed || '';
    fixedInput.readOnly = data.fixedAuto || false;

    clone.querySelector('.judge-bonus').value = data.bonus || 0;

    container.appendChild(clone);

    // イベントリスナーを設定（judgeDivは既にcloneから取得した要素）

    fixedAutoCheckbox.addEventListener('change', () => {
      fixedInput.readOnly = fixedAutoCheckbox.checked;
      if (fixedAutoCheckbox.checked) {
        fixedInput.value = abilityInfo ? `{${abilityInfo.ability}}` : '0';
      }
      this.updateJudgeCommandPreview(judgeId);
    });

    ['judge-dice', 'judge-fixed', 'judge-bonus'].forEach(className => {
      const elem = judgeDiv.querySelector(`.${className}`);
      if (elem) {
        elem.addEventListener('input', () => this.updateJudgeCommandPreview(judgeId));
      }
    });

    // ダメージコマンド追加ボタン
    const addDamageBtn = judgeDiv.querySelector('.add-damage-command-btn');
    if (addDamageBtn) {
      addDamageBtn.addEventListener('click', () => this.addDamageCommand(judgeId));
    }

    // 既存のダメージコマンドを表示
    if (data.damageCommands && data.damageCommands.length > 0) {
      data.damageCommands.forEach((damageCmd, dmgIndex) => {
        this.addDamageCommand(judgeId, damageCmd, dmgIndex);
      });
    }

    // 初期プレビュー更新
    this.updateJudgeCommandPreview(judgeId);
    this._refreshCommandLabelDefaults(skillItem);
  }

  // 判定コマンドを削除
  removeJudgeCommand(skillId, judgeId) {
    const judgeItem = document.querySelector(`[data-id="${judgeId}"]`);
    if (judgeItem) {
      judgeItem.remove();
      // 番号を振り直す
      const skillItem = document.querySelector(`[data-id="${skillId}"]`);
      if (skillItem) {
        const container = skillItem.querySelector('.skill-judge-commands-container');
        if (container) {
          this._refreshCommandLabelDefaults(skillItem);
        }
      }
    }
  }

  // ダメージコマンドを追加
  addDamageCommand(judgeId, damageData = null, index = null) {
    const judgeItem = document.querySelector(`[data-id="${judgeId}"]`);
    if (!judgeItem) return;

    const container = judgeItem.querySelector('.damage-commands-container');
    if (!container) return;

    const damageId = index !== null ? `damage_${judgeId}_${index}` : `damage_${judgeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const data = damageData || {
      dice: 2,
      fixed: 0,
      bonus: 0,
      label: ''
    };

    const template = document.querySelector('#template-damage-command');
    const clone = template.content.cloneNode(true);
    const damageDiv = clone.querySelector('.damage-command-item');
    damageDiv.dataset.id = damageId;

    const skillItem = judgeItem.closest('.skill-item');
    const skillName = this._getSkillNameFromItem(skillItem);
    const judgeIndex = this._getJudgeIndex(judgeItem);
    const damageOrder = index !== null ? index : container.children.length;
    const labelInput = clone.querySelector('.damage-label-input');
    const defaultLabel = this._getDefaultDamageLabel(skillName, judgeIndex, damageOrder);
    this._initEditableLabel(labelInput, defaultLabel, data.label, 'チャットパレット表記（任意）');
    const captionEl = damageDiv.querySelector('.command-label-caption');
    if (captionEl) {
      captionEl.textContent = `ダメージ ${damageOrder + 1}`;
    }
    const resetBtn = damageDiv.querySelector('.damage-label-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._resetCommandLabel(labelInput));
    }

    clone.querySelector('.damage-delete-btn').addEventListener('click', () => this.removeDamageCommand(judgeId, damageId));

    clone.querySelector('.damage-dice').value = data.dice || 0;
    clone.querySelector('.damage-fixed').value = data.fixed || 0;
    clone.querySelector('.damage-bonus').value = data.bonus || 0;

    container.appendChild(clone);

    // イベントリスナーを設定
    ['damage-dice', 'damage-fixed', 'damage-bonus'].forEach(className => {
      const elem = damageDiv.querySelector(`.${className}`);
      if (elem) {
        elem.addEventListener('input', () => this.updateDamageCommandPreview(damageId));
      }
    });

    // 初期プレビュー更新
    this.updateDamageCommandPreview(damageId);
    this._refreshCommandLabelDefaults(skillItem);
  }

  // ダメージコマンドを削除
  removeDamageCommand(judgeId, damageId) {
    const damageItem = document.querySelector(`[data-id="${damageId}"]`);
    if (damageItem) {
      damageItem.remove();
      // 番号を振り直す
      const judgeItem = document.querySelector(`[data-id="${judgeId}"]`);
      if (judgeItem) {
        const skillItem = judgeItem.closest('.skill-item');
        this._refreshCommandLabelDefaults(skillItem);
      }
    }
  }

  // 判定タイプから能力値への対応
  getAbilityForJudge(judge) {
    const mapping = {
      '命中判定': { ability: '器用', key: 'dex' },
      '魔術判定': { ability: '知力', key: 'int' },
      '錬金術判定': { ability: '器用', key: 'dex' },
      '呪歌判定': { ability: '精神', key: 'spi' },
      '回避判定': { ability: '敏捷', key: 'agi' },
      '筋力判定': { ability: '筋力', key: 'str' },
      '器用判定': { ability: '器用', key: 'dex' },
      '敏捷判定': { ability: '敏捷', key: 'agi' },
      '知力判定': { ability: '知力', key: 'int' },
      '感知判定': { ability: '感知', key: 'sen' },
      '精神判定': { ability: '精神', key: 'spi' },
      '幸運判定': { ability: '幸運', key: 'luck' }
    };
    return mapping[judge] || null;
  }

  // 判定設定の更新
  updateSkillJudgeSettings(id) {
    const skillItem = document.querySelector(`[data-id="${id}"]`);
    if (!skillItem) return;

    const judge = skillItem.querySelector('.skill-judge').value.trim();
    const judgeSection = skillItem.querySelector('.skill-judge-commands-section');
    const criticalSection = skillItem.querySelector('.skill-critical-section');

    // 判定が自動成功または―の場合は非表示
    const showJudge = judge !== '自動成功' && judge !== '―';
    if (judgeSection) {
      judgeSection.style.display = showJudge ? 'block' : 'none';
    }
    if (criticalSection) {
      const isWeaponAttack = skillItem.classList.contains('weapon-skill');
      criticalSection.style.display = (showJudge && !isWeaponAttack) ? 'block' : 'none';
    }

    this._refreshCommandLabelDefaults(skillItem);
  }

  // 判定コマンドプレビュー更新
  updateJudgeCommandPreview(judgeId) {
    const judgeItem = document.querySelector(`[data-id="${judgeId}"]`);
    if (!judgeItem) return;

    const diceInput = judgeItem.querySelector('.judge-dice');
    const fixedInput = judgeItem.querySelector('.judge-fixed');
    const bonusInput = judgeItem.querySelector('.judge-bonus');
    const previewInput = judgeItem.querySelector('.judge-preview');

    if (!diceInput || !fixedInput || !bonusInput || !previewInput) return;

    const dice = parseInt(diceInput.value) || 2;
    const fixed = fixedInput.value.trim() || '0';
    const bonus = parseInt(bonusInput.value) || 0;

    let command = `${dice}D6+${fixed}`;
    if (bonus !== 0) {
      command += bonus > 0 ? `+${bonus}` : bonus;
    }
    command += '>=?';

    previewInput.value = command;
  }

  // ダメージコマンドプレビュー更新
  updateDamageCommandPreview(damageId) {
    const damageItem = document.querySelector(`[data-id="${damageId}"]`);
    if (!damageItem) return;

    const diceInput = damageItem.querySelector('.damage-dice');
    const fixedInput = damageItem.querySelector('.damage-fixed');
    const bonusInput = damageItem.querySelector('.damage-bonus');
    const previewInput = damageItem.querySelector('.damage-preview');

    if (!diceInput || !fixedInput || !bonusInput || !previewInput) return;

    const dice = parseInt(diceInput.value) || 0;
    const fixed = parseInt(fixedInput.value) || 0;
    const bonus = parseInt(bonusInput.value) || 0;

    if (dice === 0 && fixed === 0 && bonus === 0) {
      previewInput.value = 'なし';
      return;
    }

    let command = '';
    if (dice > 0) {
      command = `${dice}D6`;
    }

    const total = fixed + bonus;
    if (total !== 0) {
      if (command) command += '+';
      command += total;
    } else if (dice === 0) {
      command = '0';
    }

    previewInput.value = command || '0';
  }


  toggleSkillDetails(id) {
    const skillItem = document.querySelector(`[data-id="${id}"]`);
    if (!skillItem) return;

    const details = skillItem.querySelector('.skill-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  }

  moveSkillUp(id) {
    const skillItem = document.querySelector(`[data-id="${id}"]`);
    if (!skillItem) return;

    const prev = skillItem.previousElementSibling;
    if (prev) {
      skillItem.parentNode.insertBefore(skillItem, prev);
    }
  }

  moveSkillDown(id) {
    const skillItem = document.querySelector(`[data-id="${id}"]`);
    if (!skillItem) return;

    const next = skillItem.nextElementSibling;
    if (next) {
      skillItem.parentNode.insertBefore(next, skillItem);
    }
  }

  removeSkill(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) item.remove();
  }

  _clearSkills() {
    this.elements.skillsContainer.innerHTML = '';
  }

  _populateDatalist(datalistEl, options) {
    if (!datalistEl) return;
    datalistEl.innerHTML = '';
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      datalistEl.appendChild(option);
    });
  }

  _configureWeaponSkillView(skillItem, skill, id) {
    if (!skillItem) return;
    const weaponMetaSection = skillItem.querySelector('.weapon-meta-section');
    if (!weaponMetaSection) return;

    if (skill.isWeaponAttack) {
      skillItem.classList.add('weapon-skill');
      weaponMetaSection.style.display = 'block';
      this._setReadonlyField(skillItem.querySelector('.skill-timing'), skill.timing || 'メジャー');
      this._setReadonlyField(skillItem.querySelector('.skill-cost'), skill.cost ?? 0);
      this._setReadonlyField(skillItem.querySelector('.skill-sl'), skill.sl || 1);
      this._setReadonlyField(skillItem.querySelector('.skill-condition'), skill.condition || '―');

      const effectInput = skillItem.querySelector('.skill-effect');
      if (effectInput) {
        effectInput.value = skill.effect || '対象に武器攻撃を行う。';
        effectInput.readOnly = true;
        effectInput.classList.add('readonly-field');
      }

      const needsCriticalCheckbox = skillItem.querySelector('.skill-needs-critical');
      if (needsCriticalCheckbox) {
        needsCriticalCheckbox.checked = true;
        needsCriticalCheckbox.disabled = true;
      }

      const criticalOptions = skillItem.querySelector('.skill-critical-options');
      if (criticalOptions) {
        criticalOptions.style.display = 'none';
      }

      const criticalRadios = skillItem.querySelectorAll('.critical-radio');
      criticalRadios.forEach(radio => {
        radio.disabled = true;
        radio.checked = radio.value === 'diceRoll';
      });
    } else {
      skillItem.classList.remove('weapon-skill');
      weaponMetaSection.style.display = 'none';
    }
  }

  _setReadonlyField(input, value) {
    if (!input) return;
    if (value !== undefined) {
      input.value = value;
    }
    input.readOnly = true;
    input.classList.add('readonly-field');
  }

  _getSkills() {
    const skills = [];
    const skillNames = new Set();
    this._lastSkippedSkills = [];

    document.querySelectorAll('.skill-item').forEach(item => {
      const cost = parseInt(item.querySelector('.skill-cost').value) || 0;
      const needsCritical = item.querySelector('.skill-needs-critical') ? item.querySelector('.skill-needs-critical').checked : true;

      const criticalRadio = item.querySelector('input[name^="critical-"]:checked');
      const criticalEffect = criticalRadio ? criticalRadio.value : 'diceRoll';
      const customCritical = item.querySelector('.skill-custom-critical') ? item.querySelector('.skill-custom-critical').value.trim() : '';

      const name = item.querySelector('.skill-name').value.trim();

      // スキル名の重複チェック
      if (skillNames.has(name)) {
        throw new Error(`スキル名「${name}」が重複しています。スキル・パワー名は一意である必要があります。`);
      }
      skillNames.add(name);

      // 判定コマンドを取得
      const judgeCommands = [];
      const judgeCommandContainer = item.querySelector('.skill-judge-commands-container');
      if (judgeCommandContainer) {
        judgeCommandContainer.querySelectorAll('.judge-command-item').forEach(judgeItem => {
          const fixedAuto = judgeItem.querySelector('.fixed-auto-checkbox')?.checked || false;

          const judgeLabelInput = judgeItem.querySelector('.judge-label-input');

          const judgeCommand = {
            dice: parseInt(judgeItem.querySelector('.judge-dice')?.value) || 2,
            fixedAuto: fixedAuto,
            fixed: judgeItem.querySelector('.judge-fixed')?.value.trim() || '0',
            bonus: parseInt(judgeItem.querySelector('.judge-bonus')?.value) || 0,
            label: this._getEditableLabelValue(judgeLabelInput),
            damageCommands: []
          };

          // ダメージコマンドを取得
          const damageCommandContainer = judgeItem.querySelector('.damage-commands-container');
          if (damageCommandContainer) {
            damageCommandContainer.querySelectorAll('.damage-command-item').forEach(damageItem => {
              const damageLabelInput = damageItem.querySelector('.damage-label-input');
              judgeCommand.damageCommands.push({
                dice: parseInt(damageItem.querySelector('.damage-dice')?.value) || 0,
                fixed: parseInt(damageItem.querySelector('.damage-fixed')?.value) || 0,
                bonus: parseInt(damageItem.querySelector('.damage-bonus')?.value) || 0,
                label: this._getEditableLabelValue(damageLabelInput)
              });
            });
          }

          judgeCommands.push(judgeCommand);
        });
      }

      const isWeaponAttack = item.classList.contains('weapon-skill');
      const weaponTypeInput = item.querySelector('.weapon-type');
      const weaponGripInput = item.querySelector('.weapon-grip');
      const weaponMethodInput = item.querySelector('.weapon-method');
      const weaponDamageInput = item.querySelector('.weapon-damage');

      const skill = {
        name: name,
        timing: item.querySelector('.skill-timing').value,
        classification: item.querySelector('.skill-classification').value.trim(),
        judge: item.querySelector('.skill-judge').value.trim(),
        target: item.querySelector('.skill-target').value.trim(),
        range: item.querySelector('.skill-range').value.trim(),
        cost: cost,
        sl: parseInt(item.querySelector('.skill-sl').value) || 1,
        condition: item.querySelector('.skill-condition').value.trim(),
        effect: item.querySelector('.skill-effect').value.trim(),
        judgeCommands: judgeCommands,
        criticalEffect: criticalEffect,
        customCritical: customCritical,
        needsCritical: isWeaponAttack ? true : needsCritical,
        isWeaponAttack: isWeaponAttack,
        weaponType: isWeaponAttack ? (weaponTypeInput?.value.trim() || '') : '',
        weaponGrip: isWeaponAttack ? (weaponGripInput?.value.trim() || '') : '',
        weaponMethod: isWeaponAttack ? (weaponMethodInput?.value.trim() || '') : '',
        weaponDamage: isWeaponAttack ? (weaponDamageInput?.value.trim() || '') : ''
      };

      // 必須フィールドのチェック
      if (skill.name && skill.judge && skill.target && skill.range && skill.effect) {
        skills.push(skill);
      } else {
        // スキップされたスキルの情報を記録
        const missingFields = [];
        if (!skill.name) missingFields.push('スキル名');
        if (!skill.judge) missingFields.push('判定');
        if (!skill.target) missingFields.push('対象');
        if (!skill.range) missingFields.push('射程');
        if (!skill.effect) missingFields.push('効果');
        this._lastSkippedSkills.push({
          name: skill.name || '(名前未設定)',
          missingFields: missingFields
        });
      }
    });
    return skills;
  }

  // スキル選択モーダル
  showSkillSelectModal() {
    this.elements.skillSelectModal.classList.add('active');
    this.renderSkillSelectList();
  }

  hideSkillSelectModal() {
    this.elements.skillSelectModal.classList.remove('active');
  }

  renderSkillSelectList(searchTerm = '') {
    const skills = this.skillLibraryManager.search(searchTerm);

    if (skills.length === 0) {
      const template = document.querySelector('#template-skill-select-empty-state');
      const clone = template.content.cloneNode(true);
      this.elements.skillSelectList.innerHTML = '';
      this.elements.skillSelectList.appendChild(clone);
      return;
    }

    this.elements.skillSelectList.innerHTML = '';
    const template = document.querySelector('#template-skill-select-item');

    skills.forEach(skill => {
      const clone = template.content.cloneNode(true);
      const item = clone.querySelector('.skill-select-item');

      item.addEventListener('click', () => this.selectSkillFromLibrary(skill.id));

      clone.querySelector('.skill-timing-badge').textContent = skill.timing || '-';
      clone.querySelector('.skill-select-name').textContent = skill.name;

      const effectText = skill.effect.substring(0, 100);
      clone.querySelector('.skill-select-effect').textContent = skill.effect.length > 100 ? effectText + '...' : effectText;

      this.elements.skillSelectList.appendChild(clone);
    });
  }

  selectSkillFromLibrary(id) {
    const skill = this.skillLibraryManager.get(id);
    if (skill) {
      this.addSkillToEnemy(skill.toJSON());
      this.hideSkillSelectModal();
    }
  }

  // スキルライブラリ一覧
  renderSkillLibraryList(searchTerm = '') {
    const skills = this.skillLibraryManager.search(searchTerm);

    if (skills.length === 0) {
      const template = document.querySelector('#template-skill-library-empty-state');
      const clone = template.content.cloneNode(true);
      const p = clone.querySelector('p');
      p.textContent = searchTerm ? '該当するスキルが見つかりません。' : 'スキルがまだ登録されていません。';

      if (!searchTerm) {
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.textContent = '最初のスキルを作成';
        button.addEventListener('click', () => this.showSkillLibraryForm());
        clone.querySelector('.empty-state').appendChild(button);
      }

      this.elements.skillLibraryList.innerHTML = '';
      this.elements.skillLibraryList.appendChild(clone);
      return;
    }

    this.elements.skillLibraryList.innerHTML = '';
    const template = document.querySelector('#template-skill-library-item');

    skills.forEach(skill => {
      const clone = template.content.cloneNode(true);
      const item = clone.querySelector('.skill-library-item');
      item.dataset.skillId = skill.id;

      clone.querySelector('.skill-timing-badge').textContent = skill.timing || '-';
      clone.querySelector('.skill-library-name').textContent = skill.name;

      const effectText = skill.effect.substring(0, 100);
      clone.querySelector('.skill-library-effect').textContent = skill.effect.length > 100 ? effectText + '...' : effectText;

      clone.querySelector('.skill-library-edit-btn').addEventListener('click', () => this.editSkillLibrary(skill.id));
      clone.querySelector('.skill-library-duplicate-btn').addEventListener('click', () => this.duplicateSkillLibrary(skill.id));
      clone.querySelector('.skill-library-delete-btn').addEventListener('click', () => this.deleteSkillLibrary(skill.id));

      this.elements.skillLibraryList.appendChild(clone);
    });

    // ダブルクリックイベントを追加
    this._attachSkillDoubleClickHandlers();
  }

  // スキルカードにダブルクリックイベントを追加
  _attachSkillDoubleClickHandlers() {
    const skillItems = this.elements.skillLibraryList.querySelectorAll('.skill-library-item');
    skillItems.forEach(item => {
      item.addEventListener('dblclick', () => {
        const skillId = item.dataset.skillId;
        if (skillId) {
          this.editSkillLibrary(skillId);
        }
      });
    });
  }

  showSkillLibraryForm(skill = null) {
    this.skillLibraryManager.editingSkillId = skill ? skill.id : null;
    this.elements.skillFormTitle.textContent = skill ? 'スキル編集' : '新規スキル作成';

    if (skill) {
      document.getElementById('skillName').value = skill.name || '';
      document.getElementById('skillTiming').value = skill.timing || '';
      document.getElementById('skillClassification').value = skill.classification || '';
      document.getElementById('skillJudge').value = skill.judge || '';
      document.getElementById('skillTarget').value = skill.target || '';
      document.getElementById('skillRange').value = skill.range || '';
      document.getElementById('skillCost').value = skill.cost || 0;
      document.getElementById('skillSL').value = skill.sl || 1;
      document.getElementById('skillCondition').value = skill.condition || '';
      document.getElementById('skillEffect').value = skill.effect || '';
    } else {
      this.elements.skillLibraryForm.reset();
      document.getElementById('skillSL').value = 1;
    }

    this.elements.skillLibraryFormSection.style.display = 'block';
    this.elements.skillLibraryFormSection.scrollIntoView({ behavior: 'smooth' });
  }

  hideSkillLibraryForm() {
    this.elements.skillLibraryFormSection.style.display = 'none';
    this.elements.skillLibraryForm.reset();
    this.skillLibraryManager.editingSkillId = null;
    this.renderSkillLibraryList();
  }

  saveSkillLibrary() {
    const cost = parseInt(document.getElementById('skillCost').value) || 0;

    const skillData = {
      name: document.getElementById('skillName').value.trim(),
      timing: document.getElementById('skillTiming').value,
      classification: document.getElementById('skillClassification').value.trim(),
      judge: document.getElementById('skillJudge').value.trim(),
      target: document.getElementById('skillTarget').value.trim(),
      range: document.getElementById('skillRange').value.trim(),
      cost: cost,
      sl: parseInt(document.getElementById('skillSL').value) || 1,
      condition: document.getElementById('skillCondition').value.trim(),
      effect: document.getElementById('skillEffect').value.trim()
    };

    // 必須フィールドのチェック
    if (!skillData.name || !skillData.judge || !skillData.target || !skillData.range || !skillData.effect) {
      alert('スキル名、判定、対象、射程、効果は必須です。');
      return;
    }

    if (this.skillLibraryManager.editingSkillId) {
      this.skillLibraryManager.update(this.skillLibraryManager.editingSkillId, skillData);
      alert(`スキル「${skillData.name}」を更新しました。`);
    } else {
      this.skillLibraryManager.add(skillData);
      alert(`スキル「${skillData.name}」を作成しました。`);
    }

    this.hideSkillLibraryForm();
    this.renderSkillLibraryList();
  }

  editSkillLibrary(id) {
    const skill = this.skillLibraryManager.get(id);
    if (skill) {
      this.showSkillLibraryForm(skill);
    }
  }

  duplicateSkillLibrary(id) {
    const newSkill = this.skillLibraryManager.duplicate(id);
    if (newSkill) {
      this.renderSkillLibraryList();
      alert(`スキル「${newSkill.name}」を複製しました。`);
    }
  }

  deleteSkillLibrary(id) {
    const skill = this.skillLibraryManager.get(id);
    if (!skill) return;

    this.showConfirmModal(
      'スキル削除の確認',
      `スキル「${skill.name}」を削除してよろしいですか？`,
      () => {
        this.skillLibraryManager.delete(id);
        this.renderSkillLibraryList();
      }
    );
  }

  // プレビュー表示
  showPreview() {
    if (!this.enemyManager.editingEnemyId) return;

    // フォーカスを外して入力値を確定させる
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    // 現在のフォームデータからエネミーオブジェクトを作成
    const enemyData = this._getEnemyFormData();
    if (!enemyData.name) {
      alert('エネミー名を入力してください。');
      return;
    }

    const enemy = new Enemy(enemyData);
    const previewHtml = this._generatePreviewHtml(enemy);
    this.elements.previewContent.innerHTML = previewHtml;

    // モーダルを中央に配置
    const modalContent = this.elements.previewModal.querySelector('.preview-modal-content');
    if (modalContent) {
      modalContent.style.left = '50%';
      modalContent.style.top = '50%';
      modalContent.style.transform = 'translate(-50%, -50%)';
    }

    this.elements.previewModal.classList.add('active');
  }


  hidePreview() {
    this.elements.previewModal.classList.remove('active');
  }

  // モーダル外クリックで閉じる
  _setupModalCloseHandlers() {
    // プレビューモーダル
    this.elements.previewModal.addEventListener('click', (e) => {
      if (e.target === this.elements.previewModal) {
        this.hidePreview();
      }
    });

    // プレビューモーダルのドラッグ機能
    this._setupPreviewModalDrag();
  }

  _setupPreviewModalDrag() {
    const modal = this.elements.previewModal;
    const modalContent = modal.querySelector('.preview-modal-content');
    const draggableHeader = modal.querySelector('.draggable');

    if (!draggableHeader || !modalContent) return;

    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    draggableHeader.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return; // ボタンクリック時はドラッグしない

      isDragging = true;
      modalContent.classList.add('dragging');

      // モーダルの現在位置を取得（画面座標系）
      const rect = modalContent.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();

      // マウス位置からモーダルの位置を計算（画面座標系）
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // 画面内に制限
      const maxX = window.innerWidth - modalContent.offsetWidth;
      const maxY = window.innerHeight - modalContent.offsetHeight;

      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));

      modalContent.style.left = currentX + 'px';
      modalContent.style.top = currentY + 'px';
      modalContent.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        modalContent.classList.remove('dragging');
      }
    });
  }

  _generatePreviewHtml(enemy) {
    // XML全体を生成
    const formattedXml = this.xmlGenerator.generateFormatted(enemy);
    // シンタックスハイライトを適用（HTMLエスケープも含む）
    const highlightedXml = this._highlightXml(formattedXml);
    return `<pre class="preview-xml">${highlightedXml}</pre>`;
  }

  _highlightXml(xmlString) {
    if (!xmlString) return '';

    // XMLGeneratorから生成されるXMLは：
    // - DOM経由で生成され、XMLSerializerで文字列化されている
    // - タグの<、>、属性の"、テキスト内の&などは全てXML文字実体参照に変換されている
    //
    // プレビューでは：
    // - タグの<、>は&lt;、&gt;として表示（HTMLエスケープ）
    // - 属性の"は&quot;として表示（HTMLエスケープ）
    // - 既存のXML文字実体参照（&amp;、&lt;、&gt;、&quot;、&apos;）はそのまま表示
    // - テキストコンテンツ内のXML文字実体参照は二重エスケープして表示

    let result = xmlString;

    // 既存のXML文字実体参照を保護（&amp;、&lt;、&gt;、&quot;、&apos;）
    // プレースホルダーは特殊な文字列を使用して、後続の処理で誤って変換されないようにする
    const entityMap = new Map();
    let entityIndex = 0;
    result = result.replace(/&(amp|lt|gt|quot|apos);/g, (match) => {
      const key = `__XML_ENTITY_${entityIndex}_XML__`;
      entityMap.set(key, match);
      entityIndex++;
      return key;
    });

    // HTMLの特殊文字をエスケープ（タグの<、>、属性の"をエスケープ）
    // 既存のXML文字実体参照は保護されているので、残りの&、<、>、"をエスケープ
    result = result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // 保護されたXML文字実体参照を元に戻す（チャットパレット内の&gt;、&amp;など）
    entityMap.forEach((value, key) => {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    // ここからシンタックスハイライトを適用
    // XML宣言をハイライト
    result = result.replace(/&lt;\?xml([^?]*)\?&gt;/g, (match) => {
      return `<span class="xml-declaration">${match}</span>`;
    });

    // コメントをハイライト
    result = result.replace(/&lt;!--([\s\S]*?)--&gt;/g, (match) => {
      return `<span class="xml-comment">${match}</span>`;
    });

    // CDATAをハイライト
    result = result.replace(/&lt;!\[CDATA\[([\s\S]*?)\]\]&gt;/g, (match) => {
      return `<span class="xml-cdata">${match}</span>`;
    });

    // タグをハイライト（開始タグ、終了タグ、自己完結タグ）
    // まず、既にハイライトされた部分を保護
    const protectedParts = [];
    result = result.replace(/<span class="(xml-declaration|xml-comment|xml-cdata)">[\s\S]*?<\/span>/g, (match) => {
      const id = `__PROTECTED_${protectedParts.length}__`;
      protectedParts.push(match);
      return id;
    });

    // タグ内の属性をハイライト
    // タグのパターンを修正：属性部分も含めて正しくマッチするように
    // [^&]*?では&quot;に含まれる&で止まってしまうため、より適切なパターンを使用
    // タグの終了は&gt;で確定するので、&gt;までマッチさせる
    result = result.replace(/&lt;(\/?)([\w\-:\.]+)([^>]*?)(\/?)&gt;/g, (match, closing, tagName, attrs, selfClosing) => {
      const closingSlash = closing ? closing : '';
      const selfClose = selfClosing ? selfClosing : '';
      let highlighted = `&lt;${closingSlash}<span class="xml-tag">${tagName}</span>`;

      // 属性をハイライト
      if (attrs && attrs.trim()) {
        // 属性名と属性値を分離
        // 属性値の引用符は既に&quot;または&apos;に変換されている
        // 属性値の中にXML文字実体参照が含まれる可能性がある
        const attrPattern = /(\s+)([\w\-:\.]+)(\s*=\s*)(&quot;|&apos;)((?:[^&]|&(?:amp|lt|gt|quot|apos);)*?)(\4)/g;
        let lastIndex = 0;
        let newAttrs = '';

        // 正規表現をリセットしてから実行
        attrPattern.lastIndex = 0;
        let attrMatch;
        while ((attrMatch = attrPattern.exec(attrs)) !== null) {
          // 属性の前の部分を追加
          if (attrMatch.index > lastIndex) {
            newAttrs += attrs.substring(lastIndex, attrMatch.index);
          }

          const space = attrMatch[1];
          const attrName = attrMatch[2];
          const equals = attrMatch[3];
          const quote = attrMatch[4];
          const attrValue = attrMatch[5];
          const endQuote = attrMatch[6];

          newAttrs += `${space}<span class="xml-attr-name">${attrName}</span>${equals}${quote}<span class="xml-attr-value">${attrValue}</span>${endQuote}`;
          lastIndex = attrPattern.lastIndex;
        }

        // 残りの部分を追加（マッチしなかった属性部分）
        if (lastIndex < attrs.length) {
          newAttrs += attrs.substring(lastIndex);
        }

        highlighted += newAttrs || attrs;
      }

      highlighted += `${selfClose}&gt;`;
      return highlighted;
    });

    // 保護された部分を元に戻す
    protectedParts.forEach((content, index) => {
      result = result.replace(`__PROTECTED_${index}__`, content);
    });

    // 残りのテキストコンテンツを処理（タグの外側とタグの中のテキスト）
    // 既にハイライトされた部分（<span>タグ）とタグ（&lt;...&gt;）をスキップ
    // シンタックスハイライトが適用されたタグは &lt;<span class="xml-tag">...</span>...&gt; という形式
    // タグ全体をマッチするため、&lt; から &gt; までの間で、<span> タグやXML文字実体参照が含まれていても正しくマッチする
    // より正確にマッチするため、貪欲でないマッチングを使用し、&gt; で終わる部分を確実にマッチする
    // タグのパターン: &lt; で始まり、途中に <span> タグやXML文字実体参照が含まれていても、最終的に &gt; で終わる
    // 簡略化: &lt; から &gt; までの間で、&gt; が出現するまでマッチ（貪欲でない、ネガティブルックアヘッドを使用）
    // ただし、<span> タグ内の &gt; は無視する必要があるため、より複雑な処理が必要
    // 実装: まず &lt; で始まる部分を見つけ、その中で &gt; が出現するまで（<span> タグを考慮しながら）マッチ
    const parts = [];
    let lastIndex = 0;
    let pos = 0;

    while (pos < result.length) {
      // XML宣言、コメント、CDATAを探す
      const declarationMatch = result.substring(pos).match(/^<span class="(xml-declaration|xml-comment|xml-cdata)">[\s\S]*?<\/span>/);
      if (declarationMatch) {
        if (pos > lastIndex) {
          parts.push(result.substring(lastIndex, pos));
        }
        parts.push(declarationMatch[0]);
        pos += declarationMatch[0].length;
        lastIndex = pos;
        continue;
      }

      // タグを探す（&lt; で始まり &gt; で終わる）
      if (result.substring(pos).startsWith('&lt;')) {
        // &lt; から &gt; までを探す
        let tagEnd = pos + 3; // '&lt;' の長さ
        let depth = 0; // <span> タグのネスト深度

        while (tagEnd < result.length) {
          if (result.substring(tagEnd).startsWith('<span')) {
            // <span> タグの開始
            const spanMatch = result.substring(tagEnd).match(/^<span[^>]*>/);
            if (spanMatch) {
              depth++;
              tagEnd += spanMatch[0].length;
              continue;
            }
          } else if (result.substring(tagEnd).startsWith('</span>')) {
            // </span> タグの終了
            depth--;
            tagEnd += 7; // '</span>' の長さ
            continue;
          } else if (result.substring(tagEnd).startsWith('&gt;') && depth === 0) {
            // タグの終了（&gt;）
            tagEnd += 4; // '&gt;' の長さ
            break;
          }
          tagEnd++;
        }

        if (tagEnd <= result.length) {
          if (pos > lastIndex) {
            parts.push(result.substring(lastIndex, pos));
          }
          parts.push(result.substring(pos, tagEnd));
          pos = tagEnd;
          lastIndex = pos;
          continue;
        }
      }

      pos++;
    }

    // 残りの部分を追加
    if (lastIndex < result.length) {
      parts.push(result.substring(lastIndex));
    }

    result = parts.map(part => {
      // 既にハイライトされた部分（XML宣言、コメント、CDATA）またはタグ
      if (part.match(/^<span class="(xml-declaration|xml-comment|xml-cdata)">/) || part.match(/^&lt;/)) {
        return part;
      } else if (part.trim() === '') {
        // 空行や空白のみの部分はそのまま
        return part;
      } else {
        // テキストコンテンツ（XML文字実体参照を全て二重エスケープ）
        // innerHTMLで挿入する際に、HTMLエンティティが解釈されるため、
        // テキストコンテンツ内の全てのXML文字実体参照（&amp;、&lt;、&gt;、&quot;、&apos;）を
        // 二重エスケープ（&amp;amp;、&amp;lt;、&amp;gt;、&amp;quot;、&amp;apos;）する必要がある
        // 注意: タグや属性の&lt;、&gt;、&quot;は二重エスケープしない（タグとして処理されているため）
        let textContent = part;
        // 全てのXML文字実体参照を二重エスケープ
        // 順序が重要: &amp;を最初に処理する必要がある
        textContent = textContent.replace(/&amp;/g, '&amp;amp;');
        textContent = textContent.replace(/&lt;/g, '&amp;lt;');
        textContent = textContent.replace(/&gt;/g, '&amp;gt;');
        textContent = textContent.replace(/&quot;/g, '&amp;quot;');
        textContent = textContent.replace(/&apos;/g, '&amp;apos;');
        return `<span class="xml-text">${textContent}</span>`;
      }
    }).join('');

    return result;
  }

  _escapeHtmlForHighlight(text) {
    if (!text) return '';
    // HTMLの特殊文字のみエスケープ（XML文字実体参照は既に保護されている）
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  _escapeHtml(text) {
    if (!text) return '';
    // HTMLの特殊文字のみエスケープ（XML文字実体参照はそのまま）
    // 既存の文字実体参照を保護してから、残りの&、<、>をエスケープ
    return String(text)
      .replace(/&amp;/g, '\u0001')  // 一時的に置換
      .replace(/&lt;/g, '\u0002')
      .replace(/&gt;/g, '\u0003')
      .replace(/&quot;/g, '\u0004')
      .replace(/&apos;/g, '\u0005')
      .replace(/&/g, '&amp;')       // 残りの&をエスケープ
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\u0001/g, '&amp;')  // 元に戻す
      .replace(/\u0002/g, '&lt;')
      .replace(/\u0003/g, '&gt;')
      .replace(/\u0004/g, '&quot;')
      .replace(/\u0005/g, '&apos;');
  }

  // ZIP出力
  downloadEnemyZip() {
    if (!this.enemyManager.editingEnemyId) return;
    this.downloadSingleEnemyZip(this.enemyManager.editingEnemyId);
  }

  downloadEnemyXml() {
    if (!this.enemyManager.editingEnemyId) return;
    this.downloadSingleEnemyXml(this.enemyManager.editingEnemyId);
  }

  downloadSingleEnemyXml(id) {
    const enemy = this.enemyManager.get(id);
    if (!enemy) return;

    try {
      const xmlString = this.xmlGenerator.generateFormatted(enemy);
      const blob = new Blob([xmlString], { type: 'application/xml' });
      saveAs(blob, `${enemy.name}.xml`);
    } catch (error) {
      console.error('XMLダウンロードエラー:', error);
      alert('XMLファイルのダウンロードに失敗しました。');
    }
  }

  downloadSingleEnemyZip(id) {
    const enemy = this.enemyManager.get(id);
    if (!enemy) return;

    const xmlString = this.xmlGenerator.generateFormatted(enemy);
    const zip = new JSZip();
    zip.file(`${enemy.name}.xml`, xmlString);

    zip.generateAsync({ type: 'blob' }).then(blob => {
      saveAs(blob, `${enemy.name}.zip`);
    }).catch(error => {
      console.error('ZIP生成エラー:', error);
      alert('ZIPファイルの生成に失敗しました。');
    });
  }

  // 一括エクスポート
  bulkExportEnemies() {
    const checkedBoxes = this.elements.enemyList.querySelectorAll('.enemy-checkbox:checked');
    if (checkedBoxes.length === 0) {
      alert('エクスポートするエネミーを選択してください。');
      return;
    }

    const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.enemyId);
    const enemies = selectedIds.map(id => this.enemyManager.get(id)).filter(e => e !== null);

    if (enemies.length === 0) {
      alert('選択したエネミーが見つかりません。');
      return;
    }

    // 二重ZIP構造を作成
    const outerZip = new JSZip();
    const promises = enemies.map(enemy => {
      const xmlString = this.xmlGenerator.generateFormatted(enemy);
      const innerZip = new JSZip();
      innerZip.file(`${enemy.name}.xml`, xmlString);
      return innerZip.generateAsync({ type: 'blob' }).then(blob => {
        outerZip.file(`${enemy.name}.zip`, blob);
      });
    });

    Promise.all(promises).then(() => {
      return outerZip.generateAsync({ type: 'blob' });
    }).then(blob => {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      saveAs(blob, `enemies_${dateStr}.zip`);

      // チェックボックスをリセット
      checkedBoxes.forEach(cb => cb.checked = false);
      this._updateBulkExportButton();
    }).catch(error => {
      console.error('一括ZIP生成エラー:', error);
      alert('ZIPファイルの生成に失敗しました。');
    });
  }

  // データ管理
  exportAllData() {
    const data = {
      enemies: this.enemyManager.getAll().map(e => e.toJSON()),
      skills: this.skillLibraryManager.getAll().map(s => s.toJSON()),
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ar2e_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('データをエクスポートしました。');
  }

  importAllData(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (!importedData.enemies || !Array.isArray(importedData.enemies)) {
          throw new Error('無効なデータ形式です。');
        }

        const enemyCount = importedData.enemies.length;
        const skillCount = (importedData.skills || []).length;

        // 3択モーダルを表示
        this._showAllDataImportOptionsModal(importedData, enemyCount, skillCount);

      } catch (error) {
        console.error('インポートエラー:', error);
        alert(`データのインポートに失敗しました。\nエラー: ${error.message}\n\nファイル形式を確認してください。`);
        this.elements.importFileInput.value = '';
      }
    };

    reader.onerror = (error) => {
      console.error('ファイル読み込みエラー:', error);
      alert('ファイルの読み込みに失敗しました。');
      this.elements.importFileInput.value = '';
    };

    reader.readAsText(file);
  }

  // 全データインポート方法選択用の3択モーダルを表示
  _showAllDataImportOptionsModal(importedData, enemyCount, skillCount) {
    // 既存のモーダルをクリーンアップ
    this._cleanupModal();

    this.elements.modalTitle.textContent = 'インポート方法の選択';
    this.elements.modalMessage.textContent = `エネミー${enemyCount}件、スキル${skillCount}件をインポートします。インポート方法を選択してください：\n\n・マージ：既存データに追加（同じIDは上書き）\n・上書き：既存データを完全に置き換え`;

    // デフォルトボタンを非表示
    this.elements.modalConfirmBtn.style.display = 'none';
    this.elements.modalCancelBtn.style.display = 'none';

    // カスタムボタンを作成
    const buttonsContainer = this.elements.modal.querySelector('.modal-actions');

    const mergeBtn = document.createElement('button');
    mergeBtn.className = 'btn btn-primary';
    mergeBtn.textContent = 'マージ';
    mergeBtn.addEventListener('click', () => {
      this.hideModal();
      this._showMergeOptionsModal(importedData, enemyCount, skillCount);
    });

    const overwriteBtn = document.createElement('button');
    overwriteBtn.className = 'btn btn-warning';
    overwriteBtn.textContent = '上書き';
    overwriteBtn.addEventListener('click', () => {
      this.hideModal();
      this._confirmAllDataImportOverwrite(importedData, enemyCount, skillCount);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.addEventListener('click', () => {
      this.hideModal();
      this.elements.importFileInput.value = '';
    });

    buttonsContainer.appendChild(mergeBtn);
    buttonsContainer.appendChild(overwriteBtn);
    buttonsContainer.appendChild(cancelBtn);

    this.elements.modal.classList.add('active');
  }

  // マージオプション選択モーダル（通常マージ vs 最終更新日優先マージ）
  _showMergeOptionsModal(importedData, enemyCount, skillCount) {
    this._cleanupModal();

    // モーダルを大きくする
    const modalContent = this.elements.modal.querySelector('.modal-content');
    modalContent.classList.add('modal-large');

    this.elements.modalTitle.textContent = 'マージ方法の選択';
    this.elements.modalMessage.textContent = `マージ方法を選択してください：\n\n・通常マージ：既存データに追加（同じIDは新しいデータで上書き）\n・最終更新日優先マージ：同じIDの場合、最終更新日が新しい方を優先`;

    this.elements.modalConfirmBtn.style.display = 'none';
    this.elements.modalCancelBtn.style.display = 'none';

    const buttonsContainer = this.elements.modal.querySelector('.modal-actions');

    const normalMergeBtn = document.createElement('button');
    normalMergeBtn.className = 'btn btn-primary';
    normalMergeBtn.textContent = '通常マージ';
    normalMergeBtn.addEventListener('click', () => {
      this.hideModal();
      this._confirmAllDataImportMerge(importedData, enemyCount, skillCount, false);
    });

    const datePriorityMergeBtn = document.createElement('button');
    datePriorityMergeBtn.className = 'btn btn-primary';
    datePriorityMergeBtn.textContent = '最終更新日優先マージ';
    datePriorityMergeBtn.addEventListener('click', () => {
      this.hideModal();
      this._confirmAllDataImportMerge(importedData, enemyCount, skillCount, true);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.addEventListener('click', () => {
      this.hideModal();
      this.elements.importFileInput.value = '';
    });

    buttonsContainer.appendChild(normalMergeBtn);
    buttonsContainer.appendChild(datePriorityMergeBtn);
    buttonsContainer.appendChild(cancelBtn);

    this.elements.modal.classList.add('active');
  }

  // 全データマージインポートの確認
  _confirmAllDataImportMerge(importedData, enemyCount, skillCount, useDatePriority) {
    const mergeType = useDatePriority ? '最終更新日優先マージ' : '通常マージ';
    this.showConfirmModal(
      'マージの確認',
      `エネミー${enemyCount}件、スキル${skillCount}件を既存データに${mergeType}します。同じIDのデータは${useDatePriority ? '最終更新日が新しい方で上書き' : 'インポートデータで上書き'}されます。よろしいですか？`,
      () => {
        this._importAllDataMerge(importedData, useDatePriority);
      },
      () => {
        this.elements.importFileInput.value = '';
      }
    );
  }

  // 全データ上書きインポートの確認
  _confirmAllDataImportOverwrite(importedData, enemyCount, skillCount) {
    this.showConfirmModal(
      '上書きの確認',
      `エネミー${enemyCount}件、スキル${skillCount}件で既存データを完全に上書きします。既存のデータは全て削除されます。よろしいですか？`,
      () => {
        this._importAllDataOverwrite(importedData);
      },
      () => {
        this.elements.importFileInput.value = '';
      }
    );
  }

  // 全データのマージインポート
  _importAllDataMerge(importedData, useDatePriority) {
    // エネミーのマージ
    const existingEnemies = this.enemyManager.getAll();
    const existingEnemyMap = new Map(existingEnemies.map(e => [e.id, e]));

    importedData.enemies.forEach(enemyData => {
      const enemy = new Enemy(enemyData);
      if (useDatePriority && existingEnemyMap.has(enemy.id)) {
        const existingEnemy = existingEnemyMap.get(enemy.id);
        const existingDate = new Date(existingEnemy.updatedAt || existingEnemy.createdAt || 0);
        const importedDate = new Date(enemy.updatedAt || enemy.createdAt || 0);

        // 既存の方が新しい場合は既存を保持
        if (existingDate > importedDate) {
          return; // 既存データを保持
        }
      }
      existingEnemyMap.set(enemy.id, enemy);
    });

    this.enemyManager.enemies = Array.from(existingEnemyMap.values());
    this.enemyManager.save();

    // スキルのマージ
    const existingSkills = this.skillLibraryManager.getAll();
    const existingSkillMap = new Map(existingSkills.map(s => [s.id, s]));

    (importedData.skills || []).forEach(skillData => {
      const skill = new Skill(skillData);
      if (useDatePriority && existingSkillMap.has(skill.id)) {
        const existingSkill = existingSkillMap.get(skill.id);
        const existingDate = new Date(existingSkill.updatedAt || existingSkill.createdAt || 0);
        const importedDate = new Date(skill.updatedAt || skill.createdAt || 0);

        // 既存の方が新しい場合は既存を保持
        if (existingDate > importedDate) {
          return; // 既存データを保持
        }
      }
      existingSkillMap.set(skill.id, skill);
    });

    this.skillLibraryManager.skills = Array.from(existingSkillMap.values());
    this.skillLibraryManager.save();

    this.renderEnemyList();
    this.renderSkillLibraryList();
    this.elements.importFileInput.value = '';

    const mergeType = useDatePriority ? '最終更新日優先マージ' : 'マージ';
    alert(`データを${mergeType}しました。\nエネミー: ${this.enemyManager.enemies.length}件\nスキル: ${this.skillLibraryManager.skills.length}件`);
  }

  // 全データの上書きインポート
  _importAllDataOverwrite(importedData) {
    this.enemyManager.enemies = importedData.enemies.map(d => new Enemy(d));
    this.enemyManager.save();
    this.skillLibraryManager.skills = (importedData.skills || []).map(d => new Skill(d));
    this.skillLibraryManager.save();
    this.renderEnemyList();
    this.renderSkillLibraryList();
    this.elements.importFileInput.value = '';
    alert(`データを上書きしました。\nエネミー: ${importedData.enemies.length}件\nスキル: ${(importedData.skills || []).length}件`);
  }

  confirmClearAll() {
    this.showConfirmModal(
      '全データ削除の確認',
      '本当に全てのエネミーとスキルのデータを削除しますか？この操作は取り消せません。',
      () => {
        this.enemyManager.clear();
        this.skillLibraryManager.clear();
        this.renderEnemyList();
        this.renderSkillLibraryList();
        this.hideEnemyForm();
        this.hideSkillLibraryForm();
        alert('全てのデータを削除しました。');
      }
    );
  }

  // スキルライブラリのエクスポート
  exportSkillLibrary() {
    const data = {
      skills: this.skillLibraryManager.getAll().map(s => s.toJSON()),
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ar2e_skill_library_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('スキルライブラリをエクスポートしました。');
  }

  // スキルライブラリのインポート
  importSkillLibrary(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        console.log('インポートデータ:', importedData);

        if (!importedData.skills || !Array.isArray(importedData.skills)) {
          throw new Error(`無効なデータ形式です。skills: ${typeof importedData.skills}, isArray: ${Array.isArray(importedData.skills)}`);
        }

        // 3択モーダルを表示
        this._showImportOptionsModal(importedData.skills);

      } catch (error) {
        console.error('インポートエラー:', error);
        alert(`データのインポートに失敗しました。\nエラー: ${error.message}\n\nファイル形式を確認してください。`);
        this.elements.importSkillFileInput.value = '';
      }
    };

    reader.onerror = (error) => {
      console.error('ファイル読み込みエラー:', error);
      alert('ファイルの読み込みに失敗しました。');
      this.elements.importSkillFileInput.value = '';
    };

    reader.readAsText(file);
  }

  // インポート方法選択用の3択モーダルを表示
  _showImportOptionsModal(skills) {
    // 既存のモーダルをクリーンアップ
    this._cleanupModal();

    this.elements.modalTitle.textContent = 'インポート方法の選択';
    this.elements.modalMessage.textContent = `スキル${skills.length}件をインポートします。インポート方法を選択してください：\n\n・マージ：既存データに追加（同じIDは上書き）\n・上書き：既存データを完全に置き換え`;

    // デフォルトボタンを非表示
    this.elements.modalConfirmBtn.style.display = 'none';
    this.elements.modalCancelBtn.style.display = 'none';

    // カスタムボタンを作成
    const buttonsContainer = this.elements.modal.querySelector('.modal-actions');

    const mergeBtn = document.createElement('button');
    mergeBtn.className = 'btn btn-primary';
    mergeBtn.textContent = 'マージ';
    mergeBtn.addEventListener('click', () => {
      this.hideModal();
      this._showSkillMergeOptionsModal(skills);
    });

    const overwriteBtn = document.createElement('button');
    overwriteBtn.className = 'btn btn-warning';
    overwriteBtn.textContent = '上書き';
    overwriteBtn.addEventListener('click', () => {
      this.hideModal();
      this._confirmImportOverwrite(skills);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.addEventListener('click', () => {
      this.hideModal();
      this.elements.importSkillFileInput.value = '';
    });

    buttonsContainer.appendChild(mergeBtn);
    buttonsContainer.appendChild(overwriteBtn);
    buttonsContainer.appendChild(cancelBtn);

    this.elements.modal.classList.add('active');
  }

  // スキルライブラリマージオプション選択モーダル（通常マージ vs 最終更新日優先マージ）
  _showSkillMergeOptionsModal(skills) {
    this._cleanupModal();

    // モーダルを大きくする
    const modalContent = this.elements.modal.querySelector('.modal-content');
    modalContent.classList.add('modal-large');

    this.elements.modalTitle.textContent = 'マージ方法の選択';
    this.elements.modalMessage.textContent = `マージ方法を選択してください：\n\n・通常マージ：既存データに追加（同じIDは新しいデータで上書き）\n・最終更新日優先マージ：同じIDの場合、最終更新日が新しい方を優先`;

    this.elements.modalConfirmBtn.style.display = 'none';
    this.elements.modalCancelBtn.style.display = 'none';

    const buttonsContainer = this.elements.modal.querySelector('.modal-actions');

    const normalMergeBtn = document.createElement('button');
    normalMergeBtn.className = 'btn btn-primary';
    normalMergeBtn.textContent = '通常マージ';
    normalMergeBtn.addEventListener('click', () => {
      this.hideModal();
      this._confirmSkillLibraryImportMerge(skills, false);
    });

    const datePriorityMergeBtn = document.createElement('button');
    datePriorityMergeBtn.className = 'btn btn-primary';
    datePriorityMergeBtn.textContent = '最終更新日優先マージ';
    datePriorityMergeBtn.addEventListener('click', () => {
      this.hideModal();
      this._confirmSkillLibraryImportMerge(skills, true);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.addEventListener('click', () => {
      this.hideModal();
      this.elements.importSkillFileInput.value = '';
    });

    buttonsContainer.appendChild(normalMergeBtn);
    buttonsContainer.appendChild(datePriorityMergeBtn);
    buttonsContainer.appendChild(cancelBtn);

    this.elements.modal.classList.add('active');
  }

  // スキルライブラリマージインポートの確認
  _confirmSkillLibraryImportMerge(skills, useDatePriority) {
    const mergeType = useDatePriority ? '最終更新日優先マージ' : '通常マージ';
    this.showConfirmModal(
      'マージの確認',
      `スキル${skills.length}件を既存データに${mergeType}します。同じIDのスキルは${useDatePriority ? '最終更新日が新しい方で上書き' : 'インポートデータで上書き'}されます。よろしいですか？`,
      () => {
        this._importSkillLibraryMerge(skills, useDatePriority);
      },
      () => {
        this.elements.importSkillFileInput.value = '';
      }
    );
  }

  // 上書きインポートの確認
  _confirmImportOverwrite(skills) {
    this.showConfirmModal(
      '上書きの確認',
      `スキル${skills.length}件で既存データを完全に上書きします。既存のスキルは全て削除されます。よろしいですか？`,
      () => {
        this._importSkillLibraryOverwrite(skills);
      },
      () => {
        this.elements.importSkillFileInput.value = '';
      }
    );
  }

  // スキルライブラリのマージインポート
  _importSkillLibraryMerge(skills, useDatePriority = false) {
    const existingSkills = this.skillLibraryManager.getAll();
    const existingSkillMap = new Map(existingSkills.map(s => [s.id, s]));

    // インポートしたスキルで既存スキルを更新または追加
    skills.forEach(skillData => {
      const skill = new Skill(skillData);
      if (useDatePriority && existingSkillMap.has(skill.id)) {
        const existingSkill = existingSkillMap.get(skill.id);
        const existingDate = new Date(existingSkill.updatedAt || existingSkill.createdAt || 0);
        const importedDate = new Date(skill.updatedAt || skill.createdAt || 0);

        // 既存の方が新しい場合は既存を保持
        if (existingDate > importedDate) {
          return; // 既存データを保持
        }
      }
      existingSkillMap.set(skill.id, skill);
    });

    this.skillLibraryManager.skills = Array.from(existingSkillMap.values());
    this.skillLibraryManager.save();
    this.renderSkillLibraryList();
    this.elements.importSkillFileInput.value = '';

    const mergeType = useDatePriority ? '最終更新日優先マージ' : 'マージ';
    alert(`スキルライブラリを${mergeType}しました。（合計${this.skillLibraryManager.skills.length}件）`);
  }

  // スキルライブラリの上書きインポート
  _importSkillLibraryOverwrite(skills) {
    this.skillLibraryManager.skills = skills.map(d => new Skill(d));
    this.skillLibraryManager.save();
    this.renderSkillLibraryList();
    this.elements.importSkillFileInput.value = '';
    alert(`スキルライブラリを上書きしました。（${skills.length}件）`);
  }

  // モーダル
  showConfirmModal(title, message, onConfirm, onCancel) {
    // 既存のモーダルをクリーンアップ
    this._cleanupModal();

    this.elements.modalTitle.textContent = title;
    this.elements.modalMessage.textContent = message;

    // デフォルトボタンを表示
    this.elements.modalConfirmBtn.style.display = '';
    this.elements.modalCancelBtn.style.display = '';

    // カスタムハンドラーを一時的に保存
    this._modalConfirmHandler = () => {
      onConfirm();
      this.hideModal();
    };

    this._modalCancelHandler = () => {
      if (onCancel) {
        onCancel();
      }
      this.hideModal();
    };

    // イベントリスナーを登録
    this.elements.modalConfirmBtn.addEventListener('click', this._modalConfirmHandler);
    this.elements.modalCancelBtn.addEventListener('click', this._modalCancelHandler);

    this.elements.modal.classList.add('active');
  }

  hideModal() {
    this.elements.modal.classList.remove('active');
    this._cleanupModal();
  }

  _cleanupModal() {
    // カスタムイベントリスナーを削除
    if (this._modalConfirmHandler) {
      this.elements.modalConfirmBtn.removeEventListener('click', this._modalConfirmHandler);
      this._modalConfirmHandler = null;
    }
    if (this._modalCancelHandler) {
      this.elements.modalCancelBtn.removeEventListener('click', this._modalCancelHandler);
      this._modalCancelHandler = null;
    }

    // カスタムボタンをクリーンアップ
    const buttonsContainer = this.elements.modal.querySelector('.modal-actions');
    if (buttonsContainer) {
      const customButtons = buttonsContainer.querySelectorAll('button:not(#modalConfirmBtn):not(#modalCancelBtn)');
      customButtons.forEach(btn => btn.remove());
    }

    // modal-largeクラスを削除
    const modalContent = this.elements.modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.remove('modal-large');
    }

    // デフォルトボタンを再表示
    if (this.elements.modalConfirmBtn) {
      this.elements.modalConfirmBtn.style.display = '';
    }
    if (this.elements.modalCancelBtn) {
      this.elements.modalCancelBtn.style.display = '';
    }
  }

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// =============================================================================
// アプリケーションエントリーポイント
// =============================================================================

/**
 * アプリケーションクラス
 */
class App {
  constructor() {
    this.enemyManager = new EnemyManager();
    this.skillLibraryManager = new SkillLibraryManager();
    this.xmlGenerator = new XMLGenerator(this.skillLibraryManager);
    this.ui = new UIManager(this.enemyManager, this.skillLibraryManager, this.xmlGenerator);
  }

  init() {
    this.enemyManager.load();
    this.skillLibraryManager.load();
    this.ui.init();
  }
}

// グローバルアプリケーションインスタンス
let app;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.init();
});
