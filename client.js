document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const initialLoginSection = document.getElementById('initial-login-section');
    const votingIdInput = document.getElementById('voting-id-input');
    const votingIdLoginBtn = document.getElementById('voting-id-login-btn');
    const mainAppContainer = document.getElementById('main-app-container');
    const container = document.querySelector('.container');

    const editionSelect = document.getElementById('edition');
    const bedrockNameField = document.getElementById('bedrock-name-field');
    const javaNameField = document.getElementById('java-name-field');
    const voteSection = document.getElementById('vote-section');
    const playerDetailsFormContainer = document.getElementById('player-details-form-container');
    const playerDetailsForm = document.getElementById('player-details-form');
    const playerDetailsDisplay = document.getElementById('player-details-display');
    const partyListForVoting = document.getElementById('party-list-for-voting');
    const registerCandidateForm = document.getElementById('register-candidate-form');
    const liveVoteCountDiv = document.getElementById('live-vote-count');
    const partyListDiv = document.getElementById('party-list');
    const nextBtn = document.getElementById('next-btn');
    const changePlayerDetailsBtn = document.getElementById('change-player-details-btn');
    const candidateManagementSection = document.getElementById('candidate-management-section');
    const candidateDashboard = document.getElementById('candidate-dashboard');
    const logoPreview = document.getElementById('logo-preview');
    const uploadLogoBtn = document.getElementById('upload-logo-btn');
    const partyLogoUpload = document.getElementById('party-logo-upload');
    const partyManagementLoginSection = document.getElementById('party-management-login-section');
    const partyLoginForm = document.getElementById('party-login-form');
    const logoutCandidateBtn = document.getElementById('logout-candidate-btn');
    

    // Custom Alert Modal Elements
    const customAlertModal = document.getElementById('custom-alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');

    // --- Constants & State Variables ---
    const API_BASE_URL = '/api'; // Cloudflare Worker API base path
    const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADa613fAAAAaElEQVR42u3PQREAAAgDoC2G/Yt62e20IIDz9wYBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgMDbA3cAAR2gLdJPAAAAAElFTkSuQmCC';
    const MAX_IMAGE_SIZE_MB = 5; // Increased to 5MB

    let candidates = []; // Will be fetched from API
    let votes = []; // Will be fetched from API
    let validVotingIds = []; // Fetched from API
    let usedVotingIds = []; // Fetched from API
    let currentVotingId = sessionStorage.getItem('currentVotingId') || null; // Persist validated voting ID
    let playerData = JSON.parse(sessionStorage.getItem('playerData')) || null;
    let loggedInCandidate = JSON.parse(sessionStorage.getItem('loggedInCandidate')) || null;

    // --- API Fetch Functions ---

    /**
     * Generic async function to fetch data from the API.
     * @param {string} endpoint - The API endpoint (e.g., '/candidates').
     * @returns {Promise<Array|Object|null>} - Parsed JSON data or null on error.
     */
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
            showCustomAlert(`Network error: Could not connect to server.`);
            return null;
        }
    }

    /**
     * Generic async function to post data to the API.
     * @param {string} endpoint - The API endpoint (e.g., '/register-candidate').
     * @param {Object} data - The data to send in the request body.
     * @returns {Promise<Object|null>} - Parsed JSON response or null on error.
     */
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
            showCustomAlert(`Network error: Could not connect to server.`);
            return null;
        }
    }

    // --- Helper Functions ---

    /**
     * Displays a custom alert modal with a given message.
     * @param {string} message - The message to display in the alert.
     */
    function showCustomAlert(message) {
        alertMessage.textContent = message;
        customAlertModal.classList.add('visible');
    }

    /**
     * Hides the custom alert modal.
     */
    function hideCustomAlert() {
        customAlertModal.classList.remove('visible');
    }

    /**
     * Toggles the display of Minecraft edition specific name fields.
     */
    function toggleEditionFields() {
        if (editionSelect.value === 'bedrock') {
            bedrockNameField.style.display = 'block';
            javaNameField.style.display = 'none';
        } else {
            bedrockNameField.style.display = 'none';
            javaNameField.style.display = 'block';
        }
    }

    /**
     * Updates and displays the live vote count for all parties.
     */
    async function updateLiveVoteCount() {
        votes = await fetchData('/votes');
        if (!votes) return; // Exit if data fetch failed

        liveVoteCountDiv.innerHTML = '';
        const voteCounts = {};

        votes.forEach(vote => {
            voteCounts[vote.party] = (voteCounts[vote.party] || 0) + 1;
        });

        const sortedVoteCounts = Object.entries(voteCounts).sort(([, countA], [, countB]) => countB - countA);

        if (sortedVoteCounts.length > 0) {
            sortedVoteCounts.forEach(([party, count]) => {
                const partyData = candidates.find(c => c.partyName === party);
                const div = document.createElement('div');
                div.classList.add('vote-count-item');

                if (partyData && partyData.partyLogo) {
                    const logo = document.createElement('img');
                    logo.src = partyData.partyLogo;
                    logo.alt = partyData.partyName;
                    logo.classList.add('party-logo-small');
                    div.appendChild(logo);
                }

                const text = document.createElement('span');
                text.textContent = `${party}: ${count} votes`;
                div.appendChild(text);

                liveVoteCountDiv.appendChild(div);
            });
        } else {
            liveVoteCountDiv.textContent = 'No votes cast yet.';
        }
    }

    /**
     * Displays the list of registered parties for voting.
     */
    async function displayPartyList() {
        candidates = await fetchData('/candidates');
        if (!candidates) return; // Exit if data fetch failed

        partyListDiv.innerHTML = '';
        if (candidates.length === 0) {
            partyListDiv.textContent = 'No parties registered yet. Be the first to register!';
            return;
        }

        candidates.forEach(candidate => {
            const partyCard = document.createElement('div');
            partyCard.classList.add('party-card');

            const partyLogo = document.createElement('img');
            partyLogo.src = candidate.partyLogo || placeholderImage;
            partyLogo.alt = candidate.partyName;

            const partyName = document.createElement('h3');
            partyName.textContent = candidate.partyName;

            const partyLeader = document.createElement('p');
            partyLeader.textContent = `Leader: ${candidate.candidateName}`;

            const partyChinn = document.createElement('p');
            partyChinn.textContent = `Symbol: ${candidate.partyChinn}`;

            const voteButton = document.createElement('button');
            voteButton.textContent = 'Vote for this Party';
            voteButton.addEventListener('click', async () => {
                if (!currentVotingId) {
                    showCustomAlert('Please log in with your Voting ID first.');
                    return;
                }
                if (!playerData) {
                    showCustomAlert('Please enter your player details first in the "Vote" section.');
                    activateSection(voteSection);
                    playerDetailsFormContainer.style.display = 'block';
                    playerDetailsDisplay.style.display = 'none';
                    partyListForVoting.style.display = 'none';
                    return;
                }

                const voteData = {
                    ...playerData,
                    party: candidate.partyName,
                    votingId: currentVotingId // Include the validated voting ID
                };

                const result = await postData('/submit-vote', voteData);
                if (result && result.success) {
                    showCustomAlert(`You have successfully voted for ${candidate.partyName} with Voting ID: ${currentVotingId}!`);
                    await updateLiveVoteCount(); // Refresh vote count
                    // After voting, clear player data for a new vote if desired, or keep it
                    // playerData = null;
                    // sessionStorage.removeItem('playerData');
                    // updateVoteSectionDisplay();
                } else {
                    showCustomAlert(result ? result.message : 'Failed to submit vote.');
                }
            });

            voteButton.disabled = hasVoted;
                    if (hasVoted) {
                        voteButton.textContent = 'Already Voted';
                        voteButton.style.backgroundColor = '#95a5a6'; // A grey color to indicate disabled
                        voteButton.style.cursor = 'not-allowed';
                    }

                    partyCard.appendChild(partyLogo);
                    partyCard.appendChild(partyName);
                    partyCard.appendChild(partyLeader);
                    partyCard.appendChild(partyChinn);
                    partyCard.appendChild(voteButton);
            partyListDiv.appendChild(partyCard);
        });
    }

    /**
     * Gets the total votes for a specific party.
     * @param {string} partyName - The name of the party.
     * @returns {number} The total number of votes for the party.
     */
    function getPartyVoteCount(partyName) {
        return votes.filter(vote => vote.party === partyName).length;
    }

    /**
     * Handles candidate login.
     * @param {string} partyName - The party name to log in with.
     * @param {string} password - The password to log in with.
     */
    async function loginCandidate(partyName, password) {
        candidates = await fetchData('/candidates'); // Ensure latest candidates are loaded
        if (!candidates) return;

        loggedInCandidate = candidates.find(c => c.partyName === partyName && c.password === btoa(password));

        if (loggedInCandidate) {
            sessionStorage.setItem('loggedInCandidate', JSON.stringify(loggedInCandidate));
            showCustomAlert('Login successful! Welcome to your dashboard.');
            activateSection(candidateManagementSection);
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
        activateSection(partyManagementLoginSection);
    }

    /**
     * Displays the candidate's dashboard if logged in.
     */
    async function displayCandidateDashboard() {
        if (loggedInCandidate) {
            candidateManagementSection.style.display = 'block';
            await updateLiveVoteCount(); // Ensure vote count is fresh for dashboard
            candidateDashboard.innerHTML = `
                <h3>Welcome, ${loggedInCandidate.candidateName}!</h3>
                <p>Party: ${loggedInCandidate.partyName}</p>
                <p>Symbol: ${loggedInCandidate.partyChinn}</p>
                <img src="${loggedInCandidate.partyLogo}" alt="${loggedInCandidate.partyName}" class="party-logo-large">
                <p>Your party currently has <strong>${getPartyVoteCount(loggedInCandidate.partyName)}</strong> votes.</p>
            `;
        } else {
            candidateManagementSection.style.display = 'none';
            candidateManagementSection.querySelector('.section-content').classList.add('collapsed');
            candidateManagementSection.classList.remove('active', 'expanded-main-section', 'sidebar-section');
        }
    }

    /**
     * Manages the display of the vote section based on whether player data is entered.
     */
    function updateVoteSectionDisplay() {
        if (playerData) {
            playerDetailsFormContainer.style.display = 'none';
            playerDetailsDisplay.style.display = 'block';
            partyListForVoting.style.display = 'block';
            document.getElementById('display-minecraft-name').textContent = playerData.minecraftName;
            document.getElementById('display-edition').textContent = playerData.edition;
            document.getElementById('display-real-name').textContent = playerData.realName || 'N/A';
            document.getElementById('display-discord-insta').textContent = playerData.discordInsta || 'N/A';
            displayPartyList();
        } else {
            playerDetailsFormContainer.style.display = 'block';
            playerDetailsDisplay.style.display = 'none';
            partyListForVoting.style.display = 'none';
            playerDetailsForm.reset();
        }
    }

    /**
     * Activates a specific section, expanding it and moving others to the sidebar.
     * @param {HTMLElement} sectionToActivate - The section element to expand.
     */
    function activateSection(sectionToActivate) {
        const allSections = document.querySelectorAll('.container > section');

        // If the clicked section is already active, collapse it and revert to default layout
        if (sectionToActivate.classList.contains('active')) {
            allSections.forEach(section => {
                section.classList.remove('active', 'expanded-main-section', 'sidebar-section');
                section.querySelector('.section-content').classList.add('collapsed');
            });
            container.classList.remove('two-column-active');
        } else {
            // Otherwise, activate the clicked section and set up two-column layout
            allSections.forEach(section => {
                section.classList.remove('active', 'expanded-main-section', 'sidebar-section');
                section.querySelector('.section-content').classList.add('collapsed');
            });

            sectionToActivate.classList.add('active', 'expanded-main-section');
            sectionToActivate.querySelector('.section-content').classList.remove('collapsed');

            allSections.forEach(section => {
                if (section !== sectionToActivate) {
                    section.classList.add('sidebar-section');
                }
            });

            container.classList.add('two-column-active');

            if (sectionToActivate.id === 'vote-section') {
                updateVoteSectionDisplay();
            }
            if (sectionToActivate.id === 'live-vote-section') {
                updateLiveVoteCount();
            }
            if (sectionToActivate.id === 'candidate-management-section') {
                displayCandidateDashboard();
            }
        }
    }

    // --- Event Listeners ---

    // Custom Alert OK button
    alertOkBtn.addEventListener('click', hideCustomAlert);

    // Initial Voting ID Login
    votingIdLoginBtn.addEventListener('click', async () => {
        const id = votingIdInput.value.trim();
        if (!id) {
            showCustomAlert('Please enter your Voting ID.');
            return;
        }

        const result = await postData('/check-voting-id', { votingId: id });

        if (result && result.valid && !result.used) {
            currentVotingId = id;
            sessionStorage.setItem('currentVotingId', currentVotingId);
            initialLoginSection.style.display = 'none';
            mainAppContainer.style.display = 'block';
            showCustomAlert('Login successful! Welcome.');
            // Initialize main app content after successful login
            await Promise.all([updateLiveVoteCount(), displayPartyList()]); // Fetch initial data
            activateSection(voteSection); // Activate vote section by default
        } else {
            showCustomAlert(result ? result.message : 'Invalid or already used Voting ID.');
        }
    });

    // Section Header Toggles
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            const currentSection = e.currentTarget.parentElement;
            activateSection(currentSection);
        });
    });

    // Minecraft Edition Select Change
    editionSelect.addEventListener('change', toggleEditionFields);

    // Player Details Form Submission (Next Button)
    nextBtn.addEventListener('click', () => {
        const edition = editionSelect.value;
        let minecraftNameInput;
        if (edition === 'bedrock') {
            minecraftNameInput = document.getElementById('bedrock-name');
        } else {
            minecraftNameInput = document.getElementById('java-name');
        }

        if (!minecraftNameInput.value.trim()) {
            showCustomAlert('Please enter your Minecraft Name.');
            minecraftNameInput.focus();
            return;
        }

        playerData = {
            edition,
            minecraftName: minecraftNameInput.value,
            realName: document.getElementById('real-name').value,
            discordInsta: document.getElementById('discord-insta').value
        };
        sessionStorage.setItem('playerData', JSON.stringify(playerData));

        updateVoteSectionDisplay();
    });

    // Change Player Details Button
    changePlayerDetailsBtn.addEventListener('click', () => {
        playerData = null;
        sessionStorage.removeItem('playerData');
        updateVoteSectionDisplay();
    });

    // Party Logo Upload
    uploadLogoBtn.addEventListener('click', () => {
        partyLogoUpload.click();
    });

    partyLogoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                showCustomAlert(`Image size should be less than ${MAX_IMAGE_SIZE_MB}MB.`);
                // Clear the file input to prevent re-uploading too large file
                event.target.value = '';
                logoPreview.src = placeholderImage; // Reset preview
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

        const candidateName = document.getElementById('candidate-name').value;
        const partyName = document.getElementById('party-name-reg').value;
        const partyPassword = document.getElementById('party-password-reg').value;
        const partyChinn = document.getElementById('party-chinn').value;
        const partyLogo = logoPreview.src;

        // Basic client-side check for duplicate party name (server will also validate)
        if (candidates.some(c => c.partyName.toLowerCase() === partyName.toLowerCase())) {
            showCustomAlert('A party with this name already exists. Please choose a different party name.');
            return;
        }

        const newCandidate = {
            candidateName,
            partyName,
            password: btoa(partyPassword), // Base64 encode password (NOT secure for real apps)
            partyChinn,
            partyLogo
        };

        const result = await postData('/register-candidate', newCandidate);

        if (result && result.success) {
            showCustomAlert('Candidate registered successfully!');
            registerCandidateForm.reset();
            logoPreview.src = placeholderImage;
            loginCandidate(partyName, partyPassword); // Automatically log in
            await Promise.all([updateLiveVoteCount(), displayPartyList()]); // Refresh data
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
        partyLoginForm.reset();
    });

    // Candidate Logout Button
    logoutCandidateBtn.addEventListener('click', logoutCandidate);

    // --- Initial Setup on Load ---
    (async () => {
        toggleEditionFields();

        // Check if user is already logged in with a voting ID
        if (currentVotingId) {
            initialLoginSection.style.display = 'none';
            mainAppContainer.style.display = 'block';
            // Re-fetch all data and set up UI
            await Promise.all([updateLiveVoteCount(), displayPartyList(), displayCandidateDashboard()]);
            activateSection(voteSection); // Activate vote section by default
        } else {
            initialLoginSection.style.display = 'flex'; // Show login screen
            mainAppContainer.style.display = 'none'; // Hide main app
        }
    })();
});
