'use client'

import React from 'react'
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className='bg-base-200 px-5 h-10 flex justify-between items-center '>


      {/* Navbar eleje (bal oldala) */}
      <div>
        {/* Horribili" logo */}
        <Link href={"/"}>
          <img src="/logo.png" alt="Logo" className='max-h-8 cursor-pointer hover:scale-105 hover:animate-pulse hover:brightness-125 active:scale-95 transition-all' />
        </Link>
      </div>

      <div className="navbar-center flex">
        <ul className="menu menu-horizontal menu-sm px-1 space-x-2 [&>*]:font-semibold">
          {Links()}
        </ul>
      </div>

      <p>Cisco WebConfig</p>
    </nav>)
}




const Links = () => {
  const currentPath = usePathname();

  const links = [
    { name: 'Conifg', href: '/' },
    { name: 'Help', href: '/help' },
    { name: 'Settings', href: '/settings' },


  ];

  const linkclass = ''

  return (
    <>
      {links.map(link => (
        <li key={link.href}>
          <Link
            href={link.href}
            className={`${link.href === currentPath ? 'active' : ''
              } ${linkclass} `}>
            {link.name}
          </Link>
        </li>
      ))}
    </>
  )
}