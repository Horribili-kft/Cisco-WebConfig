import React from 'react';
import CiscoSwitch from '@/classes/CiscoSwitch';
import { useDeviceStore } from '@/store/deviceStore';

export default function PortContainer() {
    const { device } = useDeviceStore();

    // Check if the device is a CiscoSwitch and cast it accordingly
    if (device instanceof CiscoSwitch) {
        // Now we know the device is a CiscoSwitch, so we can use it as such
        return (
            <div>
                <h2>Device Details:</h2>
                <p>Hostname: {device.hostname}</p>
                <p>Version: {device.version}</p>
                
                <h3>Interfaces:</h3>
                <ul>
                    {device.interfaces.map((iface, index) => (
                        <li key={index}>
                            {iface.name}: VLAN {iface.vlan}, Mode {iface.switchportMode}, Shutdown: {iface.shutdown ? 'Yes' : 'No'}
                        </li>
                    ))}
                </ul>

                <h3>VLANs:</h3>
                <ul>
                    {device.vlans.map((vlan, index) => (
                        <li key={index}>
                            VLAN {vlan.id}: {vlan.name}
                        </li>
                    ))}
                </ul>
            </div>
        );
    } else {
        return (
            <div>No Cisco switch detected</div>
        );
    }
}
