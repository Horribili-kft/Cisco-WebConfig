// components/Terminal.tsx
'use client';
import { useSshStore } from '@/store/sshSlice';

export default function Terminal() {
    const { loading, terminalBuffer, clearTerminalBuffer } = useSshStore();

    return (
        <div className="mockup-code mt-4 p-4 bg-gray-900 text-gray-200 rounded-lg shadow-md">
            {/* Render terminalBuffer entries */}
            {terminalBuffer.length > 0 ? (
                terminalBuffer.map((entry, index) => (
                    <pre
                        key={index}
                        data-prefix={entry.type === 'command' ? '$' : entry.type === 'output' ? '>' : entry.type === 'error' ? '!' : ''}
                        className={entry.type === 'error' ? 'text-error' : entry.type === 'output' ? 'text-success' : ''}>
                        <code>{entry.content}</code>
                    </pre>
                ))
            ) : (
                <pre data-prefix="$"><code>Waiting for commands...</code></pre>
            )}

            {/* Optionally display loading, output, and error statuses */}
            {loading && (
                <pre data-prefix=">" className="text-warning animate-pulse"><code>Executing...</code></pre>
            )}
            {terminalBuffer.length === 0 ? <></> 
            : 
            <button className='mt-2 btn btn-xs btn-ghost' onClick={() => clearTerminalBuffer()}>Clear terminal</button>
            }
        </div>
    );
}
