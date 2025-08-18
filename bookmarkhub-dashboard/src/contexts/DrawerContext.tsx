import React, { createContext, useContext, useState } from "react";

interface DrawerContextType {
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDrawerClosing: boolean;
  setIsDrawerClosing: React.Dispatch<React.SetStateAction<boolean>>;
  isDrawerCollapsed: boolean;
  setIsDrawerCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  return (
    <DrawerContext.Provider
      value={{
        isDrawerOpen,
        setIsDrawerOpen,
        isDrawerClosing,
        setIsDrawerClosing,
        isDrawerCollapsed,
        setIsDrawerCollapsed,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context)
    throw new Error("useDrawer must be used within a DrawerProvider");
  return context;
};
