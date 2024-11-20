import React from 'react';
import CiscoSwitch from '@/classes/CiscoSwitch';
import { useDeviceStore } from '@/store/deviceStore';
import PortGraphic from './PortGraphic';
import LinuxDevice from '@/classes/Linux';
import CiscoRouter from '@/classes/CiscoRouter';

export default function PortContainer() {
    return (
        <div className="p-4 flex flex-wrap justify-start">
            {MapPorts()}
        </div>);
}

function MapPorts() {
    const { device } = useDeviceStore();
    
    if (device instanceof CiscoSwitch) {
        return (
            device.interfaces.map((iface, index) => (
                <div key={index}>
                    <PortGraphic name={iface.shortname || iface.name} type={`vlan: ${iface.vlan}`} up={!iface.shutdown} />
                </div>
            ))
        );
    }

    if (device instanceof CiscoRouter) {
        return (
            device.interfaces.map((iface, index) => (
                <div key={index}>
                    <PortGraphic name={iface.shortname || iface.name} type={iface.ipAddress} up={iface.shutdown} />
                </div>
            ))
        );
    }

    else if (device instanceof LinuxDevice) {
        return (
            device.interfaces.map((iface, index) => (
                <div key={index}>
                    <PortGraphic name={iface.name} type={iface.ipAddress} up={iface.up}/>
                </div>
            ))
        );
    }
}