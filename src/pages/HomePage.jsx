import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function HomePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('/api/get_all')  // 使用 proxy
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1>這是首頁</h1>
      {loading && <div>載入中...</div>}
      {error && <div style={{color:'red'}}>發生錯誤：{error.message}</div>}

      {data && (
        <>
          <h3>影片 ({data.videos.length})</h3>
          <pre>{JSON.stringify(data.videos, null, 2)}</pre>

          <h3>音樂 ({data.music.length})</h3>
          <pre>{JSON.stringify(data.music, null, 2)}</pre>
        </>
      )}
    </div>
  )
}
