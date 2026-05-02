// ====== データ定義 ======

// レアリティ・ランク
const WeaponRank = ["common", "B", "A", "S", "SSS", "X"];

// 武器テンプレ
const weapons = [
  // 拳はランクなし（素手扱い）
  {
    id: "fist",
    name: "拳",
    type: "拳",
    rank: null,
    base: { range: "周囲1m", atkSpeed: 0.2 },
    effect: "0.5mノックバック",
    skills: [
      { name: "パンチ", desc: "3mノックバック", ct: 3 },
      { name: "キック", desc: "0.7秒行動不能＋打ち上げ", ct: 7 },
      {
        name: "パンチラッシュ",
        desc: "行動不能＋通常5回＋1mノックバック",
        ct: 15
      }
    ]
  },

  // 剣（ランク別補正）
  {
    id: "sword",
    name: "剣",
    type: "剣",
    rank: "A", // 表示用の例
    base: { range: "前方1.5m（左右80°）", atkSpeed: 0.4 },
    effect: "防御値5%減少",
    skills: [
      {
        name: "振り下ろし",
        desc: "防御貫通150ダメ＋0.3秒行動不能",
        ct: 6
      },
      {
        name: "剣雨",
        desc: "周囲3体分に剣10本（1本40ダメ）",
        ct: 9
      },
      {
        name: "剣山",
        desc: "行動不能＋打ち上げ＋通常3回＋2mノックバック",
        ct: 10
      }
    ]
  },

  // 槍
  {
    id: "spear",
    name: "槍",
    type: "槍",
    rank: "A",
    base: { range: "前方3m（左右10°）", atkSpeed: 0.3 },
    effect: "1mノックバック",
    skills: [
      { name: "ノックバック棒", desc: "5mノックバック", ct: 8 },
      {
        name: "炎槍",
        desc: "直線10m移動＋炎上（30/秒×10秒）",
        ct: 6
      },
      {
        name: "矛盾",
        desc: "0.2秒自分行動不能＋半径10体分を引き寄せ",
        ct: 9
      }
    ]
  },

  // 斧
  {
    id: "axe",
    name: "斧",
    type: "斧",
    rank: "A",
    base: { range: "前方2m（左右60°）", atkSpeed: 0.6 },
    effect: "0.7mノックバック",
    skills: [
      {
        name: "スタン",
        desc: "周囲5体分の敵を1秒行動不能",
        ct: 6
      },
      {
        name: "ステータスUP",
        desc: "10秒間 移動/攻撃/防御 1.5倍",
        ct: 20
      },
      {
        name: "一刀両断",
        desc: "攻撃力200%ダメージ（前方3体分）",
        ct: 8
      }
    ]
  },

  // Xランク剣
  {
    id: "x_sword",
    name: "Xランク剣",
    type: "剣",
    rank: "X",
    base: { range: "前方1.5m（左右80°）", atkSpeed: 0.4, bonusAtk: 200 },
    effect: "炎上＋凍結付与",
    skills: [
      {
        name: "極の一閃",
        desc: "前方5m移動＋攻撃力140%ダメージ",
        ct: 3
      },
      {
        name: "打ち上げ花火",
        desc: "行動不能＋打ち上げ＋通常3回＋落下時凍結",
        ct: 14
      },
      {
        name: "極道",
        desc: "回復阻害＋凍結付与＋自身攻撃力1.2倍",
        ct: 10
      },
      {
        name: "終焉",
        desc: "半径7mに攻撃力200%の剣を放つ",
        ct: 20
      }
    ]
  },

  // Dragon sword
  {
    id: "dragon_sword",
    name: "Dragon sword",
    type: "剣",
    rank: "SSS",
    base: { range: "前方1.5m（左右80°）", atkSpeed: 0.4 },
    effect: "炎上＋回復阻害＋ドラゴン％システム",
    skills: [
      {
        name: "異常付与",
        desc: "直線3m攻撃＋炎上＋回復阻害（異常回復貫通）",
        ct: 8
      },
      {
        name: "獄炎斬",
        desc: "1秒行動不能＋ドラゴン％を3貯める",
        ct: 10
      },
      {
        name: "全智のドラゴン",
        desc: "1人引き寄せ＋行動不能＋通常3回＋10mノックバック",
        ct: 25
      },
      {
        name: "炎鬼",
        desc: "攻撃力1.2倍＋ドラゴン％5貯める＋他スキルCT-1秒",
        ct: 15
      }
    ],
    dragonGauge: {
      max: 100,
      desc:
        "100で発動：全スキルCT-3秒＋周囲15mの敵を1秒行動不能。使用後ゲージ0。"
    }
  }
];

// プレイヤー状態（簡易）
const player = {
  level: 1,
  gold: 0,
  weaponId: "fist"
};

// ====== UI更新 ======

function log(msg) {
  const logEl = document.getElementById("log");
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function renderPlayer() {
  document.getElementById("player-level").textContent = player.level;
  document.getElementById("player-gold").textContent = player.gold;

  const statusEl = document.getElementById("player-status");
  const weapon = weapons.find(w => w.id === player.weaponId);
  statusEl.textContent =
    `装備武器: ${weapon ? weapon.name : "なし"}\n` +
    `ランク: ${weapon && weapon.rank ? weapon.rank : "なし"}\n`;
}

function renderWeapons() {
  const container = document.getElementById("weapon-list");
  container.innerHTML = "";

  weapons.forEach(w => {
    const div = document.createElement("div");
    div.className = "weapon-card";

    const title = document.createElement("div");
    title.className = "weapon-name";
    title.textContent = `${w.name} ${w.rank ? `(${w.rank})` : ""}`;
    div.appendChild(title);

    const base = document.createElement("div");
    base.textContent = `種別: ${w.type} ／ 射程: ${w.base.range} ／ 攻撃速度: ${w.base.atkSpeed}s`;
    div.appendChild(base);

    if (w.base.bonusAtk) {
      const bonus = document.createElement("div");
      bonus.textContent = `攻撃補正: +${w.base.bonusAtk}`;
      div.appendChild(bonus);
    }

    const eff = document.createElement("div");
    eff.textContent = `効果: ${w.effect}`;
    div.appendChild(eff);

    const skillTitle = document.createElement("div");
    skillTitle.textContent = "スキル:";
    div.appendChild(skillTitle);

    const ul = document.createElement("ul");
    w.skills.forEach(s => {
      const li = document.createElement("li");
      li.textContent = `${s.name} [CT:${s.ct}s] - ${s.desc}`;
      ul.appendChild(li);
    });
    div.appendChild(ul);

    if (w.dragonGauge) {
      const dg = document.createElement("div");
      dg.textContent = `ドラゴン％: ${w.dragonGauge.desc}`;
      div.appendChild(dg);
    }

    container.appendChild(div);
  });
}

// ====== 初期化 ======
window.addEventListener("load", () => {
  renderPlayer();
  renderWeapons();
  log("ゲーム仕様データを読み込みました。");
  log("ここから戦闘ロジックやマップ、敵AIを追加していける状態です。");
});
