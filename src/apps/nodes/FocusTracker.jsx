import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../core/AppContext';
import { useTime } from '../core/TimeProvider';
import './FocusTracker.css';

const COLORS = [
    '#ef4444', 
]