import React from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';

import { TimeProgressProps } from 'types/components/time';

const TimeProgress: React.FC<TimeProgressProps> = (props) => {
    const { value, unit, uvalue, size, ...rest } = props;
    return (
        <Stack
            {...rest}
            justifyContent="center"
            alignItems="center"
            sx={{
                width: size,
                height: size
            }}
        >
            <Stack justifyContent="center" alignItems="center">
                <Typography
                    sx={{
                        lineHeight: `${size / 3.5}px`,
                        fontSize: size / 3.5
                    }}
                >
                    {value >= 0 ? value : <Skeleton variant="circular" animation="wave" width={size} height={size} />}
                </Typography>
                <Typography
                    sx={{
                        lineHeight: `${size / 3.5}px`,
                        fontSize: size / 4
                    }}
                    variant="caption"
                >
                    {value >= 0 ? unit : ''}
                </Typography>
            </Stack>
            <CircularProgress
                size={size}
                variant="determinate"
                value={value >= 0 ? (value / uvalue) * 100 : 0}
                sx={{
                    position: 'absolute',
                    zIndex: 1
                }}
            />
            <CircularProgress
                size={size}
                variant="determinate"
                value={100}
                sx={{
                    position: 'absolute',
                    color: 'rgba(85, 119, 253, 0.1)'
                }}
            />
        </Stack>
    );
};

export default TimeProgress;
