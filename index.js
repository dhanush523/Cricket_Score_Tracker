
let maxOvers = 0, maxWickets = 0, target = null;
let historyStack = [];

const innings = {
  1: { runs: 0, wickets: 0, balls: 0, overBalls: 0, overRuns: 0, oversTimeline: [], currentOverBalls: [], ended: false },
  2: { runs: 0, wickets: 0, balls: 0, overBalls: 0, overRuns: 0, oversTimeline: [], currentOverBalls: [], ended: false }
};
let currentInnings = 1;

// --- Helper: Check if innings is active ---
function isInningsActive() {
  return !innings[currentInnings].ended;
}

// --- Start full match ---
function startMatch() {
  maxOvers = parseInt(document.getElementById('maxOvers').value);
  maxWickets = parseInt(document.getElementById('maxWickets').value);

  if (isNaN(maxOvers) || maxOvers <= 0) {
    alert("Overs cannot be zero — every match needs at least 1 over!");
    return;
  }
  if (isNaN(maxWickets) || maxWickets <= 0) {
    alert("You must have at least 1 wicket for the innings!.");
    return;
  }

  document.querySelector('.setup').style.display = 'none';
  document.getElementById('scoreboard').style.display = 'block';
  document.getElementById("matchResult").innerText = "";
  updateDisplay();
}

// --- Start 2nd innings only ---
function startSecondInningsOnly() {
  maxOvers = parseInt(document.getElementById('maxOvers').value);
  maxWickets = parseInt(document.getElementById('maxWickets').value);
  target = parseInt(document.getElementById('targetInput').value);

  if (isNaN(maxOvers) || maxOvers <= 0) {
    alert("Please enter a valid number of overs greater than 0.");
    return;
  }
  if (isNaN(maxWickets) || maxWickets <= 0) {
    alert("Please enter a valid number of wickets greater than 0.");
    return;
  }
  if (isNaN(target) || target <= 0) {
    alert("Please enter a valid target greater than 0.");
    return;
  }

  document.querySelector('.setup').style.display = 'none';
  document.getElementById('scoreboard').style.display = 'block';

  innings[1].ended = true; // Mark 1st innings as ended
  currentInnings = 2;
  innings[2] = { runs: 0, wickets: 0, balls: 0, overBalls: 0, overRuns: 0, oversTimeline: [], currentOverBalls: [], ended: false };
  updateDisplay();
}

// --- Switch innings ---
function switchInnings(num) {
  if (num === 2 && !innings[1].ended) {
    alert("You cannot start the 2nd innings until the 1st innings is over!");
    return;
  }
  currentInnings = num;
  updateDisplay();
}

// --- Save history ---
function saveHistory() {
  historyStack.push(JSON.stringify(innings));
}

// --- Add run ---
function addRun(num) {
  if (!isInningsActive()) return;
  const d = innings[currentInnings];
  saveHistory();

  d.runs += num;
  d.balls++;
  d.overBalls++;
  d.overRuns += num;
  addBallToTimeline(num);

  checkOverOrEnd();
  updateDisplay();
}

// --- Add manual run ---
function addManualRun() {
  if (!isInningsActive()) return;
  const input = document.getElementById('manualRuns');
  const val = parseInt(input.value);
  if (!isNaN(val) && val >= 0) addRun(val);
  input.value = '';
}

// --- Add wicket ---
function addWicket() {
  if (!isInningsActive()) return;
  const d = innings[currentInnings];
  if (d.wickets >= maxWickets) return;
  saveHistory();

  d.wickets++;
  d.balls++;
  d.overBalls++;
  addBallToTimeline("W", "wicket");

  checkOverOrEnd();
  updateDisplay();
}

// --- Add dot ball ---
function addBall() {
  if (!isInningsActive()) return;
  const d = innings[currentInnings];
  saveHistory();

  d.balls++;
  d.overBalls++;
  addBallToTimeline("•");

  checkOverOrEnd();
  updateDisplay();
}

// --- Wide ---
function addWide() {
  if (!isInningsActive()) return;
  const d = innings[currentInnings];
  saveHistory();

  d.runs++;
  d.overRuns++;
  addBallToTimeline("WD", "wd");

  checkWinAfterExtra();
  updateDisplay();
}

// --- No Ball ---
function addNoBall() {
  if (!isInningsActive()) return;
  const d = innings[currentInnings];
  saveHistory();

  let batRuns = parseInt(prompt("Batsman runs on No Ball:", "")) || 0;
  const totalRuns = 1 + batRuns;

  d.runs += totalRuns;
  d.overRuns += totalRuns;
  addBallToTimeline(batRuns > 0 ? `NB+${batRuns}` : "NB", "noBall");

  checkWinAfterExtra();
  updateDisplay();
}

// --- Check win after extras ---
function checkWinAfterExtra() {
  const d = innings[currentInnings];
  if (currentInnings === 2 && target !== null && d.runs >= target) {
    endMatch(`🎉 2nd Innings team won by ${maxWickets - d.wickets} wickets!`);
  }
}

// --- Check over / innings end ---
function checkOverOrEnd() {
  const d = innings[currentInnings];
  if (d.overBalls === 6) endOver();
  if (Math.floor(d.balls / 6) >= maxOvers || d.wickets >= maxWickets) endInnings();
  if (currentInnings === 2 && target !== null && d.runs >= target) {
    endMatch(`🎉 2nd Innings team won by ${maxWickets - d.wickets} wickets!`);
  }
}

// --- End over ---
function endOver() {
  const d = innings[currentInnings];
  d.oversTimeline.push({
    title: `Over ${Math.floor(d.balls / 6)} — ${d.overRuns} runs`,
    balls: d.currentOverBalls || []
  });
  d.overBalls = 0;
  d.overRuns = 0;
  d.currentOverBalls = [];
}

// --- End innings ---
function endInnings() {
  const d = innings[currentInnings];
  d.ended = true;

  if (currentInnings === 1) {
    target = d.runs + 1;
    alert(`🏏 1st Innings Over.\n🎯 Target for 2nd Innings: ${target}`);
    switchInnings(2);
  } else {
    if (d.runs >= target) endMatch(`🎉 2nd Innings team won by ${maxWickets - d.wickets} wickets!`);
    else if (d.runs === target - 1) endMatch(`🤝 Match Tied!`);
    else {
      const margin = target - d.runs - 1;
      endMatch(`🏆 1st Innings team won by ${margin} runs!`);
    }
  }
  updateDisplay();
}

// --- End match ---
function endMatch(msg) {
  innings[1].ended = innings[2].ended = true;
  document.getElementById("matchResult").innerText = msg;
}

// --- Add ball to timeline ---
function addBallToTimeline(value, type = "") {
  const d = innings[currentInnings];
  d.currentOverBalls.push({ value, type });
}

// --- Run Rate ---
function calculateRunRate(runs, balls) {
  return balls === 0 ? "0.00" : (runs / (balls / 6)).toFixed(2);
}

// --- Update display ---
function updateDisplay() {
  const d = innings[currentInnings];
  document.getElementById("score").innerText = `${d.runs} / ${d.wickets}`;
  document.getElementById("overs").innerText = `Overs: ${Math.floor(d.balls / 6)}.${d.balls % 6}`;
  document.getElementById("runRate").innerText = `Run Rate: ${calculateRunRate(d.runs, d.balls)}`;

  if (currentInnings === 2 && target !== null) {
    const runsNeeded = target - d.runs;
    const ballsLeft = maxOvers * 6 - d.balls;
    const oversLeft = ballsLeft / 6;
    const rrr = oversLeft > 0 ? (runsNeeded / oversLeft).toFixed(2) : "0.00";
    document.getElementById("targetInfo").innerText = `Target: ${target} • RRR: ${rrr}`;
    document.getElementById("ballsLeft").innerText = `Balls Left: ${ballsLeft}`;
  } else {
    document.getElementById("targetInfo").innerText = "";
    document.getElementById("ballsLeft").innerText = `Balls Left: ${maxOvers * 6 - d.balls}`;
  }

  // Timeline
  const timelineDiv = document.getElementById("timeline");
  timelineDiv.innerHTML = "";
  d.oversTimeline.forEach(over => {
    const overDiv = document.createElement("div");
    overDiv.classList.add("timeline-over");

    const title = document.createElement("span");
    title.classList.add("timeline-over-title");
    title.innerText = over.title;
    overDiv.appendChild(title);

    over.balls.forEach(b => {
      const ball = document.createElement("span");
      ball.classList.add("timeline-ball");
      if (b.type) ball.classList.add(b.type);
      ball.innerText = b.value;
      overDiv.appendChild(ball);
    });

    timelineDiv.appendChild(overDiv);
  });

  if (d.currentOverBalls.length > 0) {
    const currentOverDiv = document.createElement("div");
    currentOverDiv.classList.add("timeline-over");

    const title = document.createElement("span");
    title.classList.add("timeline-over-title");
    title.innerText = `Over ${Math.floor(d.balls / 6) + 1}`;
    currentOverDiv.appendChild(title);

    d.currentOverBalls.forEach(b => {
      const ball = document.createElement("span");
      ball.classList.add("timeline-ball");
      if (b.type) ball.classList.add(b.type);
      ball.innerText = b.value;
      currentOverDiv.appendChild(ball);
    });

    timelineDiv.appendChild(currentOverDiv);
  }

  checkWinner();
}

// --- Check winner ---
function checkWinner() {
  const matchDiv = document.getElementById("matchResult");

  if (innings[1].ended && innings[2].ended) {
    if (innings[2].runs >= target) matchDiv.innerText = `🎉 2nd Innings team won by ${maxWickets - innings[2].wickets} wickets!`;
    else if (innings[2].runs === target - 1) matchDiv.innerText = `🤝 Match Tied!`;
    else matchDiv.innerText = `🏆 1st Innings team won by ${target - innings[2].runs - 1} runs!`;
  } else if (innings[1].ended && currentInnings === 2 && innings[2].runs >= target) {
    matchDiv.innerText = `🎉 2nd Innings team won by ${maxWickets - innings[2].wickets} wickets!`;
  } else matchDiv.innerText = "";
}

// --- Undo last ball ---
function undoLastBall() {
  if (historyStack.length === 0) return;
  const lastState = historyStack.pop();
  const parsed = JSON.parse(lastState);
  Object.assign(innings[1], parsed[1]);
  Object.assign(innings[2], parsed[2]);
  updateDisplay();
}

// --- Reset match ---
function resetMatch() {
  if (!confirm("Are you sure you want to reset the entire match?")) return;

  historyStack = [];
  target = null;
  innings[1] = { runs: 0, wickets: 0, balls: 0, overBalls: 0, overRuns: 0, oversTimeline: [], currentOverBalls: [], ended: false };
  innings[2] = { runs: 0, wickets: 0, balls: 0, overBalls: 0, overRuns: 0, oversTimeline: [], currentOverBalls: [], ended: false };
  currentInnings = 1;

  document.querySelector('.setup').style.display = 'block';
  document.getElementById('scoreboard').style.display = 'none';
  document.getElementById("matchResult").innerText = "";
}

