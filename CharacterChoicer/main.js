(() => {
  // choiceコマンド作成ボタン
  document.querySelector('#create').addEventListener('click', event => {
    let num = document.querySelector('#choiceNum').value;
    num = parseInt(num);
    num = num && num > 1 ? num : '';
    let nameList = Array.from(document.querySelectorAll('.charaCheck input[type=checkbox]:checked'), e => e.closest('tr')?.querySelector('input.charaName').value).filter(e => e);
    document.querySelector('#result').value = `choice${num}[${nameList.join(',')}]`;
  });

  // テーブル全体チェックボックスのセルをクリックした場合に、内部のチェックボックスの値を変更する
  document.querySelectorAll('.tableCheck').forEach(e => {
    e.addEventListener('click', event => {
      const checkbox = event.currentTarget.querySelector('input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    });
  });

  // テーブル全体チェックボックスの値が変更された場合の動作
  document.querySelectorAll('.tableCheck input[type=checkbox]').forEach(e => {
    e.addEventListener('click', event => {
      // チェックボックスを直接クリックした場合は親要素へのイベントの伝播を止める
      event.stopPropagation();
    });
    // チェックボックスの値が変更された場合はテーブル全体を変更する
    e.addEventListener('change', event => {
      const isChecked = event.currentTarget.checked;
      const table = event.currentTarget.closest('table');
      table.querySelectorAll('.charaCheck input[type=checkbox]').forEach(c => {
        c.checked = isChecked;
      });
    });
  });

  // セル内をクリックした場合にも内部のチェックボックスの値を変更する
  document.querySelectorAll('.charaCheck').forEach(e => {
    e.addEventListener('click', event => {
      const checkbox = event.currentTarget.querySelector('input[type=checkbox]');
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    });
    e.querySelector('input[type=checkbox]').addEventListener('click', event => {
      event.stopPropagation();
    });
  });

  // プラスボタン
  document.querySelectorAll('.place').forEach(e => {
    e.addEventListener('click', event => {
      const listNavi = event.currentTarget.closest('table').querySelector('tbody tr.listNavi');
      // 新しい行を複製して表に挿入します。
      const template = document.querySelector('#charaTemplate');
      const clone = template.content.cloneNode(true);
      if (listNavi) {
        listNavi.before(clone);
      } else {
        event.currentTarget.closest('table').querySelector('tbody').append(clone);
      }
    });
  });

  // マイナスボタン
  document.querySelectorAll('.minus').forEach(e => {
    e.addEventListener('click', event => {
      // 最後の行を削除します。
      const listNavi = event.currentTarget.closest('table').querySelector('tbody tr.listNavi');
      listNavi.previousElementSibling?.remove();
    });
  });

  // 名称全削除ボタン
  document.querySelectorAll('.nameDel').forEach(e => {
    e.addEventListener('click', event => {
      event.currentTarget.closest('table').querySelectorAll('.charaName')?.forEach(elm => elm.value = '');
    });
  });
})();
