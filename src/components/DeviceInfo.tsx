import CiscoSwitch from "@/classes/CiscoSwitch";
import LinuxDevice from "@/classes/Linux";
import { useDeviceStore } from "@/store/deviceStore";
import React from "react";

export default function DeviceInfo() {
    const { device } = useDeviceStore();

    if (device instanceof CiscoSwitch) {
        return (
            <div className="bg-base-300 rounded-lg p-4 m-4">
                <div className="bg-error text-center align-middle rounded-lg font-bold text-accent-content">
                    {device.type}
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

    if (device instanceof LinuxDevice) {
        return (
            <div className="bg-base-300 rounded-lg p-4 m-4">
                <div className="bg-error text-center align-middle rounded-lg font-bold text-accent-content">
                    {device.type}
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
