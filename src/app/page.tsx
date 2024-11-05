// components/SshConsole.tsx
'use client';
import { useSshStore } from '@/store/sshSlice';
import { useEffect } from 'react';

const SshConsole: React.FC = () => {
  // Use Zustand store
  const { input, setCommandInput, execution, executeCommands, resetExecution } = useSshStore();

  const { output, error, loading } = execution; // Destructure execution state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Execute the commands using the Zustand store
    await executeCommands(input);
  };

  return (
    <div className="console">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Hostname"
          value={input.hostname}
          onChange={(e) => setCommandInput({ ...input, hostname: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={input.username}
          onChange={(e) => setCommandInput({ ...input, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={input.password}
          onChange={(e) => setCommandInput({ ...input, password: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Command"
          value={input.commands.join(', ')} // Use the commands from the input
          onChange={(e) => setCommandInput({ ...input, commands: e.target.value.split(',').map(cmd => cmd.trim()) })} // Split input for multiple commands
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Executing...' : 'Execute'}
        </button>
      </form>

      <div className="output">
        {output && (
          <div>
            <h3>Output:</h3>
            <pre>{output}</pre>
          </div>
        )}
        {error && (
          <div>
            <h3>Error:</h3>
            <pre>{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SshConsole;
