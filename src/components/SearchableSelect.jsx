import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './SearchableSelect.css';

function SearchableSelect({ options, value, onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const ref = useRef(null);
  const listRef = useRef(null); // ✅ ref for the portal dropdown

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        listRef.current && !listRef.current.contains(e.target) // ✅ also check portal list
      ) {
        setOpen(false);
        setSearch(value || '');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [value]);

  useEffect(() => {
    if (!value) setSearch('');
  }, [value]);

  const handleSelect = (option, e) => {
    e.stopPropagation();
    onChange(option);
    setSearch(option);
    setOpen(false);
  };

  return (
    <div className={`select-container ${open ? 'is-open' : ''}`} ref={ref}>
      <div className="select-input-wrapper">
        <input
          type="text"
          className="input-field"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onClick={(e) => {
            e.stopPropagation();
            !disabled && setOpen(o => !o);
          }}
          disabled={disabled}
        />
        <span
          className={`dropdown-arrow ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            !disabled && setOpen(o => !o);
          }}
        >
          ▼
        </span>
      </div>

      {open && !disabled && createPortal(
        <ul
          ref={listRef} // ✅ attached to the portal list
          className="dropdown-list"
          style={{
            position: 'absolute',
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
            zIndex: 9999,
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <li
                key={option}
                className={`dropdown-item ${option === value ? 'selected' : ''}`}
                onClick={(e) => handleSelect(option, e)}
              >
                {option}
              </li>
            ))
          ) : (
            <li className="no-results">No results</li>
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}

export default SearchableSelect;