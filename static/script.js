let currentRole = null;          // "bat" or "bowl"
let innings = 1;
let userTotal = 0;               // tracking across innings for result
let cpuTotal = 0;
let innings1Score = null;
let busy = false;                // prevent double-clicks

// ── Screen Management ──────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        target.style.animation = 'none';
        target.offsetHeight;
        target.style.animation = '';
    }
}

// ── Toss ───────────────────────────────────────────────────
function doToss(userCall) {
    const coin = document.getElementById('coin');
    const msg = document.getElementById('toss-msg');
    const tossButtons = document.getElementById('toss-buttons');
    const roleDiv = document.getElementById('role-buttons');

    tossButtons.classList.add('hidden');
    coin.classList.remove('flip');
    void coin.offsetHeight;
    coin.classList.add('flip');

    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const won = userCall === result;

    setTimeout(() => {
        coin.textContent = result === 'Heads' ? '👑' : '🪙';
        if (won) {
            msg.textContent = `It's ${result}! You called ${userCall} — YOU WIN the toss!`;
            roleDiv.classList.remove('hidden');
        } else {
            msg.textContent = `It's ${result}! You called ${userCall} — CPU wins the toss.`;
            const cpuChoice = Math.random() < 0.5 ? 'bat' : 'bowl';
            const userRole = cpuChoice === 'bat' ? 'bowl' : 'bat';
            setTimeout(() => {
                msg.textContent += ` CPU chose to ${cpuChoice}. You will ${userRole}.`;
                setTimeout(() => chooseRole(userRole), 1200);
            }, 800);
        }
    }, 1000);
}

// ── Role Selection ─────────────────────────────────────────
async function chooseRole(role) {
    currentRole = role;
    innings = 1;
    userTotal = 0;
    cpuTotal = 0;
    innings1Score = null;

    const res = await fetch('/toss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: role }),
    });
    await res.json();

    updateDoodles(role);
    resetScoreboard();
    document.getElementById('sb-role').textContent =
        role === 'bat' ? 'You are Batting' : 'You are Bowling';
    showScreen('screen-game');
}

// ── Doodle Icon Swap ───────────────────────────────────────
function updateDoodles(role) {
    const playerIcon = document.getElementById('player-icon');
    const cpuIcon = document.getElementById('cpu-icon');
    if (role === 'bat') {
        playerIcon.innerHTML = '<img src="/static/8952525.png" class="doodle-img" alt="bat">';
        cpuIcon.innerHTML = '<img src="/static/12338815.png" class="doodle-img" alt="ball">';
    } else {
        playerIcon.innerHTML = '<img src="/static/12338815.png" class="doodle-img" alt="ball">';
        cpuIcon.innerHTML = '<img src="/static/8952525.png" class="doodle-img" alt="bat">';
    }
}

// ── Scoreboard Helpers ─────────────────────────────────────
function resetScoreboard() {
    document.getElementById('sb-runs').textContent = '0';
    document.getElementById('sb-wickets').textContent = '0';
    document.getElementById('sb-overs').textContent = '0.0';
    document.getElementById('sb-target-row').classList.add('hidden');
    document.getElementById('sb-target').textContent = '—';
    document.getElementById('commentary').textContent = 'Pick a number to begin!';
    document.getElementById('player-number').textContent = '?';
    document.getElementById('cpu-number').textContent = '?';
    enableButtons(true);
}

function enableButtons(on) {
    document.querySelectorAll('.btn-num').forEach(b => {
        if (on) b.classList.remove('disabled');
        else b.classList.add('disabled');
    });
}

// ── Core Gameplay ──────────────────────────────────────────
async function sendNumber(num) {
    if (busy) return;
    busy = true;
    enableButtons(false);
    document.getElementById('player-number').textContent = num;
    document.getElementById('cpu-number').textContent = '…';

    const playerDoodle = document.getElementById('doodle-player');
    const cpuDoodle = document.getElementById('doodle-cpu');
    playerDoodle.classList.remove('highlight', 'out-highlight');
    cpuDoodle.classList.remove('highlight', 'out-highlight');

    try {
        const res = await fetch('/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: num }),
        });
        const data = await res.json();

        await delay(300);
        document.getElementById('cpu-number').textContent = data.cpu_num;

        if (data.out) {
            if (currentRole === 'bat') {
                playerDoodle.classList.add('out-highlight');
            } else {
                cpuDoodle.classList.add('out-highlight');
            }
        } else {
            if (currentRole === 'bat') {
                playerDoodle.classList.add('highlight');
            } else {
                cpuDoodle.classList.add('highlight');
            }
        }

        document.getElementById('sb-runs').textContent = data.score;
        document.getElementById('sb-wickets').textContent = data.wickets;
        document.getElementById('sb-overs').textContent = data.overs;
        document.getElementById('commentary').textContent = data.commentary;

        if (data.switch) {
            innings = 2;
            innings1Score = data.switch.target;
            currentRole = data.switch.new_role;

            // Track scores
            if (data.switch.new_role === 'bowl') {
                userTotal = data.switch.target;
            } else {
                cpuTotal = data.switch.target;
            }

            await delay(800);
            showSwitchOverlay(data.switch);
            busy = false;
            return;
        }

        if (data.game_over) {
            if (currentRole === 'bat') {
                if (innings === 2) {
                    userTotal = data.score;
                }
            } else {
                if (innings === 2) {
                    cpuTotal = data.score;
                }
            }

            await delay(600);
            showResult(data.result);
            busy = false;
            return;
        }

        await delay(200);
        enableButtons(true);
    } catch (err) {
        console.error('Play error:', err);
        document.getElementById('commentary').textContent = '⚠️ Network error. Try again.';
        enableButtons(true);
    }
    busy = false;
}

function showSwitchOverlay(info) {
    document.getElementById('switch-reason').textContent = info.reason;
    const roleLabel = info.new_role === 'bat' ? 'BAT' : 'BOWL';
    document.getElementById('switch-info').textContent =
        `Target: ${info.target + 1} runs. You will now ${roleLabel}.`;
    document.getElementById('switch-overlay').classList.remove('hidden');
}

function dismissSwitch() {
    document.getElementById('switch-overlay').classList.add('hidden');

    document.getElementById('sb-innings').textContent = 'Innings 2';
    document.getElementById('sb-role').textContent =
        currentRole === 'bat' ? 'You are Batting' : 'You are Bowling';
    document.getElementById('sb-target-row').classList.remove('hidden');
    document.getElementById('sb-target').textContent = innings1Score + 1;

    updateDoodles(currentRole);
    resetScoreboardForInnings2();
    enableButtons(true);
}

function resetScoreboardForInnings2() {
    document.getElementById('sb-runs').textContent = '0';
    document.getElementById('sb-wickets').textContent = '0';
    document.getElementById('sb-overs').textContent = '0.0';
    document.getElementById('commentary').textContent = 'New innings! Pick a number.';
    document.getElementById('player-number').textContent = '?';
    document.getElementById('cpu-number').textContent = '?';
}

// ── Result Overlay ─────────────────────────────────────────
function showResult(resultText) {
    enableButtons(false);
    document.getElementById('result-text').textContent = resultText;

    const userDisplay = userTotal || 0;
    const cpuDisplay = cpuTotal || 0;
    document.getElementById('res-user-score').textContent = userDisplay;
    document.getElementById('res-cpu-score').textContent = cpuDisplay;

    document.getElementById('result-overlay').classList.remove('hidden');
}

// ── Reset ───
async function resetGame() {
    await fetch('/reset', { method: 'POST' });
    document.getElementById('result-overlay').classList.add('hidden');
    document.getElementById('switch-overlay').classList.add('hidden');

    // Reset toss screen
    document.getElementById('coin').textContent = '🪙';
    document.getElementById('coin').classList.remove('flip');
    document.getElementById('toss-msg').textContent = 'Pick your call!';
    document.getElementById('toss-buttons').classList.remove('hidden');
    document.getElementById('role-buttons').classList.add('hidden');

    // Reset game screen state
    document.getElementById('sb-innings').textContent = 'Innings 1';
    resetScoreboard();

    currentRole = null;
    innings = 1;
    userTotal = 0;
    cpuTotal = 0;
    innings1Score = null;
    busy = false;

    showScreen('screen-landing');
}

// ── Utility ────────
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
