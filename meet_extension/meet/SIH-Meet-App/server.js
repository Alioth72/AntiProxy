const path = require('path');
const express = require('express');
const app = express();
const socketIO = require('socket.io');

const port = process.env.PORT || 8080;
const env = process.env.NODE_ENV || 'development';

const polls = {}; // Poll state per room
const rooms = {}; // Room state: { roomId: { participants: {}, admin: socketId, qa: [] } }
const userProfiles = {}; // User profiles: { socketId: { name, email, speakingTime, isSpeaking } }

// Redirect to https
app.get('*', (req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && env !== 'development') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
});


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

const server = require('http').createServer(app);
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});

/**
 * Socket.io events
 */
const io = socketIO(server);
io.sockets.on('connection', function (socket) {
    let currentRoom = null;
    let userData = { name: '', email: '' };

    /**
     * Log actions to the client
     */
    function log() {
        const array = ['Server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    /**
     * Broadcast participants list to room
     */
    function broadcastParticipants(room) {
        if (!rooms[room]) return;

        const participants = getParticipantsSnapshot(room);
        io.sockets.in(room).emit('participants:list', participants);
    }

    function getParticipantsSnapshot(room) {
        if (!rooms[room]) return [];
        const now = Date.now();
        return Object.entries(rooms[room].participants).map(([socketId, data]) => {
            let totalTime = data.totalTime || 0;
            if (data.joinTime) {
                totalTime += now - data.joinTime;
            }
            return {
                socketId,
                name: data.name,
                email: data.email,
                speakingTime: data.speakingTime || 0,
                isSpeaking: data.isSpeaking || false,
                totalTime: totalTime / 1000, // seconds
            };
        });
    }

    /**
     * Handle message from a client
     */
    socket.on('message', (message, toId = null, room = null) => {
        log('Client ' + socket.id + ' said: ', message);

        // Attach user data to gotstream message
        if (message.type === 'gotstream' && userData) {
            message.userData = userData;
        }

        if (toId) {
            console.log('From ', socket.id, ' to ', toId, message.type);
            io.to(toId).emit('message', message, socket.id);
        } else if (room) {
            console.log('From ', socket.id, ' to room: ', room, message.type);
            socket.broadcast.to(room).emit('message', message, socket.id);
        } else {
            console.log('From ', socket.id, ' to everyone ', message.type);
            socket.broadcast.emit('message', message, socket.id);
        }
    });

    /**
     * When room gets created or someone joins it
     */
    socket.on('create or join', (room, userInfo = {}) => {
        log('Create or Join room: ' + room);

        // Store user info
        userData = {
            name: userInfo.name || 'Anonymous',
            email: userInfo.email || ''
        };

        // Get number of clients in the room
        const clientsInRoom = io.sockets.adapter.rooms.get(room);
        let numClients = clientsInRoom ? clientsInRoom.size : 0;
        currentRoom = room;

        // Initialize room if it doesn't exist
        if (!rooms[room]) {
            rooms[room] = {
                participants: {},
                admin: null,
                qa: []
            };
        }

        // Add participant to room
        rooms[room].participants[socket.id] = {
            name: userData.name,
            email: userData.email,
            speakingTime: 0,
            isSpeaking: false,
            joinTime: Date.now(),
            totalTime: 0,
        };

        if (numClients === 0) {
            // Create room
            socket.join(room);
            rooms[room].admin = socket.id;
            socket.emit('created', room, socket.id);

            // Send active poll if room had one
            if (polls[room]) {
                io.to(socket.id).emit('poll:active', getPollPayload(room));
            }
        } else {
            log('Client ' + socket.id + ' joined room ' + room);

            // Join room
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready', socket.id);

            // Send current poll to the newly joined user
            if (polls[room]) {
                io.to(socket.id).emit('poll:active', getPollPayload(room));
            }
        }

        // Broadcast updated participants list
        broadcastParticipants(room);

        // Send QA list to the joined user
        io.to(socket.id).emit('qa:update', rooms[room].qa || []);

        // Send current YouTube state if active
        if (rooms[room].currentYtState) {
            const state = { ...rooms[room].currentYtState };
            // Adjust position if playing
            if (state.isPlaying && state.timestamp) {
                const elapsed = (Date.now() - state.timestamp) / 1000;
                state.position = (state.position || 0) + elapsed;
            }
            io.to(socket.id).emit('yt:state', state);
        }
    });

    /**
     * Kick participant from a call
     */
    socket.on('kickout', (socketId, room) => {
        if (rooms[room] && socket.id === rooms[room].admin) {
            socket.broadcast.emit('kickout', socketId);
            const targetSocket = io.sockets.sockets.get(socketId);
            if (targetSocket) {
                // finalize time
                const participant = rooms[room]?.participants[socketId];
                if (participant && participant.joinTime) {
                    participant.totalTime += Date.now() - participant.joinTime;
                    participant.joinTime = null;
                }
                targetSocket.leave(room);
            }
            // Remove from participants list
            if (rooms[room]?.participants[socketId]) {
                delete rooms[room].participants[socketId];
                broadcastParticipants(room);
            }
            // no QA cleanup needed
        } else {
            console.log('not an admin');
        }
    });

    /**
     * Participant leaves room
     */
    socket.on('leave room', (room) => {
        socket.leave(room);
        socket.emit('left room', room);
        socket.broadcast.to(room).emit('message', { type: 'leave' }, socket.id);

        // Remove from participants
        if (rooms[room]?.participants[socket.id]) {
            // finalize time
            if (rooms[room].participants[socket.id].joinTime) {
                rooms[room].participants[socket.id].totalTime +=
                    Date.now() - rooms[room].participants[socket.id].joinTime;


                rooms[room].participants[socket.id].joinTime = null;
            }
            delete rooms[room].participants[socket.id];
            broadcastParticipants(room);
        }

        // Remove vote from active poll
        if (polls[room]?.votes) {
            delete polls[room].votes[socket.id];
            io.sockets.in(room).emit('poll:active', getPollPayload(room));
        }

        if (currentRoom === room) {
            currentRoom = null;
        }

        // Clean up empty rooms
        if (rooms[room] && Object.keys(rooms[room].participants).length === 0) {
            delete rooms[room];
            delete polls[room];
        }
    });

    /**
     * Speaking time update
     */
    socket.on('speaking:update', ({ speakingTime, isSpeaking }) => {
        if (!currentRoom || !rooms[currentRoom]) return;

        if (rooms[currentRoom].participants[socket.id]) {
            rooms[currentRoom].participants[socket.id].speakingTime = speakingTime;
            rooms[currentRoom].participants[socket.id].isSpeaking = isSpeaking;

            // Broadcast to all in room
            io.sockets.in(currentRoom).emit('speaking:time', {
                socketId: socket.id,
                speakingTime,
                isSpeaking
            });

            // Update participants list
            broadcastParticipants(currentRoom);
        }
    });

    /**
     * Request participants list
     */
    socket.on('participants:request', () => {
        if (currentRoom) {
            broadcastParticipants(currentRoom);
        }
    });

    /**
     * Q&A: ask a question
     */
    socket.on('qa:ask', ({ question }) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        if (!question || !question.trim()) return;

        const participant = rooms[currentRoom].participants[socket.id];
        const qaEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            question: question.trim(),
            from: participant ? participant.name : 'Anonymous',
            email: participant ? participant.email : '',
            answer: null,
            answeredBy: null,
            timestamp: Date.now(),
        };

        rooms[currentRoom].qa.push(qaEntry);
        io.sockets.in(currentRoom).emit('qa:update', rooms[currentRoom].qa);
    });

    /**
     * Q&A: answer a question (admin only)
     */
    socket.on('qa:answer', ({ questionId, answer }) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        if (rooms[currentRoom].admin !== socket.id) return;
        const qaList = rooms[currentRoom].qa || [];
        const target = qaList.find((q) => q.id === questionId);
        if (!target || !answer || !answer.trim()) return;

        target.answer = answer.trim();
        target.answeredBy =
            rooms[currentRoom].participants[socket.id]?.name || 'Admin';
        io.sockets.in(currentRoom).emit('qa:update', qaList);
    });

    /**
     * Hand Raise
     */
    socket.on('hand:raise', ({ isRaised }) => {
        if (!currentRoom) return;
        socket.broadcast.to(currentRoom).emit('hand:update', {
            socketId: socket.id,
            isRaised,
            name: userData.name
        });
    });

    /**
     * Reaction
     */
    socket.on('reaction:send', ({ emoji }) => {
        if (!currentRoom) return;
        io.sockets.in(currentRoom).emit('reaction:show', {
            socketId: socket.id,
            emoji
        });
    });

    /**
     * YouTube Sync
     */
    socket.on('yt:state', (state) => {
        if (!currentRoom || !rooms[currentRoom]) return;

        // Store state persistence
        rooms[currentRoom].currentYtState = {
            ...state,
            timestamp: Date.now() // Add timestamp to calculate offset for late joiners
        };

        // Broadcast to everyone else
        socket.broadcast.to(currentRoom).emit('yt:state', state);
    });

    /**
     * When participant leaves notify other participants
     */
    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            if (room === socket.id) return;

            socket.broadcast
                .to(room)
                .emit('message', { type: 'leave' }, socket.id);

            // Remove from participants
            if (rooms[room]?.participants[socket.id]) {
                // finalize time
                if (rooms[room].participants[socket.id].joinTime) {
                    rooms[room].participants[socket.id].totalTime +=
                        Date.now() - rooms[room].participants[socket.id].joinTime;

                    rooms[room].participants[socket.id].joinTime = null;
                }
                delete rooms[room].participants[socket.id];
                broadcastParticipants(room);
            }

            // Remove vote from active poll
            if (polls[room]?.votes && polls[room].votes[socket.id] !== undefined) {
                delete polls[room].votes[socket.id];
                io.sockets.in(room).emit('poll:active', getPollPayload(room));
            }

            // Clean up empty rooms
            if (rooms[room] && Object.keys(rooms[room].participants).length === 0) {
                delete rooms[room];
                delete polls[room];
                // Clean up YT state
                delete rooms[room].currentYtState;
            }
        });
    });

    /**
     * Poll: create a new poll (single-choice)
     */
    socket.on('poll:create', ({ question, options }) => {
        if (!currentRoom) return;
        if (!question || !Array.isArray(options)) return;

        const sanitizedOptions = options
            .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
            .filter(Boolean);
        if (sanitizedOptions.length < 2) return;

        polls[currentRoom] = {
            question: question.trim(),
            options: sanitizedOptions,
            votes: {},
        };

        io.sockets.in(currentRoom).emit('poll:active', getPollPayload(currentRoom));
    });

    /**
     * Poll: cast or change a vote
     */
    socket.on('poll:vote', (optionIndex) => {
        if (!currentRoom || polls[currentRoom] === undefined) return;
        const poll = polls[currentRoom];

        const idx = Number(optionIndex);
        if (
            !Number.isInteger(idx) ||
            idx < 0 ||
            idx >= poll.options.length
        )
            return;

        // Record / update vote
        poll.votes[socket.id] = idx;
        io.sockets.in(currentRoom).emit('poll:active', getPollPayload(currentRoom));
    });

    /**
     * Poll: clear the active poll
     */
    socket.on('poll:clear', () => {
        if (!currentRoom || polls[currentRoom] === undefined) return;
        delete polls[currentRoom];
        io.sockets.in(currentRoom).emit('poll:clear');
    });
});

/**
 * Build poll payload with tallies
 */
function getPollPayload(room) {
    const poll = polls[room];
    if (!poll) return null;

    const counts = Array(poll.options.length).fill(0);
    Object.values(poll.votes || {}).forEach((voteIdx) => {
        if (typeof counts[voteIdx] === 'number') {
            counts[voteIdx] += 1;
        }
    });

    return {
        question: poll.question,
        options: poll.options.map((text, idx) => ({
            text,
            count: counts[idx],
        })),
        totalVotes: Object.keys(poll.votes || {}).length,
    };
}
