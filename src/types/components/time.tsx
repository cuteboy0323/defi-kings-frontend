export type TimeProgressProps = {
    value: number;
    unit: string;
    uvalue: number;
    size: number;
};

export type CountDownProps = {
    endTime: string | number;
    size?: number;
    spacing?: number;
    uvalue?: any;
    callback?: () => void;
    units?: {
        isDay?: boolean;
        isHour?: boolean;
        isMinute?: boolean;
        isSecond?: boolean;
    };
};

export type TimeTypes = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    distance: number;
};
