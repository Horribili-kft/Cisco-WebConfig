import CiscoSwitch from '@/classes/CiscoSwitch';
import LinuxDevice from '@/classes/Linux';
import { useDeviceStore } from '@/store/deviceStore';
import React from 'react'

export default function DeviceInfo() {
    const { device } = useDeviceStore();

    if (device instanceof CiscoSwitch) {
        return (
            <div className="bg-base-300 h-24 rounded-lg p-4 m-4">
                <p className='font-bold text-center  bg-info rounded-full'></p>{device.type}
                <ul className='list-disc'>
                <li>{device?.hostname}</li>
                <li>{device.version}</li>
                </ul>
                
                {/* Példa linuk konfiguráció kiírására */}
            </div>
        )
    }


    if (device instanceof LinuxDevice) {
        return (
            <div className="bg-base-300 rounded-lg p-4 m-4">
                <div className='bg-error rounded-lg'>
                    <p className='font-bold text-center'>{device.type}</p> 
                </div>

                <div className='ml-7 mt-3'>
                <p><span className='font-light'>Device hostname:</span> {device.hostname}</p>
                <p>Kernel version: {device.version}</p>
                </div>
        
                
                {/* Példa linuk konfiguráció kiírására */}
            </div>
        )
    }

}



