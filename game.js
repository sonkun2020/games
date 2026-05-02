// =======================
//  基本定数・ユーティリティ
// =======================

const TILE_SIZE = 32;
const MAP_COLS = 120;
const MAP_ROWS = 80;

// 草原：薄緑 ／ 街：薄こげ茶
const TILE_TYPE = {
  GRASS: 0,
  CITY: 1
};

//ログ
function log(msg) {
    const logBox = document.getElementById("log");
    const div = document.createElement("div");
    div.textContent = msg;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
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

dragonPercent: 0,
dragonModeUntil: 0,


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

let inDungeon = false;
let dungeonMap = [];

let inPvp = false;
let pvpMap = [];

let enemyPlayer = {
    x: 60,
    y: 60,
    hp: 1000,
    maxHp: 1000,
    atk: 80,
    def: 40,
    status: {
        freezeUntil: 0,
        stunUntil: 0,
        burnUntil: 0,
        healBlockUntil: 0
    },
    knockback: { x: 0, y: 0, until: 0 }
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

            // 左側70% → 草原
            if (x < MAP_COLS * 0.7) {
                row.push(TILE_TYPE.GRASS);
            }

            // 右側30% → 街
            else {
                row.push(TILE_TYPE.CITY);
            }
        }

        map.push(row);
    }

    // 街にビル（障害物）を配置
    for (let i = 0; i < 40; i++) {
        const bx = randInt(MAP_COLS * 0.72, MAP_COLS - 3);
        const by = randInt(2, MAP_ROWS - 3);

        // 3×3 のビル
        for (let yy = 0; yy < 3; yy++) {
            for (let xx = 0; xx < 3; xx++) {
                if (map[by + yy] && map[by + yy][bx + xx] !== undefined) {
                    map[by + yy][bx + xx] = "BUILDING";
                }
            }
        }
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
// PvP中なら敵プレイヤーにも攻撃判定
if (inPvp) {
    const distP = distance(player, enemyPlayer);
    if (distP <= w.base.range + 1) {
        let atkPower = player.atk;

        // Dragonモード中なら攻撃力2倍
        if (performance.now() < player.dragonModeUntil) {
            atkPower *= 2;
        }

        const dmg = Math.max(0, atkPower * 1.0);
        enemyPlayer.hp -= dmg;

        log(`あなたの攻撃！ 敵プレイヤーに ${dmg} ダメージ`);

        if (enemyPlayer.hp <= 0) {
            pvpWin();
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

　　　　　applyKnockback(target, player, 5.0, 300); // 5mノックバック
　　　　　applyKnockback(target, player, 3.0, 200);

        
        log(`スキル「${skill.name}」発動！ ${target.name} に ${dmg} ダメージ`);
        if (target.hp <= 0) {
          onEnemyDead(target);
        }
      }
    }
  }
  // PvP中なら敵プレイヤーにも攻撃判定
if (inPvp) {
    const distP = distance(player, enemyPlayer);
    if (distP <= w.base.range + 1) {
        let atkPower = player.atk;

        // Dragonモード中なら攻撃力2倍
        if (performance.now() < player.dragonModeUntil) {
            atkPower *= 2;
        }

        const dmg = Math.max(0, atkPower * 1.0);
        enemyPlayer.hp -= dmg;

        log(`あなたの攻撃！ 敵プレイヤーに ${dmg} ダメージ`);

        if (enemyPlayer.hp <= 0) {
            pvpWin();
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
          let atkPower = player.atk;

　　　　　　　// Dragonモード中なら攻撃力2倍
　　　　　　　if (performance.now() < player.dragonModeUntil) {
   　　　　　 　　atkPower *= 2;
　　　　　　　}

　　　　　　　const dmg = Math.max(0, atkPower * 1.6);

            const dmg = Math.max(0, player.atk * 1.6);
            target.hp -= dmg;

          　applyStatus(target, "burn", 5000);
          　addDragonPercent(10); // スキル2で10％増加


            log(`スキル2「${skill.name}」発動！ ${target.name} に ${dmg} ダメージ`);
            if (target.hp <= 0) onEnemyDead(target);
        }
    }
}
// PvP中なら敵プレイヤーにも攻撃判定
if (inPvp) {
    const distP = distance(player, enemyPlayer);
    if (distP <= w.base.range + 1) {
        let atkPower = player.atk;

        // Dragonモード中なら攻撃力2倍
        if (performance.now() < player.dragonModeUntil) {
            atkPower *= 2;
        }

        const dmg = Math.max(0, atkPower * 1.0);
        enemyPlayer.hp -= dmg;

        log(`あなたの攻撃！ 敵プレイヤーに ${dmg} ダメージ`);

        if (enemyPlayer.hp <= 0) {
            pvpWin();
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
            
          　applyStatus(target, "stun", 700);
          　applyKnockback(target, player, 2.0, 300); // 2mノックバックを0.3秒
         　 addDragonPercent(15); // スキル3で15％増加

          
            log(`スキル3「${skill.name}」発動！ ${target.name} に ${dmg} ダメージ`);
            if (target.hp <= 0) onEnemyDead(target);
        }
    }
}
// PvP中なら敵プレイヤーにも攻撃判定
if (inPvp) {
    const distP = distance(player, enemyPlayer);
    if (distP <= w.base.range + 1) {
        let atkPower = player.atk;

        // Dragonモード中なら攻撃力2倍
        if (performance.now() < player.dragonModeUntil) {
            atkPower *= 2;
        }

        const dmg = Math.max(0, atkPower * 1.0);
        enemyPlayer.hp -= dmg;

        log(`あなたの攻撃！ 敵プレイヤーに ${dmg} ダメージ`);

        if (enemyPlayer.hp <= 0) {
            pvpWin();
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
  // ノックバック中なら強制移動
if (now < e.knockback.until) {
    e.x += e.knockback.x * (dt / 1000);
    e.y += e.knockback.y * (dt / 1000);
    return; // ノックバック中は他の行動をしない
}

  enemies.forEach(e => {
    const dist = distance(e, player);

    // レイドボス
if (e.type === "raid") {
    raidBossAttack(e, now);

    // 攻撃範囲外なら追いかける
    if (distance(e, player) > e.range) {
        chase(e, player, dt);
    }
    return;
}


    // ドラゴン
if (e.type === "dragon") {
    dragonAI(e, now, dt);
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
        if (t === TILE_TYPE.GRASS) {
    ctx.fillStyle = "#335533"; // 草原
}
else if (t === TILE_TYPE.CITY) {
    ctx.fillStyle = "#5a3b2e"; // 街
}
else if (t === "BUILDING") {
    ctx.fillStyle = "#222222"; // ビル（黒っぽい）
}

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
  // =======================
// UI更新
// =======================
document.getElementById("player-hp").style.width =
    (player.hp / player.maxHp * 200) + "px";

document.getElementById("dragon-bar").style.width =
    (player.dragonPercent * 2) + "px";

if (currentTarget) {
    document.getElementById("enemy-hp").style.width =
        (currentTarget.hp / currentTarget.maxHp * 200) + "px";
} else {
    document.getElementById("enemy-hp").style.width = "0px";
}
// =======================
// スキルアイコンのCT表示
// =======================
function updateSkillIcons(now) {
    const w = weapons[player.weaponId];

    // スキル1
    const s1 = document.getElementById("skill1");
    if (w.skills[0]._nextUse && now < w.skills[0]._nextUse) {
        s1.classList.add("cooldown");
    } else {
        s1.classList.remove("cooldown");
    }

    // スキル2
    const s2 = document.getElementById("skill2");
    if (w.skills[1]._nextUse && now < w.skills[1]._nextUse) {
        s2.classList.add("cooldown");
    } else {
        s2.classList.remove("cooldown");
    }

    // スキル3
    const s3 = document.getElementById("skill3");
    if (w.skills[2]._nextUse && now < w.skills[2]._nextUse) {
        s3.classList.add("cooldown");
    } else {
        s3.classList.remove("cooldown");
    }
  // Dragon％100％で光らせる
if (player.dragonPercent >= 100) {
    s1.classList.add("ready");
    s2.classList.add("ready");
    s3.classList.add("ready");
} else {
    s1.classList.remove("ready");
    s2.classList.remove("ready");
    s3.classList.remove("ready");
}

// Dragonモード中は赤く光らせる
if (now < player.dragonModeUntil) {
    s1.classList.add("dragon");
    s2.classList.add("dragon");
    s3.classList.add("dragon");
} else {
    s1.classList.remove("dragon");
    s2.classList.remove("dragon");
    s3.classList.remove("dragon");
}

}
updateSkillIcons(now);

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
// =======================
// Dragon％を増やす
// =======================
function addDragonPercent(amount) {
    player.dragonPercent += amount;
    if (player.dragonPercent >= 100) {
        player.dragonPercent = 100;
        activateDragonMode();
    }
}
// =======================
// Dragonモード発動
// =======================
function activateDragonMode() {
    const now = performance.now();
    player.dragonModeUntil = now + 8000; // 8秒間強化

    log("🔥 Dragonモード発動！攻撃力が大幅に上昇！ 🔥");
  // 発動時に一瞬光らせる
document.getElementById("skills").classList.add("flash");
setTimeout(() => {
    document.getElementById("skills").classList.remove("flash");
}, 300);

}

// =======================
// ノックバック処理
// =======================
function applyKnockback(target, from, distance, durationMs) {
    const now = performance.now();

    // 方向ベクトル
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // ノックバック速度
    target.knockback.x = (dx / len) * distance;
    target.knockback.y = (dy / len) * distance;
    target.knockback.until = now + durationMs;
}

// =======================
// レイドボスの攻撃パターン
// =======================
function raidBossAttack(boss, now) {
    const dist = distance(boss, player);

    // 0.4秒ごとに攻撃
    if (!boss.lastAttack || now - boss.lastAttack >= 400) {
        boss.lastAttack = now;

        // ランダムで攻撃パターンを決定
        const pattern = Math.floor(Math.random() * 3);

        // ① 周囲攻撃（200ダメ）
        if (pattern === 0) {
            if (dist <= boss.range + 1.5) {
                const dmg = 200;
                player.hp -= dmg;
                log(`レイドボスの周囲攻撃！ プレイヤーに ${dmg} ダメージ`);
            }
        }

        // ② 単体攻撃（350ダメ）
        if (pattern === 1) {
            if (dist <= boss.range) {
                const dmg = 350;
                player.hp -= dmg;
                log(`レイドボスの強攻撃！ プレイヤーに ${dmg} ダメージ`);
            }
        }

        // ③ 凍結付与（1秒）
        if (pattern === 2) {
            if (dist <= boss.range) {
                applyStatus(player, "freeze", 1000);
                log(`レイドボスの凍結攻撃！ プレイヤーが1秒間凍結！`);
            }
        }
    }
}

// =======================
// ドラゴンのランダム行動AI
// =======================
function dragonAI(dragon, now, dt) {
    const dist = distance(dragon, player);

    // 行動タイミング（0.8〜1.5秒ごと）
    if (!dragon._nextAction || now >= dragon._nextAction) {
        dragon._nextAction = now + randInt(800, 1500);

        // ランダム行動を選択
        const action = randInt(0, 4);

        // ① 火炎ブレス（中距離攻撃）
        if (action === 0 && dist <= dragon.range + 2) {
            const dmg = 180;
            player.hp -= dmg;
            applyStatus(player, "burn", 4000); // 4秒炎上
            log(`ドラゴンの火炎ブレス！ ${dmg}ダメージ＋炎上！`);
            return;
        }

        // ② 火炎爆発（範囲攻撃）
        if (action === 1 && dist <= dragon.range + 1.5) {
            const dmg = 250;
            player.hp -= dmg;
            applyStatus(player, "burn", 5000);
            applyStatus(player, "healBlock", 5000);
            log(`ドラゴンの火炎爆発！ ${dmg}ダメージ＋炎上＋回復阻害！`);
            return;
        }

        // ③ 通常攻撃
        if (action === 2 && dist <= dragon.range) {
            const dmg = dragon.atk;
            player.hp -= dmg;
            log(`ドラゴンの通常攻撃！ ${dmg}ダメージ`);
            return;
        }

        // ④ ランダム移動
        if (action === 3) {
            const angle = Math.random() * Math.PI * 2;
            dragon._moveX = Math.cos(angle) * 1.2;
            dragon._moveY = Math.sin(angle) * 1.2;
            dragon._moveUntil = now + 600;
            log(`ドラゴンがランダムに移動し始めた`);
            return;
        }

        // ⑤ 追いかける
        if (action === 4) {
            chase(dragon, player, dt);
            log(`ドラゴンがプレイヤーを追いかけている`);
            return;
        }
    }

    // ランダム移動中
    if (dragon._moveUntil && now < dragon._moveUntil) {
        dragon.x += dragon._moveX * (dt / 1000);
        dragon.y += dragon._moveY * (dt / 1000);
        return;
    }

    // 攻撃範囲外なら追いかける
    if (dist > dragon.range) {
        chase(dragon, player, dt);
    }
}

// =======================
// 迷宮マップ生成（シンプル版）
// =======================
function generateDungeon() {
    dungeonMap = [];

    const rows = 40;
    const cols = 40;

    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
            // 壁
            if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
                row.push("WALL");
            }
            // 部屋（床）
            else {
                row.push("FLOOR");
            }
        }
        dungeonMap.push(row);
    }

    // ボス部屋（右上）
    for (let y = 2; y < 8; y++) {
        for (let x = cols - 10; x < cols - 2; x++) {
            dungeonMap[y][x] = "BOSSROOM";
        }
    }

    // 敵を10体スポーン
    for (let i = 0; i < 10; i++) {
        spawnEnemy("slime", randInt(2, cols - 3), randInt(2, rows - 3));
    }

    // ボスを1体スポーン
    spawnEnemy("raid", cols - 6, 5);
}

function enterDungeon() {
    inDungeon = true;
    generateDungeon();
    player.x = 5;
    player.y = 5;
    log("迷宮に入った！");
}

// マップ描画
for (let y = 0; y < (inDungeon ? dungeonMap.length : inPvp ? pvpMap.length : MAP_ROWS); y++) {
    for (let x = 0; x < (inDungeon ? dungeonMap[0].length : inPvp ? pvpMap[0].length : MAP_COLS); x++) {

        const t = inDungeon ? dungeonMap[y][x] :
                  inPvp ? pvpMap[y][x] :
                  map[y][x];

        if (t === TILE_TYPE.GRASS) ctx.fillStyle = "#335533";
        else if (t === TILE_TYPE.CITY) ctx.fillStyle = "#5a3b2e";
        else if (t === "BUILDING") ctx.fillStyle = "#222222";

        // 迷宮
        else if (t === "WALL") ctx.fillStyle = "#111111";
        else if (t === "FLOOR") ctx.fillStyle = "#444444";
        else if (t === "BOSSROOM") ctx.fillStyle = "#550000";

        // PvP
        else if (t === "PVP") ctx.fillStyle = "#333366"; // 青っぽいフィールド

        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}


// =======================
// PvPマップ生成（円形・障害物なし）
// =======================
function generatePvpMap() {
    pvpMap = [];

    const rows = 80;  // 迷宮の2倍
    const cols = 80;

    const centerX = cols / 2;
    const centerY = rows / 2;
    const radius = 35; // 円の半径

    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {

            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 円の外側 → 壁
            if (dist > radius) {
                row.push("WALL");
            }
            // 円の内側 → PvPフィールド
            else {
                row.push("PVP");
            }
        }
        pvpMap.push(row);
    }
}

function enterPvp() {
    inPvp = true;
    generatePvpMap();
    player.x = 40;
    player.y = 40;
    log("PvPフィールドに入った！");
}

function pvpWin() {
    log("🎉 PvP勝利！ 🎉");

    // 敵プレイヤーをリスポーン
    enemyPlayer.hp = enemyPlayer.maxHp;
    enemyPlayer.x = 60;
    enemyPlayer.y = 60;

    // プレイヤーも回復
    player.hp = player.maxHp;

    log("敵プレイヤーが復活した！");
}
document.getElementById("skill1").onclick = () => {
    keys["j"] = true;
    setTimeout(() => keys["j"] = false, 50);
};

document.getElementById("skill2").onclick = () => {
    keys["l"] = true;
    setTimeout(() => keys["l"] = false, 50);
};

document.getElementById("skill3").onclick = () => {
    keys[";"] = true;
    setTimeout(() => keys[";"] = false, 50);
};
