// components/SshConsole.tsx
'use client';
import Terminal from '@/components/Terminal';
import { useSshStore } from '@/store/sshSlice';
import { useState } from 'react';

const SshConsole: React.FC = () => {
  const { loading, executeCommands} = useSshStore();

  const [hostname, setHostname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [command, setCommand] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeCommands({ hostname, username, password, commands: [command] }); // Execute all commands including the new one
    setCommand(''); // Clear input after execution
  };

  return (
    <div className="console p-4">
      {/* Terminal input form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="input input-bordered w-full"
          type="text"
          placeholder="Hostname"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          required
        />
        <input
          className="input input-bordered w-full"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="input input-bordered w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Enter command(s)"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={3}
        />
        <button
          className="btn btn-primary w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Executing...' : 'Execute'}
        </button>
      </form>

      <Terminal></Terminal>
    </div>
  );
};

export default SshConsole;
