import React from 'react';

export default function BusinessSelector({ businesses, selectedBusiness, onSelect }) {
  return (
    <div className="business-selector">
      <label htmlFor="business">Select Business:</label>
      <select
        id="business"
        value={selectedBusiness?.id}
        onChange={(e) => {
          const biz = businesses.find(b => b.id === parseInt(e.target.value));
          onSelect(biz);
        }}
      >
        {businesses.map((biz) => (
          <option key={biz.id} value={biz.id}>
            {biz.name}
          </option>
        ))}
      </select>
    </div>
  );
}
