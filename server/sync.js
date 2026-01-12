require('dotenv').config();
const PocketBase = require('pocketbase/cjs'); // CommonJS import for Node
const eventsource = require('eventsource');
global.EventSource = eventsource.EventSource;

// You can swap this URL if hosted externally. 
// For local, assuming PB runs on 8090
const PB_URL = 'http://127.0.0.1:8090';

class VolleySync {
    constructor() {
        this.pb = new PocketBase(PB_URL);
        this.cache = new Map();
        this.isAuthenticated = false;
    }

    async authenticate() {
        const email = process.env.PB_ADMIN_EMAIL;
        const password = process.env.PB_ADMIN_PASSWORD;

        if (!email || !password) {
            console.warn('Sync: Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD in .env');
            return false;
        }

        try {
            await this.pb.admins.authWithPassword(email, password);
            this.isAuthenticated = true;
            console.log('Sync: Server authenticated successfully as Admin');
            return true;
        } catch (err) {
            console.error('Sync: Authentication failed!', err.message);
            return false;
        }
    }

    async hydrateMatch(matchId) {
        try {
            // Check if we already have it in memory? 
            // Actually state.js handles memory. This just fetches raw data.
            const record = await this.pb.collection('volleyball_matches').getOne(matchId);

            // Convert PB record to our Application Match Object
            return {
                id: record.id,
                collectionId: record.collectionId,
                name: record.name,
                homeTeam: record.homeTeam,
                awayTeam: record.awayTeam,
                homeLogo: record.homeLogo,
                awayLogo: record.awayLogo,
                backgroundImage: record.backgroundImage,
                pin: record.pin, // Hydrate PIN
                sets: record.sets || [],
                currentSet: record.currentSet,
                scores: record.scores || { home: 0, away: 0 },
                config: record.config || { bestOf: 3, setPoints: 25, tieBreakPoints: 15 },
                winner: null, // Computed runtime, or store if needed
                servingTeam: null, // Runtime only
                history: [], // Initialize empty history
                timeout: { active: false, startTime: 0, duration: 30000 }, // Initialize timeout state
                lastActive: Date.now() // Set active timestamp
            };
        } catch (err) {
            console.error(`Sync: Failed to hydrate match ${matchId}`, err.message);
            return null;
        }
    }

    async saveMatch(match) {
        try {
            // Debounce or immediate? Immediate for MVP simplicity on "New Set" events
            await this.pb.collection('volleyball_matches').update(match.id, {
                sets: match.sets,
                currentSet: match.currentSet,
                scores: match.scores,
                // optional: update config if changed?
            });
            console.log(`Sync: Saved match ${match.id}`);
        } catch (err) {
            console.error(`Sync: Failed to save match ${match.id}`, err.message);
        }
    }


    subscribeToChanges(onUpdate) {
        console.log("Sync: Subscribing to PocketBase updates...");
        // Subscribe to all changes in volleyball_matches
        this.pb.collection('volleyball_matches').subscribe('*', (e) => {
            if (e.action === 'update') {
                console.log(`Sync: External update received for ${e.record.id}`);
                // Simple parsing or raw record passing - let caller handle validation
                onUpdate(e.record);
            }
        });
    }
}

module.exports = new VolleySync();
