import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, ArrowRight, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import FormElement from "../components/FormElement";

const SignUpPage = () => {
  const loading = false;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  const childElements = [
    {
      label: "Full Name",
      name: "name",
      type: "text",
      icon: User,
      field: "name",
      placeholder: "John Doe",
    },
    {
      label: "Email Address",
      name: "email",
      type: "email",
      icon: Mail,
      placeholder: "you@example.com",
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      icon: Lock,
      placeholder: "••••••••",
    },
    {
      label: "Confirm Password",
      name: "confirmPassword",
      type: "password",
      icon: Lock,
      placeholder: "••••••••",
    },
  ];

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="mt-6 text-center text-3xl font-extrabold text-emerald-400">
          Create your account
        </h2>
      </motion.div>
      <motion.div
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {childElements.map((item) => (
              <FormElement
                key={item.name}
                {...item}
                formData={formData}
                setFormData={setFormData}
              />
            ))}

            <button 
              type="submit"
              className="w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50" disabled={loading}>

                {loading? (
                  <>
                    <Loader className="mr-2 w-5 h-5 animate-spin" aria-hidden='true'/>
                    Loading...
                  </>
                ): (
                  <>
                    <UserPlus className="mr-2 w-5 h-5 " aria-hidden='true'/>
                    Sign Up
                  </>
                )}
                
              </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;
