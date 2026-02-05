import { useState, useRef } from "react";
import TopBar from "../TopBar/TopBar";
import "./MainScreen.css";

const MAX_CHARS = 50;

export default function MainScreen() {
  const [text, setText] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const hideTimer = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setText(value);
    }

    setShowCounter(true);

    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCounter(false), 1000);
};
    
return (
  <div className="app-container">
    <div className="main-screen">
        <TopBar
            text={text}
            onChange={handleChange}
            showCounter={showCounter}
            maxChars={MAX_CHARS}
        />

      <div className="helios-corner">Helios</div>
    </div>
  </div>
);
}