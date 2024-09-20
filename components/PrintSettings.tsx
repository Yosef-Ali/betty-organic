import React from "react";

export const PrintSettings: React.FC = () => {
  const handlePrintSettings = () => {
    if ("page" in window) {
      // @ts-ignore: Unreachable code error
      window.page.paperSize = { width: 80, height: 297, isInches: false };
      // @ts-ignore: Unreachable code error
      window.page.orientation = "portrait";
    }
  };

  return (
    <button
      onClick={handlePrintSettings}
      className="px-4 py-2 bg-gray-200 rounded"
    >
      Adjust Print Settings
    </button>
  );
};
