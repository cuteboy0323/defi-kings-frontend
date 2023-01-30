import BigNumber from 'bignumber.js';
import useLocalStorage from 'hooks/useLocalStorage';
import { ConfigContext, initialState } from 'contexts/config';

type ConfigProviderProps = {
    children: React.ReactNode;
};

BigNumber.config({
    EXPONENTIAL_AT: 1000,
    DECIMAL_PLACES: 80
});

const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
    const origin = window?.location.origin ?? 'true-defi-config';
    const [config, setConfig] = useLocalStorage(origin, {
        ...initialState
    });

    const onChangeActiveSwap = (newSwap: string) => {
        setConfig((prevState) => ({
            ...prevState,
            activeSwap: newSwap
        }));
    };
    const onChangeChartView = () => {
        setConfig((prevState) => ({
            ...prevState,
            isChart: !prevState.isChart
        }));
    };
    const onChangeThemeMode = () => {
        setConfig((prevState) => ({
            ...prevState,
            isDark: !prevState.isDark
        }));
    };

    return (
        <ConfigContext.Provider value={{ ...config, onChangeThemeMode, onChangeChartView, onChangeActiveSwap }}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigProvider;
