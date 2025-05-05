import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ label, onClick, type = 'button', className = '' }) => {
  return (
    <button type={type} onClick={onClick} className={`button ${className}`}>
      {label}
    </button>
  );
};

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};

export default Button;
