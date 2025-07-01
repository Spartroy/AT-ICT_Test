import React from "react";
import Nav from "../components/Nav";

const SignIn = () => {
    return (
        <>
            <Nav />
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] p-4">
                {/* Sign-In Form Container */}
                <div className="w-full max-w-[480px] bg-gradient-to-b from-[#1a1a1a] to-[#2a1a1a] rounded-custom p-8 sm:p-12 md:p-16 border-[5px] border-[#CA133E] shadow-lg">
                    {/* Heading */}
                    <div className="text-center font-black text-[22pt] sm:text-[24pt] md:text-[26pt] text-[#CA133E] font-pop">
                        Student Login
                    </div>
                    {/* Form */}
                    <form className="mt-5 text-[14pt]">
                        {/* Username Input */}
                        <input
                            required
                            type="text"
                            name="username"
                            id="username"
                            placeholder="Username"
                            className="w-full bg-[#2a1a1a] border-none py-3 px-4 rounded-xl mt-4 shadow-md border-[2px] border-transparent focus:outline-none focus:border-[#CA133E] placeholder:text-[#aaa] text-white"
                        />
                        {/* Password Input */}
                        <input
                            required
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Password"
                            className="w-full bg-[#2a1a1a] border-none py-3 px-4 rounded-xl mt-4 shadow-md border-[2px] border-transparent focus:outline-none focus:border-[#CA133E] placeholder:text-[#aaa] text-white"
                        />
                        {/* Forgot Password Link */}
                        <span className="block mt-2 ml-2">
                            <a href="#" className="text-[11px] text-white underline">
                                Forgot Password?
                            </a>
                        </span>
                        {/* Sign In Button */}
                        <input
                            type="submit"
                            value="Sign In"
                            className="w-full font-bold bg-gradient-to-r from-[#CA133E] to-[#A01030] text-white py-3 px-0 my-5 mx-auto rounded-xl border-none transition-all duration-200 ease-in-out hover:scale-[1.03] hover:shadow-lg active:scale-[0.95]"
                        />
                    </form>
                    {/* User Agreement Link */}
                    <span className="block text-center mt-4">
                        <a href="#" className="underline text-white text-[12px]">
                            Learn user license agreement
                        </a>
                    </span>
                </div>
            </div>
        </>
    );
};

export default SignIn;
