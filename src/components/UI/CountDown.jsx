import React, {useState, useEffect} from 'react';

const Countdown = ({audioUrl}) => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        if (!audioUrl) return;

        setTime(3);

        const interval = setInterval(() => {
            setTime((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [audioUrl]);

    return (
        time > 0 ?
            <div className="counter">
                <span key={time}>{time}</span>
            </div>
            :
            <span></span>
    );
};

export default Countdown;