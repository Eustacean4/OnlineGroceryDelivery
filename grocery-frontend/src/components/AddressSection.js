import React, { useState, useEffect } from 'react';
import styles from '../pages/MyAccount.module.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

function MapUpdater({ coords }) {
  const map = useMap();
  
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, 16);
    }
  }, [coords, map]);
  
  return null;
}

export default function AddressSection({ token }) {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    label: 'home',
    street: '',
    building_name: '',
    door_number: '',
    latitude: '',
    longitude: '',
    postal_code: '',
    country: '',
    state: '',
    city: '',
  });
  const [mapCoords, setMapCoords] = useState([35.1264, 33.4299]);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_KEY;

  const fetchAddresses = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const data = await response.json();
      console.log('Fetched addresses:', data);
      setAddresses(data);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch addresses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  useEffect(() => {
    if (showForm && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setGpsCoords(coords);
          setMapCoords(coords);

          // Auto-fill address on open
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${coords[0]}+${coords[1]}&key=${OPENCAGE_API_KEY}`
          );
          const data = await res.json();
          const components = data.results?.[0]?.components;
          const formatted = data.results?.[0]?.formatted;
          if (components) {
            setForm(prev => ({
              ...prev,
              street: formatted,
              latitude: coords[0],
              longitude: coords[1],
              postal_code: components.postcode || 'N/A',
              country: components.country || '',
              state: components.state || components.region || '',
              city: components.city || components.town || components.village || '',
            }));
          }
        },
        (error) => console.error('Error getting GPS:', error),
        { enableHighAccuracy: true }
      );
    }
  }, [showForm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (form.street.length > 4) {
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(form.street)}&key=${OPENCAGE_API_KEY}`)
          .then(res => res.json())
          .then(data => {
            const location = data.results?.[0]?.geometry;
            const components = data.results?.[0]?.components;
            if (location && components) {
              setMapCoords([location.lat, location.lng]);
              setForm(prev => ({
                ...prev,
                latitude: location.lat,
                longitude: location.lng,
                postal_code: components.postcode || 'N/A',
                country: components.country || '',
                state: components.state || '',
                city: components.city || components.town || components.village || '',
              }));
            }
          })
          .catch(() => console.log("Failed to fetch location"));
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [form.street, OPENCAGE_API_KEY]);

  const handleMapClick = async (lat, lng) => {
    setMapCoords([lat, lng]);
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    try {
      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`
      );
      const data = await res.json();
      const components = data.results?.[0]?.components;
      const formatted = data.results?.[0]?.formatted;
      if (components && formatted) {
        setForm(prev => ({
          ...prev,
          street: formatted,
          postal_code: components.postcode || 'N/A',
          country: components.country || '',
          state: components.state || components.region || '',
          city: components.city || components.town || components.village || '',
        }));
      }
    } catch {
      alert('Error fetching address from map click');
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    console.log('Save button clicked');
    console.log('Form data:', form);
    
    if (!form.street.trim()) {
      console.log('No street address provided');
      alert('Street address is required');
      return;
    }

    const url = editingId
      ? `http://localhost:8000/api/addresses/${editingId}`
      : 'http://localhost:8000/api/addresses';
    const method = editingId ? 'PUT' : 'POST';

    console.log('Making request:', { url, method, form });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('Content-Type');
      const data = contentType?.includes('application/json') ? await response.json() : await response.text();
      
      console.log('Response data:', data);

      if (response.ok && data) {
        console.log('Save successful:', data);
        
        // Refetch addresses to ensure sync with database
        await fetchAddresses();
        
        handleCancel();     
      } else {
        console.error('Save failed:', response.status, data);
        alert(typeof data === 'string' ? data : data.message || 'Failed to save address');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Unexpected error while saving address: ' + err.message);
    }
  };

  const handleEdit = (address) => {
    setForm({
      label: address.label || 'home',
      street: address.street || '',
      building_name: address.building_name || '',
      door_number: address.door_number || '',
      latitude: address.latitude || '',
      longitude: address.longitude || '',
      postal_code: address.postal_code || '',
      country: address.country || '',
      state: address.state || '',
      city: address.city || '',
    });
    setMapCoords([
      parseFloat(address.latitude) || 35.1264,
      parseFloat(address.longitude) || 33.4299,
    ]);
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    const res = await fetch(`http://localhost:8000/api/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      // Refetch addresses to ensure sync with database
      await fetchAddresses();
    } else {
      alert('Failed to delete');
    }
  };

  const handleCancel = () => {
    setForm({
      label: 'home',
      street: '',
      building_name: '',
      door_number: '',
      latitude: '',
      longitude: '',
      postal_code: '',
      country: '',
      state: '',
      city: '',
    });
    setMapCoords(gpsCoords || [35.1264, 33.4299]);
    setEditingId(null);
    setShowForm(false);
  };

  const safeRender = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getLabelIcon = (label) => {
    switch(label?.toLowerCase()) {
      case 'home': return '🏠';
      case 'work': return '🏢';
      case 'other': return '📍';
      default: return '📍';
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <h2>My Addresses</h2>
          <p className={styles.profileSubtitle}>Manage your delivery addresses</p>
        </div>
      </div>

      <div className={styles.formSection}>
        {!showForm && (
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`} 
            onClick={() => setShowForm(true)}
          >
            Add New Address
          </button>
        )}

        {showForm && (
          <>
            <h3>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
            <div className={styles.modernForm}>
              <div className={styles.formGroup}>
                <label>Address Label</label>
                <select 
                  name="label" 
                  value={form.label} 
                  onChange={handleInputChange}
                  className={styles.customSelect}
                >
                  <option value="home">🏠 Home</option>
                  <option value="work">🏢 Work</option>
                  <option value="other">📍 Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Street Address *</label>
                <input 
                  name="street" 
                  value={form.street} 
                  onChange={handleInputChange}
                  placeholder="Enter your street address"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Building Name</label>
                <input 
                  name="building_name" 
                  value={form.building_name} 
                  onChange={handleInputChange}
                  placeholder="Building or complex name"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Door/Apartment Number</label>
                <input 
                  name="door_number" 
                  value={form.door_number} 
                  onChange={handleInputChange}
                  placeholder="Door or apartment number"
                />
              </div>

              {/* Map Container */}
              <div className={styles.mapContainer}>
                <label>Select Location on Map</label>
                <div style={{ height: '300px', marginTop: '0.5rem', borderRadius: '12px', overflow: 'hidden' }}>
                  <MapContainer 
                    center={mapCoords} 
                    zoom={16} 
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapUpdater coords={mapCoords} />
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickHandler onMapClick={handleMapClick} />
                    <Marker position={mapCoords} icon={markerIcon}>
                      <Popup>Selected Location</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Click on the map to select your exact location
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  className={`${styles.btn} ${styles.btnPrimary}`} 
                  onClick={handleSave}
                >
                  {editingId ? 'Update Address' : 'Save Address'}
                </button>
                <button 
                  className={`${styles.btn} ${styles.btnDanger}`} 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Saved Addresses List */}
        <div style={{ marginTop: '3rem' }}>
          <h3>Saved Addresses</h3>
          {loading ? (
            <div className={styles.emptyState}>
              <p>Loading addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📍</div>
              <h4>No addresses saved yet</h4>
              <p>Add your first address to get started with deliveries</p>
            </div>
          ) : (
            <div className={styles.addressGrid}>
              {addresses.map((address, index) => (
                <div key={address.id || `address-${index}`} className={styles.addressCard}>
                  <div className={styles.addressCardHeader}>
                    <div className={styles.addressLabel}>
                      <span className={styles.addressIcon}>
                        {getLabelIcon(address.label)}
                      </span>
                      <span className={styles.addressLabelText}>
                        {safeRender(address.label?.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.addressDetails}>
                    <div className={styles.addressStreet}>
                      {safeRender(address.street)}
                    </div>
                    {address.building_name && (
                      <div className={styles.addressBuilding}>
                        Building: {safeRender(address.building_name)}
                      </div>
                    )}
                    {address.door_number && (
                      <div className={styles.addressDoor}>
                        Door: {safeRender(address.door_number)}
                      </div>
                    )}
                    {address.city && (
                      <div className={styles.addressCity}>
                        {safeRender(address.city)}, {safeRender(address.country)}
                      </div>
                    )}
                  </div>

                  <div className={styles.addressActions}>
                    <button 
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => handleEdit(address)}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => handleDelete(address.id)}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && (
            <div style={{ 
              color: '#dc2626', 
              background: '#fef2f2', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginTop: '1rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}