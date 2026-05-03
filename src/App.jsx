import React, { useState, useRef } from 'react';
import PasswordFeedback from './components/PasswordFeedback';
import SearchableSelect from './components/SearchableSelect';
import './App.css';
import countryData from './countriesToCities.json';
import { checkPassword } from './logic/checkPassword';
import { checkHibp } from './logic/checkHibp';
import { Eye, EyeOff } from 'lucide-react';
import MemoryTest from './components/MemoryTest';
import { GoogleLogin } from '@react-oauth/google';

const allCountries = Object.keys(countryData).sort();

function App() {
  const [showMemoryTest, setShowMemoryTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState({ score: 0, issues: [], breakdown: null });
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const memoryTestRef = useRef(null);

  const availableCities = selectedCountry
    ? [...countryData[selectedCountry]].sort()
    : [];

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim())  newErrors.fullName = 'Full name is required.';
    if (!dob)              newErrors.dob = 'Date of birth is required.';
    if (!email.trim())     newErrors.email = 'Email is required.';
    if (!selectedCountry)  newErrors.country = 'Country is required.';
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setChecking(true);

      const hibp = await checkHibp(password);

      const res = checkPassword(password, {
        fullName, dob, email,
        country: selectedCountry,
        city: selectedCity,
        phone, petName,
      }, hibp.pwned);

      if (hibp.pwned) {
        res.issues.unshift({
          type: 'critical',
          message: `⚠️ This password appeared in ${hibp.count.toLocaleString()} data breaches!`,
        });
      }

      setResults(res);
      setSubmitted(true);
      setShowPassword(false); // ✅ always hide password before memory test
      setShowMemoryTest(true);
      setChecking(false);
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);

    if (val) {
      const res = checkPassword(val, {
        fullName, dob, email,
        country: selectedCountry,
        city: selectedCity,
        phone, petName,
      }, false);
      setResults(res);
      setSubmitted(true);
    } else {
      setResults({ score: 0, issues: [], breakdown: null });
      setSubmitted(false);
      setShowMemoryTest(false);
    }
  };

  const handleButtonClick = () => {
    if (showMemoryTest) {
      memoryTestRef.current?.check();
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="page-container">
      <div className="form-card">
        <h1 className="form-title">Password Strength Tester</h1>

        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const decoded = JSON.parse(
              atob(credentialResponse.credential.split('.')[1])
            );
            setFullName(decoded.name || '');
            setEmail(decoded.email || '');
          }}
          onError={() => console.log('Login Failed')}
        />

        <form className="registration-form">

          {/* FULL NAME */}
          <div className="input-group">
            <label className="input-label">
              Full Name {!fullName && <span className="required-asterisk">*</span>}
            </label>
            <input
              type="text"
              className={`input-field ${errors.fullName ? 'input-error' : ''}`}
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (e.target.value) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
            />
            {errors.fullName && <p className="error-message">{errors.fullName}</p>}
          </div>

          {/* DATE OF BIRTH */}
          <div className="input-group">
            <label className="input-label">
              Date of Birth {!dob && <span className="required-asterisk">*</span>}
            </label>
            <input
              type="date"
              className={`input-field ${errors.dob ? 'input-error' : ''}`}
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                if (e.target.value) setErrors(prev => ({ ...prev, dob: '' }));
              }}
            />
            {errors.dob && <p className="error-message">{errors.dob}</p>}
          </div>

          {/* EMAIL */}
          <div className="input-group">
            <label className="input-label">
              Email {!email && <span className="required-asterisk">*</span>}
            </label>
            <input
              type="email"
              className={`input-field ${errors.email ? 'input-error' : ''}`}
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value) setErrors(prev => ({ ...prev, email: '' }));
              }}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          {/* COUNTRY */}
          <div className="input-group">
            <label className="input-label">
              Country {!selectedCountry && <span className="required-asterisk">*</span>}
            </label>
            <SearchableSelect
              options={allCountries}
              value={selectedCountry}
              onChange={(val) => {
                setSelectedCountry(val);
                setSelectedCity('');
                if (val) setErrors(prev => ({ ...prev, country: '' }));
              }}
              placeholder="Search a country..."
              zIndex={100}
            />
            {errors.country && <p className="error-message">{errors.country}</p>}
          </div>

          {/* CITY (OPTIONAL) */}
          <div className="input-group">
            <label className="input-label">City <span>(Optional)</span></label>
            <SearchableSelect
              options={availableCities}
              value={selectedCity}
              onChange={setSelectedCity}
              placeholder="Search a city..."
              disabled={!selectedCountry}
              zIndex={50}
            />
          </div>

          {/* PHONE (OPTIONAL) */}
          <div className="input-group">
            <label className="input-label">Phone Number <span>(Optional)</span></label>
            <input
              type="tel"
              className="input-field"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* PET NAME (OPTIONAL) */}
          <div className="input-group">
            <label className="input-label">Pet's Name <span>(Optional)</span></label>
            <input
              type="text"
              className="input-field"
              placeholder="Fluffy"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword && !showMemoryTest ? 'text' : 'password'} // ✅ force masked during test
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                style={{ paddingRight: '3rem' }}
                disabled={showMemoryTest}
              />
              <button
                type="button"
                onClick={() => !showMemoryTest && setShowPassword(prev => !prev)} // ✅ block click during test
                disabled={showMemoryTest}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: showMemoryTest ? 'not-allowed' : 'pointer', // ✅
                  color: showMemoryTest ? '#555' : '#aaa', // ✅ dim during test
                  fontSize: '1.1rem',
                  padding: 0,
                  pointerEvents: showMemoryTest ? 'none' : 'auto', // ✅ fully blocks clicks
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword && !showMemoryTest ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* FEEDBACK */}
          {submitted && (
            <PasswordFeedback
              score={results.score}
              issues={results.issues}
              breakdown={results.breakdown}
            />
          )}

          {/* MEMORY TEST */}
          {submitted && showMemoryTest && (
            <MemoryTest
              ref={memoryTestRef}
              correctPassword={password}
              onReset={() => setShowMemoryTest(false)}
            />
          )}

          {/* BUTTON */}
          <button
            type="button"
            className="submit-button"
            disabled={checking}
            onClick={handleButtonClick}
          >
            {checking ? 'Checking...' : showMemoryTest ? 'Check Memory' : 'Check Password'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default App;