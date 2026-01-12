const express = require('express'); // 

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const state = require('./state');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for local network ease
        methods: ["GET", "POST"]
    }
});

// Helper to get local IP
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

app.get('/api/ip', (req, res) => {
    res.json({ ip: getLocalIp() });
});

// REST API for initial load or management
app.get('/api/matches', (req, res) => {
    res.json(state.getAllMatches());
});

app.post('/api/matches', (req, res) => {
    const newMatch = state.createMatch(req.body);
    io.emit('matches_updated', state.getAllMatches());
    res.json(newMatch);
});

// Setup PocketBase Sync (Run once)
const sync = require('./sync');
// Subscribe to PocketBase changes (e.g., from Manager Dashboard)
sync.subscribeToChanges((record) => {
    // Update in-memory state
    const updatedMatch = state.updateMatch(record.id, {
        is_live: record.is_live,
        collectionId: record.collectionId,
        name: record.name,
        homeTeam: record.homeTeam,
        awayTeam: record.awayTeam,
        homeLogo: record.homeLogo,
        awayLogo: record.awayLogo,
        backgroundImage: record.backgroundImage,
        config: record.config
    });

    if (updatedMatch) {
        console.log(`Broadcasting external update for ${record.id}`);
        io.to(record.id).emit('match_update', updatedMatch);
        io.emit('matches_updated', state.getAllMatches());
    }
});

// Socket.io Handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send initial state
    socket.emit('init_state', state.getAllMatches());

    socket.on('join_match', async (matchId) => {
        socket.join(matchId);
        console.log(`Socket ${socket.id} joined ${matchId}`);

        let match = state.getMatch(matchId);

        // HYDRATION: If not in memory, try to fetch from PocketBase
        if (!match) {
            console.log(`Match ${matchId} not in memory, attempting hydration...`);
            match = await sync.hydrateMatch(matchId);
            if (match) {
                state.matches.push(match); // Load into memory
                console.log(`Hydrated match ${matchId} from PocketBase`);
            }
        }

        if (match) {
            socket.emit('match_update', match);
        } else {
            console.log(`Match ${matchId} not found`);
            socket.emit('match_not_found', { matchId });
        }
    });

    socket.on('update_score', ({ matchId, team, delta }) => {
        const updatedMatch = state.updateScore(matchId, team, delta);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
            // SYNC: Save score changes to PocketBase immediately
            sync.saveMatch(updatedMatch);
        }
    });

    socket.on('start_new_set', (matchId) => {
        const updatedMatch = state.startNewSet(matchId);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
            // SYNC: Persistence on significant event
            sync.saveMatch(updatedMatch);
            io.emit('matches_updated', state.getAllMatches());
        }
    });

    socket.on('set_serving_team', ({ matchId, team }) => {
        const updatedMatch = state.setServingTeam(matchId, team);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
            // SYNC: Save serving team changes
            sync.saveMatch(updatedMatch);
        }
    });

    socket.on('reset_match', (matchId) => {
        const updatedMatch = state.resetMatch(matchId);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
            sync.saveMatch(updatedMatch); // Sync reset state
            io.emit('matches_updated', state.getAllMatches());
        }
    });

    // Update Settings/Teams
    socket.on('update_match_details', ({ matchId, data }) => {
        const updatedMatch = state.updateMatch(matchId, data);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
            io.emit('matches_updated', state.getAllMatches());
        }
    });

    socket.on('undo', (matchId) => {
        const updatedMatch = state.undo(matchId);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
            // No need to full sync unless critical, but let's be safe
            sync.saveMatch(updatedMatch);
        }
    });

    socket.on('start_timeout', (matchId) => {
        const updatedMatch = state.startTimeout(matchId);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);

            // Auto-stop after 30 seconds
            setTimeout(() => {
                const match = state.getMatch(matchId);
                // Only stop if it's still active and hasn't been reset/restarted
                if (match && match.timeout.active && (Date.now() - match.timeout.startTime >= 30000)) {
                    const stoppedMatch = state.stopTimeout(matchId);
                    if (stoppedMatch) {
                        io.to(matchId).emit('match_update', stoppedMatch);
                    }
                }
            }, 30500); // 30.5 seconds buffer
        }
    });

    socket.on('stop_timeout', (matchId) => {
        const updatedMatch = state.stopTimeout(matchId);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
        }
    });

    socket.on('toggle_final_result', (matchId) => {
        const updatedMatch = state.toggleFinalResult(matchId);
        if (updatedMatch) {
            io.to(matchId).emit('match_update', updatedMatch);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 3000;

// Schedule Cleanup Task (Every 1 hour)
setInterval(() => {
    state.cleanupMatches();
}, 60 * 60 * 1000);

server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`Server running on port ${PORT}`);
    console.log(`Local Access: http://${ip}:${PORT}`);
});
