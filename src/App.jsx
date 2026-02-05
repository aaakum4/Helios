import React, { useState } from "react";
import StartupScreen from "./components/StartupScreen";

function MainScreen () {
    return (
        <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
            <h2>Main Screen</h2>
            <p>Helios has launched!</p>
        </div>
    );
}


export default function App() {
    const [launched, setLaunched] = useState(false);

    return (
        <>
        { !launched ? (
            <StartupScreen onLaunch={() => setLaunched(true)} />
        ) : (
            <MainScreen />
        )}
        </>
    );
}