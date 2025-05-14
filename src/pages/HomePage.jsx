import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function HomePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('/get_all')
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err)
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1>這是首頁</h1>
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: 'red' }}>發生錯誤：{error.message}</div>}

      {/* 保持主架構在，即使沒有資料 */}
      <div>
        <h3>影片</h3>
        {data?.videos?.length > 0
          ? <pre>{JSON.stringify(data.videos, null, 2)}</pre>
          : <div style={{ color: 'gray' }}>無影片資料</div>}
      </div>

      <div>
        <h3>音樂</h3>
        {data?.music?.length > 0
          ? <pre>{JSON.stringify(data.music, null, 2)}</pre>
          : <div style={{ color: 'gray' }}>無音樂資料</div>}
      </div>
    </div>
  )
}
