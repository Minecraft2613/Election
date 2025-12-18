document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const initialLoginSection = document.getElementById('initial-login-section');
    const votingIdInputInitial = document.getElementById('voting-id-input-initial');
    const votingIdLoginBtnInitial = document.getElementById('voting-id-login-btn-initial');
    const mainAppContainer = document.getElementById('main-app-container');

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');

    // Tab Buttons (now tab items)
    const tabVote = document.getElementById('tab-vote');
    const tabCandidateLogin = document.getElementById('tab-candidate-login');
    const tabRegisterCandidate = document.getElementById('tab-register-candidate');

    // Tab Contents
    const contentVote = document.getElementById('content-vote');
    const contentCandidateLogin = document.getElementById('content-candidate-login');
    const contentRegisterCandidate = document.getElementById('content-register-candidate');

    // Vote Section Elements (after initial login)
    const voteSectionDetails = document.getElementById('vote-section-details');
    const votingDisabledMessage = document.getElementById('voting-disabled-message');
    const playerInfoDisplay = document.getElementById('player-info-display');
    const displayMinecraftName = document.getElementById('display-minecraft-name');
    const displayGameEdition = document.getElementById('display-game-edition');
    const bedrockHint = document.getElementById('bedrock-hint'); // New hint element
    const partyListForVoting = document.getElementById('party-list-for-voting');
    const partyListDiv = document.getElementById('party-list');
    const partySearchInput = document.getElementById('party-search-input'); // New search input element

    // Optional Details Elements
    const realNameInput = document.getElementById('real-name-input');
    const contactInfoInput = document.getElementById('contact-info-input');
    const enteredDetailsDisplay = document.getElementById('entered-details-display');
    const displayRealName = document.getElementById('display-real-name');
    const displayContactInfo = document.getElementById('display-contact-info');

    // Live Vote Count Elements
    const liveVoteCountDiv = document.getElementById('live-vote-count'); // Correctly defined

    // Candidate Management Elements
    const partyManagementLoginSection = document.getElementById('party-management-login-section');
    const partyLoginForm = document.getElementById('party-login-form');
    const candidateDashboard = document.getElementById('candidate-dashboard');
    // logoutCandidateBtn is dynamically created inside displayCandidateDashboard

    // Register Candidate Elements
    const registerCandidateForm = document.getElementById('register-candidate-form');
    const logoPreview = document.getElementById('logo-preview');
    const uploadLogoBtn = document.getElementById('upload-logo-btn');
    const partyLogoUpload = document.getElementById('party-logo-upload');

    // Custom Alert Modal Elements
    const customAlertModal = document.getElementById('custom-alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');

    // Loading Animation for Initial Login
    const loginFormContainer = document.getElementById('login-form-container');
    const loginLoadingAnimation = document.getElementById('login-loading-animation');

    // Vote Casting Animation Elements
    const voteCastingOverlay = document.getElementById('vote-casting-overlay');
    const voteCastingText = document.getElementById('vote-casting-text');

    // --- Feature Toggles and Custom Messages ---
    const IS_VOTING_ENABLED = true; // Set to true to enable voting as requested
    const VOTING_DISABLED_CUSTOM_MESSAGE = "Voting is tomorrow. Please check back tomorrow at 1 pm !";

    const IS_REGISTRATION_ENABLED = true; // Set to true to enable candidate registration
    const REGISTRATION_DISABLED_CUSTOM_MESSAGE = "Voting is going on.";
    // --- End Feature Toggles ---

    // --- Constants & State Variables ---
    const API_BASE_URL = 'https://voting.1987sakshamsingh.workers.dev/api';
    const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADa613fAAAAaElEQVR42u3PQREAAAgDoC2G/Yt62e20IIDz9wYBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgMDbA3cAAR2gLdJPAAAAAElFTSuQmCC';
    let allCandidates = []; // Stores all fetched candidates for search
    let votes = [];
    let currentVotingId = sessionStorage.getItem('currentVotingId') || null;
    let currentVotingPlayerDetails = JSON.parse(sessionStorage.getItem('currentVotingPlayerDetails')) || null;
    let loggedInCandidate = JSON.parse(sessionStorage.getItem('loggedInCandidate')) || null;
    let isVotingDisabledForUsedId = false;

    // --- Theme Management ---
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            themeToggle.innerHTML = '<span class="icon">☀️</span> Light Mode';
        } else {
            themeToggle.innerHTML = '<span class="icon">🌙</span> Dark Mode';
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // --- API Fetch Functions ---
    async function fetchData(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error fetching ${endpoint}: ${response.status} - ${errorText}`);
                showCustomAlert(`Error loading data: ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Network error fetching ${endpoint}:`, error);
            showCustomAlert("Network error: Could not connect to the server. Please check your connection or try again later.");
            return null;
        }
    }

    async function postData(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error posting to ${endpoint}: ${response.status} - ${errorText}`);
                showCustomAlert(`Error: ${errorText || response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Network error posting to ${endpoint}:`, error);
            showCustomAlert("Network error: Could not connect to the server. Please check your connection or try again later.");
            return null;
        }
    }

    // --- Helper Functions ---
    function showCustomAlert(message, isGamified = false) {
        alertMessage.textContent = message;
        if (isGamified) {
            customAlertModal.querySelector('.custom-alert-content').classList.add('gamified-alert-content');
        } else {
            customAlertModal.querySelector('.custom-alert-content').classList.remove('gamified-alert-content');
        }
        customAlertModal.classList.add('visible');
    }

    function hideCustomAlert() {
        customAlertModal.classList.remove('visible');
    }

    function getPartyVoteCount(partyName) {
        return votes.filter(vote => vote.party === partyName).length;
    }

    function triggerConfettiAndEmojis(partyName) {
        const confettiCount = 150;
        const emojiCount = 30;
        const emojis = ['🎉', '🥳', '✨', '⚡️', '🚀', '🔥', '🌟', '💎', '💯', '🏆'];
        
        // Simple color mapping for parties
        const partyColors = {
            'Sovereign': '240', // Blue
            'Default': '0',     // Red for others
        };
        const hue = partyColors[partyName] || partyColors['Default'];

        // Confetti
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = `${Math.random() * 100}vh`;
            // Use party-specific color, with some variation
            confetti.style.backgroundColor = `hsl(${hue}, 100%, ${Math.random() * 50 + 50}%)`;
            confetti.style.setProperty('--x', `${Math.random() * 500 - 250}px`);
            confetti.style.setProperty('--y', `${Math.random() * 500 - 250}px`);
            confetti.style.setProperty('--x-end', `${Math.random() * 1000 - 500}px`);
            confetti.style.setProperty('--y-end', `${window.innerHeight + 200}px`);
            document.body.appendChild(confetti);
            confetti.addEventListener('animationend', () => confetti.remove());
        }

        // Emojis
        for (let i = 0; i < emojiCount; i++) {
            const emoji = document.createElement('div');
            emoji.classList.add('emoji-explosion');
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.left = `${window.innerWidth / 2}px`;
            emoji.style.top = `${window.innerHeight / 2}px`;
            emoji.style.setProperty('--x-end', `${Math.random() * 400 - 200}px`);
            emoji.style.setProperty('--y-end', `${Math.random() * 400 - 200}px`);
            document.body.appendChild(emoji);
            emoji.addEventListener('animationend', () => emoji.remove());
        }
    }

    function playRoboticSound(message) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('Zira') || voice.name.includes('Microsoft David') || voice.lang === 'en-US'); // Try to find a robotic voice
            utterance.rate = 0.9; // Slightly slower
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        } else {
            console.warn("Speech Synthesis not supported in this browser.");
        }
    }

    function playVoteVideoAnimation(partyName) {
        const overlay = document.getElementById('vote-casting-overlay');
        const paper = document.getElementById('vote-paper-text');
        const successSound = document.getElementById('success-sound');

        paper.textContent = partyName;
        overlay.classList.remove('hidden');

        // Sound + vibration
        successSound.currentTime = 0;
        successSound.play().catch(()=>{});
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        // Celebration message
        const msg = document.createElement('div');
        msg.className = 'vote-success-text';
        msg.innerHTML = `
            You have voted for <strong>${partyName}</strong>.<br>
            Please wait until the election ends and see who wins.
        `;
        document.body.appendChild(msg);

        setTimeout(() => {
            overlay.classList.add('hidden');
            msg.remove();
        }, 4000);
    }

    // --- UI Management Functions ---

    /**
     * Shows a specific tab content and activates its item.
     * @param {HTMLElement} tabContentToShow - The content div to display.
     * @param {HTMLElement} tabItemToActivate - The item to mark as active.
     */
    function showTab(tabContentToShow, tabItemToActivate) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        // Deactivate all tab items
        document.querySelectorAll('.tab-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show the selected tab content
        tabContentToShow.classList.remove('hidden');
        // Activate the selected tab item
        tabItemToActivate.classList.add('active');

        // Perform specific updates for each tab
        if (tabContentToShow === contentVote) {
            updateVoteSectionUI();
        } else if (tabContentToShow === contentCandidateLogin) {
            displayCandidateDashboard(); // Show login form or dashboard
        } else if (tabContentToShow === contentRegisterCandidate) {
            // No specific update needed on tab switch, form is always visible
        }
    }

    /**
     * Updates the UI of the Vote section based on login status and voting ID usage.
     */
    function updateVoteSectionUI() {
        // This function is now only called AFTER a successful initial login

        // Check if voting is generally enabled
        if (!IS_VOTING_ENABLED) {
            voteSectionDetails.classList.remove('hidden'); // Ensure container is visible for message
            playerInfoDisplay.classList.add('hidden');
            realNameInput.classList.add('hidden');
            contactInfoInput.classList.add('hidden');
            enteredDetailsDisplay.classList.add('hidden');
            partyListForVoting.classList.add('hidden');
            votingDisabledMessage.classList.remove('hidden');
            votingDisabledMessage.innerHTML = `<p class="text-xl font-semibold">${VOTING_DISABLED_CUSTOM_MESSAGE}</p>`;
            votingDisabledMessage.classList.remove('bg-red-100', 'border-red-300', 'text-red-700');
            votingDisabledMessage.classList.add('disabled-message'); // Apply custom style
            return; // Exit early if voting is disabled
        }

        voteSectionDetails.classList.remove('hidden');

        // Display player info from the validated voting ID
        if (currentVotingPlayerDetails) {
            displayMinecraftName.textContent = currentVotingPlayerDetails.playerName || 'N/A';
            displayGameEdition.textContent = currentVotingPlayerDetails.gameEdition || 'N/A';
            playerInfoDisplay.classList.remove('hidden');

            if (currentVotingPlayerDetails.gameEdition === 'Bedrock') {
                bedrockHint.classList.remove('hidden');
            } else {
                bedrockHint.classList.add('hidden');
            }
        } else {
            playerInfoDisplay.classList.add('hidden');
        }

        // Update entered details display dynamically as user types
        realNameInput.addEventListener('input', updateEnteredDetailsDisplay);
        contactInfoInput.addEventListener('input', updateEnteredDetailsDisplay);
        updateEnteredDetailsDisplay(); // Initial call to set display based on current values

        if (isVotingDisabledForUsedId) {
            votingDisabledMessage.classList.remove('hidden');
            votingDisabledMessage.innerHTML = `
                <p class="text-xl font-semibold">
                    This Voting ID has already been used. You cannot cast another vote.
                </p>
                <p class="text-sm mt-2">You can still view live vote counts and candidate information.</p>
            `;
            // Remove old tailwind classes if present
            votingDisabledMessage.classList.remove('bg-red-100', 'border-red-300', 'text-red-700');
            // Add custom readable style
            votingDisabledMessage.classList.add('disabled-message-error');
            partyListForVoting.classList.add('hidden');
        } else {
            votingDisabledMessage.classList.add('hidden');
            partyListForVoting.classList.remove('hidden');
            // Ensure search input is visible and party list is displayed
            partySearchInput.value = ''; // Clear search input on UI update
            displayPartyList(); // Display all parties initially
        }
    }

    function updateEnteredDetailsDisplay() {
        displayRealName.textContent = `Real Name: ${realNameInput.value}`;
        displayContactInfo.textContent = `Contact: ${contactInfoInput.value}`;
        if (realNameInput.value || contactInfoInput.value) {
            enteredDetailsDisplay.classList.remove('hidden');
        } else {
            enteredDetailsDisplay.classList.add('hidden');
        }
    }

    /**
     * Updates and displays the live vote count for all parties.
     */
    async function updateLiveVoteCount() {
        // Fetch latest votes and candidates directly to ensure data consistency
        votes = await fetchData('/votes');
        const latestCandidates = await fetchData('/candidates');

        if (!votes || !latestCandidates) {
            liveVoteCountDiv.innerHTML = '<p class="text-center text-gray-500">Error loading vote data or candidate data.</p>';
            return;
        }

        // Update the global allCandidates array with the latest data
        allCandidates = latestCandidates;

        liveVoteCountDiv.innerHTML = ''; // Clear previous content
        const voteCounts = {};
        const totalVotes = votes.length;

        // Add a header for the total vote count
        const totalVotesHeader = document.createElement('h3');
        totalVotesHeader.className = 'text-xl font-bold mb-2 text-center'; // Reduced margin-bottom
        totalVotesHeader.textContent = `Total Votes: ${totalVotes}`;
        liveVoteCountDiv.appendChild(totalVotesHeader);

        // Add "Minecraft_2613" text
        const customText = document.createElement('p');
        customText.className = 'text-sm text-gray-400 text-center mb-4';
        customText.textContent = 'Minecraft_2613';
        liveVoteCountDiv.appendChild(customText);

        // Initialize counts for all known candidates
        allCandidates.forEach(c => voteCounts[c.partyName] = 0);

        // Tally votes
        votes.forEach(vote => {
            if (voteCounts.hasOwnProperty(vote.party)) {
                voteCounts[vote.party]++;
            }
        });

        const sortedVoteCounts = Object.entries(voteCounts).sort(([, countA], [, countB]) => countB - countA);

        if (sortedVoteCounts.length > 0) {
            sortedVoteCounts.forEach(([party, count], index) => {
                const rank = index + 1;
                const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(2) : 0;
                const partyData = allCandidates.find(c => c.partyName === party);
                
                const div = document.createElement('div');
                div.className = 'vote-count-item flex items-center p-3 rounded-lg shadow-sm';

                // Rank
                const rankSpan = document.createElement('span');
                rankSpan.className = 'text-lg font-bold mr-4';
                rankSpan.textContent = `#${rank}`;
                div.appendChild(rankSpan);

                if (partyData) {
                    if (partyData.partyLogo && partyData.partyLogo !== placeholderImage) {
                        const logo = document.createElement('img');
                        logo.src = partyData.partyLogo;
                        logo.alt = partyData.partyName;
                        logo.className = 'party-logo-small';
                        div.appendChild(logo);
                    } else if (partyData.partyChinn) {
                        const symbolSpan = document.createElement('span');
                        symbolSpan.textContent = partyData.partyChinn;
                        symbolSpan.className = 'text-2xl mr-3';
                        div.appendChild(symbolSpan);
                    }
                }

                // Party name, votes, and percentage
                const infoDiv = document.createElement('div');
                infoDiv.className = 'flex-grow';
                
                const partyNameSpan = document.createElement('span');
                partyNameSpan.className = 'font-semibold';
                partyNameSpan.textContent = party;
                
                const voteDetailsSpan = document.createElement('span');
                voteDetailsSpan.className = 'block text-sm';
                voteDetailsSpan.textContent = `${count} votes (${percentage}%)`;

                infoDiv.appendChild(partyNameSpan);
                infoDiv.appendChild(voteDetailsSpan);
                div.appendChild(infoDiv);

                liveVoteCountDiv.appendChild(div);
            });
        } else {
            liveVoteCountDiv.innerHTML += '<p class="text-center text-gray-500">No votes cast yet.</p>';
        }
    }

    /**
     * Displays the list of registered parties for voting.
     * @param {Array} [filteredList=null] - Optional array of candidates to display (for search).
     */
    async function displayPartyList(filteredList = null) {
        // If no filtered list is provided, fetch all candidates
        if (filteredList === null) {
            allCandidates = await fetchData('/candidates'); // Populate allCandidates
            if (!allCandidates) return;
            filteredList = allCandidates; // Use all candidates if no filter
        }

        partyListDiv.innerHTML = '';
        if (filteredList.length === 0) {
            partyListDiv.innerHTML = '<p class="text-center text-gray-500">No parties found matching your search, or no parties registered yet.</p>';
            partyListDiv.classList.add('text-center', 'text-gray-500');
            return;
        }

        // Set the grid to be a single column with a gap
        partyListDiv.className = 'grid grid-cols-1 gap-4';

        filteredList.forEach(candidate => {
            const partyCard = document.createElement('div');
            partyCard.classList.add('party-card');

            const partyLogo = document.createElement('img');
            partyLogo.src = candidate.partyLogo || placeholderImage;
            partyLogo.alt = candidate.partyName;
            partyLogo.classList.add('w-24', 'h-24', 'object-cover', 'rounded-full', 'mb-4', 'border', 'border-gray-300');

            const partyName = document.createElement('h3');
            partyName.textContent = candidate.partyName;
            partyName.classList.add('text-xl', 'font-semibold', 'mb-2', 'text-gray-800');

            const partyLeader = document.createElement('p');
            partyLeader.textContent = `Leader: ${candidate.candidateName}`;
            partyLeader.classList.add('text-gray-600', 'text-sm');

            const partyChinn = document.createElement('p');
            partyChinn.textContent = `Symbol: ${candidate.partyChinn}`;
            partyChinn.classList.add('text-gray-600', 'text-sm', 'mb-4');

            const voteButton = document.createElement('button');
            voteButton.textContent = 'Vote for this Party';
            voteButton.classList.add('action-button', 'w-full', 'mt-auto');
            
            // Disable button if voting is disabled for this ID or generally
            if (isVotingDisabledForUsedId || !IS_VOTING_ENABLED) {
                voteButton.disabled = true;
                voteButton.textContent = isVotingDisabledForUsedId ? 'Already Voted' : 'Voting Disabled';
            }

            voteButton.addEventListener('click', async () => {
                if (!currentVotingId) {
                    showCustomAlert('Please log in with your Voting ID first.');
                    return;
                }
                if (isVotingDisabledForUsedId) {
                    showCustomAlert('This Voting ID has already been used. You cannot cast another vote.');
                    return;
                }
                if (!IS_VOTING_ENABLED) {
                    showCustomAlert(VOTING_DISABLED_CUSTOM_MESSAGE);
                    return;
                }

                // Show vote casting overlay
                voteCastingOverlay.classList.remove('hidden');
                
                // Simulate network/processing delay (shortened)
                setTimeout(async () => {
                    const voteData = {
                        votingId: currentVotingId,
                        party: candidate.partyName,
                        realName: realNameInput.value,
                        discordInsta: contactInfoInput.value
                    };

                    const result = await postData('/submit-vote', voteData);

                    if (result && result.success) {
                        // Play 3D animation (auto-closes)
                        playVoteVideoAnimation(candidate.partyName);
                        
                        isVotingDisabledForUsedId = true;
                        sessionStorage.setItem('isVotingDisabledForUsedId', 'true');
                        updateVoteSectionUI();
                        await updateLiveVoteCount();
                    } else {
                        const failSound = document.getElementById('fail-sound');
                        const box = document.querySelector('.vote-box-3d');

                        failSound.currentTime = 0;
                        failSound.play().catch(()=>{});
                        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);

                        box.classList.add('break');

                        setTimeout(() => {
                            voteCastingOverlay.classList.add('hidden');
                            box.classList.remove('break');
                        }, 900);

                        showCustomAlert(result ? result.message : 'Vote failed. Please try again.');
                    }
                }, 1000); 
            });

            partyCard.appendChild(partyLogo);
            partyCard.appendChild(partyName);
            partyCard.appendChild(partyLeader);
            partyCard.appendChild(partyChinn);
            partyCard.appendChild(voteButton);
            partyListDiv.appendChild(partyCard);
        });
    }

    /**
     * Handles candidate login.
     */
    async function loginCandidate(partyName, password) {
        allCandidates = await fetchData('/candidates'); // Use allCandidates here
        if (!allCandidates) return;

        // Passwords are stored base64 encoded
        loggedInCandidate = allCandidates.find(c => c.partyName === partyName && c.password === btoa(password));

        if (loggedInCandidate) {
            sessionStorage.setItem('loggedInCandidate', JSON.stringify(loggedInCandidate));
            showCustomAlert('Login successful! Welcome to your dashboard.');
            displayCandidateDashboard();
        } else {
            showCustomAlert('Invalid Party Name or Password.');
            loggedInCandidate = null;
            sessionStorage.removeItem('loggedInCandidate');
            displayCandidateDashboard();
        }
    }

    /**
     * Handles candidate logout.
     */
    function logoutCandidate() {
        loggedInCandidate = null;
        sessionStorage.removeItem('loggedInCandidate');
        displayCandidateDashboard();
        showCustomAlert('Logged out successfully.');
    }

    /**
     * Displays the candidate's dashboard if logged in, or the login form otherwise.
     */
    async function displayCandidateDashboard() {
        if (loggedInCandidate) {
            partyManagementLoginSection.classList.add('hidden');
            candidateDashboard.classList.remove('hidden');
            await updateLiveVoteCount(); // Ensure votes are fresh for dashboard

            candidateDashboard.innerHTML = `
                <h3 class="text-xl font-semibold mb-2 text-gray-800">Welcome, ${loggedInCandidate.candidateName}!</h3>
                <p class="text-gray-600">Party: ${loggedInCandidate.partyName}</p>
                <p class="text-gray-600 mb-4">Symbol: ${loggedInCandidate.partyChinn}</p>
                <img src="${loggedInCandidate.partyLogo}" alt="${loggedInCandidate.partyName}" class="party-logo-large mb-4">
                <p class="text-lg font-bold text-gray-800">Your party currently has <strong>${getPartyVoteCount(loggedInCandidate.partyName)}</strong> votes.</p>
                <button id="logout-candidate-btn" class="action-button bg-red-600 hover:bg-red-700 w-full mt-4">Logout</button>
            `;
            document.getElementById('logout-candidate-btn').addEventListener('click', logoutCandidate);
        } else {
            partyManagementLoginSection.classList.remove('hidden');
            candidateDashboard.classList.add('hidden');
            partyLoginForm.reset();
        }
    }

    // --- Event Listeners ---

    // Custom Alert OK button
    alertOkBtn.addEventListener('click', hideCustomAlert);

    // Initial Voting ID Login Button
    votingIdLoginBtnInitial.addEventListener('click', async () => {
        const id = votingIdInputInitial.value.trim();
        if (!id) {
            showCustomAlert('Please enter your Voting ID.');
            return;
        }

        loginFormContainer.classList.add('hidden');
        loginLoadingAnimation.classList.remove('hidden');

        const result = await postData('/check-voting-id', { votingId: id });

        loginFormContainer.classList.remove('hidden');
        loginLoadingAnimation.classList.add('hidden');

        if (result && result.success && result.valid) {
            currentVotingId = id;
            sessionStorage.setItem('currentVotingId', currentVotingId);
            currentVotingPlayerDetails = {
                playerName: result.playerName,
                gameEdition: result.gameEdition
            };
            sessionStorage.setItem('currentVotingPlayerDetails', JSON.stringify(currentVotingPlayerDetails));

            if (result.used) {
                isVotingDisabledForUsedId = true;
                sessionStorage.setItem('isVotingDisabledForUsedId', 'true');
                showCustomAlert('Login successful, but this Voting ID has already been used. You cannot vote again.');
            } else {
                isVotingDisabledForUsedId = false;
                sessionStorage.removeItem('isVotingDisabledForUsedId');
                showCustomAlert('Login successful! Welcome.');
            }

            initialLoginSection.classList.add('hidden');
            mainAppContainer.classList.remove('hidden');
            showTab(contentVote, tabVote); // Automatically go to Vote tab
            await updateLiveVoteCount();
            // displayPartyList() is called by updateVoteSectionUI()
        } else {
            showCustomAlert(result ? result.message : 'Invalid Voting ID.');
        }
    });

    // Logout Button (for general app logout)
    document.getElementById('logout-button').addEventListener('click', () => {
        sessionStorage.clear(); // Clear all session data
        currentVotingId = null;
        currentVotingPlayerDetails = null;
        loggedInCandidate = null;
        isVotingDisabledForUsedId = false;

        initialLoginSection.classList.remove('hidden'); // Show initial login
        mainAppContainer.classList.add('hidden'); // Hide main app

        votingIdInputInitial.value = ''; // Clear initial ID input
        partyLoginForm.reset(); // Clear party login form
        registerCandidateForm.reset(); // Clear register form
        logoPreview.src = placeholderImage; // Reset logo preview

        showCustomAlert('Logged out successfully.');
    });


    // Tab Navigation Items
    tabVote.addEventListener('click', () => showTab(contentVote, tabVote));
    tabCandidateLogin.addEventListener('click', () => showTab(contentCandidateLogin, tabCandidateLogin));
    tabRegisterCandidate.addEventListener('click', () => showTab(contentRegisterCandidate, tabRegisterCandidate));

    // Party Logo Upload
    uploadLogoBtn.addEventListener('click', () => {
        partyLogoUpload.click();
    });

    partyLogoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Changed MAX_IMAGE_SIZE_MB to MAX_IMAGE_SIZE_KB and updated calculation
            const MAX_IMAGE_SIZE_KB = 100; // Example size
            if (file.size > MAX_IMAGE_SIZE_KB * 1024) {
                showCustomAlert(`Image size should be less than ${MAX_IMAGE_SIZE_KB}KB.`);
                event.target.value = '';
                logoPreview.src = placeholderImage;
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                logoPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Register Candidate Form Submission
    registerCandidateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if registration is generally enabled
        if (!IS_REGISTRATION_ENABLED) {
            showCustomAlert(REGISTRATION_DISABLED_CUSTOM_MESSAGE);
            return;
        }

        const candidateName = document.getElementById('candidate-name').value;
        const partyName = document.getElementById('party-name-reg').value;
        const partyPassword = document.getElementById('party-password-reg').value;
        const partyChinn = document.getElementById('party-chinn').value;
        const partyLogo = logoPreview.src;

        const newCandidate = {
            candidateName,
            partyName,
            password: btoa(partyPassword), // Base64 encode password for storage
            partyChinn,
            partyLogo
        };

        const result = await postData('/register-candidate', newCandidate);

        if (result && result.success) {
            showCustomAlert('Candidate registered successfully!');
            registerCandidateForm.reset();
            logoPreview.src = placeholderImage;
            // Automatically log in the new candidate
            await loginCandidate(partyName, partyPassword);
            await Promise.all([updateLiveVoteCount(), displayPartyList()]);
        } else {
            showCustomAlert(result ? result.message : 'Failed to register candidate.');
        }
    });

    // Party Login Form Submission
    partyLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginPartyName = document.getElementById('login-party-name').value;
        const loginPartyPassword = document.getElementById('login-party-password').value;
        loginCandidate(loginPartyName, loginPartyPassword);
    });

    // Party Search Input Listener
    partySearchInput.addEventListener('input', () => {
        const searchTerm = partySearchInput.value.toLowerCase();
        // If search term is empty, display all candidates
        if (searchTerm === '') {
            displayPartyList(allCandidates);
            return;
        }
        // Filter allCandidates, not just the currently displayed ones
        const filteredCandidates = allCandidates.filter(candidate =>
            candidate.partyName.toLowerCase().includes(searchTerm) ||
            candidate.candidateName.toLowerCase().includes(searchTerm) ||
            candidate.partyChinn.toLowerCase().includes(searchTerm)
        );
        displayPartyList(filteredCandidates);
    });

    // --- Initial Setup on Load ---
    // Hide registration tab and content if disabled
    if (!IS_REGISTRATION_ENABLED) {
        tabRegisterCandidate.classList.add('hidden'); // Hide the tab item
        contentRegisterCandidate.innerHTML = `
            <div class="disabled-message">
                <p>${REGISTRATION_DISABLED_CUSTOM_MESSAGE}</p>
            </div>
        `;
    }

    // Determine which screen to show on page load
    if (currentVotingId) {
        // Attempt to retrieve stored voting ID data
        const storedVotingIdData = sessionStorage.getItem('currentVotingPlayerDetails');
        if (storedVotingIdData) {
            try {
                currentVotingPlayerDetails = JSON.parse(storedVotingIdData);
            } catch (e) {
                console.error("Error parsing stored currentVotingPlayerDetails:", e);
                sessionStorage.removeItem('currentVotingPlayerDetails'); // Clear invalid data
                currentVotingId = null; // Force re-login
            }
        }

        if (currentVotingId && currentVotingPlayerDetails) { // Proceed only if both are valid
            initialLoginSection.classList.add('hidden');
            mainAppContainer.classList.remove('hidden');
            isVotingDisabledForUsedId = sessionStorage.getItem('isVotingDisabledForUsedId') === 'true';
            updateVoteSectionUI(); // Now currentVotingIdData should be available
            await Promise.all([updateLiveVoteCount(), displayCandidateDashboard()]);
            // displayPartyList() is called by updateVoteSectionUI()
            showTab(contentVote, tabVote);
        } else {
            // If currentVotingId exists but data is missing/corrupted, force login screen
            console.warn("Voting ID found but data missing or corrupted. Redirecting to login.");
            sessionStorage.removeItem('currentVotingId');
            sessionStorage.removeItem('currentVotingPlayerDetails');
            sessionStorage.removeItem('isVotingDisabledForUsedId');
            initialLoginSection.classList.remove('hidden');
            mainAppContainer.classList.add('hidden');
            // No specific tab to show here, as it's the initial login screen
        }
    } else if (loggedInCandidate) {
        initialLoginSection.classList.add('hidden');
        mainAppContainer.classList.remove('hidden');
        await Promise.all([updateLiveVoteCount(), displayPartyList(), displayCandidateDashboard()]);
        showTab(contentCandidateLogin, tabCandidateLogin);
    } else {
        initialLoginSection.classList.remove('hidden');
        mainAppContainer.classList.add('hidden');
        // No specific tab to show here, as it's the initial login screen
    }
});