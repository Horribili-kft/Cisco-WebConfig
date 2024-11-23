import React from 'react';
import CiscoSwitch from '@/classes/CiscoSwitch';
import CiscoRouter from '@/classes/CiscoRouter';
import LinuxDevice from '@/classes/Linux';
import { useDeviceStore } from '@/store/deviceStore';
import PortGraphic from './PortGraphic';

const PortContainer: React.FC<{ appendCommand: (command: string) => void }> = ({ appendCommand }) => {
  const { device } = useDeviceStore();

  const handlePortClick = (portName: string) => {
    const command = `Interface (${portName})`;
    appendCommand(command); // Append to the textarea when a port is clicked
  };

  if (device instanceof CiscoSwitch) {
    return (
      <div className="p-4 flex flex-wrap justify-start">
        {device.interfaces.map((iface, index) => (
          <div key={index}>
            <PortGraphic
              name={iface.shortname || iface.name}
              type={iface.vlan ? `vlan: ${iface.vlan}` : 'Unknown VLAN'} // Provide fallback if undefined
              up={!iface.shutdown}
              onClick={() => handlePortClick(iface.name || 'Unnamed Interface')} // Fallback if name is undefined
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
              type={iface.ipAddress || 'No IP Address'} // Provide fallback if undefined
              up={!iface.shutdown}
              onClick={() => handlePortClick(iface.name || 'Unnamed Interface')} // Fallback if name is undefined
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
              type={iface.ipAddress || 'No IP Address'} // Provide fallback if undefined
              up={iface.up}
              onClick={() => handlePortClick(iface.name || 'Unnamed Interface')} // Fallback if name is undefined
            />
          </div>
        ))}
      </div>
    );
  }

  return <div>No device connected</div>;
};

export default PortContainer;
