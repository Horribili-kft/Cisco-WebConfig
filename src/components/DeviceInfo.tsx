import CiscoSwitch from "@/classes/CiscoSwitch";
import LinuxDevice from "@/classes/Linux";
import { useDeviceStore } from "@/store/deviceStore";
import React from "react";

export default function DeviceInfo() {
  const { device } = useDeviceStore();

  if (device instanceof CiscoSwitch) {
    return (
      <div className="bg-base-300 h-24 rounded-lg p-4 m-4">
        <p className="font-bold text-center  bg-info rounded-full"></p>
        {device.type}
        <ul className="list-disc">
          <li>{device?.hostname}</li>
          <li>{device.version}</li>
        </ul>

        {/* Example configuration display */}
      </div>
    );
  }

  if (device instanceof LinuxDevice) {
    return (
      <div className="bg-base-300 rounded-lg p-4 m-4">
        <div className="bg-error rounded-lg pb-2">
          <p className="font-bold text-center text-accent-content">
            {device.type}
          </p>
        </div>
  
        {/* Flex container for Hostname and Version */}
        <div className="flex flex-row gap-x-4 mt-2">
          <div className="flex flex-row gap-x-4 justify-between text-sm items-center bg-base-200 rounded-lg p-2 flex-1">
            <p>Hostname:</p>
            <div>{device.hostname}</div>
          </div>
          <div className="flex flex-row gap-x-4 justify-between text-sm items-center bg-base-200 rounded-lg p-2 flex-1">
            <p>Version:</p>
            <div>{device.version}</div>
          </div>
        </div>
        <div className="flex flex-row gap-x-4 mt-2">
          <div className="flex flex-row gap-x-4 justify-between text-sm items-center bg-base-200 rounded-lg p-2 flex-1">
            <p>Hostname:</p>
            <div>{device.hostname}</div>
          </div>
          <div className="flex flex-row gap-x-4 justify-between text-sm items-center bg-base-200 rounded-lg p-2 flex-1">
            <p>Version:</p>
            <div>{device.version}</div>
          </div>
        </div>
      </div>
    );
  }
  

  
  
}
