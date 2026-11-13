import { Header } from './Header'
import { ChatMessages } from './ChatMessages'
import { Sidebar } from './Sidebar'
import { ChatInput } from './ChatInput'
import { BottomNav } from './BottomNav'
import { Toasts } from './Toasts'
import { Banners } from './Banners'

export function AppShell() {
  return (
    <>
      <Header />
      <ChatMessages />
      <Sidebar />
      <ChatInput />
      <BottomNav />
      <Toasts />
      <Banners />
    </>
  )
}
