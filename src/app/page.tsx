"use client";
import Terminal from "@/components/Terminal";
import { useCommandStore } from "@/store/commandStore";
import { useEffect, useState } from "react";
import { useDeviceStore } from "@/store/deviceStore";
import PortContainer from "@/components/Ports/PortContainer";
import DeviceInfo from "@/components/DeviceInfo";
import Commands from "@/components/configuration/cisco/SwitchInterface";

const SshConsole: React.FC = () => {
  const { connection, connectToDevice, disconnect } = useDeviceStore();
  const { executeCommands } = useCommandStore();

  const [hostname, setHostname] = useState(connection.hostname);
  const [username, setUsername] = useState(connection.username);
  const [password, setPassword] = useState(connection.password);
  const [enablePassword, setEnablePassword] = useState(connection.enablepass);

  // needed for device persistance
  useEffect(() => {
    setHostname(connection.hostname)
    setUsername(connection.username)
    setPassword(connection.password)
  }, [connection])


  const [commands, setCommands] = useState("");

  // Responsivity
  const [loading, setLoading] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    const startTime = performance.now();
    e.preventDefault();
    setLoading(true);

    // The actual logic
    if (commands) {
      if (
        !connection.state &&
        !(await connectToDevice(hostname, username, password, enablePassword))
      ) {
        setLoading(false);
        return;
      }
      await executeCommands(commands);
    } else {
      await connectToDevice(hostname, username, password, enablePassword);
    }
    // End of logicc

    setLoading(false);
    const endTime = performance.now();
    setExecutionTime(endTime - startTime);
  };



  const handleDisconnect = (e: React.FormEvent) => {
    e.preventDefault();
    disconnect();
  };

  const appendCommand = (newCommand: string) => {
    setCommands((prevCommands) =>
      prevCommands ? `${prevCommands}\n${newCommand}` : newCommand
    );
  };

  return (
    <>
      <progress
        className="m-0 p-0 progress w-full h-1 absolute rounded-none"
        hidden={!loading}
      ></progress>

      <div className="grid grid-cols-2">
        <div className="console p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex">
              <div className="join join-vertical w-full">
                {connection.state ? (
                  <div className="h-12 join-item rounded-t-lg flex align-middle items-center bg-base-200">
                    <button
                      className="btn btn-xs btn-warning m-2"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </button>
                    <p className="text-justify">
                      Hostname:{" "}
                      <a
                        href={`https://${hostname}`}
                        target="_blank"
                        className="text-info link-hover"
                      >
                        {hostname}{" "}
                      </a>
                      Username: <span className="text-info">{username}</span>
                      {" "}
                      {executionTime ? `Time: ${executionTime} ms` : <></>}


                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      className="input input-bordered join-item"
                      type="text"
                      placeholder="Hostname"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                      required
                    />
                    <input
                      className="input input-bordered join-item"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <div className="join-item">
                      <input
                        className="input input-bordered join-item w-1/2"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <input
                        className="input input-bordered join-item w-1/2"
                        type="password"
                        placeholder="Enable Password (work in progress)"
                        value={enablePassword}
                        onChange={(e) => setEnablePassword(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <button
                  className="btn btn-primary join-item"
                  type="submit"
                  disabled={loading}
                >
                  {buttonText()}
                </button>
              </div>
            </div>

            <div className="join join-vertical w-full pt-4">
              <textarea
                className="textarea textarea-bordered w-full rounded-b-none focus:outline-none focus:bg-base-200"
                placeholder="Enter command(s)"
                value={commands}
                onChange={(e) => setCommands(e.target.value)}
                rows={12}
              />
              <Terminal />
            </div>
          </form>
        </div>

        <div>
          <DeviceInfo />
          <PortContainer/> {/* Pass the correct prop */}
          <Commands addCommand={appendCommand} />
        </div>
      </div>
    </>
  );

  function buttonText() {
    if (loading) {
      return <span className="loading loading-bars"></span>;
    } else if (connection.state && hostname && username && password && commands)
      return "Execute command";
    else if (!connection.state) {
      return commands
        ? "Connect and get configuration, then execute"
        : "Connect and get configuration";
    } else {
      return "Reload configuration";
    }
  }
};

export default SshConsole;
