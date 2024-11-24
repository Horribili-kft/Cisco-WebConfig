import React from 'react';
import CiscoSwitch from '@/classes/CiscoSwitch';
import CiscoRouter from '@/classes/CiscoRouter';
import LinuxDevice from '@/classes/Linux';
import { useDeviceStore } from '@/store/deviceStore';
import PortGraphic from './PortGraphic';
import { useCommandStore } from '@/store/commandStore';

const PortContainer: React.FC = () => {
  const { device } = useDeviceStore();
  const { selectedInterfaces, toggleInterface } = useCommandStore();

  if (device instanceof CiscoSwitch) {
    return (
      <div className="p-4 flex flex-wrap justify-start">
        {device.interfaces.map((iface, index) => (
          <div key={index}>
            <PortGraphic
              name={iface.shortname || iface.name}
              type={`vlan: ${iface.vlan}`}
              up={!iface.shutdown}
              selected={selectedInterfaces.has(iface.name)}
              onClick={() => toggleInterface(iface.name)}
            />
          </div>
        ))}
      </div>
    );
  }

  if (device instanceof CiscoRouter) {
    return (
      <div className="p-4 flex flex-wrap justify-start">
        {device.interfaces.map((iface, index) => (
          <div key={index}>
            <PortGraphic
              name={iface.shortname || iface.name}
              type={iface.ipAddress}
              selected={selectedInterfaces.has(iface.name)}
              up={!iface.shutdown}
              onClick={() => toggleInterface(iface.name)}
            />
          </div>
        ))}
      </div>
    );
  }

  if (device instanceof LinuxDevice) {
    return (
      <div className="p-4 flex flex-wrap justify-start">
        {device.interfaces.map((iface, index) => (
          <div key={index}>
            <PortGraphic
              name={iface.name}
              type={iface.ipAddress}
              selected={selectedInterfaces.has(iface.name)}
              up={iface.up}
              onClick={() => toggleInterface(iface.name)}
            />
          </div>
        ))}
      </div>
    );
  }

};

export default PortContainer;
