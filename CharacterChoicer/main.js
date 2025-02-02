(() => {
  // choiceコマンド作成ボタン
  document.querySelector('#create').addEventListener('click', event => {
    let num = document.querySelector('#choiceNum').value;
    num = parseInt(num);
    num = num && num > 1 ? num : '';
    let nameList = Array.from(document.querySelectorAll('#PLListTable .charaCheck input[type=checkbox]:checked, #OtherTable .charaCheck input[type=checkbox]:checked'), e => e.closest('tr')?.querySelector('input.charaName').value).filter(e => e);
    document.querySelector('#result').value = `choice${num}[${nameList.join(',')}]`;
  });

  // choiceコマンドコピーボタン
  document.querySelector('#copy').addEventListener('click', event => {
    navigator.clipboard.writeText(document.querySelector('#result').value)
      .then(r => {
        document.querySelector('#copyMessage').className = '';
        setTimeout(() => {
          document.querySelector('#copyMessage').className = 'hidden';
        },
          1000);
      });
  });

  const savedKey = 'savedCharaData';

  /**
   * 保存しているキャラデータの再描画
   */
  const reload = () => {
    {
      // 保存しているデータの表示を一旦削除
      const list = document.querySelector('#savedCharaList');
      const clone = list.cloneNode(false);
      list.parentNode.replaceChild(clone, list);
    }
    const list = document.querySelector('#savedCharaList');
    const dataStr = localStorage.getItem(savedKey);
    if (dataStr) {
      const dataList = JSON.parse(dataStr);
      // 古いデータに対する互換性をもたせるため、古いデータを変換する
      let result = dataList.map(data => (typeof data === "string" || data instanceof String) ? { name: data, group: "" } : data);
      result.sort((a, b) => {
        if (a.group === b.group) {
          return 0;
        } else {
          return a.group.localeCompare(b.group, 'ja');
        }
      });

      for (const { name, group } of result) {
        let table = Array.from(document.querySelectorAll('#savedCharaList .groupTable'))?.filter(e => e.querySelector('.groupName').textContent === group);
        if (table.length < 1) {
          // グループのテーブルが存在しないため、グループテーブルを追加
          const tableTemplate = document.querySelector('#savedCharaTableTemplate');
          const clone = tableTemplate.content.cloneNode(true);
          clone.querySelector('.groupName').textContent = group;
          list.appendChild(clone);
          table = Array.from(document.querySelectorAll('#savedCharaList .groupTable'))?.filter(e => e.querySelector('.groupName').textContent === group);
        }
        {
          // 対象グループのテーブルに行追加
          const template = document.querySelector('#savedCharaTemplate');
          const clone = template.content.cloneNode(true);
          clone.querySelector('.savedCharaName').textContent = name;
          table[0].querySelector('tbody').appendChild(clone);
        }
      }
    }
  }

  // キャラ名保存ボタン
  document.querySelector('#save').addEventListener('click', event => {
    const name = document.querySelector('#savingCharaName').value || "";
    const group = document.querySelector('#savingCharaGroup').value || "";
    if (name) {
      let dataStr = localStorage.getItem(savedKey);
      if (!dataStr) {
        // 初めてのため、初期化
        dataStr = '[]';
      }
      const dataList = JSON.parse(dataStr);
      // データの更新(対象データが存在しないリストにする→値の追加)
      let result = dataList.filter(data => data !== name && data?.name !== name);
      result.push({ name: name, group: group });
      localStorage.setItem(savedKey, JSON.stringify(result));
      document.querySelector('#savingCharaName').value = '';
      reload();
    }
  });

  // キャラ名保存ボタン(エンターキー対応)
  document.querySelectorAll('#savingCharaName,#savingCharaGroup').forEach(e => {
    e.addEventListener('keydown', event => {
      if (event.keyCode === 13) {
        // エンターキーが押された場合は保存ボタンと同様の動作をする
        document.querySelector('#save').dispatchEvent(new Event('click'));
      }
    });
  });


  // イベント移譲系の処理登録(clickイベント)
  document.querySelector('body').addEventListener('click', event => {
    if (!event.target) {
      return;
    }
    const target = event.target;
    if (target.matches('.tableCheck')) {
      // テーブル全体チェックボックスのセルをクリックした場合に、内部のチェックボックスの値を変更する
      const checkbox = target.querySelector('input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    } else if (target.matches('.tableCheck input[type=checkbox]')) {
      // チェックボックスを直接クリックした場合は親要素へのイベントの伝播を止める
      event.stopPropagation();
      return;
    } else if (target.matches('.charaCheck')) {
      // セル内をクリックした場合にも内部のチェックボックスの値を変更する
      const checkbox = target.querySelector('input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    } else if (target.matches('.place')) {
      // プラスボタン
      const listNavi = target.closest('table').querySelector('tbody tr.listNavi');
      // 新しい行を複製して表に挿入します。
      const template = document.querySelector('#charaTemplate');
      const clone = template.content.cloneNode(true);
      if (listNavi) {
        listNavi.before(clone);
      } else {
        target.closest('table').querySelector('tbody').append(clone);
      }
      return;
    } else if (target.matches('.minus')) {
      // マイナスボタン
      const listNavi = target.closest('table').querySelector('tbody tr.listNavi');
      listNavi.previousElementSibling?.remove();
      return;
    } else if (target.matches('.nameDel')) {
      // 名称全削除ボタン
      target.closest('table').querySelectorAll('.charaName')?.forEach(elm => elm.value = '');
      return;
    } else if (target.matches('.groupName')) {
      // グループ名をクリックするとテーブルの全選択チェックボックスを変動させる
      const checkbox = target.closest('tr').querySelector('.tableCheck input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (target.matches('.savedCharaName')) {
      // 保存したキャラ名をクリックすると選択のチェックボックスを変動させる
      const checkbox = target.closest('tr').querySelector('.charaCheck input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (target.matches('#addName')) {
      // 保存したキャラ名追加
      const charaNames = Array.from(document.querySelectorAll('#savedCharaList tbody input[type=checkbox]:checked'), e => e.closest('tr').querySelector('.savedCharaName').textContent);
      {
        // 既存行に追加できるかどうかを確認
        const list = Array.from(document.querySelectorAll('#PLListTable tbody tr:not(.listNavi) input.charaName')).reverse();
        let index = -1;
        for (const row of list) {
          if (row.value === '') {
            index++;
          } else {
            break;
          }
        }
        const listNavi = document.querySelector('#PLListTable tbody tr.listNavi');
        for (const charaName of charaNames) {
          if (index < 0) {
            // 最終行が埋まっている -> 新規行の追加
            const template = document.querySelector('#charaTemplate');
            const clone = template.content.cloneNode(true);
            clone.querySelector('.charaName').value = charaName || '';
            if (listNavi) {
              listNavi.before(clone);
            } else {
              document.querySelector('#PLListTable tbody').append(clone);
            }
          } else {
            // 開いている行がある -> 該当行に追加
            list[index--].value = charaName || '';
          }
        }
      }
      return;
    } else if (target.matches('.delName') || target.closest('td')?.matches('.delName')) {
      // 保存したキャラ名削除
      const charaName = target.closest('tr').querySelector('.savedCharaName')?.textContent;
      if (charaName) {
        let dataStr = localStorage.getItem(savedKey);
        if (!dataStr) {
          // 初めてのため、初期化
          dataStr = '[]';
        }
        let data = JSON.parse(dataStr);
        data = data.filter(e => e !== charaName && e?.name !== charaName);
        localStorage.setItem(savedKey, JSON.stringify(data));
        reload();
      }
      return;
    }
  });

  // イベント移譲系の処理登録(changeイベント)
  document.querySelector('body').addEventListener('change', event => {
    if (!event.target) {
      return;
    }
    const target = event.target;
    if (target.matches('.tableCheck input[type=checkbox]')) {
      // チェックボックスの値が変更された場合はテーブル全体を変更する
      const isChecked = target.checked;
      const table = target.closest('table');
      table.querySelectorAll('.charaCheck input[type=checkbox]').forEach(c => {
        c.checked = isChecked;
      });
    }
  });

  reload();
})();
