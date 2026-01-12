const fs = require('fs');
const path = require('path');

// Simple file-based persistence or in-memory for MVP
class VolleyState {
  constructor() {
    this.matches = [];
    this.activeMatchId = null;
    // No demo match
  }

  createMatch(data) {
    const id = 'match_' + Date.now();
    const newMatch = {
      id,
      ...data,
      sets: [], // History of set scores: [{home: 25, away: 23, winner: 'home'}]
      currentSet: 1,
      scores: { home: 0, away: 0 },
      servingTeam: null,
      winner: null,
      // Default config if not provided
      config: {
        bestOf: 3,
        setPoints: 25,
        tieBreakPoints: 15,
        ...data.config
      }
    };
    this.matches.push(newMatch);
    if (!this.activeMatchId) {
      this.activeMatchId = id;
    }
    return newMatch;
  }

  getMatch(id) {
    return this.matches.find(m => m.id === id);
  }

  getAllMatches() {
    return {
      matches: this.matches,
      activeMatchId: this.activeMatchId
    };
  }

  updateScore(matchId, team, delta) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    if (match.winner) return match; // Match is already over

    if (team === 'home') match.scores.home += delta;
    if (team === 'away') match.scores.away += delta;

    // Prevent negative scores
    if (match.scores.home < 0) match.scores.home = 0;
    if (match.scores.away < 0) match.scores.away = 0;

    return match;
  }

  updateMatch(matchId, data) {
    const index = this.matches.findIndex(m => m.id === matchId);
    if (index === -1) return null;

    this.matches[index] = { ...this.matches[index], ...data };
    return this.matches[index];
  }

  startNewSet(matchId) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    // 1. Determine winner of current set based on config
    const home = match.scores.home;
    const away = match.scores.away;
    const cfg = match.config;

    // Default target points
    let pointsToWin = parseInt(cfg.setPoints);

    // Tie-break rule: If it's the deciding set
    if (match.currentSet === parseInt(cfg.bestOf)) {
      pointsToWin = parseInt(cfg.tieBreakPoints);
    }

    let winner = null;
    // Win condition: Reach points AND lead by 2
    if (home >= pointsToWin && (home - away) >= 2) winner = 'home';
    else if (away >= pointsToWin && (away - home) >= 2) winner = 'away';
    else {
      // Fallback if manually triggered without strict win condition, or forcing a premature set end
      if (home > away) winner = 'home';
      else if (away > home) winner = 'away';
    }

    // Archive current set
    match.sets.push({
      setNumber: match.currentSet,
      home,
      away,
      winner
    });

    // Check Match Over
    const homeSets = match.sets.filter(s => s.winner === 'home').length;
    const awaySets = match.sets.filter(s => s.winner === 'away').length;
    const setsToWin = Math.ceil(parseInt(cfg.bestOf) / 2);

    if (homeSets >= setsToWin) match.winner = 'home';
    else if (awaySets >= setsToWin) match.winner = 'away';
    else {
      // Reset for next set
      match.currentSet += 1;
      match.scores = { home: 0, away: 0 };
      match.servingTeam = null;
    }

    return match;
  }

  setServingTeam(matchId, team) {
    const match = this.getMatch(matchId);
    if (!match) return null;
    match.servingTeam = team;
    return match;
  }

  resetMatch(matchId) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    match.scores = { home: 0, away: 0 };
    match.sets = [];
    match.currentSet = 1;
    match.servingTeam = null;
    match.winner = null;

    return match;
  }
}

module.exports = new VolleyState();
