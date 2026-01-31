// context/LoaderContext.tsx
import LoadingRing from "@/components/ui/loading-ring";
import React, { createContext, ReactNode, useState } from "react";
import { Text, View } from "react-native";

interface LoaderContextProps {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
  loadingMessage: string | null;
}

export const LoaderContext = createContext<LoaderContextProps>({
  showLoader: (_message?: string) => {},
  hideLoader: () => {},
  isLoading: false,
  loadingMessage: null,
});

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const showLoader = (message?: string) => {
    setLoadingMessage(message ?? null);
    setIsLoading(true);
  };
  const hideLoader = () => {
    setIsLoading(false);
    setLoadingMessage(null);
  };

  return (
    <LoaderContext.Provider
      value={{ showLoader, hideLoader, isLoading, loadingMessage }}
    >
      {children}

      {isLoading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/30">
          <View className="bg-white p-6 rounded-2xl shadow-lg items-center">
            <LoadingRing size={88} color="#16A34A" background="#ffffff" />
            {loadingMessage && (
              <Text className="mt-4 text-gray-700 font-semibold">
                {loadingMessage}
              </Text>
            )}
          </View>
        </View>
      )}
    </LoaderContext.Provider>
  );
};
