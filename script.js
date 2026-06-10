let posts = JSON.parse(localStorage.getItem("velog_posts") || "[]");
let users = JSON.parse(localStorage.getItem("velog_users") || "[]");
let ads = JSON.parse(localStorage.getItem("velog_ads") || "[]");
let wallets = JSON.parse(localStorage.getItem("velog_wallets") || "{}");
let txs = JSON.parse(localStorage.getItem("velog_txs") || "[]");
let nfts = JSON.parse(localStorage.getItem("velog_nfts") || "[]");
let chatMsgs = JSON.parse(localStorage.getItem("velog_chat") || "[]");
let comments = JSON.parse(localStorage.getItem("velog_comments") || "[]");
let currentUser = localStorage.getItem("velog_current_user") || null;
let editingId = null;
let viewingId = null;
let pendingMedia = [];
let pendingAdImage = null;

function save() { localStorage.setItem("velog_posts", JSON.stringify(posts)); }
function saveAds() { localStorage.setItem("velog_ads", JSON.stringify(ads)); }

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderAds() {
  const now = Date.now();
  ads = ads.filter(a => a.expiresAt > now);
  saveAds();
  const container = document.getElementById("ad-container");
  const empty = document.getElementById("ad-empty");
  const rentBtn = document.getElementById("rent-ad-btn");
  container.innerHTML = "";
  if (currentUser) rentBtn.classList.remove("hidden"); else rentBtn.classList.add("hidden");
  if (!ads.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";
  ads.forEach(a => {
    const daysLeft = Math.ceil((a.expiresAt - now) / 86400000);
    container.innerHTML += '<div class="ad-card">'
      + (a.link ? '<a href="' + a.link + '" target="_blank" rel="noopener">' : '')
      + '<img src="' + a.image + '" alt="' + a.title + '">'
      + (a.link ? '</a>' : '')
      + '<div class="ad-body">'
      + '<h4>' + a.title + '</h4>'
      + '<div class="ad-meta"><span class="ad-badge">ad</span> by ' + a.owner + ' &middot; ' + daysLeft + 'd left</div>'
      + '</div></div>';
  });
}

function showRentAd() {
  if (!currentUser) { alert("Register first to rent ad space."); return; }
  pendingAdImage = null;
  document.getElementById("ad-title").value = "";
  document.getElementById("ad-link").value = "";
  document.getElementById("ad-preview").classList.add("hidden");
  document.getElementById("ad-preview-img").src = "";
  const active = ads.filter(a => a.expiresAt > Date.now()).length;
  document.getElementById("slots-left").textContent = 3 - active;
  document.getElementById("rent-ad-overlay").classList.remove("hidden");
}
function hideRentAd() { document.getElementById("rent-ad-overlay").classList.add("hidden"); pendingAdImage = null; }

function handleAdImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    pendingAdImage = ev.target.result;
    document.getElementById("ad-preview-img").src = pendingAdImage;
    document.getElementById("ad-preview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function rentAd() {
  const title = document.getElementById("ad-title").value.trim();
  const link = document.getElementById("ad-link").value.trim();
  if (!title || !pendingAdImage) { alert("Title and image required."); return; }
  const active = ads.filter(a => a.expiresAt > Date.now()).length;
  if (active >= 3) { alert("All 3 ad slots are full."); return; }
  ads.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    title, image: pendingAdImage, link,
    owner: currentUser,
    rentedAt: Date.now(),
    expiresAt: Date.now() + 7 * 86400000
  });
  saveAds(); renderAds(); hideRentAd(); alert("Ad rented for 7 days!");
}

function showProfile() {
  const u = users.find(x => x.username === currentUser);
  if (!u) return;
  const myPosts = posts.filter(p => p.author === currentUser);
  const totalViews = myPosts.reduce((s, p) => s + p.views, 0);
  const myAds = ads.filter(a => a.owner === currentUser && a.expiresAt > Date.now()).length;
  document.getElementById("profile-username").textContent = u.username;
  document.getElementById("profile-email").textContent = u.email;
  document.getElementById("profile-joined").textContent = "Joined " + formatDate(u.createdAt || Date.now());
  document.getElementById("stat-posts").textContent = myPosts.length;
  document.getElementById("stat-views").textContent = totalViews;
  document.getElementById("stat-ads").textContent = myAds;
  document.getElementById("profile-overlay").classList.remove("hidden");
}
function hideProfile() { document.getElementById("profile-overlay").classList.add("hidden"); }

function updateNav() {
  const userSpan = document.getElementById("nav-user");
  const nftBtn = document.getElementById("nft-btn");
  const walletBtn = document.getElementById("wallet-btn");
  const profileBtn = document.getElementById("profile-btn");
  const chatBtn = document.getElementById("chat-btn");
  const regBtn = document.getElementById("register-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  if (currentUser) {
    userSpan.textContent = currentUser;
    userSpan.classList.remove("hidden");
    nftBtn.classList.remove("hidden");
    walletBtn.classList.remove("hidden");
    profileBtn.classList.remove("hidden");
    chatBtn.classList.remove("hidden");
    regBtn.classList.add("hidden");
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    userSpan.classList.add("hidden");
    nftBtn.classList.add("hidden");
    walletBtn.classList.add("hidden");
    profileBtn.classList.add("hidden");
    chatBtn.classList.add("hidden");
    regBtn.classList.remove("hidden");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
  renderAds();
}

function render() {
  const c = document.getElementById("posts-container");
  const e = document.getElementById("empty-state");
  c.innerHTML = "";
  if (!posts.length) { e.style.display = "block"; return; }
  e.style.display = "none";
  posts.sort((a, b) => b.createdAt - a.createdAt);
  posts.forEach(p => {
    const excerpt = p.body.length > 120 ? p.body.slice(0, 120) + "..." : p.body;
    const hasMedia = p.media && p.media.length;
    const thumb = hasMedia ? p.media.find(m => m.type === "image") : null;
    c.innerHTML += `
      <div class="post-card" onclick="viewPost('${p.id}')">
        ${thumb ? '<div class="card-thumb"><img src="' + thumb.data + '" alt=""></div>' : ''}
        <h3>${p.title}</h3>
        <div class="card-author">by ${p.author || "anonymous"}</div>
        ${p.tags.length ? '<div class="tags">' + p.tags.map(t => '<span class="tag">' + t.trim() + '</span>').join("") + '</div>' : ''}
        <div class="excerpt">${excerpt}</div>
        <div class="meta">
          <span>${formatDate(p.createdAt)}</span>
          <span>${p.views} views</span>
        </div>
      </div>
    `;
  });
}

function genWallet(user) {
  if (wallets[user]) return;
  wallets[user] = {
    btc: { addr: "bc1q" + Math.random().toString(36).slice(2, 12) + "0x" + Math.random().toString(36).slice(2, 6), balance: 0.001 + Math.random() * 0.005 },
    shib: { addr: "0x" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14), balance: Math.floor(500000 + Math.random() * 2000000) }
  };
  localStorage.setItem("velog_wallets", JSON.stringify(wallets));
}

function switchWalletTab(tab) {
  document.getElementById("tab-send").classList.toggle("active", tab === "send");
  document.getElementById("tab-receive").classList.toggle("active", tab === "receive");
  document.getElementById("wallet-send").classList.toggle("hidden", tab !== "send");
  document.getElementById("wallet-receive").classList.toggle("hidden", tab !== "receive");
  if (tab === "receive") updateReceiveAddrs();
}

function resolveMember(coin) {
  const input = document.getElementById(coin + "-to");
  const val = input.value.trim();
  if (!val) return;
  if (wallets[val]) {
    input.value = wallets[val][coin].addr;
    input.style.borderColor = "#12b886";
    input.title = "Resolved to " + val + "'s " + coin.toUpperCase() + " address";
  }
}

function updateQR(coin, addr) {
  const img = document.getElementById(coin + "-qr");
  if (addr) img.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(addr);
}

function updateReceiveAddrs() {
  genWallet(currentUser);
  const w = wallets[currentUser];
  document.getElementById("btc-receive-addr").value = w.btc.addr;
  document.getElementById("shib-receive-addr").value = w.shib.addr;
  updateQR("btc", w.btc.addr);
  updateQR("shib", w.shib.addr);
}

function saveAddress(coin) {
  genWallet(currentUser);
  const input = document.getElementById(coin + "-receive-addr");
  wallets[currentUser][coin].addr = input.value.trim();
  localStorage.setItem("velog_wallets", JSON.stringify(wallets));
  updateQR(coin, input.value.trim());
  updateSendAddr(coin);
}

function editAddress(coin) {
  document.getElementById(coin + "-receive-addr").focus();
}

function genNewAddr(coin) {
  genWallet(currentUser);
  const newAddr = coin === "btc"
    ? "bc1q" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 6)
    : "0x" + Math.random().toString(36).slice(2, 16) + Math.random().toString(36).slice(2, 12);
  wallets[currentUser][coin].addr = newAddr;
  localStorage.setItem("velog_wallets", JSON.stringify(wallets));
  updateReceiveAddrs();
  updateSendAddr(coin);
}

function updateSendAddr(coin) {
  genWallet(currentUser);
  const el = document.getElementById(coin + "-my-addr-s");
  if (el) el.textContent = wallets[currentUser][coin].addr;
}

function showWallet() {
  if (!currentUser) { alert("Register first."); return; }
  genWallet(currentUser);
  const w = wallets[currentUser];
  const rateBTC = 63245, rateSHIB = 0.000025;
  const total = (w.btc.balance * rateBTC + w.shib.balance * rateSHIB);
  document.getElementById("wallet-total").textContent = "$" + total.toFixed(2);
  document.getElementById("btc-balance").textContent = w.btc.balance.toFixed(8);
  document.getElementById("shib-balance").textContent = w.shib.balance.toLocaleString();
  document.getElementById("btc-my-addr-s").textContent = w.btc.addr;
  document.getElementById("shib-my-addr-s").textContent = w.shib.addr;
  document.getElementById("btc-to").value = "";
  document.getElementById("btc-amount").value = "";
  document.getElementById("shib-to").value = "";
  document.getElementById("shib-amount").value = "";

  const datalist = document.getElementById("member-list");
  datalist.innerHTML = users.filter(u => u.username !== currentUser).map(u => '<option value="' + u.username + '">').join("");

  switchWalletTab("send");
  renderTxs();
  document.getElementById("wallet-overlay").classList.remove("hidden");
}
function hideWallet() { document.getElementById("wallet-overlay").classList.add("hidden"); }

function renderTxs() {
  const el = document.getElementById("tx-list");
  const sent = txs.filter(t => t.user === currentUser);
  const received = txs.filter(t => t.toUser === currentUser);
  const all = [...sent.map(t => ({ ...t, dir: "sent" })), ...received.map(t => ({ ...t, dir: "received" }))];
  all.sort((a, b) => b.time - a.time);
  if (!all.length) { el.innerHTML = '<p class="tx-empty">No transactions yet</p>'; return; }
  el.innerHTML = all.map(t => '<div class="tx-item"><span class="tx-coin ' + t.coin + '">' + t.coin.toUpperCase() + '</span><span class="tx-detail">' + (t.dir === "sent" ? "To: " : "From: ") + (t.other ? t.other : t.to.slice(0, 10) + '...') + ' | ' + t.amount + '</span><span class="tx-status ' + t.dir + '">' + (t.dir === "sent" ? "Sent" : "Received") + '</span></div>').join("");
}

function sendCrypto(coin) {
  const to = document.getElementById(coin + "-to").value.trim();
  const amount = document.getElementById(coin + "-amount").value.trim();
  if (!to || !amount) { alert("Recipient and amount required."); return; }
  const val = parseFloat(amount);
  if (isNaN(val) || val <= 0) { alert("Invalid amount."); return; }
  const w = wallets[currentUser];
  if (val > w[coin].balance) { alert("Insufficient " + coin.toUpperCase() + " balance."); return; }

  let recipientName = to;
  if (wallets[to]) {
    recipientName = to;
    wallets[to][coin].balance += val;
    txs.push({ user: currentUser, coin, to, toUser: to, other: to, amount: amount, time: Date.now() });
  } else {
    let found = false;
    for (const uname in wallets) {
      if (wallets[uname][coin].addr === to && uname !== currentUser) {
        recipientName = uname;
        wallets[uname][coin].balance += val;
        txs.push({ user: currentUser, coin, to, toUser: uname, other: uname, amount: amount, time: Date.now() });
        found = true;
        break;
      }
    }
    if (!found) {
      txs.push({ user: currentUser, coin, to, other: to.slice(0, 10) + '...', amount: amount, time: Date.now() });
    }
  }
  w[coin].balance -= val;
  localStorage.setItem("velog_wallets", JSON.stringify(wallets));
  localStorage.setItem("velog_txs", JSON.stringify(txs));
  showWallet();
}

function copyAddr(coin) {
  const el = document.getElementById(coin + "-receive-addr");
  const addr = el.value || el.textContent;
  navigator.clipboard.writeText(addr).then(() => alert(coin.toUpperCase() + " address copied!"));
}

function saveChat() { localStorage.setItem("velog_chat", JSON.stringify(chatMsgs)); }

function goHome() {
  document.querySelectorAll(".overlay").forEach(o => o.classList.add("hidden"));
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function showChat() {
  if (!currentUser) { alert("Register first."); return; }
  document.getElementById("chat-overlay").classList.remove("hidden");
  renderChat();
  document.getElementById("chat-input").focus();
}
function hideChat() { document.getElementById("chat-overlay").classList.add("hidden"); }

function renderChat() {
  const el = document.getElementById("chat-msgs");
  el.innerHTML = chatMsgs.map(m => '<div class="chat-msg ' + (m.user === currentUser ? "mine" : "other") + '"><div class="msg-user">' + m.user + '</div>' + m.text + '<div class="msg-time">' + formatChatTime(m.time) + '</div></div>').join("");
  el.scrollTop = el.scrollHeight;
  document.getElementById("chat-online").textContent = users.length;
}

function formatChatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function sendChat() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;
  chatMsgs.push({ user: currentUser, text, time: Date.now() });
  if (chatMsgs.length > 200) chatMsgs = chatMsgs.slice(-200);
  saveChat();
  input.value = "";
  renderChat();
}

function saveNFTs() { localStorage.setItem("velog_nfts", JSON.stringify(nfts)); }

function showNFT() {
  if (!currentUser) { alert("Register first."); return; }
  switchNFTTab("market");
  document.getElementById("nft-overlay").classList.remove("hidden");
}
function hideNFT() { document.getElementById("nft-overlay").classList.add("hidden"); }

function switchNFTTab(tab) {
  document.getElementById("nft-tab-market").classList.toggle("active", tab === "market");
  document.getElementById("nft-tab-mine").classList.toggle("active", tab === "mine");
  document.getElementById("nft-market").classList.toggle("hidden", tab !== "market");
  document.getElementById("nft-mine").classList.toggle("hidden", tab !== "mine");
  if (tab === "market") renderNFTMarket();
  else renderNFTMine();
}

function renderNFTMarket() {
  const grid = document.getElementById("nft-grid");
  const empty = document.getElementById("nft-empty");
  const listed = nfts.filter(n => n.forSale);
  grid.innerHTML = "";
  if (!listed.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";
  listed.forEach(n => {
    const isMine = n.owner === currentUser;
    grid.innerHTML += '<div class="nft-card">'
      + '<img src="' + n.image + '" alt="' + n.name + '">'
      + '<div class="nft-card-body">'
      + '<h4>' + n.name + '</h4>'
      + '<div class="nft-creator">by ' + n.creator + '</div>'
      + '<div class="nft-price">' + n.price + ' <span class="nft-coin">' + n.coin.toUpperCase() + '</span></div>'
      + (isMine ? '<button class="nft-cancel-btn" onclick="delistNFT(\'' + n.id + '\')">Delist</button>'
                : '<button class="nft-buy-btn" onclick="buyNFT(\'' + n.id + '\')">Buy</button>')
      + '</div></div>';
  });
}

function renderNFTMine() {
  const grid = document.getElementById("nft-my-grid");
  const empty = document.getElementById("nft-my-empty");
  const mine = nfts.filter(n => n.owner === currentUser);
  grid.innerHTML = "";
  if (!mine.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";
  mine.forEach(n => {
    grid.innerHTML += '<div class="nft-card">'
      + '<img src="' + n.image + '" alt="' + n.name + '">'
      + '<div class="nft-card-body">'
      + '<h4>' + n.name + '</h4>'
      + '<div class="nft-creator">' + (n.forSale ? 'Listed ' + n.price + ' ' + n.coin.toUpperCase() : 'Not for sale') + '</div>'
      + (n.forSale ? '<button class="nft-cancel-btn" onclick="delistNFT(\'' + n.id + '\')">Delist</button>'
                   : '<button class="nft-buy-btn" onclick="listNFT(\'' + n.id + '\')">List for Sale</button>')
      + '</div></div>';
  });
}

let pendingNFTImage = null;

function showMintNFT() {
  pendingNFTImage = null;
  document.getElementById("nft-name").value = "";
  document.getElementById("nft-desc").value = "";
  document.getElementById("nft-price").value = "";
  document.getElementById("nft-coin").value = "btc";
  document.getElementById("nft-image-preview").classList.add("hidden");
  document.getElementById("nft-preview-img").src = "";
  document.getElementById("mint-nft-overlay").classList.remove("hidden");
}
function hideMintNFT() { document.getElementById("mint-nft-overlay").classList.add("hidden"); pendingNFTImage = null; }

function handleNFTImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    pendingNFTImage = ev.target.result;
    document.getElementById("nft-preview-img").src = pendingNFTImage;
    document.getElementById("nft-image-preview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function mintNFT() {
  const name = document.getElementById("nft-name").value.trim();
  const desc = document.getElementById("nft-desc").value.trim();
  const price = document.getElementById("nft-price").value.trim();
  const coin = document.getElementById("nft-coin").value;
  if (!name || !price || !pendingNFTImage) { alert("Name, price and image required."); return; }
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) { alert("Invalid price."); return; }
  nfts.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, desc, image: pendingNFTImage, price, coin,
    creator: currentUser, owner: currentUser,
    forSale: true, createdAt: Date.now()
  });
  saveNFTs(); hideMintNFT(); renderNFTMarket();
}

function buyNFT(id) {
  if (!currentUser) { alert("Register first."); return; }
  const nft = nfts.find(n => n.id === id);
  if (!nft || !nft.forSale) return;
  if (nft.owner === currentUser) { alert("You already own this NFT."); return; }
  const val = parseFloat(nft.price);
  const w = wallets[currentUser];
  genWallet(currentUser);
  if (!w[nft.coin] || w[nft.coin].balance < val) { alert("Insufficient " + nft.coin.toUpperCase() + " balance."); return; }
  genWallet(nft.owner);
  w[nft.coin].balance -= val;
  wallets[nft.owner][nft.coin].balance += val;
  txs.push({ user: currentUser, coin: nft.coin, to: nft.owner, toUser: nft.owner, other: "NFT: " + nft.name, amount: nft.price, time: Date.now() });
  nft.owner = currentUser;
  nft.forSale = false;
  localStorage.setItem("velog_wallets", JSON.stringify(wallets));
  localStorage.setItem("velog_txs", JSON.stringify(txs));
  saveNFTs(); renderNFTMarket();
}

function delistNFT(id) {
  const nft = nfts.find(n => n.id === id);
  if (!nft) return;
  if (nft.owner !== currentUser) return;
  nft.forSale = false;
  saveNFTs(); renderNFTMarket(); renderNFTMine();
}

function listNFT(id) {
  const nft = nfts.find(n => n.id === id);
  if (!nft || nft.owner !== currentUser) return;
  const price = prompt("Set price:");
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) { alert("Invalid price."); return; }
  const coin = prompt("Coin (btc/shib):") || "btc";
  nft.price = price;
  nft.coin = coin.toLowerCase() === "shib" ? "shib" : "btc";
  nft.forSale = true;
  saveNFTs(); renderNFTMine();
}

function saveComments() { localStorage.setItem("velog_comments", JSON.stringify(comments)); }

function renderComments(postId) {
  const list = document.getElementById("comments-list");
  const count = document.getElementById("comment-count");
  const postComments = comments.filter(c => c.postId === postId).sort((a, b) => a.time - b.time);
  count.textContent = postComments.length;
  list.innerHTML = postComments.map(c => {
    const tips = c.tips && c.tips.length ? c.tips.map(t => '<span class="comment-tip">+' + t.amount + ' ' + t.coin.toUpperCase() + '</span>').join("") : "";
    return '<div class="comment-item">'
      + '<div class="comment-top"><span class="comment-user">' + c.user + '</span><span class="comment-time">' + formatChatTime(c.time) + '</span></div>'
      + '<div class="comment-text">' + escapeHtml(c.text) + '</div>'
      + '<div class="comment-tips">' + tips
      + (currentUser && currentUser !== c.user ? '<button class="comment-tip-btn" onclick="tipComment(\'' + c.id + '\')">&#9733; Tip</button>' : '')
      + '</div></div>';
  }).join("");
}

function escapeHtml(t) { return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function addComment() {
  if (!currentUser) { alert("Register to comment."); return; }
  const input = document.getElementById("comment-input");
  const text = input.value.trim();
  if (!text) return;
  comments.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 4), postId: viewingId, user: currentUser, text, time: Date.now(), tips: [] });
  saveComments();
  input.value = "";
  renderComments(viewingId);
}

function tipComment(commentId) {
  if (!currentUser) { alert("Register first."); return; }
  const c = comments.find(x => x.id === commentId);
  if (!c || c.user === currentUser) return;
  const coin = prompt("Tip coin (btc/shib):") || "btc";
  const amt = prompt("Amount:");
  if (!amt || isNaN(parseFloat(amt)) || parseFloat(amt) <= 0) { alert("Invalid amount."); return; }
  const val = parseFloat(amt);
  genWallet(currentUser);
  genWallet(c.user);
  const w = wallets[currentUser];
  if (!w[coin] || w[coin].balance < val) { alert("Insufficient " + coin.toUpperCase() + "."); return; }
  w[coin].balance -= val;
  wallets[c.user][coin].balance += val;
  if (!c.tips) c.tips = [];
  c.tips.push({ from: currentUser, amount: amt, coin, time: Date.now() });
  txs.push({ user: currentUser, coin, to: c.user, toUser: c.user, other: "Tip on comment", amount: amt, time: Date.now() });
  localStorage.setItem("velog_wallets", JSON.stringify(wallets));
  localStorage.setItem("velog_txs", JSON.stringify(txs));
  saveComments();
  renderComments(viewingId);
}

function showEditor() {
  if (!currentUser) { alert("Please register/login first."); return; }
  editingId = null;
  pendingMedia = [];
  document.getElementById("editor-title").textContent = "New Post";
  document.getElementById("post-title").value = "";
  document.getElementById("post-body").value = "";
  document.getElementById("post-tags").value = "";
  document.getElementById("media-preview").innerHTML = "";
  document.getElementById("editor-overlay").classList.remove("hidden");
}

function hideEditor() { document.getElementById("editor-overlay").classList.add("hidden"); pendingMedia = []; }

function handleImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    pendingMedia.push({ type: "image", data: ev.target.result });
    showMediaPreview();
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function handleVideo(e) {
  const file = e.target.files[0];
  if (!file) return;
  const video = document.createElement("video");
  video.preload = "metadata";
  video.onloadedmetadata = function() {
    if (video.duration > 30) { alert("Video too long! Max 30 seconds."); return; }
    const reader = new FileReader();
    reader.onload = function(ev) {
      pendingMedia.push({ type: "video", data: ev.target.result });
      showMediaPreview();
    };
    reader.readAsDataURL(file);
  };
  video.src = URL.createObjectURL(file);
  e.target.value = "";
}

function showMediaPreview() {
  const container = document.getElementById("media-preview");
  container.innerHTML = "";
  pendingMedia.forEach((m, idx) => {
    const div = document.createElement("div");
    div.className = "media-item";
    div.innerHTML = (m.type === "image"
      ? '<img src="' + m.data + '">'
      : '<video src="' + m.data + '" controls></video>')
      + '<button class="remove-media" onclick="removeMedia(' + idx + ')">&times;</button>';
    container.appendChild(div);
  });
}

function removeMedia(idx) { pendingMedia.splice(idx, 1); showMediaPreview(); }

function savePost() {
  const title = document.getElementById("post-title").value.trim();
  const body = document.getElementById("post-body").value.trim();
  if (!title || !body) { alert("Title and body required."); return; }
  const tags = document.getElementById("post-tags").value.split(",").map(t => t.trim()).filter(Boolean);

  if (editingId) {
    const idx = posts.findIndex(p => p.id === editingId);
    if (idx > -1) {
      posts[idx].title = title; posts[idx].body = body; posts[idx].tags = tags;
      if (pendingMedia.length) posts[idx].media = pendingMedia;
      posts[idx].updatedAt = Date.now();
    }
  } else {
    posts.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title, body, tags, media: pendingMedia,
      author: currentUser,
      views: 0, createdAt: Date.now(), updatedAt: Date.now()
    });
  }
  pendingMedia = [];
  save(); render(); hideEditor();
}

function viewPost(id) {
  viewingId = id;
  const p = posts.find(x => x.id === id);
  if (!p) return;
  p.views++;
  save();
  document.getElementById("view-title").textContent = p.title;
  document.getElementById("view-date").textContent = formatDate(p.createdAt) + " by " + (p.author || "anonymous");
  document.getElementById("view-tags").textContent = p.tags.length ? p.tags.map(t => '#' + t.trim()).join(" ") : "";
  document.getElementById("view-views").textContent = p.views + " views";

  const mediaDiv = document.getElementById("view-media");
  mediaDiv.innerHTML = "";
  if (p.media && p.media.length) {
    p.media.forEach(m => {
      if (m.type === "image") mediaDiv.innerHTML += '<img src="' + m.data + '" alt="">';
      else mediaDiv.innerHTML += '<video src="' + m.data + '" controls></video>';
    });
  }
  document.getElementById("view-body").textContent = p.body;
  document.getElementById("comment-input").value = "";
  renderComments(id);
  document.getElementById("view-overlay").classList.remove("hidden");
}

function hideView() { document.getElementById("view-overlay").classList.add("hidden"); }

function editPost() {
  hideView();
  const p = posts.find(x => x.id === viewingId);
  if (!p) return;
  if (p.author && p.author !== currentUser) { alert("You can only edit your own posts."); return; }
  editingId = p.id;
  pendingMedia = p.media ? JSON.parse(JSON.stringify(p.media)) : [];
  document.getElementById("editor-title").textContent = "Edit Post";
  document.getElementById("post-title").value = p.title;
  document.getElementById("post-body").value = p.body;
  document.getElementById("post-tags").value = p.tags.join(", ");
  showMediaPreview();
  showEditor();
}

function deletePost() {
  if (!confirm("Delete this post?")) return;
  const p = posts.find(x => x.id === viewingId);
  if (p.author && p.author !== currentUser) { alert("You can only delete your own posts."); return; }
  posts = posts.filter(x => x.id !== viewingId);
  save(); render(); hideView();
}

function switchAuth(tab) {
  document.getElementById("auth-tab-reg").classList.toggle("active", tab === "reg");
  document.getElementById("auth-tab-login").classList.toggle("active", tab === "login");
  document.getElementById("auth-reg").classList.toggle("hidden", tab !== "reg");
  document.getElementById("auth-login").classList.toggle("hidden", tab !== "login");
  document.getElementById("auth-title").textContent = tab === "reg" ? "Register" : "Login";
}

function showRegister() {
  switchAuth("reg");
  document.getElementById("register-overlay").classList.remove("hidden");
}
function showLogin() {
  switchAuth("login");
  document.getElementById("register-overlay").classList.remove("hidden");
}
function hideRegister() { document.getElementById("register-overlay").classList.add("hidden"); }

function register() {
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  if (!username || !email || !password) { alert("All fields required."); return; }
  if (password.length < 4) { alert("Password min 4 characters."); return; }
  if (users.find(u => u.username === username)) { alert("Username already taken."); return; }
  users.push({ username, email, password, createdAt: Date.now() });
  genWallet(username);
  localStorage.setItem("velog_users", JSON.stringify(users));
  currentUser = username;
  localStorage.setItem("velog_current_user", currentUser);
  document.getElementById("reg-username").value = "";
  document.getElementById("reg-email").value = "";
  document.getElementById("reg-password").value = "";
  updateNav(); hideRegister(); render(); alert("Registered as " + username);
}

function loginUser() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  if (!username || !password) { alert("All fields required."); return; }
  const u = users.find(x => x.username === username);
  if (!u) { alert("User not found."); return; }
  if (u.password !== password) { alert("Wrong password."); return; }
  currentUser = username;
  localStorage.setItem("velog_current_user", currentUser);
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  updateNav(); hideRegister(); render(); alert("Welcome back, " + username + "!");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("velog_current_user");
  updateNav();
}

updateNav();
render();
