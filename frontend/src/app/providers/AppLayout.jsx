import { Outlet } from 'react-router-dom'
import Header from '../layouts/header/header'

function AppLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default AppLayout
