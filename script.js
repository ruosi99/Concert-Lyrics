let data = {};
let currentArtist = null;
let currentAlbum = null;
let songKeyMap = {};

// 加载 JSON 文件
fetch('lyrics.json')
    .then(res => res.json())
    .then(json => {
        data = json;
        showArtists();
    });

function setTitle(text) {
    document.getElementById('title').textContent = text;
}

function setContent(html) {
    document.getElementById('content').innerHTML = html;
}

// 首页：显示所有歌手
function showArtists() {
    setTitle('选择歌手');
    let html = '';
    for (let artist in data) {
        html += `<span class="clickable" onclick="showAlbums('${artist}')">${artist}</span><br>`;
    }
    setContent(html);
}


// 显示专辑列表
function showAlbums(encodedArtist) {
    const artist = decodeURIComponent(encodedArtist);
    currentArtist = artist;
    setTitle(artist);
    let html = `<div class="back" onclick="showArtists()">← 返回</div>`;
    html += `
    <div class="option-button" onclick="showAllSongs('${artist}')">🎵 查看全部歌曲 (A-Z)</div>
    <div class="option-button" onclick="showAlbumsList('${artist}')">📀 按专辑查看歌曲</div>
    <div class="option-button" onclick="showPlaylistEditor()">➕ 生成演唱会歌单</div>
    <div class="option-button" onclick="loadPlaylistManager()">📝 查看演唱会歌单</div>
`;


    setContent(html);
}


function showAlbumsList(artist) {
    currentArtist = artist;
    setTitle(`${artist} / 专辑列表`);
    let html = `<div class="back" onclick="showAlbums('${artist}')">← 返回</div>`;

    for (let album in data[artist]) {
        html += `<span class="clickable" onclick="showSongs('${album}')">${album}</span>`;
    }

    setContent(html);
}


// 显示某专辑下所有歌曲
function showSongs(encodedAlbum) {
    const album = decodeURIComponent(encodedAlbum);
    currentAlbum = album;
    const songs = data[currentArtist][album];
    setTitle(`${currentArtist} / ${album}`);
    let html = `<div class="back" onclick="showAlbums('${encodeURIComponent(currentArtist)}')">← 返回</div>`;

    songKeyMap = {};

    for (let rawKey in songs) {
        const displayName = rawKey
            .replace(/lyrics$/i, "")
            .replace(/\(.*?\)/g, "")
            .replace(/-.*$/, "")
            .trim();

        songKeyMap[displayName] = rawKey;
        html += `<span class="clickable" onclick="showLyrics('${encodeURIComponent(displayName)}')">${displayName}</span>`;
    }

    setContent(html);
}

// 显示歌词页
function showLyrics(encodedDisplayName) {
    const displayName = decodeURIComponent(encodedDisplayName);
    const key = songKeyMap[displayName] || displayName;
    const lyrics = data[currentArtist][currentAlbum][key];

    if (!lyrics || lyrics.length === 0) {
        setContent(`<div class="back" onclick="showSongs('${encodeURIComponent(currentAlbum)}')">← 返回</div><p>⚠️ 无法找到歌词。</p>`);
        return;
    }

    setTitle(displayName);
    let html = `<div class="back" onclick="showSongs('${encodeURIComponent(currentAlbum)}')">← 返回</div>`;
    html += `
  <div class="lyrics-container">
    ${lyrics.map(line => {
        if (/^\[.*\]$/.test(line)) {
            return `<div class="section-title">${line}</div>`;
        } else {
            return `<div>${line}</div>`;
        }
    }).join('')}
  </div>
`;
    setContent(html);  // 设置歌词内容后
    const container = document.querySelector('.lyrics-container');
    enableAutoHideScrollbar(container);

}

// 搜索功能：按歌名或歌词内容模糊匹配

function mergeBrokenSectionTags(lines) {
    const merged = [];
    let i = 0;
    while (i < lines.length) {
        if (
            lines[i].trim() === "[" &&
            i + 2 < lines.length &&
            lines[i + 2].trim() === "]"
        ) {
            const tag = lines[i + 1].trim();
            merged.push(`[${tag}]`);
            i += 3; // 跳过3行
        } else {
            merged.push(lines[i]);
            i++;
        }
    }
    return merged;
}




function searchLyrics() {
    const query = document.getElementById("search-box").value.toLowerCase().trim();
    if (!query) {
        showArtists();
        return;
    }

    let results = [];
    for (let artist in data) {
        for (let album in data[artist]) {
            for (let song in data[artist][album]) {
                const displayName = song.replace(/lyrics$/i, "").trim();
                const key = song;
                const lyricsLines = data[artist][album][key];

                const matchSongName = displayName.toLowerCase().includes(query);
                const matchedLines = lyricsLines.filter(line => line.toLowerCase().includes(query));

                if (matchSongName || matchedLines.length > 0) {
                    results.push({
                        artist,
                        album,
                        displayName,
                        key,
                        snippet: matchedLines.slice(0, 2) // 最多展示两句
                    });
                }
            }
        }
    }

    setTitle(`搜索结果：${results.length} 首`);
    if (results.length === 0) {
        setContent(`<p>😢 没有找到匹配结果</p>`);
        return;
    }

    let html = `<div class="back" onclick="showArtists()">← 返回首页</div>`;
    results.forEach(item => {
        if (!songKeyMap[item.album]) songKeyMap[item.album] = {};
        songKeyMap[item.album][item.displayName] = item.key;

        html += `<span class="clickable" onclick="showLyricsFromSearch('${item.artist}', '${item.album}', '${item.displayName}')">${item.displayName} — <i>${item.album}</i></span>`;

        // 加一句歌词展示
        if (item.snippet && item.snippet.length > 0) {
            item.snippet.forEach(line => {
                const highlighted = line.replace(new RegExp(`(${query})`, 'gi'), `<mark>$1</mark>`);
                html += `<div class="lyric-snippet">${highlighted}</div>`;
            });
        }
    });

    setContent(html);
}


// 搜索跳转歌词页
function showLyricsFromSearch(encodedArtist, encodedAlbum, encodedDisplayName) {
    const artist = decodeURIComponent(encodedArtist);
    const album = decodeURIComponent(encodedAlbum);
    const displayName = decodeURIComponent(encodedDisplayName);

    currentArtist = artist;
    currentAlbum = album;

    const key = songKeyMap[album][displayName] || displayName;
    const lyrics = data[artist][album][key];

    setTitle(displayName);
    let html = `<div class="back" onclick="searchLyrics()">← 返回搜索</div>`;

    html += `
  <div class="lyrics-container">
    ${lyrics.map(line => {
        if (/^\[.*\]$/.test(line)) {
            return `<div class="section-title">${line}</div>`;
        } else {
            return `<div>${line}</div>`;
        }
    }).join('')}
  </div>
`;
    setContent(html);  // 设置歌词内容后
    const container = document.querySelector('.lyrics-container');
    enableAutoHideScrollbar(container);

}


function showAllSongs(artist) {
    currentArtist = artist;
    setTitle(`${artist} 的全部歌曲`);

    let allSongs = [];

    for (let album in data[artist]) {
        for (let song in data[artist][album]) {
            allSongs.push({
                name: song.replace(/lyrics$/i, "").trim(),
                album,
                key: song
            });
        }
    }

    // 按歌曲名排序
    allSongs.sort((a, b) => a.name.localeCompare(b.name));

    // 建立映射
    songKeyMap = {};
    allSongs.forEach(item => {
        if (!songKeyMap[item.album]) songKeyMap[item.album] = {};
        songKeyMap[item.album][item.name] = item.key;
    });

    let html = `<div class="back" onclick="showArtists()">← 返回歌手页</div>`;
    allSongs.forEach(item => {
        html += `<span class="clickable" onclick="showLyricsFromSearch('${artist}', '${item.album}', '${item.name}')">${item.name} — <i>${item.album}</i></span>`;
    });

    setContent(html);
}




// 🔧 新增变量
let playlist = [];
let playlistName = "";
let savedPlaylists = JSON.parse(localStorage.getItem("playlists") || "[]");

function saveCurrentPlaylist() {
    if (!playlistName.trim()) return;
    const index = savedPlaylists.findIndex(p => p.name === playlistName);
    const newEntry = { name: playlistName, songs: playlist };

    if (index !== -1) {
        savedPlaylists[index] = newEntry;
    } else {
        savedPlaylists.push(newEntry);
    }
    localStorage.setItem("playlists", JSON.stringify(savedPlaylists));
}

function loadPlaylistManager() {
    if (!currentArtist) currentArtist = Object.keys(data)[0];

    setTitle("📁 我的演唱会歌单");
    let html = `<div class="back" onclick="showAlbums(currentArtist)">← 返回</div>`;

    html += `<div style="margin-top: 10px;">
        <input type="text" id="new-playlist-name" placeholder="新建歌单名称..." style="padding: 8px; border-radius: 6px; font-size: 14px;" />
        <button onclick="createNewPlaylist()">➕ 新建歌单</button>
    </div><hr />`;

    if (savedPlaylists.length === 0) {
        html += `<p>尚未保存任何歌单</p>`;
    } else {
        savedPlaylists.forEach((entry, idx) => {
            html += `
                <div class="playlist-item">
                <div class="playlist-item-title">${entry.name}</div>
                <div class="playlist-actions">
                <button onclick="loadPlaylist(${idx})">🎵 加载</button>
                <button onclick="renamePlaylist(${idx})">✏️ 重命名</button>
                <button onclick="deletePlaylist(${idx})">🗑 删除</button>
              </div>
             </div>
            `;

        });
    }

    setContent(html);
}

function createNewPlaylist() {
    const name = document.getElementById("new-playlist-name").value.trim();
    if (!name) return alert("请输入歌单名称");
    if (savedPlaylists.some(p => p.name === name)) return alert("该歌单已存在");
    playlistName = name;
    playlist = [];
    showPlaylistEditor();
}

function loadPlaylist(index) {
    const entry = savedPlaylists[index];
    playlistName = entry.name;
    playlist = entry.songs;
    showPlaylistEditor();
}

function renamePlaylist(index) {
    const newName = prompt("输入新的歌单名称：", savedPlaylists[index].name);
    if (!newName) return;
    if (savedPlaylists.some((p, i) => i !== index && p.name === newName)) return alert("该名称已被使用");
    savedPlaylists[index].name = newName;
    localStorage.setItem("playlists", JSON.stringify(savedPlaylists));
    loadPlaylistManager();
}

function deletePlaylist(index) {
    if (confirm("确定要删除此歌单？")) {
        savedPlaylists.splice(index, 1);
        localStorage.setItem("playlists", JSON.stringify(savedPlaylists));
        loadPlaylistManager();
    }
}

function showPlaylistEditor() {
    setTitle("🎤 编辑演唱会歌单");

    let html = `
        <div class="back" onclick="loadPlaylistManager()">← 返回歌单管理</div>
        <input type="text" id="playlist-name" placeholder="输入歌单名称..." value="${playlistName}" onchange="updatePlaylistName(this.value)" style="width: 100%; padding: 10px; font-size: 16px; border-radius: 6px; margin-bottom: 20px;" />
    `;

    if (playlist.length === 0) {
        html += `<p>暂无歌曲，点击下方添加</p>`;
    } else {
        html += '<ul style="list-style: none; padding-left: 0;">';
        playlist.forEach((item, index) => {
            html += `
  <div class="song-entry">
    <span class="clickable song-title" onclick="showLyricsFromPlaylist(${index})">
        ${item.title} — <i>${item.album}</i>
    </span>
    <div class="song-actions">
        <button onclick="moveUp(${index})">🔼</button>
        <button onclick="moveDown(${index})">🔽</button>
        <button onclick="removeFromPlaylist(${index})">🗑</button>
    </div>
  </div>
`;

        });
        html += '</ul>';
    }

    html += `
        <div class="sub-option" onclick="addToPlaylistUI()">➕ 添加歌曲</div>
        <div class="sub-option" onclick="saveCurrentPlaylist()">💾 保存当前歌单</div>
    `;
    setContent(html);
}

function updatePlaylistName(name) {
    playlistName = name;
}

function showLyricsFromPlaylist(index) {
    const song = playlist[index];
    const lyrics = data[song.artist][song.album][song.key];
    setTitle(`${song.title}`);
    let html = `<div class="back" onclick="showPlaylistEditor()">← 返回歌单</div>`;
    html += `
  <div class="lyrics-container">
    ${lyrics.map(line => {
        if (/^\[.*\]$/.test(line)) {
            return `<div class="section-title">${line}</div>`;
        } else {
            return `<div>${line}</div>`;
        }
    }).join('')}
  </div>
`;
    setContent(html);  // 设置歌词内容后
    const container = document.querySelector('.lyrics-container');
    enableAutoHideScrollbar(container);

}

function removeFromPlaylist(index) {
    playlist.splice(index, 1);
    showPlaylistEditor();
}

function moveUp(index) {
    if (index > 0) {
        [playlist[index - 1], playlist[index]] = [playlist[index], playlist[index - 1]];
        showPlaylistEditor();
    }
}

function moveDown(index) {
    if (index < playlist.length - 1) {
        [playlist[index + 1], playlist[index]] = [playlist[index], playlist[index + 1]];
        showPlaylistEditor();
    }
}

function addToPlaylistUI() {
    setTitle("添加歌曲至歌单");
    let html = `<div class="back" onclick="showPlaylistEditor()">← 返回</div>`;
    html += `<input id="playlist-search" type="text" placeholder="搜索歌曲名..." oninput="filterPlaylistSearch()" style="width: 100%; padding: 8px; font-size: 16px; margin-bottom: 16px; border-radius: 6px;" />`;
    html += '<div id="playlist-search-results">';
    html += renderSongAddList();
    html += '</div>';
    setContent(html);
}

function renderSongAddList(query = '') {
    query = query.toLowerCase();
    let html = '';
    for (let artist in data) {
        let artistBlock = '';
        for (let album in data[artist]) {
            let albumBlock = '';
            for (let rawKey in data[artist][album]) {
                const displayName = rawKey.replace(/lyrics$/i, "").trim();
                if (displayName.toLowerCase().includes(query)) {
                    albumBlock += `<div class="clickable" style="margin-left: 20px;" onclick="addToPlaylist('${artist}', '${album}', '${rawKey}', '${displayName}')">➕ ${displayName}</div>`;
                }
            }
            if (albumBlock) {
                artistBlock += `<h4 style="margin-left: 10px;">${album}</h4>` + albumBlock;
            }
        }
        if (artistBlock) {
            html += `<h3>${artist}</h3>` + artistBlock;
        }
    }
    return html || '<p>😢 没有找到匹配歌曲</p>';
}

function filterPlaylistSearch() {
    const q = document.getElementById("playlist-search").value;
    const html = renderSongAddList(q);
    document.getElementById("playlist-search-results").innerHTML = html;
}

function addToPlaylist(artist, album, key, title) {
    playlist.push({ artist, album, key, title });
    showPlaylistEditor();
}


function enableAutoHideScrollbar(container) {
    let timeout;
    container.addEventListener('scroll', () => {
        container.classList.add('scrolling');
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            container.classList.remove('scrolling');
        }, 1000); // 停止滚动 1 秒后隐藏滚动条
    });
}
