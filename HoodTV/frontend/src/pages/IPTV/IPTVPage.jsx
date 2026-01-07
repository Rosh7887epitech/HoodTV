import { useState } from 'react';
import BackButton from '../../components/BackButton/BackButton';
import IPTVManager from '../../components/IPTVManager/IPTVManager';
import './IPTVPage.css';

export default function IPTVPage() {
  return (
    <div className="iptv-page-container">
      <div className="iptv-page-content">
        <div className="iptv-hero">
        </div>
        <IPTVManager />
      </div>
    </div>
  );
}