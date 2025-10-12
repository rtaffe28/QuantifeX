import React from "react";
import AuthForm from "@/components/AuthForm";

const Login: React.FC = () => {
  return (
    <div className="flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <AuthForm route="/token" method="login" />
      </div>
    </div>
  );
};

export default Login;
