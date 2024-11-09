// components/SshConsole.tsx
"use client";
import PortGraphic from "@/components/PortGraphic";
import Terminal from "@/components/Terminal";
import { useSshStore } from "@/store/sshSlice";
import { useState } from "react";

const SshConsole: React.FC = () => {
  const { disconnect, addToTerminalBuffer, connection, loading, executeCommands } = useSshStore();

  const [hostname, setHostname] = useState(connection.hostname || '');
  const [username, setUsername] = useState(connection.username || '');
  const [password, setPassword] = useState(connection.password || '');
  const [command, setCommand] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hostname && username && password) {
      await executeCommands({
        hostname,
        username,
        password,
        rawCommands: command ? command : undefined,
      }); // Execute all commands including the new one
    }
    else {
      addToTerminalBuffer("Missing required fields", "error")
    }
  };

  function handleDisconnect(e: React.FormEvent) {
    e.preventDefault();
    addToTerminalBuffer("Disconnecting from host", 'command')
    disconnect()
  }

  return (
    <div className="grid grid-cols-2">
      {/* Oldal bal oldala */}
      <div>

        {/* Portgraphic container */}
        <div className="p-4 flex flex-wrap justify-start">
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
          <PortGraphic />
        </div>
      </div>



      {/* Oldal jobb oldala*/}
      <div className="console p-4">
        {/* Terminal input form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex">
            <div className="join join-vertical w-full">
              {connection.state ?
                // If we are connected, we don't render the input fields
                <div className="h-12 join-item rounded-t-lg flex align-middle items-center bg-base-200">
                  <button className="btn btn-xs btn-warning m-2" onClick={handleDisconnect}>Disconnect</button>
                  <p className="text-justify">
                    Hostname: <a href={`https://${hostname}`} target="_blank" className="text-info link-hover">{hostname} </a>
                    Username: <span className="text-info">{username}</span>
                  </p>
                </div>

                :
                // If we are disconnected, we render the input fields
                <>
                  <input
                    className="input input-bordered join-item"
                    type="text"
                    placeholder="Hostname"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    required
                    hidden={connection.state}
                  />
                  <input
                    className="input input-bordered join-item"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    hidden={connection.state}
                  />
                  <input
                    className="input input-bordered join-item"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    hidden={connection.state}
                  />
                </>}
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
            {" "}
            <textarea
              className="textarea textarea-bordered w-full rounded-b-none focus:outline-none focus:bg-base-200"
              placeholder="Enter command(s)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={12}
            />
            <Terminal></Terminal>
          </div>
        </form>
      </div>
    </div>
  );

  function buttonText() {

    if (loading) {
      return (
        <span className="loading loading-bars"></span>
      )
    }

    else if (connection.state && hostname && username && password && command)
      return ("Execute command")



    else if (!connection.state) {

      return (command ? "Connect, execute, and get configuration" : "Connect and get configuration")
    }
    else {
      return ("Retest connection")

    }


  }

};




export default SshConsole;
