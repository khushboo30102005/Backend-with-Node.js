import { useEffect, useRef } from 'react';

function SelectAllCheckbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="app-checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
    />
  );
}

export default SelectAllCheckbox;