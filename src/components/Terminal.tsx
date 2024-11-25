'use client';
import { useCommandStore } from '@/store/commandStore';
import { useDeviceStore } from '@/store/deviceStore';
import { useTerminalStore } from '@/store/terminalStore';

export default function Terminal() {
    const { terminalBuffer, clearTerminalBuffer } = useTerminalStore();
    const { loading: connloading  } = useDeviceStore()
    const { loading } = useCommandStore();

    return (
        <div className="mockup-code p-4 bg-gray-900 text-gray-200 rounded-lg rounded-t-none shadow-md min-h-96 relative">
            {/* Render terminalBuffer entries */}
            {terminalBuffer.length > 0 ? (
                terminalBuffer.map((entry, index) => (
                    // Split entry.content by \n and map over each line
                    entry.content.split('\n').map((line, lineIndex) => (
                        <pre
                            key={`${index}-${lineIndex}`} // Unique key for each line
                            data-prefix={entry.type === 'command' ? '$' : entry.type === 'output' ? '>' : entry.type === 'error' ? '!' : ''}
                            className={entry.type === 'error' ? 'text-error' : entry.type === 'output' ? 'text-success' : ''}>
                            <code>{line}</code>
                        </pre>
                    ))
                ))
            ) : (
                <pre data-prefix="$"><code>Waiting for commands...</code></pre>
            )}

            {/* Optionally display loading, output, and error statuses */}
            {loading && (
                <pre data-prefix=">" className="text-warning animate-pulse"><code>Executing...</code></pre>
            )}
            {connloading.state && (
                <pre data-prefix=">" className="text-warning animate-pulse"><code>{connloading.msg}</code></pre>
            )}


            {terminalBuffer.length === 0 ? null : (
                <button
                    className="mt-2 btn btn-xs btn-ghost absolute top-[2px] left-28 transform"
                    onClick={() => clearTerminalBuffer()}>
                    Clear terminal
                </button>
            )}
        </div>
    );
}
