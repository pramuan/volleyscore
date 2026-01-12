import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, CircleDot, Timer } from 'lucide-react';
import volleyBallIcon from '../assets/volleyball_48.png';
import { socket } from '../socket';

function Display({ forcedMatchId }) {
    const params = useParams();
    const matchId = forcedMatchId || params.matchId;
    const [match, setMatch] = useState(null);
    const [matchNotFound, setMatchNotFound] = useState(false);

    const getFileUrl = (record, filename) => {
        if (!record || !filename) return null;
        // Fallback to specific collection ID string if record.collectionId is missing (e.g. from older state)
        const collectionId = record.collectionId || 'volleyball_matches';
        return `http://${window.location.hostname}:8090/api/files/${collectionId}/${record.id}/${filename}`;
    };

    useEffect(() => {
        document.title = 'VolleyScore Display';
        console.log("Display Component Mounted. Match ID:", matchId);
        if (!socket.connected) {
            console.log("Socket disconnected, attempting to connect...");
            socket.connect();
        }

        socket.emit('join_match', matchId);

        const updateData = (m) => {
            console.log("Received match_update:", m);
            if (m.id === matchId) setMatch(m);
        };

        socket.on('connect', () => {
            console.log("Socket Connected:", socket.id);
            socket.emit('join_match', matchId);
        });

        socket.on('connect_error', (err) => {
            console.error("Socket Connection Error:", err);
        });

        socket.on('init_state', (state) => {
            console.log("Received init_state:", state);
            const m = state.matches.find(m => m.id === matchId);
            if (m) {
                console.log("Found match in init_state:", m);
                setMatch(m);
                setMatchNotFound(false);
            } else {
                console.warn("Match not found in init_state for ID:", matchId);
                setMatchNotFound(true);
            }
        });

        socket.on('matches_updated', (state) => {
            console.log("Received matches_updated:", state);
            const m = state.matches.find(m => m.id === matchId);
            if (m) {
                setMatch(m);
                setMatchNotFound(false);
            } else {
                setMatchNotFound(true);
            }
        });

        socket.on('match_not_found', ({ matchId: deletedMatchId }) => {
            if (deletedMatchId === matchId) {
                setMatchNotFound(true);
                setMatch(null);
            }
        });

        socket.on('match_update', updateData);

        // Apply transparent background to html/body
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';

        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('init_state');
            socket.off('matches_updated');
            socket.off('match_update');
            socket.off('match_not_found');
        };
    }, [matchId]);

    // Match Not Found Error Page
    if (matchNotFound) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white p-4">
                <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-700">
                    <div className="bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="text-red-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Match Not Found</h2>
                    <p className="text-slate-400 mb-6 text-sm">
                        The match you're looking for doesn't exist or has been deleted.
                    </p>
                    <div className="text-xs text-slate-500 font-mono">Match ID: {matchId}</div>
                </div>
            </div>
        );
    }

    if (!match) return (
        <div className="flex flex-col items-center justify-center h-screen text-white/50 font-mono text-xl">
            <div>Waiting for Match Data...</div>
            <div className="text-sm mt-2">ID: {matchId}</div>
            <div className="text-xs mt-1">Socket connected: {socket.connected ? 'Yes' : 'No'}</div>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20 text-sm">Refresh</button>
        </div>
    );

    const leftTeamKey = (!match.leftSideTeam || match.leftSideTeam === 'home') ? 'home' : 'away';
    const rightTeamKey = leftTeamKey === 'home' ? 'away' : 'home';

    const getTeamColor = (key) => {
        if (key === 'home') return match.config?.homeColor || '#1d4ed8'; // blue-700
        return match.config?.awayColor || '#b91c1c'; // red-700
    };

    return (
        <div className="w-full h-screen flex items-end justify-center pb-10 pointer-events-none font-sans">
            {/* Scoreboard Container - Designed for bottom overlay */}
            <div
                className="flex items-stretch bg-slate-900 text-white shadow-2xl bg-cover bg-center bg-no-repeat transition-all duration-500"
                style={match.backgroundImage ? { backgroundImage: `url(${getFileUrl(match, match.backgroundImage)})` } : {}}
            >

                {/* Left Team Panel */}
                {(() => {
                    const teamKey = leftTeamKey;
                    const isHome = teamKey === 'home';
                    const teamName = isHome ? match.homeTeam : match.awayTeam;
                    const teamLogo = isHome ? match.homeLogo : match.awayLogo;
                    const setsWon = match.sets.filter(s => s.winner === teamKey).length;
                    const isServing = match.servingTeam === teamKey;
                    const color = getTeamColor(teamKey);

                    return (
                        <div
                            className={`flex flex-col items-center w-[420px] relative overflow-hidden transition-all duration-500 ${match.backgroundImage ? 'bg-black/60 backdrop-blur-sm' : 'bg-gradient-to-br from-slate-700 via-slate-900 to-black'}`}
                        >
                            {/* Service Indicator (Volleyball Icon) - Outer Left */}
                            {isServing && (
                                <div className="absolute top-[50%] translate-y-[-50%] left-12 z-20">
                                    <img src={volleyBallIcon} alt="Serving" className="w-12 h-12 drop-shadow-lg animate-spin-slow" />
                                </div>
                            )}
                            {/* Court Side Indicator - Left Team */}
                            <div className="absolute top-0 bottom-0 left-0 w-4 z-10 border-r border-black/20" style={{ backgroundColor: color }} />

                            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full">
                                {teamLogo && (
                                    <img src={getFileUrl(match, teamLogo)} className="w-24 h-24 object-contain mb-4 drop-shadow-md" alt="" />
                                )}
                                <h1 className="text-3xl font-bold uppercase tracking-wider text-center drop-shadow-md leading-tight w-full break-words px-4">{teamName}</h1>
                                {/* Sets Won Text - Only show here if NO logo */}
                                {!teamLogo && (
                                    <div className="mt-2 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <span className="text-[10px] font-bold tracking-widest opacity-60">SETS</span>
                                        <span className="text-xl font-bold tabular-nums leading-none">{setsWon}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Center Scoreboard */}
                <div className={`flex items-center px-8 py-4 min-w-[380px] justify-center relative gap-8 ${match.backgroundImage ? 'bg-black/60 backdrop-blur-sm' : 'bg-black'}`}>

                    {/* Timeout Display OR Scores */}
                    {match.timeout?.active ? (
                        <div className="flex flex-col items-center justify-center w-full animate-in zoom-in duration-300">
                            <div className="flex items-center gap-3 text-amber-500 animate-pulse mb-1">
                                <Timer size={28} />
                                <span className="font-bold tracking-widest uppercase text-sm">Timeout</span>
                            </div>
                            <div className="text-7xl font-mono font-bold tabular-nums leading-none text-white drop-shadow-lg">
                                <CountdownTimer startTime={match.timeout.startTime} duration={match.timeout.duration} />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Left Score & Sets */}
                            {(() => {
                                const teamKey = leftTeamKey;
                                const isHome = teamKey === 'home';
                                const score = isHome ? match.scores.home : match.scores.away;
                                const setsWon = match.sets.filter(s => s.winner === teamKey).length;
                                const teamLogo = isHome ? match.homeLogo : match.awayLogo;
                                const color = getTeamColor(teamKey);

                                return (
                                    <div className="flex flex-col items-center gap-1">
                                        <div
                                            className="text-8xl font-mono font-bold w-[2.5ch] text-center tabular-nums leading-none transition-colors duration-300"
                                        >
                                            {score}
                                        </div>
                                        {teamLogo && (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Sets</span>
                                                <span
                                                    className="text-3xl font-bold tabular-nums leading-none transition-colors duration-300"
                                                >
                                                    {setsWon}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Divider */}
                            <div className="h-24 w-px bg-slate-800" />

                            {/* Right Score & Sets */}
                            {(() => {
                                const teamKey = rightTeamKey;
                                const isHome = teamKey === 'home';
                                const score = isHome ? match.scores.home : match.scores.away;
                                const setsWon = match.sets.filter(s => s.winner === teamKey).length;
                                const teamLogo = isHome ? match.homeLogo : match.awayLogo;
                                const color = getTeamColor(teamKey);

                                return (
                                    <div className="flex flex-col items-center gap-1">
                                        <div
                                            className="text-8xl font-mono font-bold w-[2.5ch] text-center tabular-nums leading-none transition-colors duration-300"
                                        >
                                            {score}
                                        </div>
                                        {teamLogo && (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Sets</span>
                                                <span
                                                    className="text-3xl font-bold tabular-nums leading-none transition-colors duration-300"
                                                >
                                                    {setsWon}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>

                {/* Right Team Panel */}
                {(() => {
                    const teamKey = rightTeamKey;
                    const isHome = teamKey === 'home';
                    const teamName = isHome ? match.homeTeam : match.awayTeam;
                    const teamLogo = isHome ? match.homeLogo : match.awayLogo;
                    const setsWon = match.sets.filter(s => s.winner === teamKey).length;
                    const isServing = match.servingTeam === teamKey;
                    const color = getTeamColor(teamKey);

                    return (
                        <div
                            className={`flex flex-col items-center w-[420px] relative overflow-hidden transition-all duration-500 ${match.backgroundImage ? 'bg-black/60 backdrop-blur-sm' : 'bg-gradient-to-bl from-slate-700 via-slate-900 to-black'}`}
                        >
                            {/* Service Indicator (Volleyball Icon) - Outer Right */}
                            {isServing && (
                                <div className="absolute top-[50%] translate-y-[-50%] right-12 z-20">
                                    <img src={volleyBallIcon} alt="Serving" className="w-12 h-12 drop-shadow-lg animate-spin-slow" />
                                </div>
                            )}
                            {/* Court Side Indicator - Right Team */}
                            <div className="absolute top-0 bottom-0 right-0 w-4 z-10 border-l border-black/20" style={{ backgroundColor: color }} />

                            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full">
                                {teamLogo && (
                                    <img src={getFileUrl(match, teamLogo)} className="w-24 h-24 object-contain mb-4 drop-shadow-md" alt="" />
                                )}
                                <h1 className="text-3xl font-bold uppercase tracking-wider text-center drop-shadow-md leading-tight w-full break-words px-4">{teamName}</h1>
                                {/* Sets Won Text - Only show here if NO logo */}
                                {!teamLogo && (
                                    <div className="mt-2 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <span className="text-[10px] font-bold tracking-widest opacity-60">SETS</span>
                                        <span className="text-xl font-bold tabular-nums leading-none">{setsWon}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}



            </div>
        </div>
    );
}

// Sub-component for efficient countdown rendering
function CountdownTimer({ startTime, duration }) {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.ceil((duration - (Date.now() - startTime)) / 1000)));

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((duration - (Date.now() - startTime)) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    }, [startTime, duration]);

    return timeLeft;
}

export default Display;
