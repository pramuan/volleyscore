import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Plus, Monitor, Trophy, Edit, Trash2 } from 'lucide-react';
import PocketBase from 'pocketbase';

// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

function Management() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingMatchId, setEditingMatchId] = useState(null);
    const [newMatchData, setNewMatchData] = useState({
        name: 'New Match',
        homeTeam: 'Home',
        awayTeam: 'Away',
        bestOf: '3',
        setPoints: '25'
    });
    const navigate = useNavigate();

    // Fetch matches from PocketBase
    const fetchMatches = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('volleyball_matches').getFullList({
                sort: '-created',
            });
            setMatches(records);
        } catch (error) {
            console.error("Error fetching matches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
        document.title = 'VolleyScore Manager';

        // Subscribe to realtime changes in the matches collection
        pb.collection('volleyball_matches').subscribe('*', function (e) {
            console.log("Realtime update:", e.action, e.record);
            fetchMatches();
        });

        return () => {
            pb.collection('volleyball_matches').unsubscribe();
        };
    }, []);

    const handleSaveMatch = async (e) => {
        e.preventDefault();

        try {
            if (editingMatchId) {
                // UPDATE Existing Match
                const data = {
                    name: newMatchData.name,
                    homeTeam: newMatchData.homeTeam,
                    awayTeam: newMatchData.awayTeam,
                    config: {
                        bestOf: parseInt(newMatchData.bestOf),
                        setPoints: parseInt(newMatchData.setPoints),
                        tieBreakPoints: 15
                    }
                };
                await pb.collection('volleyball_matches').update(editingMatchId, data);
            } else {
                // CREATE New Match
                const data = {
                    name: newMatchData.name,
                    homeTeam: newMatchData.homeTeam,
                    awayTeam: newMatchData.awayTeam,
                    currentSet: 1,
                    sets: [], // Empty JSON array
                    scores: { home: 0, away: 0 },
                    config: {
                        bestOf: parseInt(newMatchData.bestOf),
                        setPoints: parseInt(newMatchData.setPoints),
                        tieBreakPoints: 15
                    },
                    is_live: false
                };
                await pb.collection('volleyball_matches').create(data);
            }

            setShowCreateModal(false);
            setEditingMatchId(null);
            setNewMatchData({
                name: 'New Match',
                homeTeam: 'Home',
                awayTeam: 'Away',
                bestOf: '3',
                setPoints: '25'
            });

        } catch (error) {
            alert("Failed to save match: " + error.message);
            console.error(error);
        }
    };

    const openCreateModal = () => {
        setEditingMatchId(null);
        setNewMatchData({
            name: 'New Match',
            homeTeam: 'Home',
            awayTeam: 'Away',
            bestOf: '3',
            setPoints: '25'
        });
        setShowCreateModal(true);
    };

    const openEditModal = (match) => {
        setEditingMatchId(match.id);
        setNewMatchData({
            name: match.name,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            bestOf: match.config?.bestOf?.toString() || '3',
            setPoints: match.config?.setPoints?.toString() || '25'
        });
        setShowCreateModal(true);
    };

    const handleDeleteMatch = async (matchId) => {
        if (!window.confirm("Are you sure you want to delete this match? This cannot be undone.")) return;
        try {
            await pb.collection('volleyball_matches').delete(matchId);
            // Realtime subscription will handle the UI update
        } catch (error) {
            console.error("Failed to delete match:", error);
            alert("Error deleting match");
        }
    };

    const handleGoLive = async (matchId) => {
        try {
            const matchToToggle = matches.find(m => m.id === matchId);
            const isTurningOn = !matchToToggle.is_live;

            if (isTurningOn) {
                // If turning ON, ensure others are OFF (Exclusive Mode)
                const activeMatches = matches.filter(m => m.is_live && m.id !== matchId);
                await Promise.all(activeMatches.map(m =>
                    pb.collection('volleyball_matches').update(m.id, { is_live: false })
                ));
            }

            // Toggle target match
            await pb.collection('volleyball_matches').update(matchId, { is_live: isTurningOn });

        } catch (error) {
            console.error("Failed to set live match:", error);
            alert("Error setting live match");
        }
    };

    const copyLink = (path) => {
        const url = `${window.location.protocol}//${window.location.host}${path}`;
        navigator.clipboard.writeText(url);
        alert(`Copied: ${url}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Monitor size={24} />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                            VolleyScore Manager
                        </h1>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30 font-semibold"
                    >
                        <Plus size={20} /> Create New Match
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <div className="grid gap-6">
                    {matches.length > 0 && matches.map(match => (
                        <div
                            key={match.id}
                            className={`group bg-white rounded-2xl p-6 transition-all duration-300 ${match.is_live ? 'shadow-lg border border-slate-200 bg-green-50/30' : 'shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300'}`}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                {/* Match Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                                            {match.name}
                                        </h2>

                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500 text-sm md:text-base font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-600 font-bold">{match.homeTeam}</span>
                                            <span className="text-slate-300">vs</span>
                                            <span className="text-red-600 font-bold">{match.awayTeam}</span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <div className="flex gap-2 text-xs">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 whitespace-nowrap">Set {match.currentSet}</span>
                                            <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-600 border border-blue-100 whitespace-nowrap">Best of {match.config?.bestOf || 3}</span>
                                            <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-600 border border-blue-100 whitespace-nowrap">{match.config?.setPoints || 25} pts</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-4 w-full md:w-auto">

                                    {/* Link & Live Actions */}
                                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            Status
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                        </span>
                                        <button
                                            onClick={() => handleGoLive(match.id)}
                                            className={`h-10 w-full flex items-center justify-center gap-2 px-3 rounded-lg font-bold text-sm transition-all shadow-sm border ${match.is_live ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:border-green-500 hover:text-green-600 hover:shadow-md'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${match.is_live ? 'bg-green-500 animate-pulse group-hover:bg-red-500' : 'bg-slate-300'}`} />
                                            {match.is_live ? 'Live (Stop)' : 'Set as Live'}
                                        </button>
                                    </div>

                                    {/* Controller Section */}
                                    <div className="flex-1 md:flex-none flex flex-col gap-1.5 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            Controller
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                        </span>
                                        <div className="flex items-stretch gap-1">
                                            <Link
                                                to={`/controller/${match.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 flex-1 bg-slate-50 text-slate-700 font-bold text-sm px-3 rounded-lg hover:bg-white hover:text-blue-600 hover:shadow border border-slate-200 transition-all flex items-center justify-center gap-2"
                                                title="Open Controller"
                                            >
                                                <Monitor size={16} /> Open
                                            </Link>
                                            <button
                                                onClick={() => copyLink(`/controller/${match.id}`)}
                                                className="h-10 bg-slate-50 text-slate-500 px-3 rounded-lg hover:bg-white hover:text-blue-600 hover:shadow border border-slate-200 transition-all font-bold text-sm"
                                                title="Copy Link"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Display Section */}
                                    <div className="flex-1 md:flex-none flex flex-col gap-1.5 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            Display
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                        </span>
                                        <div className="flex items-stretch gap-1">
                                            <Link
                                                to={`/display/${match.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 flex-1 bg-slate-50 text-slate-700 font-bold text-sm px-3 rounded-lg hover:bg-white hover:text-purple-600 hover:shadow border border-slate-200 transition-all flex items-center justify-center gap-2"
                                                title="Open Display"
                                            >
                                                <Monitor size={16} /> Open
                                            </Link>
                                            <button
                                                onClick={() => copyLink(`/display/${match.id}`)}
                                                className="h-10 bg-slate-50 text-slate-500 px-3 rounded-lg hover:bg-white hover:text-purple-600 hover:shadow border border-slate-200 transition-all font-bold text-sm"
                                                title="Copy Link"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Manage Actions */}
                                    <div className="flex-1 md:flex-none flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            Actions
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                        </span>
                                        <div className="flex items-stretch gap-1">
                                            <button
                                                onClick={() => openEditModal(match)}
                                                className="h-10 bg-slate-50 text-slate-700 font-bold text-sm px-3 rounded-lg hover:bg-white hover:text-blue-600 hover:shadow border border-slate-200 transition-all flex items-center justify-center gap-2"
                                                title="Edit Match"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMatch(match.id)}
                                                className="h-10 bg-slate-50 text-slate-500 px-3 rounded-lg hover:bg-red-50 hover:text-red-600 hover:shadow border border-slate-200 transition-all font-bold text-sm"
                                                title="Delete Match"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse h-24"></div>
                            ))}
                        </div>
                    )}

                    {!loading && matches.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                                <Plus size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">No Matches Found</h3>
                                <p className="text-slate-500">Create a new match to start scoring.</p>
                            </div>
                            <button onClick={openCreateModal} className="mt-2 text-blue-600 font-semibold hover:underline">Create First Match</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Match Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-800">{editingMatchId ? 'Edit Match' : 'Create New Match'}</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveMatch} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Match Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={newMatchData.name}
                                        onChange={e => setNewMatchData({ ...newMatchData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                            value={newMatchData.homeTeam}
                                            onChange={e => setNewMatchData({ ...newMatchData, homeTeam: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Away Team</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                            value={newMatchData.awayTeam}
                                            onChange={e => setNewMatchData({ ...newMatchData, awayTeam: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mt-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Match Configuration</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Match Format</label>
                                            <select
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                                value={newMatchData.bestOf}
                                                onChange={e => setNewMatchData({ ...newMatchData, bestOf: e.target.value })}
                                            >
                                                <option value="3">Best of 3</option>
                                                <option value="5">Best of 5</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Points per Set</label>
                                            <select
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                                value={newMatchData.setPoints}
                                                onChange={e => setNewMatchData({ ...newMatchData, setPoints: e.target.value })}
                                            >
                                                <option value="25">25 Points</option>
                                                <option value="21">21 Points</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 italic">
                                        * Includes 'Win by 2' rule and fixed 15-point tie-break.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-500/20"
                                    >
                                        {editingMatchId ? 'Save Changes' : 'Start Match'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default Management;
