import { Outlet } from 'react-router-dom'
import { useSession } from '@/context/SessionContext'
import { useTimeTotals } from '@/hooks/useTimeTotals'
import { Sidebar } from '@/components/Sidebar'
import './AppLayout.css'

export function AppLayout() {
  const { user } = useSession()
  const { todayMinutes, weekMinutes } = useTimeTotals(user?.id)

  return (
    <div className="app-layout">
      <Sidebar todayHours={todayMinutes} weekHours={weekMinutes} />
      <div className="app-layout-main">
        <Outlet />
      </div>
    </div>
  )
}
