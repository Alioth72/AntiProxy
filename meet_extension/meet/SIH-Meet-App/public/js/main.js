'use strict';

const socket = io.connect();

// Pre-join elements
const preJoinScreen = document.querySelector('#preJoinScreen');
const preJoinForm = document.querySelector('#preJoinForm');
const userNameInput = document.querySelector('#userName');
const userEmailInput = document.querySelector('#userEmail');
const roomIdInput = document.querySelector('#roomId');

// Conference elements
const conferenceScreen = document.querySelector('#conferenceScreen');
const roomNameSpan = document.querySelector('#roomName');
const localVideo = document.querySelector('#localVideo-container video');
const localUserNameSpan = document.querySelector('#localUserName');
const localSpeakingTimeSpan = document.querySelector('#localSpeakingTime');
const videoGrid = document.querySelector('#videoGrid');
const notification = document.querySelector('#notification');

// Sidebar elements
const participantsSidebar = document.querySelector('#participantsSidebar');
const toggleSidebarBtn = document.querySelector('#toggleSidebarBtn');
const closeSidebarBtn = document.querySelector('#closeSidebarBtn');
const participantsList = document.querySelector('#participantsList');
const downloadCsvBtn = document.querySelector('#downloadCsvBtn');
const downloadCsvHeaderBtn = document.querySelector('#downloadCsvHeaderBtn');
const tabParticipantsBtn = document.querySelector('#tabParticipants');
const tabPollsBtn = document.querySelector('#tabPolls');
const tabYouTubeBtn = document.querySelector('#tabYouTube');
const participantsTab = document.querySelector('#participantsTab');
const pollsTab = document.querySelector('#pollsTab');
const youtubeTab = document.querySelector('#youtubeTab');
const qaQuestionInput = document.querySelector('#qaQuestion');
const qaAskBtn = document.querySelector('#qaAskBtn');
const qaList = document.querySelector('#qaList');

// Control buttons
const leaveBtn = document.querySelector('#leaveBtn');
const toggleAudioBtn = document.querySelector('#toggleAudioBtn');
const toggleVideoBtn = document.querySelector('#toggleVideoBtn');

// Poll elements
const pollQuestionInput = document.querySelector('#pollQuestion');
const pollOptionsInput = document.querySelector('#pollOptions');
const createPollBtn = document.querySelector('#createPollBtn');
const clearPollBtn = document.querySelector('#clearPollBtn');
const pollContent = document.querySelector('#pollContent');
const pollStatus = document.querySelector('#pollStatus');

// YouTube elements
const ytUrlInput = document.querySelector('#ytUrlInput');
const ytLoadBtn = document.querySelector('#ytLoadBtn');
const ytPlayBtn = document.querySelector('#ytPlayBtn');
const ytPauseBtn = document.querySelector('#ytPauseBtn');
const ytSeekInput = document.querySelector('#ytSeekInput');
const ytTimeLabel = document.querySelector('#ytTimeLabel');
const ytNotice = document.querySelector('#ytNotice');
const ytFrame = document.querySelector('#ytFrame');

// YouTube state
let ytPlayer;
let ytReady = false;
let ytDuration = 0;
let ytSyncInterval = null;
let pendingYtState = null;

// Guard missing DOM (in case markup not loaded)
if (!preJoinScreen) {
    console.error('UI elements missing. Please ensure index.html is updated.');
}

// User state
let currentUser = {
    name: '',
    email: '',
    socketId: ''
};

// Notification helper
const notify = (message, duration = 3000) => {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
        // ... (existing notify code) 
    }, duration);
};

// --- Auth & Teacher Logic ---
const syncAttendanceBtn = document.querySelector('#syncAttendanceBtn');
let authToken = null; // JWT from Backend
let teacherClasses = []; // List of classes from Backend

// Expose to global scope for Google Callback
window.handleCredentialResponse = async (response) => {
    try {
        const idToken = response.credential;
        console.log("Google ID Token received, exchanging for Backend Token...");

        // Exchange ID Token for Backend JWT
        // URL based on user info: https://aims-backend-614674911910.asia-south1.run.app
        const res = await fetch('https://aims-backend-614674911910.asia-south1.run.app/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: idToken })
        });

        if (!res.ok) throw new Error('Auth failed');

        const data = await res.json();
        authToken = data.token;
        const user = data.user;

        console.log("Login Success:", user);
        notify(`Welcome, ${user.name}!`);

        // Hide Login Button
        document.getElementById('teacherLoginContainer').style.display = 'none';

        // Fetch Classes (to prepare for Sync)
        await fetchClasses();

        // Update UI Context (if already joined or pre-fill)
        if (user.email) {
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userName').value = user.name;
        }

    } catch (err) {
        console.error("Login Error:", err);
        notify("Login invalid: Not a registered teacher/admin.");
    }
};

async function fetchClasses() {
    try {
        const res = await fetch('https://aims-backend-614674911910.asia-south1.run.app/classes', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            teacherClasses = await res.json();
            console.log("Classes loaded:", teacherClasses);
            if (syncAttendanceBtn) {
                syncAttendanceBtn.style.display = 'block'; // Show Sync button
            }
        }
    } catch (e) {
        console.error("Failed to load classes", e);
    }
}
// ----------------------------

// Format time helper (seconds to MM:SS)
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Extract YouTube video ID from URL or raw ID
const extractVideoId = (value) => {
    if (!value) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
    const match = value.match(
        /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
    return match ? match[1] : null;
};

// Parse poll options
const parseOptions = (input) => {
    if (!input) return [];
    return input.split(/[\n,]/)
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
};

const pcConfig = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
            ],
        },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com',
        },
        {
            urls: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808',
        },
    ],
};

/**
 * Initialize webrtc
 */
const webrtc = new Webrtc(socket, pcConfig, {
    log: true,
    warn: true,
    error: true,
});

/**
 * Pre-join form submission
 */
preJoinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    const room = roomIdInput.value.trim();

    if (!name || !email || !room) {
        notify('Please fill in all fields');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        notify('Please enter a valid email address');
        return;
    }

    currentUser.name = name;
    currentUser.email = email;

    // Join room with user info
    webrtc.joinRoom(room, { name, email });
});

/**
 * Room created/joined handlers
 */
const setTitle = (status, e) => {
    const room = e.detail.roomId;
    console.log(`Room ${room} was ${status}`);

    // Get local media stream first
    webrtc
        .getLocalStream(true, { width: 640, height: 480 })
        .then((stream) => {
            localVideo.srcObject = stream;

            // Show conference screen
            preJoinScreen.style.display = 'none';
            conferenceScreen.style.display = 'flex';

            roomNameSpan.textContent = room;
            localUserNameSpan.textContent = currentUser.name;

            notify(`Room ${room} was ${status}`);
            webrtc.gotStream();

            // Show CSV buttons if admin
            if (webrtc.isAdmin) {
                downloadCsvBtn.style.display = 'block';
                downloadCsvHeaderBtn.style.display = 'inline-flex';
            }

            // Initialize YT player and disable controls for attendees
            initYouTubePlayer();
            const isAdmin = webrtc.isAdmin;
            [ytUrlInput, ytLoadBtn, ytPlayBtn, ytPauseBtn, ytSeekInput].forEach((el) => {
                if (el) el.disabled = !isAdmin;
            });
            if (ytNotice) ytNotice.style.display = isAdmin ? 'none' : 'block';
        })
        .catch((error) => {
            notify('Could not access camera/microphone. Please grant permissions and try again.');
            console.error('Media access error:', error);
        });
};

webrtc.addEventListener('createdRoom', setTitle.bind(this, 'created'));
webrtc.addEventListener('joinedRoom', setTitle.bind(this, 'joined'));

/**
 * Leave the room
 */
leaveBtn.addEventListener('click', () => {
    webrtc.leaveRoom();
});

webrtc.addEventListener('leftRoom', (e) => {
    const room = e.detail.roomId;
    conferenceScreen.style.display = 'none';
    preJoinScreen.style.display = 'flex';
    notify(`Left the room ${room}`);
    videoGrid.innerHTML = '';
    participantsList.innerHTML = '';
});

webrtc.addEventListener('kicked', () => {
    notify('You were kicked out of the room');
    conferenceScreen.style.display = 'none';
    preJoinScreen.style.display = 'flex';
    videoGrid.innerHTML = '';
    participantsList.innerHTML = '';
});

webrtc.addEventListener('userLeave', (e) => {
    console.log(`user ${e.detail.socketId} left room`);
});

/**
 * Handle new user connection
 */
webrtc.addEventListener('newUser', (e) => {
    const socketId = e.detail.socketId;
    const stream = e.detail.stream;
    const userData = e.detail.userData || {};

    const videoContainer = document.createElement('div');
    videoContainer.setAttribute('class', 'grid-item');
    videoContainer.setAttribute('id', socketId);

    const video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('muted', true);
    video.setAttribute('playsinline', true);
    video.srcObject = stream;

    const label = document.createElement('div');
    label.setAttribute('class', 'video-label');

    const userName = document.createElement('span');
    userName.textContent = userData.name || socketId;

    const speakingTime = document.createElement('span');
    speakingTime.setAttribute('class', 'speaking-time');
    speakingTime.setAttribute('id', `speaking-${socketId}`);
    speakingTime.textContent = '0:00';

    label.append(userName);
    label.append(speakingTime);
    videoContainer.append(video);
    videoContainer.append(label);

    // If user is admin add kick buttons
    if (webrtc.isAdmin) {
        const kickBtn = document.createElement('button');
        kickBtn.setAttribute('class', 'kick_btn');
        kickBtn.textContent = 'Kick';

        kickBtn.addEventListener('click', () => {
            webrtc.kickUser(socketId);
        });

        videoContainer.append(kickBtn);
    }

    videoGrid.append(videoContainer);
});

/**
 * Handle user got removed
 */
webrtc.addEventListener('removeUser', (e) => {
    const socketId = e.detail.socketId;
    if (!socketId) {
        // remove all remote stream elements
        videoGrid.innerHTML = '';
        participantsList.innerHTML = '';
        return;
    }
    const videoElement = document.getElementById(socketId);
    if (videoElement) videoElement.remove();
});

/**
 * Sidebar toggle
 */
toggleSidebarBtn.addEventListener('click', () => {
    participantsSidebar.classList.toggle('hidden');
});

closeSidebarBtn.addEventListener('click', () => {
    participantsSidebar.classList.add('hidden');
});

/**
 * Sidebar tabs
 */
const activateTab = (tabName) => {
    const isParticipants = tabName === 'participants';
    const isPolls = tabName === 'polls';
    const isYouTube = tabName === 'youtube';

    tabParticipantsBtn.classList.toggle('active', isParticipants);
    tabPollsBtn.classList.toggle('active', isPolls);
    tabYouTubeBtn.classList.toggle('active', isYouTube);

    participantsTab.classList.toggle('active', isParticipants);
    pollsTab.classList.toggle('active', isPolls);
    youtubeTab.classList.toggle('active', isYouTube);

    participantsTab.style.display = isParticipants ? 'block' : 'none';
    pollsTab.style.display = isPolls ? 'block' : 'none';
    youtubeTab.style.display = isYouTube ? 'block' : 'none';
};

tabParticipantsBtn.addEventListener('click', () => activateTab('participants'));
tabPollsBtn.addEventListener('click', () => activateTab('polls'));
tabYouTubeBtn.addEventListener('click', () => activateTab('youtube'));
// Default
activateTab('participants');

/**
 * Update participants list
 */
webrtc.addEventListener('participantsUpdated', (e) => {
    const participants = e.detail.participants || [];

    participantsList.innerHTML = '';

    participants.forEach(participant => {
        const card = document.createElement('div');
        card.setAttribute('class', 'participant-card');
        card.setAttribute('id', `participant-${participant.socketId}`);

        if (participant.isSpeaking) {
            card.classList.add('speaking');
        }

        const info = document.createElement('div');
        info.setAttribute('class', 'participant-info');

        const avatar = document.createElement('div');
        avatar.setAttribute('class', 'participant-avatar');
        avatar.textContent = participant.name.charAt(0).toUpperCase();

        const details = document.createElement('div');
        details.setAttribute('class', 'participant-details');

        const name = document.createElement('div');
        name.setAttribute('class', 'participant-name');
        name.textContent = participant.name;

        const email = document.createElement('div');
        email.setAttribute('class', 'participant-email');
        email.textContent = participant.email;

        details.append(name);
        details.append(email);
        info.append(avatar);
        info.append(details);

        const timeInfo = document.createElement('div');
        timeInfo.setAttribute('class', 'participant-speaking-time');

        if (participant.isSpeaking) {
            const indicator = document.createElement('span');
            indicator.setAttribute('class', 'speaking-indicator');
            timeInfo.append(indicator);
        }

        const timeText = document.createElement('span');
        timeText.textContent = `🕐 Speaking time: ${formatTime(participant.speakingTime || 0)}`;
        timeInfo.append(timeText);

        card.append(info);
        card.append(timeInfo);
        participantsList.append(card);
    });
});

/**
 * Update speaking times
 */
webrtc.addEventListener('speakingTimeUpdated', (e) => {
    const { socketId, speakingTime, isSpeaking } = e.detail;

    // Update video grid label
    const speakingTimeElement = document.getElementById(`speaking-${socketId}`);
    if (speakingTimeElement) {
        speakingTimeElement.textContent = formatTime(speakingTime);
    }

    // Update participant card
    const participantCard = document.getElementById(`participant-${socketId}`);
    if (participantCard) {
        if (isSpeaking) {
            participantCard.classList.add('speaking');
        } else {
            participantCard.classList.remove('speaking');
        }
    }

    // Update local speaking time
    if (socketId === webrtc.myId) {
        localSpeakingTimeSpan.textContent = formatTime(speakingTime);
    }
});

// --- Attendance Sync Logic ---
if (syncAttendanceBtn) {
    syncAttendanceBtn.addEventListener('click', async () => {
        if (!authToken) {
            notify("You must be logged in as a Teacher.");
            return;
        }

        // 1. Ask user to select a class (Simple prompt for now, or use first class)
        if (teacherClasses.length === 0) {
            notify("No classes found for your account.");
            return;
        }

        // Ideally, show a modal. For simplicity, we use the first class or matching ID if possible.
        // Let's assume the Room ID matches Class ID or we prompt.
        // Since we don't have a UI for selection yet, let's try to match Room ID to Class ID? 
        // Or just pick the first one for demonstration as requested.
        let selectedClass = teacherClasses[0];

        notify(`Syncing attendance for: ${selectedClass.name || 'Class'}...`);

        try {
            // Get Participants from WebRTC (Needs webrtc.js reference or local list)
            // participantsList is a DOM element. webrtc._participantsList is the data.
            // But webrtc instance is global 'webrtc'.
            const participants = webrtc.getParticipantsList(); // We need to ensure this method exists or access property

            // 2. Create Session
            const sessionRes = await fetch('https://aims-backend-614674911910.asia-south1.run.app/attendance/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    classId: selectedClass.id,
                    sessionDate: new Date().toISOString().split('T')[0],
                    processedImageUrl: "https://via.placeholder.com/150" // Placeholder as we don't have image
                })
            });

            if (!sessionRes.ok) throw new Error("Failed to create session");
            const sessionData = await sessionRes.json();
            const sessionId = sessionData.id;

            // 3. Mark Statuses
            // Map current participants to updates. 
            // PROBLEM: We need Roll No. We only have Name/Email. 
            // Backend expects "rollNo". 
            // Let's try to send what we have? Or maybe endpoint accepts email?
            // "updates": [{"rollNo": "...", "status": "present"}]
            // We'll assume the user (Teacher) has to map this manually later if auto-map fails?
            // Actually, we can't map without Roll No. 
            // Let's log this limitation and notify user.

            notify("Session Created! (Auto-marking requires Roll No - not yet implemented)");
            console.log("Session ID:", sessionId);

        } catch (e) {
            console.error("Sync Error:", e);
            notify("Sync Failed: " + e.message);
        }
    });
}
// -----------------------------

/**
 * CSV Export (admin only)
 */
downloadCsvBtn.addEventListener('click', () => {
    webrtc.downloadParticipantsCSV();
});

downloadCsvHeaderBtn.addEventListener('click', () => {
    webrtc.downloadParticipantsCSV();
});

/**
 * Polls UI
 */
const renderPoll = (poll) => {
    pollContent.innerHTML = '';
    if (!poll) {
        pollStatus.textContent = 'No active poll';
        return;
    }
    pollStatus.textContent = poll.question;

    poll.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.textContent = `${opt.text} (${opt.count})`;
        btn.addEventListener('click', () => {
            webrtc.votePoll(idx);
        });
        pollContent.append(btn);
    });
};

createPollBtn.addEventListener('click', () => {
    const question = pollQuestionInput.value.trim();
    const options = parseOptions(pollOptionsInput.value);
    if (!question || options.length < 2) {
        notify('Enter a question and at least 2 options (comma or newline separated)');
        return;
    }
    webrtc.createPoll(question, options);
    pollQuestionInput.value = '';
    pollOptionsInput.value = '';
});

clearPollBtn.addEventListener('click', () => {
    webrtc.clearPoll();
});

webrtc.addEventListener('pollUpdated', (e) => {
    renderPoll(e.detail.poll);
});

webrtc.addEventListener('pollCleared', () => {
    renderPoll(null);
});

/**
 * Q&A
 */
qaAskBtn.addEventListener('click', () => {
    const question = (qaQuestionInput.value || '').trim();
    if (!question) {
        notify('Enter a question');
        return;
    }
    webrtc.askQuestion(question);
    qaQuestionInput.value = '';
});

const renderQA = (qaListData) => {
    qaList.innerHTML = '';
    if (!qaListData || qaListData.length === 0) {
        qaList.innerHTML = '<p class="muted">No questions yet</p>';
        return;
    }
    qaListData
        .slice()
        .reverse()
        .forEach((item) => {
            const card = document.createElement('div');
            card.className = 'qa-card';

            const qText = document.createElement('div');
            qText.className = 'qa-question';
            qText.textContent = item.question;

            const meta = document.createElement('div');
            meta.className = 'qa-meta';
            meta.textContent = `Asked by ${item.from || 'Guest'}`;

            card.appendChild(qText);
            card.appendChild(meta);

            if (item.answer) {
                const aText = document.createElement('div');
                aText.className = 'qa-answer';
                aText.textContent = `Answer: ${item.answer}`;
                card.appendChild(aText);

                const aMeta = document.createElement('div');
                aMeta.className = 'qa-meta';
                aMeta.textContent = `Answered by ${item.answeredBy || 'Admin'}`;
                card.appendChild(aMeta);
            } else if (webrtc.isAdmin) {
                const answerInput = document.createElement('textarea');
                answerInput.placeholder = 'Type answer';
                answerInput.rows = 2;
                answerInput.className = 'qa-answer-input';

                const answerBtn = document.createElement('button');
                answerBtn.textContent = 'Submit Answer';
                answerBtn.addEventListener('click', () => {
                    const val = answerInput.value.trim();
                    if (!val) {
                        notify('Enter an answer');
                        return;
                    }
                    webrtc.answerQuestion(item.id, val);
                });

                card.appendChild(answerInput);
                card.appendChild(answerBtn);
            } else {
                const pending = document.createElement('div');
                pending.className = 'qa-meta';
                pending.textContent = 'Awaiting answer...';
                card.appendChild(pending);
            }

            qaList.appendChild(card);
        });
};

webrtc.addEventListener('qaUpdated', (e) => {
    renderQA(e.detail.qaList || []);
});

/**
 * YouTube shared player (sidebar tab)
 */
const loadYouTubeAPI = () =>
    new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        window.onYouTubeIframeAPIReady = () => resolve();
        document.body.appendChild(tag);
    });

const initYouTubePlayer = async () => {
    if (ytPlayer || !ytFrame) return;
    // Ensure iframe has origin + enablejsapi
    const origin = window.location.origin;
    ytFrame.src = `https://www.youtube.com/embed/?enablejsapi=1&origin=${encodeURIComponent(
        origin
    )}`;

    await loadYouTubeAPI();
    ytPlayer = new YT.Player('ytFrame', {
        playerVars: {
            controls: webrtc.isAdmin ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            disablekb: webrtc.isAdmin ? 0 : 1,
            autoplay: 1,
            mute: 1, // Required for autoplay policy
        },
        events: {
            onReady: (event) => {
                ytReady = true;
                event.target.mute(); // Double down on mute
                // If there is a pending state (e.g. from join), apply it now
                if (pendingYtState) {
                    applyYtState(pendingYtState);
                    pendingYtState = null;
                }
            },
            onStateChange: (event) => {
                // Prevent user from pausing if not admin
                if (!webrtc.isAdmin && event.data === YT.PlayerState.PAUSED) {
                    // Trust server state, do nothing local
                }
                updateYtUi();
            },
            onError: (err) => {
                console.error('YouTube player error', err);
                notify('YouTube playback error. Try another video or check network.');
            },
        },
    });
};

const applyYtState = (state) => {
    console.log('[YouTube] Applying state:', state);
    if (!state) return;

    // Auto-promote to stage if not already
    if (ytFrame && ytFrame.parentNode !== stageDisplay) {
        enterStageMode(ytFrame);
    }

    if (!ytReady || !ytPlayer || !ytPlayer.loadVideoById) {
        console.log('[YouTube] Player not ready, queuing state');
        pendingYtState = state;
        return;
    }

    try {
        if (state.videoId) {
            const currentId = ytPlayer.getVideoData ? ytPlayer.getVideoData().video_id : null;
            if (currentId !== state.videoId) {
                // New video -> load and play
                ytPlayer.loadVideoById({
                    videoId: state.videoId,
                    startSeconds: state.position || 0,
                });
            } else {
                // Same video -> seek if needed
                if (typeof state.position === 'number') {
                    const currentPos = ytPlayer.getCurrentTime();
                    // Only seek if significantly different to assume scrub
                    if (Math.abs(currentPos - state.position) > 2) {
                        ytPlayer.seekTo(state.position, true);
                    }
                }
            }

            // Sync Play/Pause
            if (state.playing) {
                ytPlayer.playVideo();
            } else {
                ytPlayer.pauseVideo();
            }
        }
    } catch (e) {
        console.error('Error applying YT state:', e);
    }
};

webrtc.addEventListener('ytUpdated', (e) => {
    applyYtState(e.detail.state);
});

/**
 * YouTube shared player (sidebar tab)
 */

const updateYtUi = () => {
    if (!ytPlayer || !ytReady) return;
    const current = ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0;
    ytDuration = ytPlayer.getDuration ? ytPlayer.getDuration() : 0;

    if (ytSeekInput) {
        ytSeekInput.max = ytDuration || 0;
        if (Math.abs(ytSeekInput.value - current) > 2) {
            ytSeekInput.value = current || 0;
        }
    }
    if (ytTimeLabel) {
        ytTimeLabel.textContent = `${formatTime(current || 0)} / ${formatTime(
            ytDuration || 0
        )}`;
    }
};

const startYtSyncTicker = () => {
    // No longer using a tickers, relying on events
};

// Admin controls
if (ytLoadBtn) {
    ytLoadBtn.addEventListener('click', () => {
        const videoId = extractVideoId((ytUrlInput.value || '').trim());
        if (!videoId) {
            notify('Enter a valid YouTube URL or ID');
            return;
        }
        const pos = ytPlayer && ytReady ? ytPlayer.getCurrentTime() || 0 : 0;
        // Apply locally immediately, then emit to room
        applyYtState({ videoId, position: pos, isPlaying: true }); // Default to playing
        webrtc.ytLoad(videoId, pos, true);
    });
}

if (ytPlayBtn) {
    ytPlayBtn.addEventListener('click', () => {
        webrtc.ytControl('play');
    });
}

if (ytPauseBtn) {
    ytPauseBtn.addEventListener('click', () => {
        webrtc.ytControl('pause');
    });
}

if (ytSeekInput) {
    ytSeekInput.addEventListener('input', (e) => {
        if (!webrtc.isAdmin) return;
        const val = Number(e.target.value) || 0;
        webrtc.ytControl('seek', val);
    });
}



// --- end YouTube ---

/**
 * Handle errors
 */
const shareScreenBtn = document.querySelector('#shareScreenBtn');
const raiseHandBtn = document.querySelector('#raiseHandBtn');
const captionsBtn = document.querySelector('#captionsBtn');
const reactionBtn = document.querySelector('#reactionBtn');
const emojiPicker = document.querySelector('#emojiPicker');
const captionsContainer = document.querySelector('#captionsContainer');
const reactionOverlay = document.querySelector('#reactionOverlay');

// ... (previous listeners)

/**
 * Audio/Video Toggle
 */
toggleAudioBtn.addEventListener('click', () => {
    const enabled = webrtc.toggleAudio();
    toggleAudioBtn.classList.toggle('active', !enabled);
    const icon = toggleAudioBtn.querySelector('i');
    if (icon) {
        icon.className = enabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
    }
    // Update local user card if needed
});

toggleVideoBtn.addEventListener('click', () => {
    const enabled = webrtc.toggleVideo();
    toggleVideoBtn.classList.toggle('active', !enabled);
    const icon = toggleVideoBtn.querySelector('i');
    if (icon) {
        icon.className = enabled ? 'fas fa-video' : 'fas fa-video-slash';
    }
});

/**
 * Screen Share
 */
shareScreenBtn.addEventListener('click', () => {
    webrtc.toggleScreenShare().then(isSharing => {
        shareScreenBtn.classList.toggle('active', isSharing);
        shareScreenBtn.title = isSharing ? 'Stop Screen Sharing' : 'Share Screen';
    });
});

webrtc.addEventListener('streamChanged', (e) => {
    const stream = e.detail.stream;
    if (localVideo) {
        localVideo.srcObject = stream;
    }
});

/**
 * Hand Raising
 */
let isHandRaised = false;
raiseHandBtn.addEventListener('click', () => {
    isHandRaised = !isHandRaised;
    webrtc.raiseHand(isHandRaised);
    raiseHandBtn.classList.toggle('active', isHandRaised);
    raiseHandBtn.title = isHandRaised ? 'Lower Hand' : 'Raise Hand';

    // Show local feedback
    if (isHandRaised) {
        notify('You raised your hand');
    }
});

webrtc.addEventListener('handUpdated', (e) => {
    const { socketId, isRaised, name } = e.detail;
    if (isRaised) {
        notify(`${name || 'Someone'} raised their hand!`);
        // Visual indicator on video
        const videoContainer = document.getElementById(socketId);
        if (videoContainer) {
            videoContainer.classList.add('hand-raised');
            let handIcon = videoContainer.querySelector('.hand-icon');
            if (!handIcon) {
                handIcon = document.createElement('div');
                handIcon.className = 'hand-icon';
                handIcon.textContent = '✋';
                videoContainer.appendChild(handIcon);
            }
        }
    } else {
        const videoContainer = document.getElementById(socketId);
        if (videoContainer) {
            videoContainer.classList.remove('hand-raised');
            const handIcon = videoContainer.querySelector('.hand-icon');
            if (handIcon) handIcon.remove();
        }
    }
});

/**
 * Reactions
 */
reactionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle('hidden');
});

// Close picker when clicking outside
document.addEventListener('click', (e) => {
    if (!reactionBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
        emojiPicker.classList.add('hidden');
    }
});

emojiPicker.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        const emoji = e.target.dataset.emoji;
        webrtc.sendReaction(emoji);
        emojiPicker.classList.add('hidden');
        showFloatingEmoji(emoji, true); // Show locally
    }
});

webrtc.addEventListener('reactionShown', (e) => {
    const { emoji } = e.detail;
    showFloatingEmoji(emoji, false);
});

function showFloatingEmoji(emoji, isLocal) {
    const el = document.createElement('div');
    el.textContent = emoji;
    el.className = 'floating-emoji';
    el.style.left = Math.random() * 80 + 10 + '%'; // Random horizontal position
    reactionOverlay.appendChild(el);

    // Cleanup after animation
    setTimeout(() => {
        el.remove();
    }, 2000);
}

/**
 * Captions
 */
let captionsEnabled = false;
captionsBtn.addEventListener('click', () => {
    captionsEnabled = !captionsEnabled;
    webrtc.toggleCaptions(captionsEnabled);
    captionsBtn.classList.toggle('active', captionsEnabled);
    captionsBtn.title = captionsEnabled ? 'Hide Captions' : 'Show Captions';
    captionsContainer.classList.toggle('hidden', !captionsEnabled);
});

webrtc.addEventListener('caption:text', (e) => {
    if (!captionsEnabled) return;
    const { text } = e.detail;
    captionsContainer.textContent = text;
    captionsContainer.classList.remove('hidden');

    // Auto-hide text after silence
    if (window.captionTimeout) clearTimeout(window.captionTimeout);
    window.captionTimeout = setTimeout(() => {
        captionsContainer.textContent = '';
        captionsContainer.classList.add('hidden');
    }, 3000);
});

// Handle errors
webrtc.addEventListener('error', (e) => {
    const error = e.detail.error;
    console.error(error);
    notify(error.message || error);
});

// Handle notifications
webrtc.addEventListener('notification', (e) => {
    const notif = e.detail.notification;
    console.log(notif);
    notify(notif);
});

webrtc.addEventListener('ytState', (e) => {
    const state = e.detail.state;

    // Ensure YT player is in stage
    if (ytFrame && ytFrame.parentNode !== stageDisplay) {
        enterStageMode(ytFrame);
    }

    applyYtState(state);
});

// Presentation Listener
webrtc.addEventListener('presentationState', (e) => {
    const { socketId, isPresenting } = e.detail;

    if (isPresenting) {
        // Find the video element for this user
        const videoContainer = document.getElementById(socketId);
        if (videoContainer) {
            const video = videoContainer.querySelector('video');
            if (video) {
                // Clone the stream to a new stage video to keep thumbnail
                const stageVideo = document.createElement('video');
                stageVideo.srcObject = video.srcObject;
                stageVideo.autoplay = true;
                stageVideo.playsInline = true;

                enterStageMode(stageVideo);
            }
        } else if (socketId === webrtc.myId) {
            // Local present - no action needed usually unless we want self-view on stage
        }
    } else {
        // Stop presentation
        if (activeStageElement && activeStageElement.tagName === 'VIDEO') {
            exitStageMode();
        }
    }
});

// If local screen share starts
webrtc.addEventListener('streamChanged', (e) => {
    const stream = e.detail.stream;

    // Check if it's a screen share track
    const isScreen = stream.getVideoTracks()[0].label.toLowerCase().includes('screen');

    if (isScreen) {
        notify('You are sharing your screen');
    } else {
        // Stopped presenting
        if (activeStageElement && activeStageElement.tagName === 'VIDEO') {
            exitStageMode();
        }
    }
});
