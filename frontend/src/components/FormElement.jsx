import React, { useState } from "react";
import {Eye, EyeOff} from "lucide-react"
const FormElement = ({label, name, type, icon: Icon,  placeholder, formData, setFormData}) => {
    const [showPassword, setShowPassword] = useState(false);
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          id={name}
          type={type === "password" ? (showPassword ? "text": "password"): type}
          required
          value={formData[name]}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          className="block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm "
          placeholder={placeholder}
        />
        {type === "password" && formData.password?.length && (
            showPassword ? (
                <Eye className="absolute top-0 right-4 translate-y-1/2" size={18} onClick={() => setShowPassword(!showPassword)}/>
            ):(
                <EyeOff className="absolute top-0 right-4 -translate-y-1/2" size={18} onClick={() => setShowPassword(!showPassword)}/>
            )
        )
            
           
        }
        
      </div>
    </div>
  );
};

export default FormElement;
