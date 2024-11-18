import Link from 'next/link'
import React from 'react'

export default function helppage() {
    return (
        <div className='p-4'>
            <Link href={'/'}>
                back to page
            </Link>

            <h1 className='text-xl text-center'>Help page</h1>
        </div>
    )
}
