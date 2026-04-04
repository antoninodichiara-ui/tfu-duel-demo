let score = 0;

function compare(playerValue) {
  let enemyValue = Math.floor(Math.random() * 100);

  if (playerValue > enemyValue) {
    setResult('win');
  } else if (playerValue < enemyValue) {
    setResult('lose');
  } else {
    setResult('draw');
  }
}

function setResult(result) {
  let text = document.getElementById("resultText");

  if (result === 'win') {
    text.innerText = "You Win!";
    score++;
  } else if (result === 'lose') {
    text.innerText = "You Lose!";
  } else {
    text.innerText = "Draw!";
  }

  document.getElementById("score").innerText = score;
}
