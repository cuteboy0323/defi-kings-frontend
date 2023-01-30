import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';

import TimeProgress from './TimeProgress';

const CountDown = ({ endTime, unit = 'mins', uvalue = 60, size, style }: any) => {
    const [time, setTime] = useState<number>(0);
    useEffect(() => {
        let interval = null;
        if (endTime) {
            let end = parseInt(String(endTime));
            setTime(end);
            interval = setInterval(() => {
                end = end - 1;
                // If the count down is finished, write some text
                if (end < 0) {
                    clearInterval(interval);
                }
                setTime(end);
            }, 60 * 1000);
        }
        return () => clearInterval(interval);
    }, [endTime]);

    return (
        <Stack direction="row" alignItems="center" justifyContent="center" sx={style}>
            <TimeProgress size={size || 44} value={time} uvalue={uvalue} unit={unit} />
        </Stack>
    );
};

export default CountDown;
