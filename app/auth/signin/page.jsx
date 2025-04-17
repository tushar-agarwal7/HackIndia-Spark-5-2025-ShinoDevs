"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import WalletConnectButton from "@/components/auth/WalletConnectButton";
import UserProfileForm from "@/components/auth/UserProfileForm";
import { ChevronLeft } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState("connect"); // 'connect' or 'profile'
  const [walletData, setWalletData] = useState(null);
  const [error, setError] = useState(null);

  const handleWalletSuccess = (data) => {
    setWalletData(data);
    // If user is already registered and profile is complete, redirect to dashboard
    if (!data.isNewUser) {
      router.push("/dashboard");
      return;
    }
    // Otherwise, proceed to profile setup
    setStep("profile");
  };

  const handleWalletError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleProfileSuccess = () => {
    router.push("/dashboard");
  };

  const handleProfileError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              {/* <Image
                src="/logo.png"
                alt="ShinoLearn Logo"
                width={800}
                height={800}
                className="rounded-lg"
              /> */}
              <span className="text-xl font-bold bg-gradient-to-r from-[#4d9fff] to-[#009ec2] bg-clip-text text-transparent">
                ShinoLearn
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full">
          {/* Left Side */}
          <div className="bg-gradient-to-br from-[#e0f7ff] to-[#f0fdfd] p-10 rounded-3xl shadow-xl relative flex flex-col justify-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-1">
              Welcome to
            </h1>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4d9fff] to-[#00d9ff] mb-4">
              ShinoLearn
            </h2>
            <p className="text-gray-600 mb-8">
              Master languages with cutting-edge AI technology
            </p>

            <div className="flex justify-center mb-8">
              <div className="w-82 h-82 relative">
                <Image
                  src="/logo.png"
                  alt="ShinoLearn Logo"
                  className="drop-shadow-2xl"
                  width={400}
                  height={400}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              {/* Language Info */}
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <ChevronRight className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    30+ Languages
                  </p>
                  <p className="text-xs text-gray-500">To explore</p>
                </div>
              </div>

              {/* AI Powered */}
              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-full">
                  <ChevronRight className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    AI Powered
                  </p>
                  <p className="text-xs text-gray-500">Learning path</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="bg-white p-10 rounded-3xl shadow-xl w-full flex flex-col justify-center">
            {step === "connect" ? (
              <div className="space-y-6 flex flex-col justify-center gap-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Sign In</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Connect your wallet to continue your journey
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl text-sm text-gray-600">
                  <p className="mb-2 font-medium text-gray-700 flex items-center space-x-2">
                    <span className="bg-blue-100 p-2 rounded-full">
                      <ChevronRight className="w-4 h-4 text-blue-500" />
                    </span>
                    <span>Why connect a wallet?</span>
                  </p>
                  <p className="ml-10 text-xs">
                    Your progress is securely stored on the blockchain, allowing
                    you to own your learning journey.
                  </p>
                </div>

                <div className="mt-4 flex justify-center">
                  <WalletConnectButton
                    onSuccess={handleWalletSuccess}
                    onError={handleWalletError}
                    className="w-full max-w-xs py-4 bg-gradient-to-r from-[#a0e9ff] to-[#4d9fff] text-white font-semibold rounded-2xl flex justify-center items-center space-x-2 shadow-md hover:shadow-lg transition-all"
                  />
                </div>

                <p className="text-xs text-center text-gray-500 mt-6">
                  By connecting, you agree to our{" "}
                  <a href="#" className="text-blue-500 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-500 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Complete Your Profile
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Personalize your learning experience
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-2xl mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-400 text-white rounded-full w-8 h-8 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Wallet Connected
                      </p>
                      <p className="text-xs text-gray-500">
                        {walletData?.walletAddress.slice(0, 6)}...
                        {walletData?.walletAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>

                <UserProfileForm
                  walletAddress={walletData?.walletAddress}
                  onSuccess={handleProfileSuccess}
                  onError={handleProfileError}
                  className="space-y-4"
                  buttonClassName="cursor-pointer w-full py-4 bg-gradient-to-r from-[#a0e9ff] to-[#4d9fff] text-white font-medium rounded-2xl flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
