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

    // Extract and parse config values with defaults
    const config = data.config || {};
    const matchConfig = {
      bestOf: parseInt(config.bestOf) || 3,
      setPoints: parseInt(config.setPoints) || 25,
      tieBreakPoints: parseInt(config.tieBreakPoints) || 15,
      homeColor: config.homeColor || '#1d4ed8',
      awayColor: config.awayColor || '#b91c1c'
    };

    const newMatch = {
      id, // Use the generated ID
      name: data.name || 'Untitled Match',
      homeTeam: data.homeTeam || 'Home',
      awayTeam: data.awayTeam || 'Away',
      homeLogo: data.homeLogo || null,
      awayLogo: data.awayLogo || null,
      backgroundImage: data.backgroundImage || null,
      pin: data.pin || null, // Capture PIN
      sets: [], // History of set scores: [{home: 25, away: 23, winner: 'home'}]
      currentSet: 1,
      scores: { home: 0, away: 0 },
      servingTeam: null,
      winner: null,
      config: matchConfig,
      lastActive: Date.now(), // Track for cleanup
      history: [], // For Undo feature
      timeout: { active: false, startTime: 0, duration: 30000 } // Timeout state
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


  saveSnapshot(match) {
    // Deep clone match state (excluding history to prevent recursion)
    // We only need to save specific state fields
    const snapshot = {
      scores: { ...match.scores },
      sets: JSON.parse(JSON.stringify(match.sets)),
      currentSet: match.currentSet,
      servingTeam: match.servingTeam,
      winner: match.winner
    };

    if (!match.history) match.history = [];
    match.history.push(snapshot);

    // Limit history to 5 items
    if (match.history.length > 5) {
      match.history.shift();
    }
  }

  undo(matchId) {
    const match = this.getMatch(matchId);
    if (!match || !match.history || match.history.length === 0) return match; // Nothing to undo

    const previousState = match.history.pop();

    // Restore state
    match.scores = previousState.scores;
    match.sets = previousState.sets;
    match.currentSet = previousState.currentSet;
    match.servingTeam = previousState.servingTeam;
    match.winner = previousState.winner;

    match.lastActive = Date.now();
    return match;
  }

  updateScore(matchId, team, delta) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    if (match.winner) return match; // Match is already over

    this.saveSnapshot(match); // Save state before change

    if (team === 'home') match.scores.home += delta;
    if (team === 'away') match.scores.away += delta;

    // Prevent negative scores
    if (match.scores.home < 0) match.scores.home = 0;
    if (match.scores.away < 0) match.scores.away = 0;

    match.lastActive = Date.now();
    return match;
  }

  updateMatch(matchId, data) {
    const index = this.matches.findIndex(m => m.id === matchId);
    if (index === -1) return null;

    this.saveSnapshot(this.matches[index]); // Save state before change
    this.matches[index] = { ...this.matches[index], ...data, lastActive: Date.now() };
    return this.matches[index];
  }

  startNewSet(matchId) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    this.saveSnapshot(match); // Save state before change

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

    match.lastActive = Date.now();
    return match;
  }

  setServingTeam(matchId, team) {
    const match = this.getMatch(matchId);
    if (!match) return null;
    this.saveSnapshot(match); // Save state before change
    match.servingTeam = team;
    match.lastActive = Date.now();
    return match;
  }

  resetMatch(matchId) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    this.saveSnapshot(match); // Save state before change

    match.scores = { home: 0, away: 0 };
    match.sets = [];
    match.currentSet = 1;
    match.servingTeam = null;
    match.winner = null;

    match.lastActive = Date.now();
    return match;
  }



  startTimeout(matchId) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    match.timeout = {
      active: true,
      startTime: Date.now(),
      duration: 30000 // 30 seconds
    };

    match.lastActive = Date.now();
    return match;
  }

  stopTimeout(matchId) {
    const match = this.getMatch(matchId);
    if (!match) return null;

    match.timeout.active = false;

    match.lastActive = Date.now();
    return match;
  }

  cleanupMatches() {
    const NOW = Date.now();
    const TIMEOUT = 24 * 60 * 60 * 1000; // 24 Hours
    const initialCount = this.matches.length;

    this.matches = this.matches.filter(m => {
      // Keep if active recently
      const lastActive = m.lastActive || 0;
      return (NOW - lastActive) < TIMEOUT;
    });

    const removedCount = initialCount - this.matches.length;
    if (removedCount > 0) {
      console.log(`[Memory Cleanup] Removed ${removedCount} inactive matches from RAM.`);
    }
  }
}

module.exports = new VolleyState();
