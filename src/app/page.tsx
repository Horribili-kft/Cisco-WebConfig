// components/SshConsole.tsx
"use client";
import PortGraphic from "@/components/PortGraphic";
import Terminal from "@/components/Terminal";
import { useSshStore } from "@/store/sshSlice";
import { useState } from "react";

const SshConsole: React.FC = () => {
  const { loading, executeCommands } = useSshStore();

  const [hostname, setHostname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [command, setCommand] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeCommands({
      hostname,
      username,
      password,
      commands: [command],
    }); // Execute all commands including the new one
    setCommand(""); // Clear input after execution
  };

  return (
    <div className="grid grid-cols-2">
      <div>
        <PortGraphic/>

      </div>
      <div className="console p-4">
        {/* Terminal input form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex">
            <div className="join h-12">
              <input
                className="input input-bordered w- join-item"
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
              <input
                className="input input-bordered join-item"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="btn btn-primary join-item"
                type="submit"
                disabled={loading}
              >
                {command ? (loading ? 'Executing...' : 'Execute') : 'Test connection'}
              </button>
            </div>

            <img src="logo.png" alt="Horribili" className="h-12 ml-auto" />
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
};

export default SshConsole;
