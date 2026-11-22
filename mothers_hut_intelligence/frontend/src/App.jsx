import React, { useState, useEffect } from 'react'
import TopHeader from './components/TopHeader'
import SidebarDrawer from './components/SidebarDrawer'
import MealVerifier from './components/MealVerifier'
import RestaurantOverview from './components/RestaurantOverview'

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('verifier') // 'verifier' | 'overview'
  const [visionOnline, setVisionOnline] = useState(true)
  const [overviewData, setOverviewData] = useState(null)

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/overview')
      if (res.ok) {
        const data = await res.json()
        setOverviewData(data)
        setVisionOnline(true)
      }
    } catch {
      setVisionOnline(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchOverview()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2A181A]">
      <TopHeader
        onOpenMenu={() => setDrawerOpen(true)}
        visionOnline={visionOnline}
      />

      <SidebarDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      <main>
        {activeTab === 'verifier' ? (
          <MealVerifier onScanComplete={fetchOverview} />
        ) : (
          <RestaurantOverview
            data={overviewData}
            onResolveAlert={handleResolveAlert}
            onLaunchVerifier={() => setActiveTab('verifier')}
          />
        )}
      </main>
    </div>
  )
}
