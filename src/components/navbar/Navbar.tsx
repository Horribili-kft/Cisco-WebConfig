// Ez a komponens jelenleg nincs használva

'use client'

import React from 'react'
import SSHconnection from './SSHconnection'

export default function Navbar() {
  return (
    <nav className='justify-evenly bg-base-200 px-5 h-12 flex items-center shadow-md sticky top-0 z-50 gap-4'>


      {/* Navbar eleje (bal oldala) */}
      <div>
        {/* Horribili logo */}
        <img src="/logo.png" alt="Logo" className='max-h-10 cursor-pointer hover:scale-110 hover:brightness-150 active:scale-95 transition-all' />
      </div>

      <p>Cisco WebConfig</p>


      <div>
        <SSHconnection />

      </div>
    </nav>)
}