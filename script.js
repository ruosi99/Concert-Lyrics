let data = {};
let currentArtist = null;
let currentAlbum = null;
let songKeyMap = {};

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

function showArtists() {
    setTitle('选择歌手');
    let html = '';
    for (let artist in data) {
        html += `<span class="clickable" onclick="showAlbums('${artist}')">${artist}</span>`;
    }
    setContent(html);
}

function showAlbums(artist) {
    currentArtist = artist;
    setTitle(artist);
    let html = `<div class="back" onclick="showArtists()">← 返回</div>`;
    for (let album in data[artist]) {
        html += `<span class="clickable" onclick="showSongs('${album}')">${album}</span>`;
    }
    setContent(html);
}

function showSongs(album) {
    currentAlbum = album;
    const songs = data[currentArtist][album];
    setTitle(`${currentArtist} / ${album}`);
    let html = `<div class="back" onclick="showAlbums('${currentArtist}')">← 返回</div>`;

    songKeyMap = {}; // 清空旧映射

    for (let rawKey in songs) {
        const displayName = rawKey
            .replace(/lyrics$/i, "")
            .replace(/\(.*?\)/g, "")
            .replace(/-.*$/, "")
            .trim();

        songKeyMap[displayName] = rawKey; // 建立映射
        html += `<span class="clickable" onclick="showLyrics('${displayName}')">${displayName}</span>`;
    }

    setContent(html);
}

function showLyrics(displayName) {
    const key = songKeyMap[displayName] || displayName;
    const lyrics = data[currentArtist][currentAlbum][key];

    if (!lyrics || lyrics.length === 0) {
        setContent(`<div class="back" onclick="showSongs('${currentAlbum}')">← 返回</div><p>⚠️ 无法找到歌词。</p>`);
        return;
    }

    setTitle(displayName);
    let html = `<div class="back" onclick="showSongs('${currentAlbum}')">← 返回</div>`;
    html += `<div class="lyrics">${lyrics.map(line => `<div>${line}</div>`).join('')}</div>`;
    setContent(html);
}
