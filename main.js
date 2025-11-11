// Firebase関連のインポート（まとめて1箇所に）
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { 
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyB3jp9nmDsdwWtAPMwuF0QTikgHayGDMW4",
  authDomain: "slap-chat-a361d.firebaseapp.com",
  projectId: "slap-chat-a361d",
  storageBucket: "slap-chat-a361d.firebasestorage.app",
  messagingSenderId: "619921075331",
  appId: "1:619921075331:web:ce894758ea6c8d16bdbfb6",
  measurementId: "G-S9HDDBDWKW"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// コメントをリアルタイムで読み込む関数
function コメント読み込み() {
  const commentList = document.getElementById('comment-list');
  commentList.innerHTML = '<div class="loading">コメントを読み込み中...</div>';

  const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));

  // 🔄 リアルタイムリスナーを設定
  onSnapshot(q, (querySnapshot) => {
    commentList.innerHTML = '';

    if (querySnapshot.empty) {
      commentList.innerHTML = '<div class="loading">まだコメントがありません。最初のコメントを投稿しよう！</div>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment-item';

      // アバター部分
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'comment-avatar';
      avatarDiv.textContent = (data.name || '名無し').charAt(0).toUpperCase();

      // コンテンツ部分
      const contentDiv = document.createElement('div');
      contentDiv.className = 'comment-content';

      // ヘッダー（名前 + 時間）
      const headerDiv = document.createElement('div');
      headerDiv.className = 'comment-header';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'comment-name';
      nameSpan.textContent = data.name || '名無し';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'comment-time';
      const date = data.timestamp ? new Date(data.timestamp) : new Date();
      timeSpan.textContent = date.toLocaleString('ja-JP');

      headerDiv.appendChild(nameSpan);
      headerDiv.appendChild(timeSpan);

      // テキスト部分
      const textDiv = document.createElement('div');
      textDiv.className = 'comment-text';
      textDiv.textContent = data.text;

      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(textDiv);

      // 🎬 メディアがある場合（画像・動画・音声）
      if (data.mediaUrl || data.imageUrl) {
        const mediaUrl = data.mediaUrl || data.imageUrl;
        const mediaType = data.mediaType || getMediaType(mediaUrl);
        
        const mediaDiv = document.createElement('div');
        mediaDiv.className = 'comment-media';

        if (mediaType === 'image') {
          // 画像
          const img = document.createElement('img');
          img.src = mediaUrl;
          img.alt = 'コメント画像';
          img.onerror = function() {
            this.style.display = 'none';
            showMediaError(mediaDiv);
          };
          mediaDiv.appendChild(img);
        } 
        else if (mediaType === 'video') {
          // 動画
          const video = document.createElement('video');
          video.src = mediaUrl;
          video.controls = true;
          video.preload = 'metadata';
          video.onerror = function() {
            this.style.display = 'none';
            showMediaError(mediaDiv);
          };
          mediaDiv.appendChild(video);
        }
        else if (mediaType === 'audio') {
          // 音声
          const audio = document.createElement('audio');
          audio.src = mediaUrl;
          audio.controls = true;
          audio.preload = 'metadata';
          audio.onerror = function() {
            this.style.display = 'none';
            showMediaError(mediaDiv);
          };
          mediaDiv.appendChild(audio);
        }
        else if (mediaType === 'youtube') {
          // YouTube埋め込み
          const iframe = document.createElement('iframe');
          iframe.src = convertToYouTubeEmbed(mediaUrl);
          iframe.frameBorder = '0';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          mediaDiv.appendChild(iframe);
        }
        else {
          // その他のファイル（ダウンロードリンク）
          const link = document.createElement('a');
          link.href = mediaUrl;
          link.target = '_blank';
          link.className = 'file-link';
          link.innerHTML = `📎 ファイルを開く`;
          mediaDiv.appendChild(link);
        }

        contentDiv.appendChild(mediaDiv);
      }

      commentDiv.appendChild(avatarDiv);
      commentDiv.appendChild(contentDiv);
      commentList.appendChild(commentDiv);
    });
  }, (error) => {
    console.error("リアルタイム更新エラー:", error);
    commentList.innerHTML = '<div class="loading">コメントの読み込みに失敗しました。</div>';
  });
}

// メディアタイプを判定する関数
function getMediaType(url) {
  const lowerUrl = url.toLowerCase();
  
  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  // 画像
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(lowerUrl)) {
    return 'image';
  }
  
  // 動画
  if (/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(lowerUrl)) {
    return 'video';
  }
  
  // 音声
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(lowerUrl)) {
    return 'audio';
  }
  
  return 'file';
}

// YouTubeURLを埋め込み形式に変換
function convertToYouTubeEmbed(url) {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// YouTube動画IDを抽出
function extractYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// エラー表示
function showMediaError(container) {
  const errorText = document.createElement('p');
  errorText.textContent = 'メディアを読み込めませんでした';
  errorText.style.color = '#ff6b6b';
  container.appendChild(errorText);
}

// 投稿ボタンの機能
document.addEventListener('DOMContentLoaded', function() {
  const postButton = document.getElementById('post-button');
  const nameInput = document.getElementById('name');
  const commentInput = document.getElementById('comment');
  const mediaUrlInput = document.getElementById('media-url');

  // 投稿ボタンのクリックイベント
  postButton.addEventListener('click', async function() {
    const name = nameInput.value.trim() || '名無し';
    const text = commentInput.value.trim();
    const mediaUrl = mediaUrlInput.value.trim();

    // コメントが空の場合はエラー
    if (!text) {
      alert('コメントを入力してください');
      return;
    }

    // ボタンを無効化（連続投稿防止）
    postButton.disabled = true;
    postButton.textContent = '投稿中...';

    try {
      // Firestoreにコメントを追加
      const commentData = {
        name: name,
        text: text,
        timestamp: Date.now()
      };

      // メディアURLがある場合は追加
      if (mediaUrl) {
        commentData.mediaUrl = mediaUrl;
        commentData.mediaType = getMediaType(mediaUrl);
      }

      await addDoc(collection(db, "comments"), commentData);

      // 入力欄をクリア
      nameInput.value = '';
      commentInput.value = '';
      mediaUrlInput.value = '';

      console.log('コメント投稿成功！');
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      alert('コメントの投稿に失敗しました。もう一度お試しください。');
    } finally {
      // ボタンを再有効化
      postButton.disabled = false;
      postButton.textContent = '投稿';
    }
  });

  // Enterキーでの投稿（Shift+Enterは改行）
  commentInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      postButton.click();
    }
  });
});

// ページ読み込み時にコメントを表示
コメント読み込み();

console.error('01000110 01101111 01100011 01110101 01110011 00100000 01101111 01101110 00100000 01101010 01110011')

const part1 = "SSBhbSB2ZXJ5IGdyYXRlZnVs";
const part2 = "IGZvciBTbGFwIEJhdHRsZS4=";
function reveal() {
  console.log(atob(part1 + part2));
}