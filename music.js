export function handlePlayMusic(player1, player2) {
  // This function simulates a music battle between two players
  // It randomly selects a winner and returns the result
  const players = [player1, player2];
  const winnerIndex = Math.floor(Math.random() * players.length);
  const winner = players[winnerIndex];
  const loser = players[(winnerIndex + 1) % players.length];

  return {
    winner: winner,
    loser: loser,
    message: `<@${winner.id}> wins the music battle against <@${loser.id}>! 🎶`
  };
}