import { ConfigProvider } from "antd";
import { mainTheme } from "../../utils/antTheme";

const ThemeProvider = ({ children }: any) => {
  return <ConfigProvider theme={mainTheme as any}>{children}</ConfigProvider>;
};

export default ThemeProvider;
