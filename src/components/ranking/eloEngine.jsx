// Elo Rating Engine for song ranking

const K_FACTOR = 32;
const DEFAULT_RATING = 1400;

export function calculateElo(winnerRating, loserRating) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  const newWinnerRating = winnerRating + K_FACTOR * (1 - expectedWinner);
  const newLoserRating = loserRating + K_FACTOR * (0 - expectedLoser);
  
  return {
    winner: Math.round(newWinnerRating * 10) / 10,
    loser: Math.round(Math.max(newLoserRating, 100) * 10) / 10,
  };
}

export function calculateEloDraw(ratingA, ratingB) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));
  
  return {
    a: Math.round((ratingA + K_FACTOR * (0.5 - expectedA)) * 10) / 10,
    b: Math.round((ratingB + K_FACTOR * (0.5 - expectedB)) * 10) / 10,
  };
}

export function generateBattlePairs(songIds) {
  // Generate all unique pairs then shuffle for randomness
  const pairs = [];
  for (let i = 0; i < songIds.length; i++) {
    for (let j = i + 1; j < songIds.length; j++) {
      pairs.push([songIds[i], songIds[j]]);
    }
  }
  // Fisher-Yates shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

// For large song counts, generate a reduced set of smart battles
export function generateSmartBattlePairs(songIds, roundsMultiplier = 3) {
  const totalBattles = songIds.length * roundsMultiplier;
  const pairs = [];
  const usedPairs = new Set();
  
  // Ensure each song appears at least roundsMultiplier*2 times
  const shuffled = [...songIds];
  
  for (let round = 0; round < roundsMultiplier; round++) {
    // Shuffle the array each round
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Pair adjacent songs
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const key = [shuffled[i], shuffled[i + 1]].sort().join("-");
      if (!usedPairs.has(key)) {
        usedPairs.add(key);
        pairs.push([shuffled[i], shuffled[i + 1]]);
      }
    }
  }
  
  // Add some random extra pairs to fill gaps
  let attempts = 0;
  while (pairs.length < totalBattles && attempts < 500) {
    const a = songIds[Math.floor(Math.random() * songIds.length)];
    const b = songIds[Math.floor(Math.random() * songIds.length)];
    if (a !== b) {
      const key = [a, b].sort().join("-");
      if (!usedPairs.has(key)) {
        usedPairs.add(key);
        pairs.push([a, b]);
      }
    }
    attempts++;
  }
  
  // Final shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  
  return pairs;
}

export function initializeRatings(songIds) {
  const ratings = {};
  songIds.forEach(id => {
    ratings[id] = DEFAULT_RATING;
  });
  return ratings;
}

export function getRankedSongs(ratings, songsMap) {
  return Object.entries(ratings)
    .sort(([, a], [, b]) => b - a)
    .map(([id, rating], index) => ({
      ...songsMap[id],
      rank: index + 1,
      eloRating: rating,
    }));
}