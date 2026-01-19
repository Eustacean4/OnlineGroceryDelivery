import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import './Avatar.css';

const Avatar = ({ profilePicture, name }) => {
  const getInitials = () => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2); // Max 2 letters
  };

  return (
    <div className="avatar-wrapper">
      {profilePicture ? (
        <img src={profilePicture} alt="Profile" className="avatar-img" />
      ) : name ? (
        <div className="avatar-initials">{getInitials()}</div>
      ) : (
        <FontAwesomeIcon icon={faUserCircle} className="avatar-icon" />
      )}
    </div>
  );
};

export default Avatar;
