import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import './NotificationContext.css'

const NotificationContext = createContext(null)

export function useNotification() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null)
  
  const showNotification = useCallback((message, soundPath = '/notification.wav') => {
    setNotification(message)
    
    try {
      // Use the subtle premium chime generated earlier or a custom provided sound
      const audio = new Audio(soundPath)
      audio.play()
    } catch (e) {
      // Ignore audio block issues
    }

    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => prev === message ? null : prev)
    }, 3000)
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Global Notification Overlay */}
      <div className={`global-notification ${notification ? 'visible' : ''}`}>
        {notification && (
          <div className="global-notification-content">
            {notification}
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  )
}
