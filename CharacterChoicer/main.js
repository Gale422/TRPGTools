(() => {
  // 定数定義
  const DOM_SELECTORS = {
    CREATE_BUTTON: '#create',
    COPY_BUTTON: '#copy',
    CHOICE_NUM: '#choiceNum',
    RESULT: '#result',
    COPY_MESSAGE: '#copyMessage',
    SAVE_BUTTON: '#save',
    SAVING_CHARA_NAME: '#savingCharaName',
    SAVING_CHARA_GROUP: '#savingCharaGroup',
    SAVED_CHARA_LIST: '#savedCharaList',
    PL_LIST_TABLE: '#PLListTable',
    OTHER_TABLE: '#OtherTable',
    ADD_NAME: '#addName',
    SAVED_CHARA_TABLE_TEMPLATE: '#savedCharaTableTemplate',
    SAVED_CHARA_TEMPLATE: '#savedCharaTemplate',
    CHARA_TEMPLATE: '#charaTemplate',
  };

  const STORAGE_KEY = 'savedCharaData';
  const ENTER_KEY_CODE = 13;

  // DOM要素のキャッシュ
  const domCache = {};

  /**
   * DOM要素をキャッシュして取得する
   * @param {string} selector - セレクタ文字列
   * @returns {Element} - DOM要素
   */
  const getElement = (selector) => {
    if (!domCache[selector]) {
      domCache[selector] = document.querySelector(selector);
    }
    return domCache[selector];
  };

  /**
   * 複数のDOM要素をセレクタから取得する（キャッシュなし）
   * @param {string} selector - セレクタ文字列
   * @returns {NodeList} - DOM要素のリスト
   */
  const getElements = (selector) => document.querySelectorAll(selector);

  /**
   * choiceコマンドを作成する
   */
  const createChoiceCommand = () => {
    const choiceNumElem = getElement(DOM_SELECTORS.CHOICE_NUM);
    let num = parseInt(choiceNumElem.value);
    num = num && num > 1 ? num : '';

    const selector = `${DOM_SELECTORS.PL_LIST_TABLE} .charaCheck input[type=checkbox]:checked, ${DOM_SELECTORS.OTHER_TABLE} .charaCheck input[type=checkbox]:checked`;
    const nameList = Array.from(
      getElements(selector),
      e => e.closest('tr')?.querySelector('input.charaName').value
    ).filter(Boolean);

    getElement(DOM_SELECTORS.RESULT).value = `choice${num}[${nameList.join(',')}]`;
  };

  /**
   * コマンドをクリップボードにコピーする
   */
  const copyToClipboard = () => {
    const resultElem = getElement(DOM_SELECTORS.RESULT);
    const copyMessageElem = getElement(DOM_SELECTORS.COPY_MESSAGE);

    navigator.clipboard.writeText(resultElem.value)
      .then(() => {
        copyMessageElem.className = '';
        setTimeout(() => {
          copyMessageElem.className = 'hidden';
        }, 1000);
      });
  };

  /**
   * キャラクターデータを保存する
   */
  const saveCharacter = () => {
    const nameElem = getElement(DOM_SELECTORS.SAVING_CHARA_NAME);
    const groupElem = getElement(DOM_SELECTORS.SAVING_CHARA_GROUP);
    const name = nameElem.value || "";
    const group = groupElem.value || "";

    if (!name) return;

    const savedData = getSavedData();
    // データの更新(対象データが存在しないリストにする→値の追加)
    const updatedData = savedData.filter(data => data !== name && data?.name !== name);
    updatedData.push({ name, group });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    nameElem.value = '';
    reloadSavedCharacters();
  };

  /**
   * 保存されているキャラクターデータを取得する
   * @returns {Array} - 保存されているキャラクターデータ
   */
  const getSavedData = () => {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) return [];
    return JSON.parse(dataStr);
  };

  /**
   * 保存しているキャラデータの再描画
   */
  const reloadSavedCharacters = () => {
    const listElem = getElement(DOM_SELECTORS.SAVED_CHARA_LIST);
    // 保存しているデータの表示を一旦削除（より効率的な方法）
    listElem.innerHTML = '';

    const savedData = getSavedData();
    if (!savedData.length) return;

    // 古いデータに対する互換性をもたせるため、古いデータを変換する
    const processedData = savedData.map(data =>
      (typeof data === "string" || data instanceof String) ? { name: data, group: "" } : data
    );

    // グループでソート
    processedData.sort((a, b) => {
      if (a.group === b.group) return 0;
      return a.group.localeCompare(b.group, 'ja');
    });

    // グループごとのテーブルマップを作成（DOMの操作を減らすため）
    const groupTables = {};

    for (const { name, group } of processedData) {
      if (!groupTables[group]) {
        // グループのテーブルが存在しないため、グループテーブルを追加
        const tableTemplate = getElement(DOM_SELECTORS.SAVED_CHARA_TABLE_TEMPLATE);
        const clone = tableTemplate.content.cloneNode(true);
        clone.querySelector('.groupName').textContent = group;
        listElem.appendChild(clone);

        // 新しく追加したテーブルを取得
        const tables = getElements(`${DOM_SELECTORS.SAVED_CHARA_LIST} .groupTable`);
        groupTables[group] = tables[tables.length - 1];
      }

      // 対象グループのテーブルに行追加
      const template = getElement(DOM_SELECTORS.SAVED_CHARA_TEMPLATE);
      const clone = template.content.cloneNode(true);
      clone.querySelector('.savedCharaName').textContent = name;
      groupTables[group].querySelector('tbody').appendChild(clone);
    }
  };

  /**
   * 保存したキャラクターを選択リストに追加する
   */
  const addSelectedCharacters = () => {
    const charaNames = Array.from(
      getElements(`${DOM_SELECTORS.SAVED_CHARA_LIST} tbody input[type=checkbox]:checked`),
      e => e.closest('tr').querySelector('.savedCharaName').textContent
    );

    if (!charaNames.length) return;

    // 既存行に追加できるかどうかを確認
    const emptyInputs = Array.from(
      getElements(`${DOM_SELECTORS.PL_LIST_TABLE} tbody tr:not(.listNavi) input.charaName`)
    ).filter(input => input.value === '');

    const listNavi = getElement(`${DOM_SELECTORS.PL_LIST_TABLE} tbody tr.listNavi`);
    const plListTableBody = getElement(`${DOM_SELECTORS.PL_LIST_TABLE} tbody`);

    // テンプレートは一度だけ取得
    const template = getElement(DOM_SELECTORS.CHARA_TEMPLATE);

    // DocumentFragmentを使用して一度に複数の要素を追加（DOMの再描画回数を減らす）
    const fragment = document.createDocumentFragment();
    let newRowsCount = 0;

    for (let i = 0; i < charaNames.length; i++) {
      const charaName = charaNames[i];

      if (i < emptyInputs.length) {
        // 空の入力欄がある場合は、そこに追加
        emptyInputs[i].value = charaName || '';
      } else {
        // 空の入力欄がない場合は、新しい行を作成
        const clone = template.content.cloneNode(true);
        clone.querySelector('.charaName').value = charaName || '';
        fragment.appendChild(clone);
        newRowsCount++;
      }
    }

    // 新しい行がある場合のみDOMに追加
    if (newRowsCount > 0) {
      if (listNavi) {
        listNavi.before(fragment);
      } else {
        plListTableBody.appendChild(fragment);
      }
    }
  };

  /**
   * 保存したキャラクター名を削除する
   * @param {Element} target - クリックされた要素
   */
  const deleteCharacter = (target) => {
    const charaName = target.closest('tr').querySelector('.savedCharaName')?.textContent;
    if (!charaName) return;

    const savedData = getSavedData();
    const updatedData = savedData.filter(e => e !== charaName && e?.name !== charaName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    reloadSavedCharacters();
  };

  /**
   * イベントリスナーを設定する
   */
  const setupEventListeners = () => {
    // choiceコマンド作成ボタン
    getElement(DOM_SELECTORS.CREATE_BUTTON).addEventListener('click', createChoiceCommand);

    // choiceコマンドコピーボタン
    getElement(DOM_SELECTORS.COPY_BUTTON).addEventListener('click', copyToClipboard);

    // キャラ名保存ボタン
    getElement(DOM_SELECTORS.SAVE_BUTTON).addEventListener('click', saveCharacter);

    // キャラ名保存ボタン(エンターキー対応)
    [DOM_SELECTORS.SAVING_CHARA_NAME, DOM_SELECTORS.SAVING_CHARA_GROUP].forEach(selector => {
      getElement(selector).addEventListener('keydown', event => {
        if (event.keyCode === ENTER_KEY_CODE) {
          // エンターキーが押された場合は保存ボタンと同様の動作をする
          saveCharacter();
        }
      });
    });

    // イベント委譲：クリックイベント
    document.body.addEventListener('click', handleBodyClick);

    // イベント委譲：changeイベント
    document.body.addEventListener('change', handleBodyChange);
  };

  /**
   * bodyのクリックイベントハンドラ（イベント委譲）
   * @param {Event} event - クリックイベント
   */
  const handleBodyClick = (event) => {
    if (!event.target) return;

    const target = event.target;

    // チェックボックス関連の処理
    if (handleCheckboxClick(target)) return;

    // ボタン関連の処理
    if (handleButtonClick(target)) return;

    // 保存キャラ名関連の処理
    if (handleSavedCharaClick(target)) return;
  };

  /**
   * チェックボックス関連のクリックイベント処理
   * @param {Element} target - クリックされた要素
   * @returns {boolean} - イベントが処理された場合はtrue
   */
  const handleCheckboxClick = (target) => {
    if (target.matches('.tableCheck')) {
      // テーブル全体チェックボックスのセルをクリックした場合
      const checkbox = target.querySelector('input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (target.matches('.tableCheck input[type=checkbox]')) {
      // チェックボックスを直接クリックした場合
      event.stopPropagation();
      return true;
    }

    if (target.matches('.charaCheck')) {
      // セル内をクリックした場合
      const checkbox = target.querySelector('input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (target.matches('.groupName')) {
      // グループ名をクリックするとテーブルの全選択チェックボックスを変動させる
      const checkbox = target.closest('tr').querySelector('.tableCheck input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (target.matches('.savedCharaName')) {
      // 保存したキャラ名をクリックすると選択のチェックボックスを変動させる
      const checkbox = target.closest('tr').querySelector('.charaCheck input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  };

  /**
   * ボタン関連のクリックイベント処理
   * @param {Element} target - クリックされた要素
   * @returns {boolean} - イベントが処理された場合はtrue
   */
  const handleButtonClick = (target) => {
    if (target.matches('.place')) {
      // プラスボタン：新しい行を追加
      const table = target.closest('table');
      const listNavi = table.querySelector('tbody tr.listNavi');
      const template = getElement(DOM_SELECTORS.CHARA_TEMPLATE);
      const clone = template.content.cloneNode(true);

      if (listNavi) {
        listNavi.before(clone);
      } else {
        table.querySelector('tbody').append(clone);
      }
      return true;
    }

    if (target.matches('.minus')) {
      // マイナスボタン：行を削除
      const listNavi = target.closest('table').querySelector('tbody tr.listNavi');
      listNavi.previousElementSibling?.remove();
      return true;
    }

    if (target.matches('.nameDel')) {
      // 名称全削除ボタン
      target.closest('table').querySelectorAll('.charaName')?.forEach(elm => elm.value = '');
      return true;
    }

    if (target.matches('#addName')) {
      // 保存したキャラ名追加
      addSelectedCharacters();
      return true;
    }

    return false;
  };

  /**
   * 保存キャラ名関連のクリックイベント処理
   * @param {Element} target - クリックされた要素
   * @returns {boolean} - イベントが処理された場合はtrue
   */
  const handleSavedCharaClick = (target) => {
    if (target.matches('.delName') || target.closest('td')?.matches('.delName')) {
      // 保存したキャラ名削除
      deleteCharacter(target);
      return true;
    }

    return false;
  };

  /**
   * bodyのchangeイベントハンドラ（イベント委譲）
   * @param {Event} event - changeイベント
   */
  const handleBodyChange = (event) => {
    if (!event.target) return;

    const target = event.target;

    if (target.matches('.tableCheck input[type=checkbox]')) {
      // チェックボックスの値が変更された場合はテーブル全体を変更する
      const isChecked = target.checked;
      const table = target.closest('table');
      table.querySelectorAll('.charaCheck input[type=checkbox]').forEach(c => {
        c.checked = isChecked;
      });
    }
  };

  // アプリケーションの初期化
  const init = () => {
    setupEventListeners();
    reloadSavedCharacters();
  };

  // 初期化実行
  init();
})();
