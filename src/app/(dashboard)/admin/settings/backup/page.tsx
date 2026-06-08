'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Database, Download, ShieldAlert } from 'lucide-react'

export default function BackupPage() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    setIsDownloading(true)
    
    // Instead of tanstack query, we can trigger a direct download link using a hidden anchor tag
    // since the API returns an attachment
    const token = localStorage.getItem('token')
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/backup`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok')
      return response.blob()
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${new Date().getTime()}.sql` // Fallback filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      setIsDownloading(false)
    })
    .catch(err => {
      console.error(err)
      alert('Failed to download backup.')
      setIsDownloading(false)
    })
  }

  return (
    <div className="max-w-3xl space-y-6 fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Database Backup</h1>
        <p className="text-sm text-slate-500 mt-1">Export your data to a downloadable SQL file.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="text-blue-500" size={20} /> Generate Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
            <ShieldAlert className="shrink-0 text-amber-500" size={20} />
            <div>
              <p className="font-bold mb-1">Important Note</p>
              <p>
                Downloading a database backup contains sensitive operational and financial data. 
                Ensure you store the exported SQL file in a secure location and do not share it with unauthorized personnel.
              </p>
            </div>
          </div>

          <div className="flex justify-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <div className="text-center">
              <Database className="mx-auto h-12 w-12 text-slate-400 mb-4 opacity-50" />
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed mx-auto"
              >
                <Download size={20} /> 
                {isDownloading ? 'Generating Backup...' : 'Download Full Database Backup'}
              </button>
              <p className="text-xs text-slate-400 mt-3 font-mono">Format: SQL Dump File (.sql)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
