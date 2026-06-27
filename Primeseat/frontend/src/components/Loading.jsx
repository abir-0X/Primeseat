import React from 'react';

/**
 * Loading Spinner Component
 * 
 * Renders a centered bouncy dot spinner with an optional progress message string.
 * Used across the dashboard and details pages during REST API query resolutions.
 * 
 * @param {string} message Optional loading text description
 */
const Loading = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-6 w-full">
            <div className="flex flex-row gap-2 items-center justify-center">
                {/* 3 bouncing dots using custom CSS animation delays */}
                <div className="w-4 h-4 rounded-full bg-blue-750 animate-bounce [animation-delay:.7s]"></div>
                <div className="w-4 h-4 rounded-full bg-blue-750 animate-bounce [animation-delay:.3s]"></div>
                <div className="w-4 h-4 rounded-full bg-blue-750 animate-bounce [animation-delay:.7s]"></div>
            </div>
            {message && <p className="text-zinc-400 font-medium text-lg animate-pulse">{message}</p>}
        </div>
    );
};

export default Loading;
