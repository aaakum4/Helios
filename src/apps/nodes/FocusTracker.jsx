import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../core/AppContext';
import { useTime } from '../core/TimeProvider';
import './FocusTracker.css';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
];

function createId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

