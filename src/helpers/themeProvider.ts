'use client'
// Kliens komponens, mert a kliensnél van eltárolva a theme

import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

const ThemeProvider = () => {
    const { theme } = useSettingsStore()
    // Amikor változik a theme változó, ez lecseréli a <html>-ben a data-theme paramétert arra amire változott. A többit a Daisyui intézi

    useEffect(() => {
        document.querySelector('html')!.setAttribute('data-theme', theme);
    }, 
    // Minden theme változást figyelünk
    [theme])

    return null
}
export default ThemeProvider