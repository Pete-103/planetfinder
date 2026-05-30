import React from 'react';
import { renderToString } from 'react-dom/server';
import EventsModal from './src/EventsModal.jsx';
import { UPCOMING_EVENTS } from './src/eventsData.js';

try {
  console.log(renderToString(<EventsModal events={UPCOMING_EVENTS} onClose={()=>{}} onSelect={()=>{}} />));
} catch (e) {
  console.error("Render error:", e);
}
