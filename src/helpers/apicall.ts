import { RequestData } from "@/app/api/ssh/route";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Executes an SSH command on a remote device and returns the response.
 *
 * @param requestData - An object containing the necessary information to execute the SSH command.
 * @param requestData.hostname - The hostname or IP address of the remote device.
 * @param requestData.username - The username to authenticate with the remote device.
 * @param requestData.password - The password to authenticate with the remote device.
 * @param requestData.commands - An optional array of commands to execute on the remote device.
 * @param requestData.devicetype - An optional type of the remote device, which determines the SSH handling logic.
 * @param requestData.enablepass - An optional enable password for the remote device.
 * @param requestData.settings - An optional object containing additional settings for the SSH call.
 * @param requestData.settings.forceciscossh - A boolean indicating whether to force SSH for command execution on Cisco devices.
 *
 * @returns A Promise that resolves to the Response object from the fetch call.
 *
 * @example
 * const requestData: RequestData = {
 *   hostname: '10.10.10.10',
 *   username: 'cisco',
 *   password: 'cisco',
 *   commands: ['show version', 'show interfaces'],
 *   devicetype: 'cisco',
 *   enablepass: 'enablepassword', // Currently unused
 *   settings: {
 *     forceciscossh: true
 *   }
 * };
 *
 * const response = await apicall(requestData);
 * const data = await response.json();
 * console.log(data);
 */

export async function apicall(requestData: RequestData): Promise<Response> {
    const { forceciscossh } = useSettingsStore.getState();

    // We use the settingstore settings if none are provided.
    const finalRequestData: RequestData = {
        ...requestData,
        settings: {
            forceciscossh: requestData.settings?.forceciscossh ?? forceciscossh,
        },
    };

    return await fetch('/api/ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalRequestData),
    });
}

