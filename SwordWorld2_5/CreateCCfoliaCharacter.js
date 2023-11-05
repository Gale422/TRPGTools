(() => {
  const addStatus = (label = '', value = 0, max = 0) => {
    return { label, value, max };
  };
  const addParams = (label = '', value = 0) => {
    return { label, value };
  };
  const url = new URL(location.href);
  url.searchParams.set('mode', 'json');
  fetch(url.toString(), {
    method: 'GET'
  })
    .then(response => response.json())
    .then(json => {
      let chara = {
        kind: "character", data: {
          name: '',
          memo: '',
          initiative: 2,
          externalUrl: '',
          status: [],
          params: [],
          faces: [],
          x: 0,
          y: 0,
          angle: 0,
          width: 4,
          height: 4,
          active: true,
          secret: false,
          invisible: false,
          hideStatus: false,
          color: '',
          commands: '',
        }
      };

      chara.data.name = json.characterName;
      chara.data.memo = `PL: ${json.playerName}\n${json.sheetDescriptionM.replaceAll(/[　／]/g, '\n')}`;
      chara.data.externalUrl = document.location.href;
      chara.data.status.push(addStatus('HP', parseInt(json.hpTotal), parseInt(json.hpTotal)));
      chara.data.status.push(addStatus('MP', parseInt(json.mpTotal), parseInt(json.mpTotal)));
      chara.data.status.push(addStatus('防護点', parseInt(json.armourNum), parseInt(json.armourNum)));
      if (document.querySelector('#fairycontact')) {
        chara.data.status.push(addStatus(Array.from(document.querySelectorAll('#fairycontact > *'), e => e.textContent).join(','), 0, 0));
      }
      if (json.cardRedB) {
        chara.data.status.push(addStatus('赤B', parseInt(json.cardRedB), parseInt(json.cardRedB)));
      }
      if (json.cardRedA) {
        chara.data.status.push(addStatus('赤A', parseInt(json.cardRedA), parseInt(json.cardRedA)));
      }
      if (json.cardRedS) {
        chara.data.status.push(addStatus('赤S', parseInt(json.cardRedS), parseInt(json.cardRedS)));
      }
      if (json.cardRedSS) {
        chara.data.status.push(addStatus('赤SS', parseInt(json.cardRedSS), parseInt(json.cardRedSS)));
      }
      if (json.cardGreB) {
        chara.data.status.push(addStatus('緑B', parseInt(json.cardGreB), parseInt(json.cardGreB)));
      }
      if (json.cardGreA) {
        chara.data.status.push(addStatus('緑A', parseInt(json.cardGreA), parseInt(json.cardGreA)));
      }
      if (json.cardGreS) {
        chara.data.status.push(addStatus('緑S', parseInt(json.cardGreS), parseInt(json.cardGreS)));
      }
      if (json.cardGreSS) {
        chara.data.status.push(addStatus('緑SS', parseInt(json.cardGreSS), parseInt(json.cardGreSS)));
      }
      if (json.cardBlaB) {
        chara.data.status.push(addStatus('黒B', parseInt(json.cardBlaB), parseInt(json.cardBlaB)));
      }
      if (json.cardBlaA) {
        chara.data.status.push(addStatus('黒A', parseInt(json.cardBlaA), parseInt(json.cardBlaA)));
      }
      if (json.cardBlaS) {
        chara.data.status.push(addStatus('黒S', parseInt(json.cardBlaS), parseInt(json.cardBlaS)));
      }
      if (json.cardBlaSS) {
        chara.data.status.push(addStatus('黒SS', parseInt(json.cardBlaSS), parseInt(json.cardBlaSS)));
      }
      if (json.cardWhiB) {
        chara.data.status.push(addStatus('白B', parseInt(json.cardWhiB), parseInt(json.cardWhiB)));
      }
      if (json.cardWhiA) {
        chara.data.status.push(addStatus('白A', parseInt(json.cardWhiA), parseInt(json.cardWhiA)));
      }
      if (json.cardWhiS) {
        chara.data.status.push(addStatus('白S', parseInt(json.cardWhiS), parseInt(json.cardWhiS)));
      }
      if (json.cardWhiSS) {
        chara.data.status.push(addStatus('白SS', parseInt(json.cardWhiSS), parseInt(json.cardWhiSS)));
      }
      if (json.cardGolB) {
        chara.data.status.push(addStatus('金B', parseInt(json.cardGolB), parseInt(json.cardGolB)));
      }
      if (json.cardGolA) {
        chara.data.status.push(addStatus('金A', parseInt(json.cardGolA), parseInt(json.cardGolA)));
      }
      if (json.cardGolS) {
        chara.data.status.push(addStatus('金S', parseInt(json.cardGolS), parseInt(json.cardGolS)));
      }
      if (json.cardGolSS) {
        chara.data.status.push(addStatus('金SS', parseInt(json.cardGolSS), parseInt(json.cardGolSS)));
      }
      if (json.craftGeomancy1) {
        chara.data.status.push(addStatus('天相', 0, 4));
        chara.data.status.push(addStatus('地相', 0, 4));
        chara.data.status.push(addStatus('人相', 0, 4));
      }
      if (json.craftCommand1) {
        chara.data.status.push(addStatus('陣気', 0, 20));
      }
      if (json.craftSong1) {
        chara.data.status.push(addStatus('高揚', 0, 20));
        chara.data.status.push(addStatus('鎮静', 0, 20));
        chara.data.status.push(addStatus('魅惑', 0, 20));
      }
      chara.data.status.push(addStatus('命中修正', 0, 0));
      chara.data.status.push(addStatus('ダメージ修正', 0, 0));
      chara.data.status.push(addStatus('C値修正', 0, 0));
      chara.data.status.push(addStatus('ファンブル', 0, 0));
      // パラメータ
      // 魔力修正
      // 行使修正
      // 魔法C
      // 魔法D修正
      // 生命抵抗修正
      // 精神抵抗修正
      // 回避修正
      // 器用度
      // 敏捷度
      // 筋力
      // 生命力
      // 知力
      // 精神力
      // 冒険者レベル
      //

      chara.data.params.push(addParams('器用度', parseInt(json.sttDex)));
      chara.data.params.push(addParams('敏捷度', parseInt(json.sttAgi)));
      chara.data.params.push(addParams('筋力', parseInt(json.sttStr)));
      chara.data.params.push(addParams('生命力', parseInt(json.sttVit)));
      chara.data.params.push(addParams('知力', parseInt(json.sttInt)));
      chara.data.params.push(addParams('精神力', parseInt(json.sttMnd)));
      chara.data.params.push(addParams('器用度B', parseInt(json.bonusDex)));
      chara.data.params.push(addParams('敏捷度B', parseInt(json.bonusAgi)));
      chara.data.params.push(addParams('筋力B', parseInt(json.bonusStr)));
      chara.data.params.push(addParams('生命力B', parseInt(json.bonusVit)));
      chara.data.params.push(addParams('知力B', parseInt(json.bonusInt)));
      chara.data.params.push(addParams('精神力B', parseInt(json.bonusMnd)));
      chara.data.params.push(addParams('冒険者レベル', parseInt(json.level)));
      chara.data.params.push(addParams('生命抵抗力', parseInt(json.vitResistTotal)));
      chara.data.params.push(addParams('精神抵抗力', parseInt(json.mndResistTotal)));
      let desps = json.sheetDescriptionS.split('\n');
      if (desps.length > 1) {
        let jobs = desps[1].replace('技能:', '').split('／').map(e => {
          return {
            "label": e.replaceAll('\d', ''),
            "value": parseInt(e.replaceAll('\D', ''))
          }
        });
        for (const job of jobs) {
          chara.data.params.push(addParams(job.label, job.value));
        }
      }


      chara.data.params.push(addParams('回避修正', parseInt(json)));
      let commands = '';
      commands += `### ■非戦闘系\n`;
      commands += `2D6\n`;
      commands += `2D6+0+0>=0 冒険者+器用\n`;
      commands += `2D6+0+0>=0 冒険者+敏捷\n`;
      commands += `2D6+0+0>=0 冒険者+筋力\n`;
      commands += `2D6+0+0>=0 冒険者+生命\n`;
      commands += `2D6+0+0>=0 冒険者+知力\n`;
      commands += `2D6+0+0>=0 冒険者+精神\n`;
      commands += `\n`;
      commands += `### ■戦闘系\n`;
      commands += `:命中修正=0 リセット\n`;
      commands += `:ダメージ修正=0 リセット\n`;
      commands += `:C値修正=0 リセット\n`;
      commands += `:ファンブル+1\n`;
      if (json.cardRedB) {
        commands += `:赤B-1\n`;
      }
      if (json.cardRedA) {
        commands += `:赤A-1\n`;
      }
      if (json.cardRedS) {
        commands += `:赤S-1\n`;
      }
      if (json.cardRedSS) {
        commands += `:赤SS-1\n`;
      }
      if (json.cardGreB) {
        commands += `:緑B-1\n`;
      }
      if (json.cardGreA) {
        commands += `:緑A-1\n`;
      }
      if (json.cardGreS) {
        commands += `:緑S-1\n`;
      }
      if (json.cardGreSS) {
        commands += `:緑SS-1\n`;
      }
      if (json.cardBlaB) {
        commands += `:黒B-1\n`;
      }
      if (json.cardBlaA) {
        commands += `:黒A-1\n`;
      }
      if (json.cardBlaS) {
        commands += `:黒S-1\n`;
      }
      if (json.cardBlaSS) {
        commands += `:黒SS-1\n`;
      }
      if (json.cardWhiB) {
        commands += `:白B-1\n`;
      }
      if (json.cardWhiA) {
        commands += `:白A-1\n`;
      }
      if (json.cardWhiS) {
        commands += `:白S-1\n`;
      }
      if (json.cardWhiSS) {
        commands += `:白SS-1\n`;
      }
      if (json.cardGolB) {
        commands += `:金B-1\n`;
      }
      if (json.cardGolA) {
        commands += `:金A-1\n`;
      }
      if (json.cardGolS) {
        commands += `:金S-1\n`;
      }
      if (json.cardGolSS) {
        commands += `:金SS-1\n`;
      }
      if (json.craftGeomancy1) {
        commands += `:天相+1\n`;
        commands += `:地相+1\n`;
        commands += `:人相+1\n`;
        commands += `:天相-1\n`;
        commands += `:地相-1\n`;
        commands += `:人相-1\n`;
      }
      if (json.craftCommand1) {
        commands += `:陣気+1\n`;
        commands += `:陣気-1\n`;
      }
      if (json.craftSong1) {
        commands += `:高揚+1\n`;
        commands += `:鎮静+1\n`;
        commands += `:魅惑+1\n`;
        commands += `:高揚-1\n`;
        commands += `:鎮静-1\n`;
        commands += `:魅惑-1\n`;
      }
      commands += `\n`;
      commands += `### ■魔法系\n`;
      commands += `\n`;
      commands += `### ■物理系\n`;
      commands += `\n`;
      commands += `### ■抵抗回避\n`;
      commands += `\n`;
      commands += `### ■能力値\n`;
      commands += `\n`;
      commands += `### ■代入パラメータ\n`;
      commands += `\n`;
      chara.data.commands = commands;
      console.log(JSON.stringify(chara));
      // navigator.clipboard.writeText(JSON.stringify(chara));
    });
})()
