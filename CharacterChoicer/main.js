/**
 * キャラクター選択ツール - ココフォリア用choiceコマンド生成アプリケーション
 * @description キャラクター名を管理し、ココフォリアのchoiceコマンドを生成するツール
 */
(() => {
  'use strict';

  // ================================================================================
  // 定数定義
  // ================================================================================

  /**
   * DOM要素のセレクタ定義
   * @readonly
   */
  const DOM_SELECTORS = {
    CREATE_BUTTON: '#create',
    COPY_BUTTON: '#copyBtn',
    CHOICE_NUM: '#num',
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
    CHARA_TEMPLATE: '#newRowTemplate',
    HISTORY_TOGGLE: '#historyToggle',
    HISTORY_CONTENT: '#historyContent',
    HISTORY_LIST: '#historyList',
    HISTORY_ITEM_TEMPLATE: '#historyItemTemplate',
  };

  /** LocalStorageのキー名 */
  const STORAGE_KEY = 'savedCharaData';

  /** choiceコマンド履歴のLocalStorageキー名 */
  const HISTORY_STORAGE_KEY = 'choiceCommandHistory';

  /** 履歴の最大保存件数 */
  const MAX_HISTORY_COUNT = 10;

  /** コピー成功メッセージの表示時間（ミリ秒） */
  const COPY_MESSAGE_DURATION = 1000;

  /** ドラッグ&ドロップのデータ形式 */
  const DRAG_DATA_TYPE = 'application/x-character-row';

  /** ドラッグ中の行を示すCSSクラス */
  const DRAG_OVER_CLASS = 'drag-over';

  /** タイムスタンプ更新の間隔（ミリ秒） */
  const TIMESTAMP_UPDATE_INTERVAL = 60000; // 1分ごと

  // ================================================================================
  // DOM操作ユーティリティ
  // ================================================================================

  /** DOM要素のキャッシュ */
  const domCache = {};

  /** タイムスタンプ更新タイマーのID */
  let timestampUpdateTimer = null;

  /**
   * DOM要素をキャッシュして取得する
   * @param {string} selector - CSSセレクタ文字列
   * @returns {Element|null} DOM要素、見つからない場合はnull
   */
  const getElement = (selector) => {
    if (!domCache[selector]) {
      domCache[selector] = document.querySelector(selector);
    }
    return domCache[selector];
  };

  /**
   * 複数のDOM要素をセレクタから取得する（キャッシュなし）
   * @param {string} selector - CSSセレクタ文字列
   * @returns {NodeList} DOM要素のNodeList
   */
  const getElements = (selector) => document.querySelectorAll(selector);

  // ================================================================================
  // choiceコマンド生成機能
  // ================================================================================

  /**
   * ココフォリア用choiceコマンドを作成する
   * @description 選択されたキャラクター名からchoiceコマンド文字列を生成
   */
  const createChoiceCommand = () => {
    try {
    const choiceNumElem = getElement(DOM_SELECTORS.CHOICE_NUM);
      if (!choiceNumElem) {
        console.error('選択数入力欄が見つかりません');
        return;
      }

      // 選択数の取得と検証（1より大きい場合のみ数値を使用）
      let num = parseInt(choiceNumElem.value, 10);
    num = num && num > 1 ? num : '';

      // チェックされたキャラクター名を取得
    const selector = `${DOM_SELECTORS.PL_LIST_TABLE} .charaCheck input[type=checkbox]:checked, ${DOM_SELECTORS.OTHER_TABLE} .charaCheck input[type=checkbox]:checked`;
    const nameList = Array.from(
      getElements(selector),
        e => e.closest('tr')?.querySelector('input.charaName')?.value
    ).filter(Boolean);

      // choiceコマンドの生成
      const resultElem = getElement(DOM_SELECTORS.RESULT);
      if (resultElem) {
        const command = `choice${num}[${nameList.join(',')}]`;
        resultElem.value = command;

        // 履歴に追加（空でない場合のみ）
        if (command && nameList.length > 0) {
          addCommandToHistory(command);
        }
      }
    } catch (error) {
      console.error('choiceコマンドの作成中にエラーが発生しました:', error);
    }
  };

  /**
   * 生成したコマンドをクリップボードにコピーする
   * @description Clipboard APIを使用してテキストをコピーし、成功通知を表示
   */
  const copyToClipboard = () => {
    const resultElem = getElement(DOM_SELECTORS.RESULT);
    const copyMessageElem = getElement(DOM_SELECTORS.COPY_MESSAGE);

    if (!resultElem || !resultElem.value) {
      console.warn('コピーする内容がありません');
      return;
    }

    navigator.clipboard.writeText(resultElem.value)
      .then(() => {
        // コピー成功メッセージを表示
        if (copyMessageElem) {
        copyMessageElem.className = '';
        setTimeout(() => {
          copyMessageElem.className = 'hidden';
          }, COPY_MESSAGE_DURATION);
        }
      })
      .catch(error => {
        console.error('クリップボードへのコピーに失敗しました:', error);
        alert('コピーに失敗しました。ブラウザがクリップボードAPIに対応していない可能性があります。');
      });
  };

  // ================================================================================
  // choiceコマンド履歴管理機能
  // ================================================================================

  /**
   * choiceコマンド履歴を取得する
   * @returns {Array<{command: string, timestamp: number}>} 履歴の配列
   */
  const getCommandHistory = () => {
    try {
      const historyStr = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!historyStr) return [];

      const history = JSON.parse(historyStr);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('履歴の読み込み中にエラーが発生しました:', error);
      return [];
    }
  };

  /**
   * choiceコマンドを履歴に追加する
   * @param {string} command - 追加するchoiceコマンド
   */
  const addCommandToHistory = (command) => {
    try {
      if (!command || command.trim() === '') return;

      const history = getCommandHistory();

      // 同じコマンドが既に存在する場合は削除（重複を避ける）
      const filteredHistory = history.filter(item => item.command !== command);

      // 新しいコマンドを先頭に追加
      filteredHistory.unshift({
        command: command,
        timestamp: Date.now()
      });

      // 最大件数を超える場合は古いものを削除
      const limitedHistory = filteredHistory.slice(0, MAX_HISTORY_COUNT);

      // LocalStorageに保存
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));

      // 履歴表示を更新
      reloadCommandHistory();
    } catch (error) {
      console.error('履歴の追加中にエラーが発生しました:', error);
    }
  };

  /**
   * 履歴からコマンドを削除する
   * @param {number} timestamp - 削除する履歴のタイムスタンプ
   */
  const deleteCommandFromHistory = (timestamp) => {
    try {
      const history = getCommandHistory();
      const filteredHistory = history.filter(item => item.timestamp !== timestamp);

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
      reloadCommandHistory();
    } catch (error) {
      console.error('履歴の削除中にエラーが発生しました:', error);
    }
  };

  /**
   * 履歴を全てクリアする
   */
  const clearCommandHistory = () => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
      reloadCommandHistory();
    } catch (error) {
      console.error('履歴のクリア中にエラーが発生しました:', error);
    }
  };

  /**
   * 履歴表示を再描画する
   */
  const reloadCommandHistory = () => {
    try {
      const historyListElem = getElement(DOM_SELECTORS.HISTORY_LIST);
      if (!historyListElem) {
        console.error('履歴表示領域が見つかりません');
        return;
      }

      // 既存の履歴をクリア
      historyListElem.innerHTML = '';

      const history = getCommandHistory();

      if (history.length === 0) {
        historyListElem.innerHTML = '<div class="no-history">履歴はありません</div>';
        return;
      }

      const template = getElement(DOM_SELECTORS.HISTORY_ITEM_TEMPLATE);
      if (!template) {
        console.error('履歴テンプレートが見つかりません');
        return;
      }

      // 履歴を新しい順に表示
      history.forEach((item, index) => {
        const clone = template.content.cloneNode(true);

        // インデックスを設定
        const indexElem = clone.querySelector('.history-index');
        if (indexElem) {
          indexElem.textContent = `#${index + 1}`;
        }

        // 絶対時刻タイムスタンプを設定
        const absoluteTimestamp = clone.querySelector('.history-timestamp-absolute');
        if (absoluteTimestamp) {
          absoluteTimestamp.textContent = formatAbsoluteTimestamp(item.timestamp);
        }

        // 相対時刻タイムスタンプを設定
        const relativeTimestamp = clone.querySelector('.history-timestamp-relative');
        if (relativeTimestamp) {
          relativeTimestamp.textContent = formatRelativeTimestamp(item.timestamp);
        }

        // コピーボタンにデータ属性を設定
        const copyBtn = clone.querySelector('.history-copy-btn');
        if (copyBtn) {
          copyBtn.dataset.command = item.command;
        }

        // コマンドテキストを設定
        const commandText = clone.querySelector('.history-command');
        if (commandText) {
          commandText.textContent = item.command;
        }

        // 削除ボタンにデータ属性を設定
        const deleteBtn = clone.querySelector('.history-delete-btn');
        if (deleteBtn) {
          deleteBtn.dataset.timestamp = item.timestamp;
        }

        historyListElem.appendChild(clone);
      });
    } catch (error) {
      console.error('履歴の再描画中にエラーが発生しました:', error);
    }
  };

  /**
   * タイムスタンプを絶対時刻形式に変換する
   * @param {number} timestamp - ミリ秒単位のタイムスタンプ
   * @returns {string} フォーマット済み絶対時刻文字列 (YYYY/MM/DD HH:MM)
   */
  const formatAbsoluteTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  /**
   * タイムスタンプを相対時刻形式に変換する
   * @param {number} timestamp - ミリ秒単位のタイムスタンプ
   * @returns {string} フォーマット済み相対時刻文字列 (括弧付き)
   * @description たった今/n分前/n時間前など
   */
  const formatRelativeTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    // 1分以内
    if (diff < 60 * 1000) {
      return '(たった今)';
    }

    // 1時間以内
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `(${minutes}分前)`;
    }

    // 24時間以内
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `(${hours}時間前)`;
    }

    // それ以上
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `(${days}日前)`;
  };

  /**
   * 履歴からコマンドをコピーする
   * @param {string} command - コピーするコマンド
   */
  const copyCommandFromHistory = (command) => {
    if (!command) return;

    navigator.clipboard.writeText(command)
      .then(() => {
        const copyMessageElem = getElement(DOM_SELECTORS.COPY_MESSAGE);
        if (copyMessageElem) {
          copyMessageElem.className = '';
          setTimeout(() => {
            copyMessageElem.className = 'hidden';
          }, COPY_MESSAGE_DURATION);
        }
      })
      .catch(error => {
        console.error('クリップボードへのコピーに失敗しました:', error);
        alert('コピーに失敗しました。');
      });
  };

  /**
   * 履歴のタイムスタンプ表示のみを更新する
   * @description 全体を再描画せず、タイムスタンプのテキストのみを更新
   */
  const updateHistoryTimestamps = () => {
    try {
      const history = getCommandHistory();
      const historyItems = document.querySelectorAll('.history-item');

      historyItems.forEach((item, index) => {
        if (history[index]) {
          const relativeElem = item.querySelector('.history-timestamp-relative');
          if (relativeElem) {
            relativeElem.textContent = formatRelativeTimestamp(history[index].timestamp);
          }
        }
      });
    } catch (error) {
      console.error('タイムスタンプの更新中にエラーが発生しました:', error);
    }
  };

  /**
   * タイムスタンプの定期更新を開始する
   */
  const startTimestampUpdater = () => {
    // 既存のタイマーがあればクリア
    if (timestampUpdateTimer) {
      clearInterval(timestampUpdateTimer);
    }

    // 1分ごとにタイムスタンプを更新
    timestampUpdateTimer = setInterval(() => {
      const content = getElement(DOM_SELECTORS.HISTORY_CONTENT);
      // アコーディオンが開いている時のみ更新
      if (content && content.classList.contains('open')) {
        updateHistoryTimestamps();
      }
    }, TIMESTAMP_UPDATE_INTERVAL);
  };

  /**
   * タイムスタンプの定期更新を停止する
   */
  const stopTimestampUpdater = () => {
    if (timestampUpdateTimer) {
      clearInterval(timestampUpdateTimer);
      timestampUpdateTimer = null;
    }
  };

  /**
   * アコーディオンの開閉を切り替える
   */
  const toggleHistoryAccordion = () => {
    const toggle = getElement(DOM_SELECTORS.HISTORY_TOGGLE);
    const content = getElement(DOM_SELECTORS.HISTORY_CONTENT);

    if (!toggle || !content) return;

    const isOpen = content.classList.contains('open');

    if (isOpen) {
      content.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      // アコーディオンを閉じたらタイマー停止
      stopTimestampUpdater();
    } else {
      content.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      // アコーディオンを開いたらタイマー開始
      startTimestampUpdater();
    }
  };

  // ================================================================================
  // キャラクターデータの保存・管理機能
  // ================================================================================

  /**
   * キャラクターデータをLocalStorageに保存する
   * @description 同名のキャラクターがある場合は上書き保存
   */
  const saveCharacter = () => {
    try {
    const nameElem = getElement(DOM_SELECTORS.SAVING_CHARA_NAME);
    const groupElem = getElement(DOM_SELECTORS.SAVING_CHARA_GROUP);

      if (!nameElem || !groupElem) {
        console.error('入力欄が見つかりません');
        return;
      }

      const name = nameElem.value.trim();
      const group = groupElem.value.trim();

      // キャラクター名が空の場合は保存しない
      if (!name) {
        console.warn('キャラクター名が入力されていません');
        return;
      }

    const savedData = getSavedData();

      // 重複チェック: 同名のキャラクターがある場合は削除（上書き保存）
      const updatedData = savedData.filter(data =>
        data !== name && data?.name !== name
      );

      // 新しいデータを追加（orderは最大値+1）
      const maxOrder = updatedData.reduce((max, data) =>
        Math.max(max, data.order || 0), 0
      );
      updatedData.push({ name, group, order: maxOrder + 1 });

      // LocalStorageに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      // 入力欄をクリア
    nameElem.value = '';

      // 保存済みキャラクター一覧を再描画
    reloadSavedCharacters();
    } catch (error) {
      console.error('キャラクターの保存中にエラーが発生しました:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    }
  };

  /**
   * LocalStorageから保存されているキャラクターデータを取得する
   * @returns {Array<{name: string, group: string, order: number}>} 保存されているキャラクターデータの配列
   */
  const getSavedData = () => {
    try {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) return [];

      const parsedData = JSON.parse(dataStr);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      return [];
    }
  };

  /**
   * 保存済みキャラクターデータを再描画する
   * @description LocalStorageから取得したデータをグループ別にテーブル表示
   */
  const reloadSavedCharacters = () => {
    try {
    const listElem = getElement(DOM_SELECTORS.SAVED_CHARA_LIST);
      if (!listElem) {
        console.error('保存済みキャラクター一覧の表示領域が見つかりません');
        return;
      }

      // 既存の表示をクリア
    listElem.innerHTML = '';

    const savedData = getSavedData();
    if (!savedData.length) return;

      // 古い形式のデータを新形式に変換（後方互換性）
      const processedData = savedData.map((data, index) => {
        if (typeof data === "string" || data instanceof String) {
          // 旧形式: 文字列のみ
          return { name: data, group: "", order: index };
        } else if (!data.hasOwnProperty('order')) {
          // 中間形式: orderフィールドがない
          return { ...data, order: index };
        }
        return data;
      });

      // グループ名でソート、同じグループ内ではorder順
    processedData.sort((a, b) => {
        if (a.group === b.group) {
          return (a.order || 0) - (b.order || 0);
        }
      return a.group.localeCompare(b.group, 'ja');
    });

      // グループごとのテーブルマップを作成（DOM操作を最小化）
    const groupTables = {};

    for (const { name, group } of processedData) {
        // 新しいグループの場合、グループテーブルを作成
      if (!groupTables[group]) {
        const tableTemplate = getElement(DOM_SELECTORS.SAVED_CHARA_TABLE_TEMPLATE);
          if (!tableTemplate) continue;

        const clone = tableTemplate.content.cloneNode(true);
          const groupNameElem = clone.querySelector('.groupName');
          if (groupNameElem) {
            groupNameElem.textContent = group || '（未分類）';
          }
        listElem.appendChild(clone);

          // 追加したテーブルを取得してマップに保存
        const tables = getElements(`${DOM_SELECTORS.SAVED_CHARA_LIST} .groupTable`);
        groupTables[group] = tables[tables.length - 1];
      }

        // キャラクター行を追加
      const template = getElement(DOM_SELECTORS.SAVED_CHARA_TEMPLATE);
        if (!template) continue;

      const clone = template.content.cloneNode(true);
        const charaNameElem = clone.querySelector('.savedCharaName');
        if (charaNameElem) {
          charaNameElem.textContent = name;
        }

        const tbody = groupTables[group]?.querySelector('tbody');
        if (tbody) {
          tbody.appendChild(clone);

          // 追加した行にドラッグ&ドロップを設定
          const addedRow = tbody.lastElementChild;
          if (addedRow) {
            setupSavedCharaDragAndDrop(addedRow);
          }
        }
      }

      // グループヘッダーにドロップ機能を設定
      Object.values(groupTables).forEach(table => {
        const groupHeader = table.querySelector('.groupName');
        if (groupHeader) {
          setupGroupHeaderDrop(groupHeader);
        }
      });
    } catch (error) {
      console.error('キャラクター一覧の再描画中にエラーが発生しました:', error);
    }
  };

  /**
   * 選択された保存済みキャラクターをPLキャラクターテーブルに追加する
   * @description 空き行を優先使用し、不足分は新規行を作成
   */
  const addSelectedCharacters = () => {
    try {
      // 選択されているキャラクター名を取得
    const charaNames = Array.from(
      getElements(`${DOM_SELECTORS.SAVED_CHARA_LIST} tbody input[type=checkbox]:checked`),
        e => e.closest('tr')?.querySelector('.savedCharaName')?.textContent
      ).filter(Boolean);

      if (!charaNames.length) {
        console.warn('キャラクターが選択されていません');
        return;
      }

      // 既存の空き入力欄を取得
    const emptyInputs = Array.from(
      getElements(`${DOM_SELECTORS.PL_LIST_TABLE} tbody tr:not(.listNavi) input.charaName`)
    ).filter(input => input.value === '');

    const listNavi = getElement(`${DOM_SELECTORS.PL_LIST_TABLE} tbody tr.listNavi`);
    const plListTableBody = getElement(`${DOM_SELECTORS.PL_LIST_TABLE} tbody`);
    const template = getElement(DOM_SELECTORS.CHARA_TEMPLATE);

      if (!plListTableBody || !template) {
        console.error('必要なDOM要素が見つかりません');
        return;
      }

      // DocumentFragmentを使用してDOM操作を最小化
    const fragment = document.createDocumentFragment();
    let newRowsCount = 0;

    for (let i = 0; i < charaNames.length; i++) {
      const charaName = charaNames[i];

      if (i < emptyInputs.length) {
          // 既存の空き入力欄に設定
          emptyInputs[i].value = charaName;
      } else {
          // 新しい行を作成
        const clone = template.content.cloneNode(true);
          const nameInput = clone.querySelector('.charaName');
          if (nameInput) {
            nameInput.value = charaName;
          }
        fragment.appendChild(clone);
        newRowsCount++;
      }
    }

      // 新規行をDOMに追加
    if (newRowsCount > 0) {
      if (listNavi) {
        listNavi.before(fragment);
      } else {
        plListTableBody.appendChild(fragment);
      }

        // 新しく追加した行にドラッグ&ドロップを設定
        const addedRows = Array.from(
          plListTableBody.querySelectorAll('tr:not(.listNavi)')
        ).slice(-newRowsCount);
        addedRows.forEach(setupRowDragAndDrop);
      }
    } catch (error) {
      console.error('キャラクターの追加中にエラーが発生しました:', error);
    }
  };

  /**
   * 保存済みキャラクターを削除する
   * @param {Element} target - クリックされた削除ボタン要素
   */
  const deleteCharacter = (target) => {
    try {
      const row = target.closest('tr');
      if (!row) return;

      const charaName = row.querySelector('.savedCharaName')?.textContent;
      if (!charaName) {
        console.warn('削除対象のキャラクター名が見つかりません');
        return;
      }

    const savedData = getSavedData();

      // 該当キャラクターを除外したデータを作成
      const updatedData = savedData.filter(e =>
        e !== charaName && e?.name !== charaName
      );

      // LocalStorageを更新
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      // 一覧を再描画
    reloadSavedCharacters();
    } catch (error) {
      console.error('キャラクターの削除中にエラーが発生しました:', error);
    }
  };

  // ================================================================================
  // ドラッグ&ドロップ機能
  // ================================================================================

  /**
   * テーブル行にドラッグ&ドロップ機能を設定する
   * @param {HTMLTableRowElement} row - 設定対象の行要素
   */
  const setupRowDragAndDrop = (row) => {
    // listNavi行は除外
    if (row.classList.contains('listNavi')) return;

    const dragHandle = row.querySelector('.drag-handle');
    if (!dragHandle) return;

    // ドラッグハンドルのみでドラッグを開始
    dragHandle.addEventListener('mousedown', () => {
      row.draggable = true;
    });

    dragHandle.addEventListener('mouseup', () => {
      row.draggable = false;
    });

    // ドラッグ開始
    row.addEventListener('dragstart', (event) => {
      event.stopPropagation();
      row.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', ''); // Firefox対応
    });

    // ドラッグ終了
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      row.draggable = false;

      // 全てのプレースホルダーとdrag-overクラスを削除
      document.querySelectorAll('.drag-placeholder').forEach(el => el.remove());
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });

    // ドラッグオーバー
    row.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (row.classList.contains('listNavi')) return;

      const draggingRow = row.closest('tbody').querySelector('.dragging');
      if (!draggingRow || draggingRow === row) return;

      // ドラッグ中の行とターゲット行が同じテーブル内かチェック
      if (draggingRow.closest('tbody') !== row.closest('tbody')) return;

      // 既存のプレースホルダーを削除
      row.closest('tbody').querySelectorAll('.drag-placeholder').forEach(el => el.remove());

      // 新しいプレースホルダーを挿入
      const placeholder = document.createElement('tr');
      placeholder.className = 'drag-placeholder';
      const colspan = row.children.length;
      placeholder.innerHTML = `<td colspan="${colspan}"></td>`;

      // マウスの位置に基づいて挿入位置を決定
      const rect = row.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (event.clientY < midpoint) {
        row.before(placeholder);
      } else {
        row.after(placeholder);
      }
    });

    // ドロップ
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (row.classList.contains('listNavi')) return;

      const draggingRow = row.closest('tbody').querySelector('.dragging');
      if (!draggingRow || draggingRow === row) return;

      // 同じテーブル内のみ並び替え可能
      if (draggingRow.closest('tbody') !== row.closest('tbody')) return;

      // プレースホルダーの位置に行を移動
      const placeholder = row.closest('tbody').querySelector('.drag-placeholder');
      if (placeholder) {
        placeholder.replaceWith(draggingRow);
      } else {
        // プレースホルダーがない場合は従来の方法
        const tbody = row.closest('tbody');
        const allRows = Array.from(tbody.querySelectorAll('tr:not(.listNavi)'));
        const draggingIndex = allRows.indexOf(draggingRow);
        const targetIndex = allRows.indexOf(row);

        if (draggingIndex < targetIndex) {
          row.after(draggingRow);
        } else {
          row.before(draggingRow);
        }
      }
    });
  };

  /**
   * テーブル内の全ての行にドラッグ&ドロップを設定する
   * @param {string} tableSelector - テーブルのセレクタ
   */
  const setupTableDragAndDrop = (tableSelector) => {
    const table = getElement(tableSelector);
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr:not(.listNavi)');
    rows.forEach(setupRowDragAndDrop);
  };

  /**
   * 保存済みキャラクター行にドラッグ&ドロップ機能を設定する
   * @param {HTMLTableRowElement} row - 設定対象の行要素
   */
  const setupSavedCharaDragAndDrop = (row) => {
    const dragHandle = row.querySelector('.drag-handle');
    if (!dragHandle) return;

    // ドラッグハンドルのみでドラッグを開始
    dragHandle.addEventListener('mousedown', () => {
      row.draggable = true;
    });

    dragHandle.addEventListener('mouseup', () => {
      row.draggable = false;
    });

    // ドラッグ開始
    row.addEventListener('dragstart', (event) => {
      event.stopPropagation();
      row.classList.add('dragging');
      row.dataset.sourceGroup = row.closest('table').querySelector('.groupName').textContent;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', '');
    });

    // ドラッグ終了
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      row.draggable = false;
      delete row.dataset.sourceGroup;

      // 全てのプレースホルダーとdrag-overクラスを削除
      document.querySelectorAll('.drag-placeholder').forEach(el => el.remove());
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });

    // ドラッグオーバー
    row.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const draggingRow = document.querySelector('#savedCharaList .dragging');
      if (!draggingRow || draggingRow === row) return;

      // 同じグループ内の場合のみプレースホルダーを表示
      const draggingTable = draggingRow.closest('table');
      const targetTable = row.closest('table');

      if (draggingTable === targetTable) {
        // 既存のプレースホルダーを削除
        targetTable.querySelectorAll('.drag-placeholder').forEach(el => el.remove());

        // 新しいプレースホルダーを挿入
        const placeholder = document.createElement('tr');
        placeholder.className = 'drag-placeholder';
        const colspan = row.children.length;
        placeholder.innerHTML = `<td colspan="${colspan}"></td>`;

        // マウスの位置に基づいて挿入位置を決定
        const rect = row.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (event.clientY < midpoint) {
          row.before(placeholder);
        } else {
          row.after(placeholder);
        }
      }
    });

    // ドロップ
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const draggingRow = document.querySelector('#savedCharaList .dragging');
      if (!draggingRow || draggingRow === row) return;

      const sourceGroup = draggingRow.dataset.sourceGroup;
      const targetGroup = row.closest('table').querySelector('.groupName').textContent;
      const draggingName = draggingRow.querySelector('.savedCharaName').textContent;
      const targetName = row.querySelector('.savedCharaName').textContent;

      // プレースホルダーの位置に行を移動（同じグループ内の場合）
      const placeholder = row.closest('table').querySelector('.drag-placeholder');
      if (placeholder && sourceGroup === targetGroup) {
        // プレースホルダーを使用して移動
        const targetNameForOrder = placeholder.nextElementSibling?.querySelector('.savedCharaName')?.textContent ||
                                   placeholder.previousElementSibling?.querySelector('.savedCharaName')?.textContent;

        if (targetNameForOrder) {
          updateSavedCharacterOrder(draggingName, targetNameForOrder, sourceGroup, targetGroup);
        }
      } else {
        // データを更新（従来の方法）
        updateSavedCharacterOrder(draggingName, targetName, sourceGroup, targetGroup);
      }
    });
  };

  /**
   * グループヘッダーにドロップ機能を設定する（グループ間移動用）
   * @param {HTMLElement} groupHeader - グループヘッダー要素
   */
  const setupGroupHeaderDrop = (groupHeader) => {
    const headerRow = groupHeader.closest('tr');

    // ドラッグオーバー
    headerRow.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const draggingRow = document.querySelector('#savedCharaList .dragging');
      if (!draggingRow) return;

      headerRow.classList.add('drag-over');
    });

    // ドラッグリーブ
    headerRow.addEventListener('dragleave', () => {
      headerRow.classList.remove('drag-over');
    });

    // ドロップ
    headerRow.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const draggingRow = document.querySelector('#savedCharaList .dragging');
      if (!draggingRow) return;

      const sourceGroup = draggingRow.dataset.sourceGroup;
      const targetGroup = groupHeader.textContent;
      const draggingName = draggingRow.querySelector('.savedCharaName').textContent;

      // グループを変更（最後に追加）
      moveCharacterToGroup(draggingName, sourceGroup, targetGroup);

      headerRow.classList.remove('drag-over');
    });
  };

  /**
   * 保存済みキャラクターの並び順を更新する
   * @param {string} draggingName - ドラッグ中のキャラクター名
   * @param {string} targetName - ドロップ先のキャラクター名
   * @param {string} sourceGroup - 移動元のグループ名
   * @param {string} targetGroup - 移動先のグループ名
   */
  const updateSavedCharacterOrder = (draggingName, targetName, sourceGroup, targetGroup) => {
    try {
      const savedData = getSavedData();

      // 移動するキャラクターとターゲットキャラクターを検索
      const draggingIndex = savedData.findIndex(d => d.name === draggingName);
      const targetIndex = savedData.findIndex(d => d.name === targetName);

      if (draggingIndex === -1 || targetIndex === -1) return;

      const draggingChar = savedData[draggingIndex];

      // グループが異なる場合はグループを変更
      if (sourceGroup !== targetGroup) {
        draggingChar.group = targetGroup;
      }

      // 配列から削除
      savedData.splice(draggingIndex, 1);

      // 新しい位置に挿入
      const newTargetIndex = savedData.findIndex(d => d.name === targetName);
      savedData.splice(newTargetIndex, 0, draggingChar);

      // orderを再割り当て
      savedData.forEach((data, index) => {
        data.order = index;
      });

      // 保存して再描画
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
      reloadSavedCharacters();
    } catch (error) {
      console.error('並び順の更新中にエラーが発生しました:', error);
    }
  };

  /**
   * キャラクターを別のグループに移動する
   * @param {string} characterName - 移動するキャラクター名
   * @param {string} sourceGroup - 移動元のグループ名
   * @param {string} targetGroup - 移動先のグループ名
   */
  const moveCharacterToGroup = (characterName, sourceGroup, targetGroup) => {
    try {
      const savedData = getSavedData();

      const charIndex = savedData.findIndex(d => d.name === characterName);
      if (charIndex === -1) return;

      // グループを変更
      savedData[charIndex].group = targetGroup;

      // そのグループの最大orderを取得して設定
      const groupItems = savedData.filter(d => d.group === targetGroup);
      const maxOrder = groupItems.reduce((max, d) => Math.max(max, d.order || 0), 0);
      savedData[charIndex].order = maxOrder + 1;

      // 保存して再描画
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
      reloadSavedCharacters();
    } catch (error) {
      console.error('グループ移動中にエラーが発生しました:', error);
    }
  };

  // ================================================================================
  // イベント処理
  // ================================================================================

  /**
   * 全てのイベントリスナーを設定する
   * @description アプリケーション初期化時に一度だけ呼び出される
   */
  const setupEventListeners = () => {
    // choiceコマンド作成ボタン
    const createBtn = getElement(DOM_SELECTORS.CREATE_BUTTON);
    if (createBtn) {
      createBtn.addEventListener('click', createChoiceCommand);
    }

    // choiceコマンドコピーボタン
    const copyBtn = getElement(DOM_SELECTORS.COPY_BUTTON);
    if (copyBtn) {
      copyBtn.addEventListener('click', copyToClipboard);
    }

    // キャラ名保存ボタン
    const saveBtn = getElement(DOM_SELECTORS.SAVE_BUTTON);
    if (saveBtn) {
      saveBtn.addEventListener('click', saveCharacter);
    }

    // キャラ名追加ボタン
    const addNameBtn = getElement(DOM_SELECTORS.ADD_NAME);
    if (addNameBtn) {
      addNameBtn.addEventListener('click', addSelectedCharacters);
    }

    // Enterキーでの保存対応
    [DOM_SELECTORS.SAVING_CHARA_NAME, DOM_SELECTORS.SAVING_CHARA_GROUP].forEach(selector => {
      const elem = getElement(selector);
      if (elem) {
        elem.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
          saveCharacter();
        }
      });
      }
    });

    // 履歴アコーディオントグルボタン
    const historyToggle = getElement(DOM_SELECTORS.HISTORY_TOGGLE);
    if (historyToggle) {
      historyToggle.addEventListener('click', toggleHistoryAccordion);
    }

    // イベント委譲を使用（パフォーマンス向上）
    document.body.addEventListener('click', handleBodyClick);
    document.body.addEventListener('change', handleBodyChange);

    // ドラッグ&ドロップの初期設定
    setupTableDragAndDrop(DOM_SELECTORS.PL_LIST_TABLE);
    setupTableDragAndDrop(DOM_SELECTORS.OTHER_TABLE);
  };

  /**
   * body要素のクリックイベントハンドラ（イベント委譲パターン）
   * @param {Event} event - クリックイベント
   * @description 複数の要素のクリックイベントを一元管理してパフォーマンスを向上
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

    // 履歴関連の処理
    if (handleHistoryClick(target)) return;
  };

  /**
   * チェックボックス関連のクリックイベント処理
   * @param {Element} target - クリックされた要素
   * @returns {boolean} イベントが処理された場合はtrue
   */
  const handleCheckboxClick = (target) => {
    // テーブルヘッダーのチェックボックスセルをクリック
    if (target.matches('.tableCheck')) {
      const checkbox = target.querySelector('input[type=checkbox]');
      if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }

    // チェックボックス自体を直接クリック（イベントの伝播を停止）
    if (target.matches('.tableCheck input[type=checkbox]')) {
      event.stopPropagation();
      return true;
    }

    // キャラクターチェックボックスのセルをクリック
    if (target.matches('.charaCheck')) {
      const checkbox = target.querySelector('input[type=checkbox]');
      if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }

    // グループ名をクリック（そのグループの全選択チェックボックスをトグル）
    if (target.matches('.groupName')) {
      const row = target.closest('tr');
      if (row) {
        const checkbox = row.querySelector('.tableCheck input[type=checkbox]');
        if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      return true;
    }

    // 保存済みキャラクター名をクリック（そのキャラクターをトグル選択）
    if (target.matches('.savedCharaName')) {
      const row = target.closest('tr');
      if (row) {
        const checkbox = row.querySelector('.charaCheck input[type=checkbox]');
        if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      return true;
    }

    return false;
  };

  /**
   * ボタン関連のクリックイベント処理
   * @param {Element} target - クリックされた要素
   * @returns {boolean} イベントが処理された場合はtrue
   */
  const handleButtonClick = (target) => {
      // プラスボタン：新しい行を追加
    if (target.matches('.place')) {
      const table = target.closest('table');
      if (!table) return false;

      const listNavi = table.querySelector('tbody tr.listNavi');
      const template = getElement(DOM_SELECTORS.CHARA_TEMPLATE);
      if (!template) return false;

      const clone = template.content.cloneNode(true);
      const tbody = table.querySelector('tbody');

      if (listNavi) {
        listNavi.before(clone);
      } else if (tbody) {
        tbody.append(clone);
      }

      // 新しく追加した行にドラッグ&ドロップを設定
      const newRow = listNavi ? listNavi.previousElementSibling : tbody.lastElementChild;
      if (newRow) {
        setupRowDragAndDrop(newRow);
      }

      return true;
    }

    // マイナスボタン：最後の行を削除
    if (target.matches('.minus')) {
      const table = target.closest('table');
      if (!table) return false;

      const listNavi = table.querySelector('tbody tr.listNavi');
      listNavi?.previousElementSibling?.remove();
      return true;
    }

    // 名称全削除ボタン：テーブル内の全入力欄をクリア
    if (target.matches('.nameDel')) {
      const table = target.closest('table');
      if (!table) return false;

      table.querySelectorAll('.charaName')?.forEach(input => {
        input.value = '';
      });
      return true;
    }

    return false;
  };

  /**
   * 保存キャラ名関連のクリックイベント処理
   * @param {Element} target - クリックされた要素
   * @returns {boolean} イベントが処理された場合はtrue
   */
  const handleSavedCharaClick = (target) => {
    // 削除ボタン（アイコン）をクリック
    if (target.matches('.delName') || target.closest('td')?.matches('.delName')) {
      deleteCharacter(target);
      return true;
    }

    return false;
  };

  /**
   * 履歴関連のクリックイベント処理
   * @param {Element} target - クリックされた要素
   * @returns {boolean} イベントが処理された場合はtrue
   */
  const handleHistoryClick = (target) => {
    // 履歴のコピーボタン
    if (target.matches('.history-copy-btn') || target.closest('.history-copy-btn')) {
      const btn = target.matches('.history-copy-btn') ? target : target.closest('.history-copy-btn');
      const command = btn?.dataset.command;
      if (command) {
        copyCommandFromHistory(command);
      }
      return true;
    }

    // 履歴の削除ボタン
    if (target.matches('.history-delete-btn') || target.closest('.history-delete-btn')) {
      const btn = target.matches('.history-delete-btn') ? target : target.closest('.history-delete-btn');
      const timestamp = btn?.dataset.timestamp;
      if (timestamp) {
        deleteCommandFromHistory(Number(timestamp));
      }
      return true;
    }

    // 履歴全削除ボタン
    if (target.matches('.history-clear-all') || target.closest('.history-clear-all')) {
      if (confirm('履歴を全て削除しますか？')) {
        clearCommandHistory();
      }
      return true;
    }

    return false;
  };

  /**
   * body要素のchangeイベントハンドラ（イベント委譲パターン）
   * @param {Event} event - changeイベント
   * @description ヘッダーチェックボックスの変更時にテーブル全体のチェック状態を同期
   */
  const handleBodyChange = (event) => {
    if (!event.target) return;

    const target = event.target;

    // テーブルヘッダーのチェックボックスが変更された場合
    if (target.matches('.tableCheck input[type=checkbox]')) {
      const isChecked = target.checked;
      const table = target.closest('table');

      if (table) {
        // テーブル内の全てのキャラクターチェックボックスを同期
        table.querySelectorAll('.charaCheck input[type=checkbox]').forEach(checkbox => {
          checkbox.checked = isChecked;
        });
      }
    }
  };

  // ================================================================================
  // アプリケーション初期化
  // ================================================================================

  /**
   * アプリケーションを初期化する
   * @description DOMContentLoadedイベント発火後に実行される
   */
  const init = () => {
    setupEventListeners();
    reloadSavedCharacters();
    reloadCommandHistory();

    // ページを閉じる時にタイマーをクリーンアップ
    window.addEventListener('beforeunload', () => {
      stopTimestampUpdater();
    });
  };

  // 初期化実行
  init();
})();
