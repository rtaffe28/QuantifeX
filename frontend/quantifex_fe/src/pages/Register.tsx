import React from "react";
import AuthForm from "@/components/AuthForm";

const Login: React.FC = () => {
  return <AuthForm route="/user/register" method="register" />;
};

export default Login;
