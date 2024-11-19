import React from 'react'
import PropTypes from 'prop-types'; // Import PropTypes

function PortGraphic({ name = "Unknown interface", type = "unkown" }) {
    return (
        <div className="card bg-neutral m-1 w-[4.5rem] shadow-xl hover:cursor-pointer hover:brightness-110 active:scale-95 transition-all duration-75">
            <figure>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} className="stroke-primary">
                    {/*<rect fill='bg-white' x="1.5" y="1.5" width="21" height="21" rx="1.91" />*/}
                    <polygon points="5.32 6.27 5.32 13.91 7.23 13.91 7.23 15.82 10.09 15.82 10.09 17.73 13.91 17.73 13.91 15.82 16.77 15.82 16.77 13.91 18.68 13.91 18.68 6.27 5.32 6.27" />
                    <line x1="8.18" y1="9.14" x2="8.18" y2="6.27" />
                    <line x1="12" y1="9.14" x2="12" y2="6.27" />
                    <line x1="15.82" y1="9.14" x2="15.82" y2="6.27" />
                </svg>
            </figure>
            <p className='text-center text-xs pb-2 pl-2 pr-2'>{name}</p>
            <p className='text-center text-xs pb-2 pl-2 pr-2'>{type}</p>

        </div>
    )
}

// Define the prop types
PortGraphic.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string
};

export default PortGraphic;
