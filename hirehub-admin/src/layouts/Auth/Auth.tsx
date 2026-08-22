
import { Outlet } from "react-router-dom";
import { ConfigProvider } from "antd";

const Auth = () => {

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6161ff",
          colorInfo: "#61D0FF",
        },
        components: {
          Input: {
            colorBgContainer: "none",
            controlHeightLG: 56,
            borderRadiusLG: 4,
            colorBorder: "#FEFEFE",
            colorText: "#ffffff",
            colorTextPlaceholder: "#bcaaaa"
          },
          Button: {
            controlHeightLG: 48,
            borderRadiusLG: 12,
            primaryShadow: "0 0px 0 rgba(5, 145, 255, 0.1)",
          },
        },
      }}
    >
      <div
        // style={{ backgroundSize: "cover" }}
        className="h-screen m-auto flex w-full justify-center items-center"
      >
        
        <Outlet/>
      </div>

    </ConfigProvider>

  )
};

export default Auth;