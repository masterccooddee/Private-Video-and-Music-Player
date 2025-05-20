import { useState } from 'react';

export default function UploadPage() {
  const [type, setType] = useState('music');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return setMessage('請輸入標題');
    }

    if (!file) {
      return setMessage('請選擇音樂或影片檔案');
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('file', file);
    if (cover) {
      formData.append('cover', cover);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage('上傳成功，已上傳：${uploadedName}');
        setTitle('');
        setDescription('');
        setFile(null);
        setCover(null);
      } else if (res.status === 409) {
        const msg = await res.text();
        setMessage('上傳失敗：' + msg);
      } else {
        const err = await res.text();
        setMessage('上傳失敗: ' + err);
      }
    } catch (err) {
      console.error(err);
      setMessage('伺服器錯誤');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, ''); // 去掉副檔名
      setTitle(name);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>上傳影片或音樂</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>類型：</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="music">音樂</option>
            <option value="video">影片</option>
          </select>
        </div>
        <div>
          <label>標題：</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>檔案（影片或音樂）：</label>
          <input
            type="file"
            accept={type === 'music' ? 'audio/*' : 'video/*'}
            onChange={handleFileChange}
            required
          />
        </div>
        <div>
          <label>封面圖片（可選）：</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files[0])}
          />
        </div>
        <button type="submit">上傳</button>
      </form>

      {message && (
        <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
    </div>
  );
}
