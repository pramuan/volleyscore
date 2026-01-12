import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, CircleDot } from 'lucide-react';
import volleyBallIcon from '../assets/volleyball_48.png';
import { socket } from '../socket';

function Display() {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);

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
            } else {
                console.warn("Match not found in init_state for ID:", matchId);
            }
        });

        socket.on('matches_updated', (state) => {
            console.log("Received matches_updated:", state);
            const m = state.matches.find(m => m.id === matchId);
            if (m) setMatch(m);
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
        };
    }, [matchId]);

    if (!match) return (
        <div className="flex flex-col items-center justify-center h-screen text-white/50 font-mono text-xl">
            <div>Waiting for Match Data...</div>
            <div className="text-sm mt-2">ID: {matchId}</div>
            <div className="text-xs mt-1">Socket connected: {socket.connected ? 'Yes' : 'No'}</div>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20 text-sm">Refresh</button>
        </div>
    );

    const navSetsWon = match.sets.filter(s => s.winner === 'home').length;
    const awaySetsWon = match.sets.filter(s => s.winner === 'away').length;

    return (
        <div className="w-full h-screen flex items-end justify-center pb-10 pointer-events-none font-sans">
            {/* Scoreboard Container - Designed for bottom overlay */}
            <div className="flex items-stretch bg-slate-900 text-white rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800">

                {/* Home Team */}
                <div className="flex flex-col items-center bg-gradient-to-br from-blue-900 to-blue-800 w-[420px] relative overflow-hidden">
                    {/* Service Indicator (Volleyball Icon) - Outer Left */}
                    {match.servingTeam === 'home' && (
                        <div className="absolute top-[50%] translate-y-[-50%] left-12 z-20">
                            <img src={volleyBallIcon} alt="Serving" className="w-12 h-12 drop-shadow-lg animate-spin-slow" />
                        </div>
                    )}
                    {/* Court Side Indicator - Home Team (Only if Home is Left) */}
                    {(!match.leftSideTeam || match.leftSideTeam === 'home') && (
                        <div className="absolute top-0 bottom-0 left-0 w-4 bg-slate-400 z-10 border-r border-black/20" />
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                        <h1 className="text-3xl font-bold uppercase tracking-wider text-center drop-shadow-md leading-tight">{match.homeTeam}</h1>
                        {/* Sets Won Text */}
                        <div className="mt-2 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <span className="text-[10px] font-bold tracking-widest opacity-60">SETS</span>
                            <span className="text-xl font-bold tabular-nums leading-none">{navSetsWon}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-black px-6 min-w-[340px] justify-center relative">
                    <div className="text-8xl font-mono font-bold text-blue-400 w-[2.5ch] text-center tabular-nums">
                        {match.scores.home}
                    </div>
                    {/* Animated Divider */}
                    <div className="text-2xl text-slate-700 font-bold px-4 flex flex-col items-center gap-1">
                        <div className="w-1 h-20 bg-slate-800 rounded-full" />
                    </div>
                    <div className="text-8xl font-mono font-bold text-red-500 w-[2.5ch] text-center tabular-nums">
                        {match.scores.away}
                    </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center bg-gradient-to-bl from-red-900 to-red-800 w-[420px] relative overflow-hidden">
                    {/* Service Indicator (Volleyball Icon) - Outer Right */}
                    {match.servingTeam === 'away' && (
                        <div className="absolute top-[50%] translate-y-[-50%] right-12 z-20">
                            <img src={volleyBallIcon} alt="Serving" className="w-12 h-12 drop-shadow-lg animate-spin-slow" />
                        </div>
                    )}
                    {/* Court Side Indicator - Away Team (Only if Away is Left) */}
                    {match.leftSideTeam === 'away' && (
                        <div className="absolute top-0 bottom-0 right-0 w-4 bg-slate-400 z-10 border-l border-black/20" />
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                        <h1 className="text-3xl font-bold uppercase tracking-wider text-center drop-shadow-md leading-tight">{match.awayTeam}</h1>
                        {/* Sets Won Text */}
                        <div className="mt-2 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <span className="text-[10px] font-bold tracking-widest opacity-60">SETS</span>
                            <span className="text-xl font-bold tabular-nums leading-none">{awaySetsWon}</span>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}

export default Display;
