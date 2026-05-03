import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './PasswordInput.css';

// These props allow App.jsx to "talk" to this input
const PasswordInput = ({ value, onChange, error, showAsterisk }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="input-group">
      <label className="input-label">
        Password {showAsterisk && <span className="required-asterisk">*</span>}
      </label>
      <div className="input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          /* This class only triggers if the error prop exists */
          className={`password-field ${error ? 'input-error' : ''}`}
          placeholder="Enter your password"
          /* VITAL: value and onChange must be linked to props */
          value={value}
          onChange={onChange}
        />
        <button 
          type="button" 
          className="toggle-button" 
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;