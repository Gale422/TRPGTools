javascript: (() => {
  /* サイト検証 */
  const validateSite = () => {
    const url = new URL(window.location.href);
    if (url.hostname !== '[対象サイトのホスト名]') {
      alert('このブックマークレットは[対象サイト名]でのみ使用できます。');
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
      elem.textContent = value;
      return elem;
    },

    createDataElement: (attrs, value = '') => {
      return xml.createElement('data', attrs, value);
    },

    createCharacterData: (charaName, detailList = []) => {
      /* キャラクターデータを生成 */
    },

    createChatPalette: (diceBotName, chatPalette) => {
      /* チャットパレットを生成 */
    },

    createBuffPalette: (diceBotName, buffPalette) => {
      /* バフパレットを生成 */
    }
  };

  /* ZIPファイル作成とダウンロード */
  const createZipFile = (fileName, charaData, chatPaletteData, buffPaletteData) => {
    /* ZIPファイルを作成してダウンロード */
  };

  /* システム固有のデータ生成関数 */
  const createDetailElements = () => {
    /* システム固有の詳細データ要素を生成 */
  };

  const generateChatPaletteText = () => {
    /* システム固有のチャットパレットテキストを生成 */
  };

  /* メイン処理 */
  const main = async () => {
    try {
      /* サイト検証 */
      if (!validateSite() || !validateBrowser()) return;

      /* ライブラリ読み込み */
      await loadLibraries([
        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
      ]);

      /* キャラクターデータチェック */
      if (!validateCharacterSheet()) return;

      /* データ生成 */
      const [charaName, detailElements] = createDetailElements();

      /* キャラクターXML等の生成 */
      const characterData = xml.createCharacterData(charaName, detailElements);
      const chatPaletteData = xml.createChatPalette('[ダイスボット名]', generateChatPaletteText());
      const buffPaletteData = xml.createBuffPalette('[ダイスボット名]', '');

      /* ZIPファイル作成 */
      createZipFile(charaName, characterData, chatPaletteData, buffPaletteData);
    } catch (error) {
      console.error('エラーが発生しました:', error);
      alert(`処理中にエラーが発生しました: ${error.message}`);
    }
  };

  /* メイン処理実行 */
  main();
})();
