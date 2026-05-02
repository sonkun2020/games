// =======================
//  基本定数・ユーティリティ
// =======================

const TILE_SIZE = 32;
const MAP_COLS = 20;
const MAP_ROWS = 15;

// 草原：薄緑 ／ 街：薄こげ茶
const TILE_TYPE = {
  GRASS: 0,
  CITY: 1
};

// ログ出力
function log(msg) {
  const el = document.getElementById("log");
  el.textContent += msg + "\n";
  el.scrollTop = el.scrollHeight;
}

// ランダム
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =======================
//  武器・スキルデータ
// =======================

const weapons = {
  fist: {
    id: "fist",
    name: "拳",
    type: "拳",
    rank: null,
    base: { range: 1, atkSpeed: 0.2 },
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
  sword: {
    id: "sword",
    name: "剣",
    type: "剣",
    rank: "A",
    base: { range: 1.5, atkSpeed: 0.4 },
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
  spear: {
    id: "spear",
    name: "槍",
    type: "槍",
    rank: "A",
    base: { range: 3, atkSpeed: 0.3 },
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
  axe: {
    id: "axe",
    name: "斧",
    type: "斧",
    rank: "A",
    base: { range: 2, atkSpeed: 0.6 },
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
  }
};

// =======================
//  プレイヤー・敵・状態
// =======================

const player = {
  x: 5,
  y: 5,
  hp: 1000,
  maxHp: 1000,
  atk: 100,
  def: 50,
  level: 1,
  gold: 0,
  weaponId: "sword",
  moveSpeed: 2, // 2m/s 相当（ここでは1タイル=1m扱い）
  ccUntil: 0
  status: {
    freezeUntil: 0,   // 凍結
    stunUntil: 0,     // 行動不能
    burnUntil: 0,     // 炎上
    healBlockUntil: 0 // 回復阻害
},
knockback: { x: 0, y: 0, until: 0 }

};

const enemies = [];

const enemyTemplate = {
  normal: {
    name: "フィールド敵",
    hp: 300,
    atk: 50,
    range: 1.5,
    speed: 1.5
  },
  raid: {
    name: "レイドボス Rest",
    hp: 5000,
    atk: 200,
    range: 3,
    speed: 1,
    attackInterval: 0.4
  },
  dragon: {
    name: "Strong dragon",
    hp: 8000,
    atk: 250,
    range: 4,
    speed: 1.2
  }
};

// =======================
//  マップ生成
// =======================

let map = [];

function generateMap() {
  map = [];
  for (let y = 0; y < MAP_ROWS; y++) {
    const row = [];
    for (let x = 0; x < MAP_COLS; x++) {
      // 左側：草原 ／ 右側：街
      if (x < MAP_COLS / 2) {
        row.push(TILE_TYPE.GRASS);
      } else {
        row.push(TILE_TYPE.CITY);
      }
    }
    map.push(row);
  }
}

// =======================
//  敵スポーン
// =======================

function spawnEnemy(type, x, y) {
  const t = enemyTemplate[type];
  if (!t) return;
  enemies.push({
    type,
    name: t.name,
    x,
    y,
    hp: t.hp,
    maxHp: t.hp,
    atk: t.atk,
    range: t.range,
    speed: t.speed,
    lastAttack: 0
    status: {
    freezeUntil: 0,   // 凍結
    stunUntil: 0,     // 行動不能
    burnUntil: 0,     // 炎上
    healBlockUntil: 0 // 回復阻害
},
knockback: { x: 0, y: 0, until: 0 }

  });
}

function spawnInitialEnemies() {
  // フィールド敵を数体
  for (let i = 0; i < 5; i++) {
    spawnEnemy("normal", randInt(2, MAP_COLS - 2), randInt(2, MAP_ROWS - 2));
  }
  // レイドボス
  spawnEnemy("raid", MAP_COLS - 4, 3);
  // ドラゴン
  spawnEnemy("dragon", MAP_COLS - 4, MAP_ROWS - 4);
}

// =======================
//  入力
// =======================

const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// =======================
//  戦闘・AIロジック
// =======================

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// CC中かどうか
function isCC(now, ccUntil) {
  return now < ccUntil;
}

// プレイヤー攻撃（簡易：通常攻撃＋スキル1）
function playerAttack(now) {
  const w = weapons[player.weaponId];
  if (!w) return;

  // 通常攻撃（J）
  if (keys["j"]) {
    const target = enemies.find(e => distance(player, e) <= w.base.range);
    if (target) {
      const dmg = Math.max(0, player.atk - 0); // 防御簡略
      target.hp -= dmg;
      log(`プレイヤーの通常攻撃！ ${target.name} に ${dmg} ダメージ`);
      if (target.hp <= 0) {
        onEnemyDead(target);
      }
    }
  }

  // スキル1（1） → 仕様に合わせて「スキル1」を使うイメージ
  if (keys["1"]) {
    const skill = w.skills[0];
    if (!skill._nextUse || now >= skill._nextUse) {
      const target = enemies.find(e => distance(player, e) <= w.base.range + 1);
      if (target) {
        skill._nextUse = now + skill.ct * 1000;
        const dmg = Math.max(0, player.atk * 1.4 - 0); // ざっくり倍率
        target.hp -= dmg;
        log(`スキル「${skill.name}」発動！ ${target.name} に ${dmg} ダメージ`);
        if (target.hp <= 0) {
          onEnemyDead(target);
        }
      }
    }
  }
  // スキル2（2）
if (keys["2"]) {
    const skill = w.skills[1];
    if (skill && (!skill._nextUse || now >= skill._nextUse)) {
        skill._nextUse = now + skill.ct * 1000;

        const target = enemies.find(e => distance(player, e) <= w.base.range + 1);
        if (target) {
            const dmg = Math.max(0, player.atk * 1.6);
            target.hp -= dmg;
            log(`スキル2「${skill.name}」発動！ ${target.name} に ${dmg} ダメージ`);
            if (target.hp <= 0) onEnemyDead(target);
        }
    }
}

// スキル3（3）
if (keys["3"]) {
    const skill = w.skills[2];
    if (skill && (!skill._nextUse || now >= skill._nextUse)) {
        skill._nextUse = now + skill.ct * 1000;

        const target = enemies.find(e => distance(player, e) <= w.base.range + 1.5);
        if (target) {
            const dmg = Math.max(0, player.atk * 2.0);
            target.hp -= dmg;
            log(`スキル3「${skill.name}」発動！ ${target.name} に ${dmg} ダメージ`);
            if (target.hp <= 0) onEnemyDead(target);
        }
    }
}
  applyStatus(target, "stun", 700); // 0.7秒行動不能
applyStatus(target, "burn", 5000); // 5秒炎上

}

// 敵死亡時
function onEnemyDead(enemy) {
  const idx = enemies.indexOf(enemy);
  if (idx >= 0) enemies.splice(idx, 1);
  log(`${enemy.name} を倒した！`);

  // ドロップ（簡略版）
  if (enemy.type === "normal") {
    // 通常素材50%（仕様通り）
    if (Math.random() < 0.5) {
      player.gold += 1;
      log("通常素材を売却して 1ドラ 入手（簡略処理）");
    }
  } else if (enemy.type === "raid" || enemy.type === "dragon") {
    // 通常素材70%
    if (Math.random() < 0.7) {
      player.gold += 1;
      log("ボスから通常素材ドロップ → 売却で 1ドラ 入手（簡略処理）");
    }
  }
}

// 敵AI
function updateEnemies(dt, now) {
  enemies.forEach(e => {
    const dist = distance(e, player);

    // レイドボス：攻撃頻度0.4秒
    if (e.type === "raid") {
      if (dist <= e.range) {
        if (!e.lastAttack || now - e.lastAttack >= 400) {
          e.lastAttack = now;
          const dmg = e.atk;
          player.hp -= dmg;
          log(`レイドボスの攻撃！ プレイヤーに ${dmg} ダメージ`);
        }
      } else {
        // 追いかける
        chase(e, player, dt);
      }
      return;
    }

    // ドラゴン：ランダム行動
    if (e.type === "dragon") {
      if (!e._nextAction || now >= e._nextAction) {
        e._nextAction = now + randInt(800, 1500);
        const action = randInt(0, 2);
        if (action === 0 && dist <= e.range) {
          const dmg = e.atk;
          player.hp -= dmg;
          log(`ドラゴンの火炎攻撃！ プレイヤーに ${dmg} ダメージ`);
        } else {
          chase(e, player, dt);
        }
      } else {
        // たまに追いかける
        if (dist > e.range) chase(e, player, dt);
      }
      return;
    }

    // 通常敵：追いかけて、範囲に入ったら攻撃
    if (dist <= e.range) {
      if (!e.lastAttack || now - e.lastAttack >= 800) {
        e.lastAttack = now;
        const dmg = e.atk;
        player.hp -= dmg;
        log(`${e.name} の攻撃！ プレイヤーに ${dmg} ダメージ`);
      }
    } else {
      chase(e, player, dt);
    }
  });
}

// 追尾
function chase(e, target, dt) {
  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const vx = (dx / len) * e.speed * (dt / 1000);
  const vy = (dy / len) * e.speed * (dt / 1000);
  e.x += vx;
  e.y += vy;
}

// =======================
//  プレイヤー移動
// =======================

function updatePlayer(dt, now) {
  if (isCC(now, player.ccUntil)) return;

  let mx = 0;
  let my = 0;
  if (keys["w"]) my -= 1;
  if (keys["s"]) my += 1;
  if (keys["a"]) mx -= 1;
  if (keys["d"]) mx += 1;

  if (mx !== 0 || my !== 0) {
    const len = Math.sqrt(mx * mx + my * my);
    mx /= len;
    my /= len;
    const vx = mx * player.moveSpeed * (dt / 1000);
    const vy = my * player.moveSpeed * (dt / 1000);
    player.x = Math.max(0, Math.min(MAP_COLS - 1, player.x + vx));
    player.y = Math.max(0, Math.min(MAP_ROWS - 1, player.y + vy));
  }
}

// =======================
//  描画
// =======================

let canvas, ctx;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // マップ
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      const t = map[y][x];
      if (t === TILE_TYPE.GRASS) {
        ctx.fillStyle = "#335533"; // 薄緑
      } else {
        ctx.fillStyle = "#5a3b2e"; // 薄こげ茶
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // プレイヤー
  ctx.fillStyle = "#00aaff";
  ctx.fillRect(
    player.x * TILE_SIZE - TILE_SIZE / 2,
    player.y * TILE_SIZE - TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE
  );

  // 敵
  enemies.forEach(e => {
    if (e.type === "raid") ctx.fillStyle = "#ff4444";
    else if (e.type === "dragon") ctx.fillStyle = "#ff8800";
    else ctx.fillStyle = "#aa0000";

    ctx.fillRect(
      e.x * TILE_SIZE - TILE_SIZE / 2,
      e.y * TILE_SIZE - TILE_SIZE / 2,
      TILE_SIZE,
      TILE_SIZE
    );
  });
}

// =======================
//  UI更新
// =======================

function renderPlayerUI() {
  document.getElementById("player-level").textContent = player.level;
  document.getElementById("player-gold").textContent = player.gold;

  const statusEl = document.getElementById("player-status");
  statusEl.textContent =
    `HP: ${player.hp} / ${player.maxHp}\n` +
    `攻撃力: ${player.atk}\n` +
    `防御値: ${player.def}\n` +
    `位置: (${player.x.toFixed(1)}, ${player.y.toFixed(1)})\n` +
    `装備武器: ${weapons[player.weaponId].name}\n`;

  const w = weapons[player.weaponId];
  const wEl = document.getElementById("weapon-info");
  wEl.innerHTML = `
    <div>種別: ${w.type} ／ ランク: ${w.rank || "なし"}</div>
    <div>射程: ${w.base.range}m ／ 攻撃速度: ${w.base.atkSpeed}s</div>
    <div>効果: ${w.effect}</div>
    <div>スキル:</div>
    <ul>
      ${w.skills
        .map(
          s =>
            `<li class="skill">${s.name} [CT:${s.ct}s] - ${s.desc}</li>`
        )
        .join("")}
    </ul>
  `;

  const enemyEl = document.getElementById("enemy-status");
  if (enemies.length === 0) {
    enemyEl.textContent = "敵はいません。";
  } else {
    enemyEl.textContent = enemies
      .map(
        e =>
          `${e.name} HP:${e.hp}/${e.maxHp} 位置:(${e.x.toFixed(
            1
          )},${e.y.toFixed(1)})`
      )
      .join("\n");
  }
}

// =======================
//  オートセーブ（簡易）
// =======================

function saveGame() {
  const data = {
    player
  };
  localStorage.setItem("raid_dragon_save", JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem("raid_dragon_save");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(player, data.player);
    log("セーブデータを読み込みました。");
  } catch (e) {
    console.warn(e);
  }
}

// =======================
//  メインループ
// =======================

let lastTime = 0;
let autoSaveTimer = 0;

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  const now = performance.now();

  updatePlayer(dt, now);
  playerAttack(now);
  updateEnemies(dt, now);
  draw();
  renderPlayerUI();

  autoSaveTimer += dt;
  if (autoSaveTimer >= 30000) {
    autoSaveTimer = 0;
    saveGame();
    log("オートセーブしました。");
  }

  if (player.hp <= 0) {
    log("プレイヤーは倒れた…（リロードで再開）");
    return;
  }

  requestAnimationFrame(loop);
}

// =======================
//  初期化
// =======================

window.addEventListener("load", () => {
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  generateMap();
  loadGame();
  spawnInitialEnemies();
  renderPlayerUI();
  log("ゲーム開始。WASDで移動、jで攻撃、1でスキル1。");

  requestAnimationFrame(loop);
});
function applyStatus(target, type, durationMs) {
    const now = performance.now();

    if (type === "freeze") {
        target.status.freezeUntil = now + durationMs;
    }
    if (type === "stun") {
        target.status.stunUntil = now + durationMs;
    }
    if (type === "burn") {
        target.status.burnUntil = now + durationMs;
    }
    if (type === "healBlock") {
        target.status.healBlockUntil = now + durationMs;
    }
}
