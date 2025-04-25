const API_URL = '/api';
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
  updateAuthStatus();
  loadPolls();

  document.getElementById('login-btn').addEventListener('click', () => showAuthForm('Login'));
  document.getElementById('register-btn').addEventListener('click', () => showAuthForm('Register'));
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('auth-form').addEventListener('submit', handleAuth);
  document.getElementById('poll-form').addEventListener('submit', createPoll);
  document.getElementById('add-option').addEventListener('click', addOption);
});

function updateAuthStatus() {
  const loggedIn = !!token;
  document.getElementById('login-btn').style.display = loggedIn ? 'none' : 'inline';
  document.getElementById('register-btn').style.display = loggedIn ? 'none' : 'inline';
  document.getElementById('logout-btn').style.display = loggedIn ? 'inline' : 'none';
  document.getElementById('create-poll').style.display = loggedIn ? 'block' : 'none';
}

function showAuthForm(type) {
  document.getElementById('auth-title').textContent = type;
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('auth-form').dataset.type = type.toLowerCase();
}

async function handleAuth(e) {
  e.preventDefault();
  const type = e.target.dataset.type;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/auth/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    if (type === 'login') {
      token = data.token;
      localStorage.setItem('token', token);
      updateAuthStatus();
      document.getElementById('auth-section').style.display = 'none';
    }
    alert(`${type} successful`);
  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  token = null;
  localStorage.removeItem('token');
  updateAuthStatus();
}

async function loadPolls() {
  try {
    const response = await fetch(`${API_URL}/polls`);
    const polls = await response.json();
    const pollList = document.getElementById('poll-list');
    pollList.innerHTML = '';
    polls.forEach(poll => {
      const div = document.createElement('div');
      div.className = 'poll-item';
      div.textContent = poll.title;
      div.addEventListener('click', () => showPollDetails(poll._id));
      pollList.appendChild(div);
    });
  } catch (error) {
    alert('Error loading polls');
  }
}

async function showPollDetails(id) {
  try {
    const response = await fetch(`${API_URL}/polls/${id}`);
    const poll = await response.json();
    document.getElementById('poll-detail-title').textContent = poll.title;
    
    const optionsDiv = document.getElementById('poll-options');
    optionsDiv.innerHTML = '';
    poll.options.forEach((option, index) => {
      const div = document.createElement('div');
      div.className = 'option-item';
      div.textContent = option.text;
      div.addEventListener('click', () => vote(id, index));
      optionsDiv.appendChild(div);
    });

    const resultsDiv = document.getElementById('poll-results');
    resultsDiv.innerHTML = '<h3>Results:</h3>';
    poll.options.forEach(option => {
      const div = document.createElement('div');
      div.textContent = `${option.text}: ${option.votes} votes`;
      resultsDiv.appendChild(div);
    });

    document.getElementById('poll-details').style.display = 'block';
  } catch (error) {
    alert('Error loading poll details');
  }
}

async function vote(pollId, optionIndex) {
  if (!token) {
    alert('Please login to vote');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ optionIndex })
    });
    const poll = await response.json();
    if (!response.ok) throw new Error(poll.message);
    showPollDetails(pollId);
  } catch (error) {
    alert(error.message);
  }
}

function addOption() {
  const options = document.getElementById('options');
  if (options.children.length >= 5) {
    alert('Maximum 5 options allowed');
    return;
  }
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'option';
  input.placeholder = `Option ${options.children.length + 1}`;
  input.required = true;
  options.appendChild(input);
}

async function createPoll(e) {
  e.preventDefault();
  const title = document.getElementById('poll-title').value;
  const options = Array.from(document.getElementsByClassName('option')).map(input => input.value);

  try {
    const response = await fetch(`${API_URL}/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, options })
    });
    const poll = await response.json();
    if (!response.ok) throw new Error(poll.message);
    document.getElementById('poll-form').reset();
    document.getElementById('options').innerHTML = `
      <input type="text" class="option" placeholder="Option 1" required>
      <input type="text" class="option" placeholder="Option 2" required>
    `;
    loadPolls();
    alert('Poll created successfully');
  } catch (error) {
    alert(error.message);
  }
}