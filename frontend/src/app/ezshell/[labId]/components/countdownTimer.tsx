'use client'

import React, { useState, useEffect } from 'react';

interface Props {
  time: number,
  hasTimerCompleted: () => void
}

const CountdownTimer = ({ time, hasTimerCompleted }: Props) => {
  const [timer, setTimer] = useState(time * 60); // Convert minutes to seconds

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (timer > 0) {
        setTimer(timer - 1);
      } else {
        clearInterval(intervalId);
        // Handle timer completion here
        console.log('Timer complete!');
        hasTimerCompleted()
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timer]);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div className='text-sm'>
      <span>Remaining time: </span>
      <span>{minutes}:{seconds < 10 ? `0${ seconds }` : seconds}</span>
    </div>
  );
};

export default CountdownTimer;
