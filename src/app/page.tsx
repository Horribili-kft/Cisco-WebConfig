// components/SshConsole.tsx
"use client";
import PortGraphic from "@/components/PortGraphic";
import Terminal from "@/components/Terminal";
import { useConnectionStore } from "@/store/connectionStore";
import { useCommandStore } from "@/store/commandStore";
import { useState } from "react";



const SshConsole: React.FC = () => {

  const { connection, connect, disconnect } = useConnectionStore();
  const { executeCommands } = useCommandStore();


  const [hostname, setHostname] = useState(connection.hostname || '');
  const [username, setUsername] = useState(connection.username || '');
  const [password, setPassword] = useState(connection.password || '');
  const [enablePassword, setEnablePassword] = useState(connection.enablepass || '') 
  const [commands, setCommands] = useState("");


  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    // We execute commands if we have any, otherwise we try the connection
    if (commands) {
      console.log(connection.state)
      // Try to connect, if unsuccessful, we return
      if (!connection.state && !(await connect(hostname, username, password, enablePassword))) {
        setLoading(false)
        return
      }
      // Try to execute
      await executeCommands(commands); // Execute all commands including the new one
    }
    else {
      await connect(hostname, username, password, enablePassword)
    }
    setLoading(false)
  };



  function handleDisconnect(e: React.FormEvent) {
    e.preventDefault();
    disconnect()
  }

  return (
    <>
      <progress className="m-0 p-0 progress w-full h-1 absolute rounded-none" hidden={!loading}></progress>

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
                    <div className="join-item">
                      <input
                        className="input input-bordered join-item w-1/2"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        hidden={connection.state}
                      />
                      <input
                        className="input input-bordered join-item w-1/2"
                        type="password"
                        placeholder="Enable Password (optional)"
                        value={enablePassword}
                        onChange={(e) => setEnablePassword(e.target.value)}
                        hidden={connection.state}
                      />
                    </div>
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
              <textarea
                className="textarea textarea-bordered w-full rounded-b-none focus:outline-none focus:bg-base-200"
                placeholder="Enter command(s)"
                value={commands}
                onChange={(e) => setCommands(e.target.value)}
                rows={12}
              />
              <Terminal></Terminal>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  function buttonText() {
    // If loading display a loading icon in the button
    if (loading) {
      return (
        <span className="loading loading-bars"></span>
      )
    }
    // If we are connected and there is something in the commands textbox
    else if (connection.state && hostname && username && password && commands)
      return ("Execute command")
    // If we are disconnected...
    else if (!connection.state) {
      return (commands ? "Connect and get configuration, then execute" : "Connect and get configuration")
    }
    // If we are connected and nothing is in the commands textbox
    else {
      return ("Retest connection")
    }
  }

};




export default SshConsole;
