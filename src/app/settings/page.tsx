'use client'

import { useSettingsStore } from '@/store/settingsStore';
import { themes } from '../../../tailwind.config';
import React, { ReactNode } from 'react'

export default function Settings() {


  const {
    theme, setTheme, // Just a simple setting keeping track of the theme
    forceciscossh, setForceCiscoSSH // Setting to force cisco devices to use SSH instead of Telnet
  } = useSettingsStore();

  return (



    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Cisco WebConfig settings</h1>
      <p className="brightness-75 mb-2">Settings here are persisted in the local browser storage</p>

      <div>
        {/* Theme Setting. Yet to be implemented */}
        <Setting
          title="Theme"
          description="Choose your preferred website theme. (work in progress)">
          <div className="flex flex-wrap space-x-2">
            {themes.map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`btn btn-sm btn-ghost ${theme === themeOption ? 'btn-active' : ''}`}
              >
                {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
              </button>
            ))}
          </div>
        </Setting>

        {/* Force Cisco SSH setting. */}
        <Setting
          title='Force SSH on Cisco devices'
          description='By default, telnet is used to interface with Cisco devices for compatibility reasons. You can force SSH, but it very probably will not work on older devices. If Telnet works for you, there is practically no reason to change to this besides security.'>
          <input type="checkbox" className="toggle toggle-lg toggle-warning" checked={forceciscossh} onChange={(e) => setForceCiscoSSH(e.target.checked)} />
        </Setting>


      </div>

    </div>



  );
}



// Reusable Setting component
function Setting({ title, description, children }: { title: string, description: string, children: ReactNode }) {
  return (
    <div className="mt-4 mb-4">
      <div className='divider'></div>
      <h2 className="text-xl mb-2 font-semibold">{title}</h2>
      <p className="brightness-75 text-sm mb-2">{description}</p>
      <div className='pt-2 pb-2'>
        {children}
      </div>
    </div>
  );
}