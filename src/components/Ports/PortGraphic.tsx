import React from 'react';
import PropTypes from 'prop-types';

interface PortGraphicProps {
  name: string;
  type: string; // Ensure type is a string
  up: boolean;
  onClick: () => void; // Click handler for interaction
}

const PortGraphic: React.FC<PortGraphicProps> = ({ name, type, up, onClick }) => {
  return (
    <div
      className="card bg-base-200 m-1 w-[4.5rem] shadow-2xl hover:cursor-pointer hover:brightness-110 active:scale-95 transition-all duration-75"
      onClick={onClick}
    >
      <figure>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          className={getUpStyle(up)}
        >
          <polygon points="5.32 6.27 5.32 13.91 7.23 13.91 7.23 15.82 10.09 15.82 10.09 17.73 13.91 17.73 13.91 15.82 16.77 15.82 16.77 13.91 18.68 13.91 18.68 6.27 5.32 6.27" />
          <line x1="8.18" y1="9.14" x2="8.18" y2="6.27" />
          <line x1="12" y1="9.14" x2="12" y2="6.27" />
          <line x1="15.82" y1="9.14" x2="15.82" y2="6.27" />
        </svg>
      </figure>
      <p className="text-center text-xs pb-2 pl-2 pr-2">{name}</p>
      <p className="text-center text-xs pb-2 pl-2 pr-2">{type}</p>
    </div>
  );
};

function getUpStyle(up: boolean) {
  return up ? 'stroke-success' : 'stroke-error';
}

// PropTypes definition for runtime validation
PortGraphic.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  up: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default PortGraphic;
