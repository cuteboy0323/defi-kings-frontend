import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';

import { CountDownProps, TimeTypes } from 'types/components/time';

import TimeProgress from './TimeProgress';

const CountDown = ({
    endTime,
    size,
    spacing = 2,
    uvalue = {},
    callback,
    units = { isDay: true, isHour: true, isMinute: true, isSecond: true }
}: CountDownProps) => {
    const [time, setTime] = useState<TimeTypes | any>({});
    const [isCalled, setIsCalled] = useState<boolean>(false);
    useEffect(() => {
        let interval = null;
        if (endTime) {
            const exTime = Number(endTime) * 1000;
            interval = setInterval(() => {
                const now = new Date().getTime();
                const distance = exTime - now;

                // Time calculations for days, hours, minutes and seconds
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                // If the count down is finished, write some text
                if (distance < 0) {
                    clearInterval(interval);
                }

                setTime({
                    days,
                    hours,
                    minutes,
                    distance,
                    seconds
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [endTime]);

    useEffect(() => {
        if (time.distance < 0 && callback && !isCalled) {
            callback();
            setIsCalled(true);
        }
        if (time.distance > 0) {
            setIsCalled(false);
        }
    }, [time.distance]);

    return (
        <Stack direction="row" spacing={spacing} justifyContent="center" flexWrap="wrap">
            {units.isDay && (
                <TimeProgress size={size || 44} value={time.days ?? -1} uvalue={uvalue.days ?? 365} unit={'days'} />
            )}
            {units.isHour && (
                <TimeProgress size={size || 44} value={time.hours ?? -1} uvalue={uvalue.hours ?? 24} unit={'hrs'} />
            )}
            {units.isMinute && (
                <TimeProgress
                    size={size || 44}
                    value={time.minutes ?? -1}
                    uvalue={uvalue.minutes ?? 60}
                    unit={'mins'}
                />
            )}
            {units.isSecond && (
                <TimeProgress
                    size={size || 44}
                    value={time.seconds ?? -1}
                    uvalue={uvalue.seconds ?? 60}
                    unit={'secs'}
                />
            )}
        </Stack>
    );
};

export default CountDown;
