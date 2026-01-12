import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socket } from '../socket';
import { ChevronLeft, Plus, Minus, RotateCcw, CircleDot, Trophy, Shield, ArrowLeftRight, Undo2, Timer, X, StepForward, Check, Award } from 'lucide-react';
import toast from 'react-hot-toast';

// Session Management Constants
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const SESSION_KEY = 'volleyscore_sessions';

// Session Helper Functions
const getSession = (matchId) => {
    try {
        const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
        const session = sessions[matchId];

        if (!session) return null;

        const now = Date.now();
        if (now > session.expiresAt) {
            // Session expired
            clearSession(matchId);
            return null;
        }

        return session;
    } catch (e) {
        return null;
    }
};

const createSession = (matchId) => {
    try {
        const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
        const now = Date.now();

        sessions[matchId] = {
            authenticated: true,
            lastActivity: now,
            expiresAt: now + SESSION_TIMEOUT
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to create session:', e);
    }
};

const updateActivity = (matchId) => {
    try {
        const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
        const session = sessions[matchId];

        if (session) {
            const now = Date.now();
            session.lastActivity = now;
            session.expiresAt = now + SESSION_TIMEOUT;
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
        }
    } catch (e) {
        console.error('Failed to update activity:', e);
    }
};

const clearSession = (matchId) => {
    try {
        const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
        delete sessions[matchId];
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to clear session:', e);
    }
};

function Controller() {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);
    const [connected, setConnected] = useState(false);
    const [matchNotFound, setMatchNotFound] = useState(false);

    // PIN Logic - must be at top level
    const [pinInput, setPinInput] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isPinError, setIsPinError] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        const session = getSession(matchId);
        if (session) {
            setIsUnlocked(true);
        }
    }, [matchId]);

    const getFileUrl = (record, filename) => {
        if (!record || !filename) return null;
        return `http://${window.location.hostname}:8090/api/files/${record.collectionId}/${record.id}/${filename}`;
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
            if (m) {
                setMatch(m);
                setMatchNotFound(false);
            } else {
                setMatchNotFound(true);
            }
        });

        socket.on('matches_updated', (state) => {
            const m = state.matches.find(m => m.id === matchId);
            if (m) {
                setMatch(m);
                setMatchNotFound(false);
            } else {
                setMatchNotFound(true);
            }
        });

        socket.on('match_update', (updatedMatch) => {
            if (updatedMatch.id === matchId) {
                setMatch(updatedMatch);
                setMatchNotFound(false);
            }
        });

        socket.on('match_not_found', ({ matchId: deletedMatchId }) => {
            if (deletedMatchId === matchId) {
                setMatchNotFound(true);
                setMatch(null);
            }
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('init_state');
            socket.off('matches_updated');
            socket.off('match_update');
            socket.off('match_not_found');
        };
    }, [matchId]);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        // If match has no pin, or input matches pin
        if (!match?.pin || pinInput === match.pin) {
            setIsUnlocked(true);
            setIsPinError(false);
            createSession(matchId); // Create session on successful PIN entry
            toast.success("Controller Unlocked");
        } else {
            setIsPinError(true);
            toast.error("Incorrect PIN");
            setPinInput('');
        }
    };

    const updateScore = (team, delta) => {
        updateActivity(matchId); // Track activity
        socket.emit('update_score', { matchId, team, delta });
    };

    const handleUndo = () => {
        updateActivity(matchId); // Track activity
        socket.emit('undo', matchId);
        toast.success("Action Undone");
    };

    const toggleTimeout = () => {
        updateActivity(matchId); // Track activity
        if (match.timeout?.active) {
            socket.emit('stop_timeout', matchId);
            toast.success("Timeout Cancelled");
        } else {
            socket.emit('start_timeout', matchId);
            toast.success("Timeout Started");
        }
    };

    const toggleFinalResult = () => {
        updateActivity(matchId); // Track activity
        socket.emit('toggle_final_result', matchId);
        toast.success(match.showFinalResult ? "Showing Scoreboard" : "Showing Final Result");
    };

    const startNewSet = () => {
        updateActivity(matchId); // Track activity
        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">Start a New Set?</span>
                <span className="text-xs text-gray-500">Current scores will be archived.</span>
                <div className="flex gap-2 mt-1">
                    <button
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition-colors"
                        onClick={() => {
                            toast.dismiss(t.id);
                            socket.emit('start_new_set', matchId);
                        }}
                    >
                        Confirm
                    </button>
                    <button
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 4000,
            style: {
                minWidth: '250px',
            },
        });
    };

    const resetMatch = () => {
        updateActivity(matchId); // Track activity
        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm text-red-600">RESET MATCH?</span>
                <span className="text-xs text-gray-500">This will CLEAR ALL scores and sets.</span>
                <div className="flex gap-2 mt-1">
                    <button
                        className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600 transition-colors"
                        onClick={() => {
                            toast.dismiss(t.id);
                            socket.emit('reset_match', matchId);
                            toast.success("Match has been reset.");
                        }}
                    >
                        Yes, Reset Everything
                    </button>
                    <button
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                minWidth: '280px',
                border: '1px solid #fee2e2'
            },
        });
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

    // Match Not Found Error Page
    if (matchNotFound) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Match Not Found</h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        The match you're looking for doesn't exist or has been deleted.
                    </p>
                    <Link
                        to="/management"
                        className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30"
                    >
                        Back to Management
                    </Link>
                </div>
            </div>
        );
    }

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

    // PIN LOCK SCREEN
    if (match && match.pin && !isUnlocked) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Controller Locked</h2>
                    <p className="text-gray-500 mb-6 text-sm">Enter the 4-digit PIN to access score controls for <strong>{match.name}</strong>.</p>

                    <form onSubmit={handlePinSubmit} className="flex flex-col gap-4 w-fit mx-auto">
                        <div className="flex gap-3 justify-center">
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    autoFocus={index === 0}
                                    value={pinInput[index] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 1) {
                                            const newPin = pinInput.split('');
                                            newPin[index] = val;
                                            setPinInput(newPin.join(''));
                                            setIsPinError(false);

                                            // Auto-focus next input
                                            if (val && index < 3) {
                                                const nextInput = e.target.parentElement.children[index + 1];
                                                if (nextInput) nextInput.focus();
                                            }
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        // Handle backspace to go to previous input
                                        if (e.key === 'Backspace' && !pinInput[index] && index > 0) {
                                            const prevInput = e.target.parentElement.children[index - 1];
                                            if (prevInput) prevInput.focus();
                                        }
                                    }}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                                        if (pastedData) {
                                            setPinInput(pastedData);
                                            setIsPinError(false);
                                            // Focus the last filled input or the last input if full
                                            const focusIndex = Math.min(pastedData.length, 3);
                                            const inputs = e.target.parentElement.children;
                                            if (inputs[focusIndex]) {
                                                inputs[focusIndex].focus();
                                            }
                                        }
                                    }}
                                    className={`w-16 h-16 text-center text-2xl font-bold border-2 rounded-xl focus:ring-4 focus:outline-none transition-all ${isPinError
                                        ? 'border-red-500 focus:ring-red-100 bg-red-50'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                                        }`}
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30"
                        >
                            Unlock Controller
                        </button>
                    </form>
                    <Link to="/management" className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-600">
                        Back to Management
                    </Link>
                </div>
            </div>
        );
    }

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
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Court {match.config?.courtId || '1'}</span>
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

                {/* Dynamic Sides Render */}
                {(() => {
                    const leftTeamKey = (!match.leftSideTeam || match.leftSideTeam === 'home') ? 'home' : 'away';
                    const rightTeamKey = leftTeamKey === 'home' ? 'away' : 'home';
                    const sides = [leftTeamKey, rightTeamKey];

                    return sides.map((teamKey, index) => {
                        const isHome = teamKey === 'home';
                        const teamName = isHome ? match.homeTeam : match.awayTeam;
                        const teamLogo = isHome ? match.homeLogo : match.awayLogo;
                        const score = isHome ? match.scores.home : match.scores.away;
                        const setsWon = match.sets.filter(s => s.winner === teamKey).length;
                        const isServing = match.servingTeam === teamKey;
                        const state = isHome ? homeState : awayState;
                        const color = isHome ? (match.config?.homeColor || '#3b82f6') : (match.config?.awayColor || '#ef4444');

                        return (
                            <React.Fragment key={teamKey}>
                                {/* Team Card */}
                                <div className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col relative transition-all ring-4 ring-transparent duration-300"
                                    style={isServing ? { ringColor: color, boxShadow: `0 0 0 4px ${color}4d` } : {}}>

                                    {/* Service Toggle Area */}
                                    <button
                                        onClick={() => setServing(teamKey)}
                                        style={{ background: `linear-gradient(to right, ${color}, ${color}dd)` }}
                                        className={`p-4 lg:p-6 text-white text-center w-full relative transition-colors ${isServing ? 'brightness-110' : 'brightness-90 opacity-90'}`}
                                    >
                                        <h2 className="text-xl lg:text-2xl font-bold tracking-tight uppercase truncate drop-shadow-sm flex items-center justify-center gap-3">
                                            {isServing && <CircleDot className="animate-pulse" />}
                                            {teamLogo ? (
                                                <img src={getFileUrl(match, teamLogo)} className="w-8 h-8 object-contain bg-white rounded-full p-0.5" alt="" />
                                            ) : (
                                                <Shield className="w-6 h-6 opacity-50" />
                                            )}
                                            {teamName}
                                        </h2>
                                        {isServing && <div className="absolute top-2 right-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">SERVING</div>}
                                    </button>

                                    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-12 relative">
                                        {/* Status Badge */}
                                        {state && (
                                            <div className={`absolute top-4 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase animate-pulse ${state === 'WON' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {state === 'WON' ? 'Set Won' : 'Set Point'}
                                            </div>
                                        )}

                                        <div className="text-[12rem] lg:text-[14rem] leading-none font-bold text-slate-800 tracking-tighter tabular-nums">
                                            {score}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <button
                                                onClick={() => updateScore(teamKey, 1)}
                                                disabled={match.winner}
                                                style={{ backgroundColor: color }}
                                                className={`h-32 active:scale-95 transition-all rounded-2xl shadow-lg shadow-black/10 flex items-center justify-center text-white ${match.winner ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:brightness-110'}`}
                                            >
                                                <Plus size={56} strokeWidth={3} />
                                            </button>
                                            <button
                                                onClick={() => updateScore(teamKey, -1)}
                                                disabled={match.winner}
                                                className={`h-32 bg-slate-100 active:scale-95 transition-all rounded-xl flex items-center justify-center text-slate-400 ${match.winner ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200 hover:text-red-500'}`}
                                            >
                                                <Minus size={40} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Bottom Indicators */}
                                    <div className="bg-slate-50 p-4 border-t border-gray-100 flex justify-center">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                            <span>SETS:</span>
                                            <span
                                                style={{ color: color, backgroundColor: `${color}20` }}
                                                className="px-3 py-0.5 rounded-full flex items-center gap-1"
                                            >
                                                <Trophy size={14} />
                                                {setsWon}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider / Controls (Only render after first element) */}
                                {index === 0 && (
                                    <div className="flex flex-col items-center justify-center gap-4 text-gray-300 font-black text-xs italic">
                                        <div className="text-6xl lg:text-8xl text-slate-300 transform -skew-x-12 mb-8">VS</div>
                                        <div className="flex flex-col gap-2 items-center">
                                            <span className="opacity-60 text-sm not-italic font-sans font-black uppercase tracking-widest text-slate-400">SWAP</span>
                                            <button
                                                onClick={() => setCourtSide((!match.leftSideTeam || match.leftSideTeam === 'home') ? 'away_left' : 'home_left')}
                                                className="p-4 rounded-2xl bg-slate-800 text-white shadow-lg hover:bg-slate-700 active:scale-95 transition-all flex flex-col items-center gap-2 group"
                                                title="Switch Court Sides"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Visual Court Representation */}
                                                    {/* Left Bar */}
                                                    <div className="w-3 h-8 border-2 border-white/50 rounded-sm transition-colors duration-300"
                                                        style={{
                                                            backgroundColor: (!match.leftSideTeam || match.leftSideTeam === 'home')
                                                                ? (match.config?.homeColor || '#3b82f6') + '40'
                                                                : (match.config?.awayColor || '#ef4444') + '40'
                                                        }}>
                                                    </div>

                                                    <ArrowLeftRight size={24} className="group-hover:scale-110 transition-transform duration-300" />

                                                    {/* Right Bar */}
                                                    <div className="w-3 h-8 border-2 border-white/50 rounded-sm transition-colors duration-300"
                                                        style={{
                                                            backgroundColor: (!match.leftSideTeam || match.leftSideTeam === 'home')
                                                                ? (match.config?.awayColor || '#ef4444') + '40'
                                                                : (match.config?.homeColor || '#3b82f6') + '40'
                                                        }}>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    });
                })()}
            </main>

            {/* Footer / Global Actions */}
            <footer className={`p-4 lg:p-8 grid gap-2 max-w-5xl mx-auto w-full ${!match.winner ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {!match.winner ? (
                    <>
                        <button
                            className={`w-full py-3 px-1 rounded-xl font-bold active:scale-95 transition-all shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5 ${anySetWon ? 'bg-green-600 text-white hover:bg-green-700 animate-bounce' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                            onClick={startNewSet}
                        >
                            {anySetWon ? <Check size={16} className="shrink-0" /> : <StepForward size={16} className="shrink-0" />}
                            <span className="text-[10px] sm:text-xs lg:text-sm">{anySetWon ? 'Confirm' : 'New Set'}</span>
                        </button>
                        <button
                            className={`w-full py-3 px-1 rounded-xl font-bold active:scale-95 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${match.timeout?.active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                            onClick={toggleTimeout}
                        >
                            {match.timeout?.active ? <X size={16} className="shrink-0" /> : <Timer size={16} className="shrink-0" />}
                            <span className="text-[10px] sm:text-xs lg:text-sm">{match.timeout?.active ? 'Stop' : 'Timeout'}</span>
                        </button>
                        <button
                            className="w-full py-3 px-1 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 active:scale-95 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                            onClick={handleUndo}
                        >
                            <Undo2 size={16} className="shrink-0" />
                            <span className="text-[10px] sm:text-xs lg:text-sm">Undo</span>
                        </button>
                    </>
                ) : (
                    <div className="w-full flex items-center justify-center bg-green-600 text-white py-3 px-1 rounded-xl shadow-lg gap-1.5 animate-in fade-in zoom-in duration-500">
                        <Trophy size={16} className="shrink-0" />
                        <span className="text-[10px] sm:text-xs lg:text-sm font-bold truncate">
                            {match.winner === 'home' ? match.homeTeam : match.awayTeam}
                        </span>
                    </div>
                )}

                <button
                    className="w-full py-3 px-1 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                    onClick={resetMatch}
                >
                    <RotateCcw size={16} className="shrink-0" />
                    <span className="text-[10px] sm:text-xs lg:text-sm">Reset</span>
                </button>
                {match.winner && (
                    <button
                        className={`w-full py-3 px-1 rounded-xl font-bold active:scale-95 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${match.showFinalResult ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        onClick={toggleFinalResult}
                    >
                        <Award size={16} className="shrink-0" />
                        <span className="text-[10px] sm:text-xs lg:text-sm">{match.showFinalResult ? 'Scoreboard' : 'Final Result'}</span>
                    </button>
                )}
            </footer>
        </div>
    );
}

export default Controller;
