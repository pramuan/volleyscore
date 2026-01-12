import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';

function PartialDisplay() {
    const { matchId, team, category } = useParams();
    const [match, setMatch] = useState(null);

    useEffect(() => {
        if (!socket.connected) socket.connect();
        socket.emit('join_match', matchId);

        const handleUpdate = (m) => {
            if (m.id === matchId) setMatch(m);
        };

        const handleState = (state) => {
            const m = state.matches.find(m => m.id === matchId);
            if (m) setMatch(m);
        };

        socket.on('init_state', handleState);
        socket.on('matches_updated', handleState);
        socket.on('match_update', handleUpdate);

        // Ensure transparent background (overriding global styles if any)
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';

        return () => {
            socket.off('init_state', handleState);
            socket.off('matches_updated', handleState);
            socket.off('match_update', handleUpdate);
        };
    }, [matchId]);

    if (!match) return null;

    // Helper to get content safely
    const getContent = () => {
        if (!match) return '';

        // Resolve team props
        const teamKey = team === 'home' || team === 'away' ? team : null;
        if (!teamKey) return 'Invalid Team';

        if (category === 'name') {
            return teamKey === 'home' ? match.homeTeam : match.awayTeam;
        }

        if (category === 'score') {
            return match.scores[teamKey];
        }

        if (category === 'sets') {
            return match.sets.filter(s => s.winner === teamKey).length;
        }

        return 'Invalid Category';
    };

    const content = getContent();

    // specific styles based on category for optimal display
    let textStyle = "font-bold text-slate-800"; // Default
    if (category === 'score') textStyle = "text-[15vw] leading-none font-mono font-bold text-slate-900";
    if (category === 'name') textStyle = "text-[8vw] leading-tight font-bold text-slate-800 uppercase text-center";
    if (category === 'sets') textStyle = "text-[10vw] leading-none font-bold text-slate-800";

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent overflow-hidden p-4">
            <span className={textStyle}>
                {content}
            </span>
        </div>
    );
}

export default PartialDisplay;
