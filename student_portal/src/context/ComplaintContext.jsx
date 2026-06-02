import React, { createContext, useContext, useState } from 'react';

const ComplaintContext = createContext();

export const ComplaintProvider = ({ children }) => {
  const [lastTrackingId, setLastTrackingId] = useState(localStorage.getItem('lastTrackingId') || null);

  const saveTrackingId = (id) => {
    setLastTrackingId(id);
    localStorage.setItem('lastTrackingId', id);
  };

  return (
    <ComplaintContext.Provider value={{ lastTrackingId, saveTrackingId }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaint = () => useContext(ComplaintContext);
