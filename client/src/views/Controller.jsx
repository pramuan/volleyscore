import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socket } from '../socket';
import { ChevronLeft, Plus, Minus, RotateCcw, CircleDot, Trophy, Shield } from 'lucide-react';

function Controller() {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);
    const [connected, setConnected] = useState(false);

    const getFileUrl = (record, filename) => {
        if (!record || !filename) return null;
        return `http://127.0.0.1:8090/api/files/${record.collectionId}/${record.id}/${filename}`;
    };

    useEffect(() => {
        document.title = 'VolleyScore Controller';
        socket.emit('join_match', matchId);
        setConnected(socket.connected);

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join_match', matchId);
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('init_state', (state) => {
            const m = state.matches.find(m => m.id === matchId);
            setMatch(m);
        });

        socket.on('matches_updated', (state) => {
            const m = state.matches.find(m => m.id === matchId);
            setMatch(m);
        });

        socket.on('match_update', (updatedMatch) => {
            if (updatedMatch.id === matchId) {
                setMatch(updatedMatch);
            }
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('init_state');
            socket.off('matches_updated');
            socket.off('match_update');
        };
    }, [matchId]);

    const updateScore = (team, delta) => {
        socket.emit('update_score', { matchId, team, delta });
    };

    const startNewSet = () => {
        if (confirm("Start a new set? Current scores will be archived.")) {
            socket.emit('start_new_set', matchId);
        }
    };

    const resetMatch = () => {
        if (confirm("RESET MATCH? This will clear all sets and scores.")) {
            socket.emit('reset_match', matchId);
        }
    };

    const setServing = (team) => {
        // Optimistic update for instant feedback
        setMatch(prev => ({ ...prev, servingTeam: team }));
        socket.emit('set_serving_team', { matchId, team });
    };

    const setCourtSide = (side) => {
        // side = 'home_left' or 'away_left'
        // Optimistic update
        setMatch(prev => ({ ...prev, leftSideTeam: side === 'home_left' ? 'home' : 'away' }));
        socket.emit('update_match_details', { matchId, data: { leftSideTeam: side === 'home_left' ? 'home' : 'away' } });
    };

    if (!match) return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">Loading match context...</div>;

    // Helper to check game state
    const cfg = match.config || { bestOf: 3, setPoints: 25, tieBreakPoints: 15 };
    const bestOf = parseInt(cfg.bestOf);
    const isTieBreak = match.currentSet === bestOf;
    const targetPoints = isTieBreak ? parseInt(cfg.tieBreakPoints) : parseInt(cfg.setPoints);

    // Check for Set Point / Match Point / Set Won
    const checkState = (myScore, opScore) => {
        if (myScore >= targetPoints && (myScore - opScore) >= 2) return 'WON';
        if (myScore >= targetPoints - 1 && (myScore > opScore)) return 'SET_POINT';
        return null;
    };

    const homeState = checkState(match.scores.home, match.scores.away);
    const awayState = checkState(match.scores.away, match.scores.home);
    const anySetWon = homeState === 'WON' || awayState === 'WON';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
            {/* Navbar */}
            <nav className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
                <Link to="/management" className="p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="font-bold text-gray-800 text-lg leading-tight">{match.name}</h1>
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                        <span>Set {match.currentSet}</span>
                        <span className="text-gray-300">•</span>
                        <span>Best of {bestOf}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {match.is_live && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 ring-1 ring-green-600/20 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                            LIVE ON AIR
                        </div>
                    )}
                    {!connected && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-600/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            OFFLINE
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Control Area */}
            <main className="flex-1 p-4 lg:p-8 flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-7xl mx-auto w-full">

                {/* Home Team Card */}
                <div className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col relative transition-all ring-4 ring-transparent duration-300"
                    style={match.servingTeam === 'home' ? { ringColor: '#3b82f6', boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)' } : {}}>

                    {/* Service Toggle Area */}
                    <button
                        onClick={() => setServing('home')}
                        className={`bg-gradient-to-r from-blue-600 to-blue-500 p-4 lg:p-6 text-white text-center w-full relative transition-colors ${match.servingTeam === 'home' ? 'brightness-110' : 'brightness-90 opacity-90'}`}
                    >
                        <h2 className="text-xl lg:text-2xl font-bold tracking-tight uppercase truncate drop-shadow-sm flex items-center justify-center gap-3">
                            {match.servingTeam === 'home' && <CircleDot className="animate-pulse" />}
                            {match.homeLogo ? (
                                <img src={getFileUrl(match, match.homeLogo)} className="w-8 h-8 object-contain bg-white rounded-full p-0.5" alt="" />
                            ) : (
                                <Shield className="w-6 h-6 opacity-50" />
                            )}
                            {match.homeTeam}
                        </h2>
                        {match.servingTeam === 'home' && <div className="absolute top-2 right-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">SERVING</div>}
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-12 relative">
                        {/* Status Badge */}
                        {homeState && (
                            <div className={`absolute top-4 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase animate-pulse ${homeState === 'WON' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {homeState === 'WON' ? 'Set Won' : 'Set Point'}
                            </div>
                        )}

                        <div className="text-[12rem] lg:text-[14rem] leading-none font-bold text-slate-800 tracking-tighter tabular-nums">
                            {match.scores.home}
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={() => updateScore('home', 1)}
                                className="h-32 bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center text-white"
                            >
                                <Plus size={56} strokeWidth={3} />
                            </button>
                            <button
                                onClick={() => updateScore('home', -1)}
                                className="h-32 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500"
                            >
                                <Minus size={40} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                    {/* Bottom Indicators */}
                    <div className="bg-slate-50 p-4 border-t border-gray-100 flex justify-center">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                            <span>SETS:</span>
                            <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full flex items-center gap-1">
                                <Trophy size={14} />
                                {match.sets.filter(s => s.winner === 'home').length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* VS Divider (Desktop) / Spacer (Mobile) */}
                {/* VS Divider / Court Side Toggles */}
                <div className="flex flex-col items-center justify-center gap-4 text-gray-300 font-black text-xs italic">
                    <div className="text-3xl lg:text-4xl text-slate-300 transform -skew-x-12 mb-8">VS</div>
                    <div className="flex flex-col gap-1 items-center">
                        <span className="opacity-50 text-[10px] not-italic font-sans font-medium uppercase tracking-wider text-slate-400">Court Side</span>
                        <button
                            onClick={() => setCourtSide('home_left')}
                            className={`p-2 rounded-lg transition-all ${(!match.leftSideTeam || match.leftSideTeam === 'home') ? 'bg-slate-800 text-white shadow-md scale-110' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                            title="Home is Left"
                        >
                            <div className="flex gap-1 h-3 items-center">
                                <div className="w-1 h-full bg-current rounded-full"></div>
                                <div className="w-3 h-full border border-current rounded-sm opacity-50"></div>
                            </div>
                        </button>
                        <button
                            onClick={() => setCourtSide('away_left')}
                            className={`p-2 rounded-lg transition-all ${match.leftSideTeam === 'away' ? 'bg-slate-800 text-white shadow-md scale-110' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                            title="Away is Left"
                        >
                            <div className="flex gap-1 h-3 items-center flex-row-reverse">
                                <div className="w-1 h-full bg-current rounded-full"></div>
                                <div className="w-3 h-full border border-current rounded-sm opacity-50"></div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Away Team Card */}
                <div className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col relative transition-all ring-4 ring-transparent duration-300"
                    style={match.servingTeam === 'away' ? { ringColor: '#ef4444', boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.3)' } : {}}>

                    <button
                        onClick={() => setServing('away')}
                        className={`bg-gradient-to-r from-red-600 to-red-500 p-4 lg:p-6 text-white text-center w-full relative transition-colors ${match.servingTeam === 'away' ? 'brightness-110' : 'brightness-90 opacity-90'}`}
                    >
                        <h2 className="text-xl lg:text-2xl font-bold tracking-tight uppercase truncate drop-shadow-sm flex items-center justify-center gap-3">
                            {match.servingTeam === 'away' && <CircleDot className="animate-pulse" />}
                            {match.awayLogo ? (
                                <img src={getFileUrl(match, match.awayLogo)} className="w-8 h-8 object-contain bg-white rounded-full p-0.5" alt="" />
                            ) : (
                                <Shield className="w-6 h-6 opacity-50" />
                            )}
                            {match.awayTeam}
                        </h2>
                        {match.servingTeam === 'away' && <div className="absolute top-2 right-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">SERVING</div>}
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-12 relative">
                        {/* Status Badge */}
                        {awayState && (
                            <div className={`absolute top-4 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase animate-pulse ${awayState === 'WON' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {awayState === 'WON' ? 'Set Won' : 'Set Point'}
                            </div>
                        )}

                        <div className="text-[12rem] lg:text-[14rem] leading-none font-bold text-slate-800 tracking-tighter tabular-nums">
                            {match.scores.away}
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={() => updateScore('away', 1)}
                                className="h-32 bg-red-500 hover:bg-red-600 active:scale-95 transition-all rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center text-white"
                            >
                                <Plus size={56} strokeWidth={3} />
                            </button>
                            <button
                                onClick={() => updateScore('away', -1)}
                                className="h-32 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500"
                            >
                                <Minus size={40} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                    {/* Bottom Indicators */}
                    <div className="bg-slate-50 p-4 border-t border-gray-100 flex justify-center">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                            <span>SETS:</span>
                            <span className="bg-red-100 text-red-700 px-3 py-0.5 rounded-full flex items-center gap-1">
                                <Trophy size={14} />
                                {match.sets.filter(s => s.winner === 'away').length}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer / Global Actions */}
            <footer className="p-4 lg:p-8 flex justify-center gap-4 max-w-lg mx-auto w-full">
                <button
                    className={`flex-1 py-3 px-6 rounded-xl font-bold active:scale-95 transition-all shadow-sm ${anySetWon ? 'bg-green-600 text-white hover:bg-green-700 animate-bounce' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                    onClick={startNewSet}
                >
                    {anySetWon ? 'Confirm Set & Next' : 'New Set'}
                </button>
                <button
                    className="flex-1 py-3 px-6 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 active:scale-95 transition-colors flex items-center justify-center gap-2"
                    onClick={resetMatch}
                >
                    <RotateCcw size={18} /> Reset
                </button>
            </footer>
        </div>
    );
}

export default Controller;
