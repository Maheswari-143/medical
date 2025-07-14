// Sidebar tab switching functionality
function showNewChat() {
  document.getElementById('new-chat-section').style.display = 'block';
  document.getElementById('history-section').style.display = 'none';
  document.getElementById('newChatTab').classList.add('active');
  document.getElementById('historyTab').classList.remove('active');
  chatBox.innerHTML = "";
}

function showHistory() {
  document.getElementById('new-chat-section').style.display = 'none';
  document.getElementById('history-section').style.display = 'block';
  document.getElementById('newChatTab').classList.remove('active');
  document.getElementById('historyTab').classList.add('active');
  loadHistorySidebar();
}
// New Chat button functionality
function newChat() {
  fetch("http://127.0.0.1:5000/delete", { method: "POST" })
    .then(() => {
      chatHistory = [];
      renderHistorySidebar();
      chatBox.innerHTML = "";
    })
    .catch(() => {
      alert("❌ Failed to start new chat.");
    });
}
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const historyList = document.getElementById("history-list");

let chatHistory = []; // Holds all chat sessions

// Load all history sessions and render sidebar
async function loadHistorySidebar() {
  historyList.innerHTML = "<li style='color:#888;padding:10px;'>Loading...</li>";
  try {
    const response = await fetch("http://127.0.0.1:5000/history");
    const history = await response.json();
    chatHistory = history;
    renderHistorySidebar();
  } catch (error) {
    historyList.innerHTML = "<li style='color:#ff5252;padding:10px;'>❌ Failed to load history.</li>";
  }
}

// Render sidebar history
function renderHistorySidebar() {
  historyList.innerHTML = "";
  if (!chatHistory.length) {
    historyList.innerHTML = "<li style='color:#888;padding:10px;'>No history yet.</li>";
    return;
  }
  chatHistory.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.title = item.user;
    li.onclick = () => loadSingleHistory(idx);
    li.innerHTML = `
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        <i class="fa-solid fa-user"></i> ${item.user.slice(0, 30)}${item.user.length > 30 ? "..." : ""}
      </span>
      <button class="delete-btn" onclick="event.stopPropagation(); deleteHistoryItem(${idx});" title="Delete"><i class="fa-solid fa-trash"></i></button>
    `;
    historyList.appendChild(li);
  });
}

// Load a single chat session into the chat box
function loadSingleHistory(idx) {
  chatBox.innerHTML = "";
  const item = chatHistory[idx];
  appendMessage("user", item.user);
  appendMessage("bot", item.bot);
}

// Send a new message
let sending = false;
async function sendMessage() {
  if (sending) return;
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";
  input.disabled = true;
  sending = true;

  // Animate send button
  const sendBtn = document.querySelector('.input-area button');
  if (sendBtn) {
    sendBtn.classList.add('sending');
    setTimeout(() => sendBtn.classList.remove('sending'), 400);
  }

  // Show typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot typing-indicator";
  typingDiv.textContent = "Bot is typing...";
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    });

    const data = await response.json();
    typingDiv.remove();
    appendMessage("bot", data.reply || "❌ No reply from server.");
    // Reload sidebar history after new message
    loadHistorySidebar();
  } catch (error) {
    typingDiv.remove();
    appendMessage("bot", "❌ Failed to connect to server.");
  } finally {
    input.disabled = false;
    input.focus();
    sending = false;
  }
}

// Append a message to the chat box
function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  if (sender === "bot") {
    msgDiv.textContent = "Bot: ";
    chatBox.appendChild(msgDiv);
    let i = 0;
    function typeWriter() {
      if (i < text.length) {
        msgDiv.textContent += text.charAt(i);
        i++;
        chatBox.scrollTop = chatBox.scrollHeight;
        setTimeout(typeWriter, 12); // Fast typewriter effect
      }
    }
    typeWriter();
  } else {
    msgDiv.textContent = `You: ${text}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Delete a single history item
async function deleteHistoryItem(idx) {
  if (!confirm("Delete this chat history item?")) return;
  try {
    await fetch("http://127.0.0.1:5000/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: idx })
    });
    loadHistorySidebar();
    chatBox.innerHTML = "";
  } catch (error) {
    alert("❌ Failed to delete history item.");
  }
}

// Clear all history
async function clearHistory() {
  if (!confirm("Are you sure you want to clear all chat history?")) return;
  try {
    await fetch("http://127.0.0.1:5000/delete", { method: "POST" });
    chatHistory = [];
    renderHistorySidebar();
    chatBox.innerHTML = "";
  } catch (error) {
    alert("❌ Failed to clear history.");
  }
}

// Optional: Send message on Enter key
input.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Initial load
window.onload = loadHistorySidebar;