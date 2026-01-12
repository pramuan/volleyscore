
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Plus, Monitor, Trophy, Edit, Trash2, ChevronDown, ChevronUp, Link as LinkIcon, Upload, Video, ExternalLink, RefreshCw, Smartphone, Tv } from 'lucide-react';
import toast from 'react-hot-toast';
import pb from '../lib/pocketbase';
import volleyballIcon from '../assets/volleyball_48.png';

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
        setPoints: '25',
        homeColor: '#1d4ed8', // Default Blue
        awayColor: '#b91c1c', // Default Red
        homeLogo: null,
        awayLogo: null,
        pin: '',
        courtId: '1' // Default Court 1
    });
    const [expandedMatchId, setExpandedMatchId] = useState(null);
    const [serverIp, setServerIp] = useState(null); // Store server IP
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
            if (!error.isAbort) {
                console.error("Error fetching matches:", error);
                toast.error("Failed to fetch matches.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
        document.title = 'VolleyScore Manager';

        // Fetch Server IP
        fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/ip`)
            .then(res => res.json())
            .then(data => setServerIp(data.ip))
            .catch(err => console.error("Failed to fetch server IP:", err));

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
                const formData = new FormData();
                formData.append('name', newMatchData.name);
                formData.append('homeTeam', newMatchData.homeTeam);
                formData.append('awayTeam', newMatchData.awayTeam);

                // Config JSON needs to be stringified if sent via FormData
                const configData = {
                    bestOf: parseInt(newMatchData.bestOf),
                    setPoints: parseInt(newMatchData.setPoints),
                    tieBreakPoints: 15,
                    homeColor: newMatchData.homeColor,
                    awayColor: newMatchData.awayColor,
                    courtId: newMatchData.courtId || '1'
                };
                formData.append('config', JSON.stringify(configData));

                // Update PIN if provided
                if (newMatchData.pin) {
                    formData.append('pin', newMatchData.pin);
                }

                if (newMatchData.homeLogo instanceof File) {
                    formData.append('homeLogo', newMatchData.homeLogo);
                } else if (newMatchData.homeLogo === 'DELETE') {
                    formData.append('homeLogo', '');
                }

                if (newMatchData.awayLogo instanceof File) {
                    formData.append('awayLogo', newMatchData.awayLogo);
                } else if (newMatchData.awayLogo === 'DELETE') {
                    formData.append('awayLogo', '');
                }

                if (newMatchData.backgroundImage instanceof File) {
                    formData.append('backgroundImage', newMatchData.backgroundImage);
                } else if (newMatchData.backgroundImage === 'DELETE') {
                    formData.append('backgroundImage', '');
                }

                await pb.collection('volleyball_matches').update(editingMatchId, formData);
                toast.success('Match updated successfully!');
            } else {
                // CREATE New Match
                const formData = new FormData();
                formData.append('name', newMatchData.name);
                formData.append('homeTeam', newMatchData.homeTeam);
                formData.append('awayTeam', newMatchData.awayTeam);
                formData.append('is_live', 'false'); // FormData sends strings

                // Enforce PIN
                const finalPin = newMatchData.pin || Math.floor(1000 + Math.random() * 9000).toString();
                formData.append('pin', finalPin);

                const configData = {
                    bestOf: parseInt(newMatchData.bestOf),
                    setPoints: parseInt(newMatchData.setPoints),
                    tieBreakPoints: 15,
                    homeColor: newMatchData.homeColor,
                    awayColor: newMatchData.awayColor,
                    courtId: newMatchData.courtId || '1'
                };
                formData.append('config', JSON.stringify(configData));

                formData.append('scores', JSON.stringify({ home: 0, away: 0 }));
                formData.append('sets', JSON.stringify([]));
                formData.append('currentSet', '1');

                if (newMatchData.homeLogo instanceof File) {
                    formData.append('homeLogo', newMatchData.homeLogo);
                } else if (newMatchData.homeLogo === 'DELETE') {
                    formData.append('homeLogo', '');
                }

                if (newMatchData.awayLogo instanceof File) {
                    formData.append('awayLogo', newMatchData.awayLogo);
                } else if (newMatchData.awayLogo === 'DELETE') {
                    formData.append('awayLogo', '');
                }

                if (newMatchData.backgroundImage instanceof File) {
                    formData.append('backgroundImage', newMatchData.backgroundImage);
                } else if (newMatchData.backgroundImage === 'DELETE') {
                    formData.append('backgroundImage', '');
                }

                await pb.collection('volleyball_matches').create(formData);
                toast.success('Match created successfully!');
            }

            setShowCreateModal(false);
            setEditingMatchId(null);
            setNewMatchData({
                name: 'New Match',
                homeTeam: 'Home',
                awayTeam: 'Away',
                bestOf: '3',
                setPoints: '25',
                homeColor: '',
                awayColor: '',
                homeLogo: null,
                awayLogo: null,
                backgroundImage: null,
                courtId: '1'
            });
        } catch (error) {
            toast.error("Failed to save match: " + error.message);
            console.error(error);
        }
    };

    const openCreateModal = () => {
        setEditingMatchId(null);
        const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
        setNewMatchData({
            name: 'New Match',
            homeTeam: 'Home',
            awayTeam: 'Away',
            bestOf: '3',
            setPoints: '25',
            homeColor: '',
            awayColor: '',
            homeLogo: null,
            awayLogo: null,
            pin: randomPin,
            courtId: '1'
        });
        setShowCreateModal(true);
    };

    const getFileUrl = (record, filename) => {
        if (!record || !filename) return null;
        return `http://127.0.0.1:8090/api/files/${record.collectionId}/${record.id}/${filename}`;
    };

    const openEditModal = (match) => {
        setEditingMatchId(match.id);
        setNewMatchData({
            name: match.name,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            bestOf: match.config?.bestOf?.toString() || '3',
            setPoints: match.config?.setPoints?.toString() || '25',
            homeColor: match.config?.homeColor || '',
            awayColor: match.config?.awayColor || '',
            homeLogo: null, // Don't preload file objects
            awayLogo: null,
            pin: match.pin || '',
            courtId: match.config?.courtId || '1'
        });
        setShowCreateModal(true);
    };

    const handleDeleteMatch = (matchId) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Delete this match?</span>
                <div className="flex gap-2">
                    <button
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition-colors"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await pb.collection('volleyball_matches').delete(matchId);
                                toast.success('Match deleted');
                            } catch (error) {
                                console.error("Failed to delete:", error);
                                toast.error("Error deleting match");
                            }
                        }}
                    >
                        Delete
                    </button>
                    <button
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs font-bold hover:bg-gray-300 transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 4000,
            position: 'top-center',
            style: {
                background: '#fff',
                color: '#333',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
            },
        });
    };

    const handleGoLive = async (matchId) => {
        try {
            const matchToToggle = matches.find(m => m.id === matchId);
            const isTurningOn = !matchToToggle.is_live;

            if (isTurningOn) {
                // MULTI-COURT LOGIC:
                // Only turn off other matches that are on the SAME COURT.
                // Default to '1' if courtId is missing.
                const targetCourtId = matchToToggle.config?.courtId || '1';

                const activeMatchesSameCourt = matches.filter(m =>
                    m.is_live &&
                    m.id !== matchId &&
                    (m.config?.courtId || '1') === targetCourtId
                );

                await Promise.all(activeMatchesSameCourt.map(m =>
                    pb.collection('volleyball_matches').update(m.id, { is_live: false })
                ));
            }

            // Toggle target match
            await pb.collection('volleyball_matches').update(matchId, { is_live: isTurningOn });
            toast.success(isTurningOn ? 'Match set live!' : 'Match taken offline.');

        } catch (error) {
            console.error("Failed to set live match:", error);
            toast.error("Error setting live match");
        }
    };

    const copyLink = async (path) => {
        // Use server IP if available, otherwise fallback to current host
        const host = serverIp ? `${serverIp}:${window.location.port}` : window.location.host;
        const url = `${window.location.protocol}//${host}${path}`;

        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy link');
        }
    };

    const handleLogout = () => {
        pb.authStore.clear();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        {/* <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Monitor size={24} />
                        </div> */}
                        <img src={volleyballIcon} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                            VolleyScore Manager
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30 font-semibold"
                        >
                            <Plus size={20} /> Create New Match
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24">
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
                                            <span className="font-bold" style={{ color: match.config?.homeColor || '#1d4ed8' }}>{match.homeTeam}</span>
                                            <span className="text-slate-300">vs</span>
                                            <span className="font-bold" style={{ color: match.config?.awayColor || '#b91c1c' }}>{match.awayTeam}</span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <div className="flex gap-2 text-xs">
                                            <span className="bg-purple-50 px-2 py-0.5 rounded text-purple-700 border border-purple-200 whitespace-nowrap font-medium">
                                                {match.config?.courtId === 'Main' ? 'Main Stadium' : `Court ${match.config?.courtId || '1'}`}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 whitespace-nowrap">Set {match.currentSet}</span>
                                            <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-600 border border-blue-100 whitespace-nowrap">Best of {match.config?.bestOf || 3}</span>
                                            <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-600 border border-blue-100 whitespace-nowrap">{match.config?.setPoints || 25} pts</span>
                                            {match.pin && (
                                                <span className="bg-amber-50 px-2 py-0.5 rounded text-amber-700 border border-amber-200 whitespace-nowrap font-mono">PIN: {match.pin}</span>
                                            )}
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
                                            <div className={`w-2 h-2 rounded-full ${match.is_live ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
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
                                                <LinkIcon size={16} />
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
                                                <LinkIcon size={16} />
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

                            {/* Broadcast Links Section */}
                            <div className="mt-6 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                                    className="w-full flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-all border border-slate-100"
                                >
                                    <div className="flex items-center gap-2">
                                        <Tv size={18} />
                                        <span>Broadcast Links (OBS/vMix)</span>
                                    </div>
                                    {expandedMatchId === match.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>

                                {expandedMatchId === match.id && (
                                    <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">

                                        {/* Auto-Live Link */}
                                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600">
                                                    <Tv size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-indigo-900 text-sm">Auto-Live Channel (Court {match.config?.courtId || '1'})</h4>
                                                    <p className="text-[10px] text-indigo-600 font-medium">Automatically switches to this match when Set as Live.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => copyLink(`/display/court/${match.config?.courtId || '1'}`)}
                                                className="bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-200 transition-all font-bold text-xs flex items-center gap-2 shadow-sm"
                                            >
                                                <LinkIcon size={14} /> Copy Link
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Home Team Links */}
                                            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                                <h4
                                                    className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                                                    style={{ color: match.config?.homeColor || '#1d4ed8' }}
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: match.config?.homeColor || '#1d4ed8' }}
                                                    ></div>
                                                    Home Team ({match.homeTeam})
                                                </h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Team Name', path: `/display/${match.id}/home/name` },
                                                        { label: 'Score', path: `/display/${match.id}/home/score` },
                                                        { label: 'Sets Won', path: `/display/${match.id}/home/sets` },
                                                        { label: 'Logo', path: `/display/${match.id}/home/logo` },
                                                    ].map((link, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="text-sm font-medium text-slate-600">{link.label}</span>
                                                            <button
                                                                onClick={() => copyLink(link.path)}
                                                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
                                                                title="Copy Link"
                                                            >
                                                                <LinkIcon size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Away Team Links */}
                                            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                                <h4
                                                    className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                                                    style={{ color: match.config?.awayColor || '#b91c1c' }}
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: match.config?.awayColor || '#b91c1c' }}
                                                    ></div>
                                                    Away Team ({match.awayTeam})
                                                </h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Team Name', path: `/display/${match.id}/away/name` },
                                                        { label: 'Score', path: `/display/${match.id}/away/score` },
                                                        { label: 'Sets Won', path: `/display/${match.id}/away/sets` },
                                                        { label: 'Logo', path: `/display/${match.id}/away/logo` },
                                                    ].map((link, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="text-sm font-medium text-slate-600">{link.label}</span>
                                                            <button
                                                                onClick={() => copyLink(link.path)}
                                                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
                                                                title="Copy Link"
                                                            >
                                                                <LinkIcon size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                        placeholder="Match Name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        {/* Display Existing Home Logo if available and not being removed/replaced */}
                                        {editingMatchId && matches.find(m => m.id === editingMatchId)?.homeLogo &&
                                            newMatchData.homeLogo !== 'DELETE' &&
                                            !(newMatchData.homeLogo instanceof File) && (
                                                <div className="mb-1 flex items-center gap-2">
                                                    <img
                                                        src={getFileUrl(matches.find(m => m.id === editingMatchId), matches.find(m => m.id === editingMatchId).homeLogo)}
                                                        alt="Current Home Logo"
                                                        className="w-10 h-10 object-contain bg-slate-50 rounded-md border border-slate-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewMatchData({ ...newMatchData, homeLogo: 'DELETE' })}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="Remove Logo"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        {/* Show 'Logo will be removed' indicator */}
                                        {newMatchData.homeLogo === 'DELETE' && (
                                            <div className="mb-1 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded border border-red-100">
                                                <Trash2 size={12} />
                                                Existing logo will be removed
                                                <button
                                                    type="button"
                                                    onClick={() => setNewMatchData({ ...newMatchData, homeLogo: null })}
                                                    className="ml-auto text-blue-600 hover:underline font-semibold"
                                                >
                                                    Undo
                                                </button>
                                            </div>
                                        )}
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                            value={newMatchData.homeTeam}
                                            onChange={e => setNewMatchData({ ...newMatchData, homeTeam: e.target.value })}
                                        />
                                        <div className="flex flex-col gap-2 mt-2">
                                            <label className="block text-xs font-medium text-gray-500">Team Logo</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className={`w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 ${newMatchData.homeLogo ? 'text-slate-500' : 'text-transparent'}`}
                                                onChange={e => setNewMatchData({ ...newMatchData, homeLogo: e.target.files[0] })}
                                            />
                                        </div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Team Color</label>
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={newMatchData.homeColor || '#1d4ed8'}
                                                onChange={e => setNewMatchData({ ...newMatchData, homeColor: e.target.value })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div
                                                className="w-full text-xs py-2 px-4 rounded-full border-0 font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-start gap-2"
                                            >
                                                <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: newMatchData.homeColor || '#1d4ed8' }}></span>
                                                <span>{newMatchData.homeColor ? newMatchData.homeColor : 'Select Color'}</span>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {/* Display Existing Away Logo if available and not being removed/replaced */}
                                        {editingMatchId && matches.find(m => m.id === editingMatchId)?.awayLogo &&
                                            newMatchData.awayLogo !== 'DELETE' &&
                                            !(newMatchData.awayLogo instanceof File) && (
                                                <div className="mb-1 flex items-center gap-2">
                                                    <img
                                                        src={getFileUrl(matches.find(m => m.id === editingMatchId), matches.find(m => m.id === editingMatchId).awayLogo)}
                                                        alt="Current Away Logo"
                                                        className="w-10 h-10 object-contain bg-slate-50 rounded-md border border-slate-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewMatchData({ ...newMatchData, awayLogo: 'DELETE' })}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="Remove Logo"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        {/* Show 'Logo will be removed' indicator */}
                                        {newMatchData.awayLogo === 'DELETE' && (
                                            <div className="mb-1 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded border border-red-100">
                                                <Trash2 size={12} />
                                                Existing logo will be removed
                                                <button
                                                    type="button"
                                                    onClick={() => setNewMatchData({ ...newMatchData, awayLogo: null })}
                                                    className="ml-auto text-blue-600 hover:underline font-semibold"
                                                >
                                                    Undo
                                                </button>
                                            </div>
                                        )}
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Away Team</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                            value={newMatchData.awayTeam}
                                            onChange={e => setNewMatchData({ ...newMatchData, awayTeam: e.target.value })}
                                        />
                                        <div className="flex flex-col gap-2 mt-2">
                                            <label className="block text-xs font-medium text-gray-500">Team Logo</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className={`w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 ${newMatchData.awayLogo ? 'text-slate-500' : 'text-transparent'}`}
                                                onChange={e => setNewMatchData({ ...newMatchData, awayLogo: e.target.files[0] })}
                                            />
                                        </div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Team Color</label>
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={newMatchData.awayColor || '#b91c1c'}
                                                onChange={e => setNewMatchData({ ...newMatchData, awayColor: e.target.value })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div
                                                className="w-full text-xs py-2 px-4 rounded-full border-0 font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-start gap-2"
                                            >
                                                <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: newMatchData.awayColor || '#b91c1c' }}></span>
                                                <span>{newMatchData.awayColor ? newMatchData.awayColor : 'Select Color'}</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mt-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Match Configuration</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Court / Arena</label>
                                            <select
                                                value={newMatchData.courtId || '1'}
                                                onChange={(e) => setNewMatchData({ ...newMatchData, courtId: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                            >
                                                <option value="1">Court 1</option>
                                                <option value="2">Court 2</option>
                                                <option value="3">Court 3</option>
                                                <option value="4">Court 4</option>
                                                <option value="Main">Main Stadium</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Controller PIN</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={4}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center tracking-widest font-mono font-bold text-slate-600 bg-slate-50"
                                                value={newMatchData.pin || ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    setNewMatchData({ ...newMatchData, pin: val });
                                                }}
                                                placeholder="4-digit PIN"
                                            />
                                        </div>
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

                                    <p className="text-[11px] text-gray-400 mt-2 mb-4 italic">
                                        * Includes 'Win by 2' rule and fixed 15-point tie-break.
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Scoreboard Background <span className="text-gray-400 font-normal text-xs">(1920 x 315 Pixel)</span>
                                        </label>

                                        {/* Existing Background Preview */}
                                        {editingMatchId && matches.find(m => m.id === editingMatchId)?.backgroundImage &&
                                            newMatchData.backgroundImage !== 'DELETE' &&
                                            !(newMatchData.backgroundImage instanceof File) && (
                                                <div className="mb-1 flex items-center gap-2">
                                                    <img
                                                        src={getFileUrl(matches.find(m => m.id === editingMatchId), matches.find(m => m.id === editingMatchId).backgroundImage)}
                                                        alt="Current Background"
                                                        className="w-16 h-10 object-cover bg-slate-900 rounded-md border border-slate-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewMatchData({ ...newMatchData, backgroundImage: 'DELETE' })}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="Remove Background"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}

                                        {/* Removed Background Indicator */}
                                        {newMatchData.backgroundImage === 'DELETE' && (
                                            <div className="mb-1 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded border border-red-100">
                                                <Trash2 size={12} />
                                                Background removed
                                                <button
                                                    type="button"
                                                    onClick={() => setNewMatchData({ ...newMatchData, backgroundImage: null })}
                                                    className="ml-auto text-blue-600 hover:underline font-semibold"
                                                >
                                                    Undo
                                                </button>
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className={`w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 ${newMatchData.backgroundImage ? 'text-slate-500' : 'text-transparent'}`}
                                            onChange={e => setNewMatchData({ ...newMatchData, backgroundImage: e.target.files[0] })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                    >
                                        {editingMatchId ? 'Save Changes' : 'Create Match'}
                                    </button>
                                </div>
                            </form>
                        </div >
                    </div >

                )
            }
            <footer className="fixed bottom-0 left-0 w-full py-4 text-center text-slate-400 text-xs font-medium bg-slate-50 z-0">
                Powered by 3PT Live Streaming
            </footer>
        </div >
    );
}

export default Management;
