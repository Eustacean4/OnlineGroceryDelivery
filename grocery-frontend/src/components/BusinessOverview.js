import React, { useEffect, useState } from 'react';

export default function BusinessOverview({ business }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchBusinessStats = async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`http://localhost:8000/api/vendor/business/${business.id}/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setSummary(data);
    };

    fetchBusinessStats();
  }, [business]);

  if (!summary) return <div>Loading business data...</div>;

  return (
    <div className="business-overview">
      <h3>{business.name}</h3>
      <p>📦 Products: {summary.products_count}</p>
      <p>🛒 Orders: {summary.orders_count}</p>
      <p>💰 Revenue: ₺{summary.revenue}</p>

      <button onClick={() => alert('Go to Add Product')}>➕ Add Product</button>
      <button onClick={() => alert('Go to Orders')}>📋 View Orders</button>
    </div>
  );
}
