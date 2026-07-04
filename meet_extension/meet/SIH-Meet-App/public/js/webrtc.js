'use strict';

class Webrtc extends EventTarget {
    constructor(
        socket,
        pcConfig = null,
        logging = { log: true, warn: true, error: true }
    ) {
        super();
        this.room;
        this.socket = socket;
        this.pcConfig = pcConfig;

        this._myId = null;
        this.pcs = {}; // Peer connections
        this.streams = {};
        this.currentRoom;
        this.inCall = false;
        this.isReady = false; // At least 2 users are in room
        this.isInitiator = false; // Initiates connections if true
        this._isAdmin = false; // Should be checked on the server
        this._localStream = null;
        this.activePoll = null;
        this._myPollVote = null;

        // Speaking time tracking
        this._speakingTime = 0; // Total speaking time in seconds
        this._isSpeaking = false;
        this._speakingStartAt = null;
        this._speakingTicker = null;
        this._participantsList = []; // List of participants with their data
        this._qaList = [];

        // Manage logging
        this.log = logging.log ? console.log : () => { };
        this.warn = logging.warn ? console.warn : () => { };
        this.error = logging.error ? console.error : () => { };

        // Initialize socket.io listeners
        this._onSocketListeners();
    }

    // Custom event emitter
    _emit(eventName, details) {
        this.dispatchEvent(
            new CustomEvent(eventName, {
                detail: details,
            })
        );
    }

    get localStream() {
        return this._localStream;
    }

    get myId() {
        return this._myId;
    }

    get isAdmin() {
        return this._isAdmin;
    }

    get roomId() {
        return this.room;
    }

    get participants() {
        return Object.keys(this.pcs);
    }

    getParticipantsList() {
        return this._participantsList;
    }

    gotStream() {
        if (this.room) {
            this._sendMessage({ type: 'gotstream' }, null, this.room);
        } else {
            this.warn('Should join room before sending stream');

            this._emit('notification', {
                notification: `Should join room before sending a stream.`,
            });
        }
    }

    joinRoom(room, userInfo = {}) {
        if (this.room) {
            this.warn('Leave current room before joining a new one');

            this._emit('notification', {
                notification: `Leave current room before joining a new one`,
            });
            return;
        }
        if (!room) {
            this.warn('Room ID not provided');

            this._emit('notification', {
                notification: `Room ID not provided`,
            });
            return;
        }
        this.socket.emit('create or join', room, userInfo);
    }

    leaveRoom() {
        if (!this.room) {
            this.warn('You are currently not in a room');

            this._emit('notification', {
                notification: `You are currently not in a room`,
            });
            return;
        }
        this.isInitiator = false;
        this._stopSpeakingTracking();
        this._speakingTime = 0;
        this._isSpeaking = false;
        this.socket.emit('leave room', this.room);
    }

    // Get local stream
    getLocalStream(audioConstraints, videoConstraints) {
        return navigator.mediaDevices
            .getUserMedia({
                audio: audioConstraints,
                video: videoConstraints,
            })
            .then((stream) => {
                this.log('Got local stream.');
                this._localStream = stream;

                // Init speaking tracking based on mute state
                this._speakingTime = 0;
                this._isSpeaking = false;
                this._speakingStartAt = null;
                this._initSpeakingTracking();

                return stream;
            })
            .catch(() => {
                this.error("Can't get usermedia");

                this._emit('error', {
                    error: new Error(`Can't get usermedia`),
                });
            });
    }

    /**
     * Try connecting to peers
     * if got local stream and is ready for connection
     */
    _connect(socketId) {
        if (typeof this._localStream !== 'undefined' && this.isReady) {
            this.log('Create peer connection to ', socketId);

            this._createPeerConnection(socketId);
            this.pcs[socketId].addStream(this._localStream);

            if (this.isInitiator) {
                this.log('Creating offer for ', socketId);

                this._makeOffer(socketId);
            }
        } else {
            this.warn('NOT connecting');
        }
    }

    /**
     * Initialize listeners for socket.io events
     */
    _onSocketListeners() {
        this.log('socket listeners initialized');

        // Room got created
        this.socket.on('created', (room, socketId) => {
            this.room = room;
            this._myId = socketId;
            this.isInitiator = true;
            this._isAdmin = true;

            this._emit('createdRoom', { roomId: room });
        });

        // Joined the room
        this.socket.on('joined', (room, socketId) => {
            this.log('joined: ' + room);

            this.room = room;
            this.isReady = true;
            this._myId = socketId;

            this._emit('joinedRoom', { roomId: room });
        });

        // Left the room
        this.socket.on('left room', (room) => {
            if (room === this.room) {
                this.warn(`Left the room ${room}`);

                this.room = null;
                this.activePoll = null;
                this._emit('pollCleared');
                this._removeUser();
                this._emit('leftRoom', {
                    roomId: room,
                });
            }
        });

        // Someone joins room
        this.socket.on('join', (room) => {
            this.log('Incoming request to join room: ' + room);

            this.isReady = true;

            this.dispatchEvent(new Event('newJoin'));
        });

        // Room is ready for connection
        this.socket.on('ready', (user) => {
            this.log('User: ', user, ' joined room');

            if (user !== this._myId && this.inCall) this.isInitiator = true;
        });

        // Someone got kicked from call
        this.socket.on('kickout', (socketId) => {
            this.log('kickout user: ', socketId);

            if (socketId === this._myId) {
                // You got kicked out
                this.dispatchEvent(new Event('kicked'));
                this._removeUser();
            } else {
                // Someone else got kicked out
                this._removeUser(socketId);
            }
        });

        // Logs from server
        this.socket.on('log', (log) => {
            this.log.apply(console, log);
        });

        /**
         * Message from the server
         * Manage stream and sdp exchange between peers
         */
        this.socket.on('message', (message, socketId) => {
            this.log('From', socketId, ' received:', message.type);

            // Participant leaves
            if (message.type === 'leave') {
                this.log(socketId, 'Left the call.');
                this._removeUser(socketId);
                this.isInitiator = true;

                this._emit('userLeave', { socketId: socketId });
                return;
            }

            // Avoid dublicate connections
            if (
                this.pcs[socketId] &&
                this.pcs[socketId].connectionState === 'connected'
            ) {
                this.log(
                    'Connection with ',
                    socketId,
                    'is already established'
                );
                return;
            }

            switch (message.type) {
                case 'gotstream': // user is ready to share their stream
                    this._connect(socketId);
                    break;
                case 'offer': // got connection offer
                    if (!this.pcs[socketId]) {
                        this._connect(socketId);
                    }
                    this.pcs[socketId].setRemoteDescription(
                        new RTCSessionDescription(message)
                    );
                    this._answer(socketId);
                    break;
                case 'answer': // got answer for sent offer
                    this.pcs[socketId].setRemoteDescription(
                        new RTCSessionDescription(message)
                    );
                    break;
                case 'candidate': // received candidate sdp
                    this.inCall = true;
                    const candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate,
                    });
                    this.pcs[socketId].addIceCandidate(candidate);
                    break;
            }
        });

        this.socket.on('poll:active', (poll) => {
            this.activePoll = poll;
            this._emit('pollUpdated', { poll });
        });

        this.socket.on('poll:clear', () => {
            this.activePoll = null;
            this._emit('pollCleared');
        });

        // Participants list
        this.socket.on('participants:list', (participants) => {
            this._participantsList = participants;
            this._emit('participantsUpdated', { participants });
        });

        // Speaking time update
        this.socket.on('speaking:time', ({ socketId, speakingTime, isSpeaking }) => {
            this._emit('speakingTimeUpdated', { socketId, speakingTime, isSpeaking });
        });

        // Q&A updates
        this.socket.on('qa:update', (qaList) => {
            this._qaList = qaList || [];
            this._emit('qaUpdated', { qaList: this._qaList });
        });

        // Hand raise update
        this.socket.on('hand:update', ({ socketId, isRaised, name }) => {
            this._emit('handUpdated', { socketId, isRaised, name });
        });

        // Reaction show
        this.socket.on('reaction:show', ({ socketId, emoji }) => {
            this._emit('reactionShown', { socketId, emoji });
        });

        // YT Sync
        this.socket.on('yt:state', (state) => {
            this._emit('ytState', { state });
        });

        // Presentation Sync
        this.socket.on('presentation:state', ({ socketId, isPresenting }) => {
            this._emit('presentationState', { socketId, isPresenting });
        });

        // YouTube Sync
        this.socket.on('yt:state', (state) => {
            this._emit('ytUpdated', { state });
        });
    }

    _sendMessage(message, toId = null, roomId = null) {
        this.socket.emit('message', message, toId, roomId);
    }

    _createPeerConnection(socketId) {
        try {
            if (this.pcs[socketId]) {
                // Skip peer if connection is already established
                this.warn('Connection with ', socketId, ' already established');
                return;
            }

            this.pcs[socketId] = new RTCPeerConnection(this.pcConfig);
            this.pcs[socketId].onicecandidate = this._handleIceCandidate.bind(
                this,
                socketId
            );
            this.pcs[socketId].ontrack = this._handleOnTrack.bind(
                this,
                socketId
            );
            // this.pcs[socketId].onremovetrack = this._handleOnRemoveTrack.bind(
            //     this,
            //     socketId
            // );

            this.log('Created RTCPeerConnnection for ', socketId);
        } catch (error) {
            this.error('RTCPeerConnection failed: ' + error.message);

            this._emit('error', {
                error: new Error(`RTCPeerConnection failed: ${error.message}`),
            });
        }
    }

    /**
     * Send ICE candidate through signaling server (socket.io in this case)
     */
    _handleIceCandidate(socketId, event) {
        this.log('icecandidate event');

        if (event.candidate) {
            this._sendMessage(
                {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                },
                socketId
            );
        }
    }

    _handleCreateOfferError(event) {
        this.error('ERROR creating offer');

        this._emit('error', {
            error: new Error('Error while creating an offer'),
        });
    }

    /**
     * Make an offer
     * Creates session descripton
     */
    _makeOffer(socketId) {
        this.log('Sending offer to ', socketId);

        this.pcs[socketId].createOffer(
            this._setSendLocalDescription.bind(this, socketId),
            this._handleCreateOfferError
        );
    }

    /**
     * Create an answer for incoming offer
     */
    _answer(socketId) {
        this.log('Sending answer to ', socketId);

        this.pcs[socketId]
            .createAnswer()
            .then(
                this._setSendLocalDescription.bind(this, socketId),
                this._handleSDPError
            );
    }

    /**
     * Set local description and send it to server
     */
    _setSendLocalDescription(socketId, sessionDescription) {
        this.pcs[socketId].setLocalDescription(sessionDescription);
        this._sendMessage(sessionDescription, socketId);
    }

    _handleSDPError(error) {
        this.log('Session description error: ' + error.toString());

        this._emit('error', {
            error: new Error(`Session description error: ${error.toString()}`),
        });
    }

    _handleOnTrack(socketId, event) {
        this.log('Remote stream added for ', socketId);

        if (this.streams[socketId]?.id !== event.streams[0].id) {
            this.streams[socketId] = event.streams[0];

            // Find user data from participants list
            const participant = this._participantsList.find(p => p.socketId === socketId);

            this._emit('newUser', {
                socketId,
                stream: event.streams[0],
                userData: participant || {}
            });
        }
    }

    _handleUserLeave(socketId) {
        this.log(socketId, 'Left the call.');
        this._removeUser(socketId);
        this.isInitiator = false;
    }

    _removeUser(socketId = null) {
        if (!socketId) {
            // close all connections
            for (const [key, value] of Object.entries(this.pcs)) {
                this.log('closing', value);
                value.close();
                delete this.pcs[key];
            }
            this.streams = {};
        } else {
            if (!this.pcs[socketId]) return;
            this.pcs[socketId].close();
            delete this.pcs[socketId];

            delete this.streams[socketId];
        }

        this._emit('removeUser', { socketId });
    }

    kickUser(socketId) {
        if (!this.isAdmin) {
            this._emit('notification', {
                notification: 'You are not an admin',
            });
            return;
        }
        this._removeUser(socketId);
        this.socket.emit('kickout', socketId, this.room);
    }

    createPoll(question, options) {
        if (!this.room) {
            this._emit('notification', {
                notification: 'Join a room before creating a poll',
            });
            return;
        }
        this.socket.emit('poll:create', { question, options });
    }

    votePoll(optionIndex) {
        if (!this.activePoll) {
            this._emit('notification', {
                notification: 'No active poll to vote on',
            });
            return;
        }
        this._myPollVote = optionIndex;
        this.socket.emit('poll:vote', optionIndex);
    }

    clearPoll() {
        if (!this.activePoll) return;
        this.socket.emit('poll:clear');
    }

    askQuestion(question) {
        if (!this.room) {
            this._emit('notification', {
                notification: 'Join a room before asking a question',
            });
            return;
        }
        this.socket.emit('qa:ask', { question });
    }

    answerQuestion(questionId, answer) {
        if (!this._isAdmin) {
            this._emit('notification', {
                notification: 'Only admin can answer questions',
            });
            return;
        }
        this.socket.emit('qa:answer', { questionId, answer });
    }

    /**
     * Toggle audio track on/off
     * Returns true if audio is enabled after toggle, false if disabled
     */
    toggleAudio() {
        if (!this._localStream) {
            this._emit('notification', {
                notification: 'No local stream available',
            });
            return false;
        }
        const audioTracks = this._localStream.getAudioTracks();
        if (audioTracks.length === 0) {
            this._emit('notification', {
                notification: 'No audio track found',
            });
            return false;
        }
        const newState = !audioTracks[0].enabled;
        audioTracks[0].enabled = newState;
        this.log('Audio ' + (newState ? 'enabled' : 'disabled'));

        // Update speaking tracking based on mute state
        this._handleMuteStateChange(newState);

        return newState;
    }

    /**
     * Toggle video track on/off
     * Returns true if video is enabled after toggle, false if disabled
     */
    toggleVideo() {
        if (!this._localStream) {
            this._emit('notification', {
                notification: 'No local stream available',
            });
            return false;
        }
        const videoTracks = this._localStream.getVideoTracks();
        if (videoTracks.length === 0) {
            this._emit('notification', {
                notification: 'No video track found',
            });
            return false;
        }
        const newState = !videoTracks[0].enabled;
        videoTracks[0].enabled = newState;
        this.log('Video ' + (newState ? 'enabled' : 'disabled'));
        return newState;
    }

    /**
     * Initialize speaking tracking based on current mute state
     */
    _initSpeakingTracking() {
        const audioTracks = this._localStream.getAudioTracks();
        const enabled = audioTracks.length > 0 ? audioTracks[0].enabled : false;
        this._handleMuteStateChange(enabled, true);
    }

    _handleMuteStateChange(enabled, skipUpdate = false) {
        if (enabled) {
            this._startSpeaking();
        } else {
            this._stopSpeaking();
        }
        if (!skipUpdate && this.room) {
            this._emitSpeakingUpdate();
        }
    }

    _startSpeaking() {
        if (this._isSpeaking) return;
        this._isSpeaking = true;
        this._speakingStartAt = Date.now();
        this._startSpeakingTicker();
    }

    _stopSpeaking() {
        if (!this._isSpeaking) return;
        if (this._speakingStartAt) {
            this._speakingTime += (Date.now() - this._speakingStartAt) / 1000;
        }
        this._speakingStartAt = null;
        this._isSpeaking = false;
        this._stopSpeakingTicker();
        this._emitSpeakingUpdate();
    }

    _startSpeakingTicker() {
        if (this._speakingTicker) return;
        this._speakingTicker = setInterval(() => {
            if (this._isSpeaking && this._speakingStartAt) {
                const now = Date.now();
                this._speakingTime += (now - this._speakingStartAt) / 1000;
                this._speakingStartAt = now;
                this._emitSpeakingUpdate();
            }
        }, 2000);
    }

    _stopSpeakingTicker() {
        if (this._speakingTicker) {
            clearInterval(this._speakingTicker);
            this._speakingTicker = null;
        }
    }

    _stopSpeakingTracking() {
        this._stopSpeakingTicker();
        this._speakingStartAt = null;
        this._isSpeaking = false;
    }

    _emitSpeakingUpdate() {
        if (!this.room) return;
        this.socket.emit('speaking:update', {
            speakingTime: this._speakingTime,
            isSpeaking: this._isSpeaking,
        });
    }

    /**
     * Download participants data as CSV (admin only)
     */
    downloadParticipantsCSV() {
        if (!this._isAdmin) {
            this._emit('notification', {
                notification: 'Only admin can download CSV',
            });
            return;
        }

        if (this._participantsList.length === 0) {
            this._emit('notification', {
                notification: 'No participants to export',
            });
            return;
        }

        // Format time helper
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Deduplicate by socketId
        const unique = [];
        const seen = new Set();
        this._participantsList.forEach((p) => {
            if (seen.has(p.socketId)) return;
            seen.add(p.socketId);
            unique.push(p);
        });

        // Compute max duration for presence calculation
        const maxDuration = unique.reduce(
            (max, p) => Math.max(max, p.totalTime || 0),
            0
        );

        const presenceFor = (p) => {
            const total = p.totalTime || 0;
            const spoke = (p.speakingTime || 0) > 0;
            if (maxDuration === 0) return 'Absent';
            if ((spoke && total >= 0.65 * maxDuration) || total >= 0.8 * maxDuration) {
                return 'Present';
            }
            return 'Absent';
        };

        // Create CSV content
        let csv =
            'Name,Email,Speaking Time (MM:SS),Total Time (MM:SS),Presence\n';

        unique.forEach((participant) => {
            const speakTime = participant.speakingTime || 0;
            const totalTime = participant.totalTime || 0;
            const row = [
                participant.name,
                participant.email,
                formatTime(speakTime),
                formatTime(totalTime),
                presenceFor(participant),
            ];
            csv += row.map((field) => `"${field}"`).join(',') + '\n';
        });

        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.setAttribute('href', url);
        link.setAttribute('download', `room-${this.room}-${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.log('CSV downloaded');
        this._emit('notification', {
            notification: 'CSV downloaded successfully',
        });
    }

    /**
     * Screen Sharing
     */
    async toggleScreenShare() {
        if (this._localStream && this._localStream.getVideoTracks()[0].label.includes('screen')) {
            // Already sharing screen, switch back to camera
            return this.stopScreenShare();
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            const screenTrack = stream.getVideoTracks()[0];

            screenTrack.onended = () => {
                this.stopScreenShare();
            };

            this._replaceVideoTrack(screenTrack);
            this._localStream = stream; // Update local reference

            // Emit event to update local UI
            this._emit('streamChanged', { stream: this._localStream });
            this.socket.emit('presentation:state', { isPresenting: true });
            return true;
        } catch (error) {
            console.error('Error sharing screen', error);
            this._emit('notification', { notification: 'Failed to share screen' });
            return false;
        }
    }

    async stopScreenShare() {
        // Switch back to camera
        const constraints = { video: { width: 640, height: 480 }, audio: true };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoTrack = stream.getVideoTracks()[0];
            this._replaceVideoTrack(videoTrack);
            this._localStream = stream;

            this._emit('streamChanged', { stream: this._localStream });
            this.socket.emit('presentation:state', { isPresenting: false });
            return false;
        } catch (e) {
            this.error('Could not revert to camera');
            return false;
        }
    }

    _replaceVideoTrack(newTrack) {
        // Replace track in all PeerConnections
        Object.values(this.pcs).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(newTrack);
            }
        });
    }

    /**
     * Hand Raising
     */
    raiseHand(isRaised) {
        this.socket.emit('hand:raise', { isRaised });
    }

    /**
     * Reactions
     */
    sendReaction(emoji) {
        this.socket.emit('reaction:send', { emoji });
    }

    /**
     * Captions (Web Speech API)
     */
    toggleCaptions(enabled) {
        if (!enabled) {
            if (this._recognition) this._recognition.stop();
            return;
        }

        if (!('webkitSpeechRecognition' in window)) {
            this._emit('notification', { notification: 'Browser does not support Speech Recognition' });
            return;
        }

        this._recognition = new webkitSpeechRecognition();
        this._recognition.continuous = true;
        this._recognition.interimResults = true;

        this._recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                this._emit('caption:text', { text: finalTranscript, isLocal: true });
            }
        };

        this._recognition.start();
    }

    /**
     * YouTube
     */
    ytControl(action, data) {
        let state = {};
        if (action === 'play') state = { isPlaying: true };
        else if (action === 'pause') state = { isPlaying: false };
        else if (action === 'seek') state = { position: data };

        this.socket.emit('yt:state', state);
    }

    ytLoad(videoId, position = 0, isPlaying = false) {
        this.socket.emit('yt:state', { videoId, position, isPlaying });
    }
}


